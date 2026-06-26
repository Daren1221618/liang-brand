// ============================================================
// 亮品牌 · 审核中心
// 所有待审核任务的集中管理
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Typography, List, Tag, Button, Space, Modal, Input,
  Tabs, Empty, message, Badge, Descriptions, Divider, Row, Col, Statistic,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
  ClockCircleOutlined, AuditOutlined, ProjectOutlined,
} from '@ant-design/icons';
import { useApp } from '../context';
import * as storage from '../storage';
import { ENGINE_CONFIG, DELIVERABLE_STATUS_LABELS } from '../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function ReviewCenter() {
  const { reviewTasks, projects, refresh } = useApp();
  const navigate = useNavigate();
  const [reviewModal, setReviewModal] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const pendingTasks = reviewTasks.filter(t => t.status === 'pending_review');
  const completedTasks = reviewTasks.filter(t => t.status !== 'pending_review');

  const handleReview = (taskId: string, approved: boolean) => {
    const task = reviewTasks.find(t => t.id === taskId);
    if (!task) return;

    storage.updateReviewTask(taskId, {
      status: approved ? 'approved' : 'rejected',
      comment,
      reviewedAt: Date.now(),
    });

    // Update deliverable status
    const project = projects.find(p => p.id === task.projectId);
    if (project) {
      storage.updateDeliverable(task.projectId, task.deliverableId, {
        status: approved ? 'approved' : 'revision_needed',
        reviewHistory: [
          ...(project.deliverables.find(d => d.id === task.deliverableId)?.reviewHistory || []),
          {
            id: Date.now().toString(),
            status: approved ? 'approved' as const : 'revision_needed' as const,
            reviewer: '审核人',
            comment,
            createdAt: Date.now(),
          },
        ],
      });
    }

    refresh();
    setReviewModal(null);
    setComment('');
    message.success(approved ? '审核通过' : '已退回修改');
  };

  const renderTask = (task: typeof reviewTasks[0], showActions: boolean = true) => {
    const engineCfg = ENGINE_CONFIG[task.engineType];
    return (
      <List.Item
        actions={[
          <Tag key="engine" color="blue">{engineCfg?.icon} {engineCfg?.name}</Tag>,
          showActions ? (
            <Space key="actions" wrap>
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/projects/${task.projectId}/engine/${task.engineType}?deliverableId=${task.deliverableId}`)}
              >
                查看
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => { setReviewModal(task.id); setComment(''); }}
              >
                退回
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleReview(task.id, true)}
              >
                通过
              </Button>
            </Space>
          ) : (
            <Space key="actions-done" wrap>
              <Tag color={task.status === 'approved' ? 'green' : 'red'}>
                {task.status === 'approved' ? '已通过' : '已退回'}
              </Tag>
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/projects/${task.projectId}/engine/${task.engineType}?deliverableId=${task.deliverableId}`)}
              >
                查看成果
              </Button>
            </Space>
          ),
        ]}
      >
        <List.Item.Meta
          avatar={
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: task.status === 'pending_review' ? '#fff7e6' : '#f6ffed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {task.status === 'pending_review'
                ? <ClockCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
                : <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
              }
            </div>
          }
          title={task.deliverableName}
          description={
            <span>
              <Text type="secondary">{task.projectName}</Text>
              <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
              <Text type="secondary">{task.reviewer}</Text>
              <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
              <Text type="secondary">{dayjs(task.createdAt).format('MM-DD HH:mm')}</Text>
              {task.comment && (
                <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>意见：{task.comment}</div>
              )}
            </span>
          }
        />
      </List.Item>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3}>审核中心</Title>
        <Paragraph type="secondary">管理所有交付物的审核流程</Paragraph>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="待审核" value={pendingTasks.length} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="已通过" value={completedTasks.filter(t => t.status === 'approved').length} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="已退回" value={completedTasks.filter(t => t.status === 'rejected').length} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="pending"
        items={[
          {
            key: 'pending',
            label: <Badge count={pendingTasks.length} offset={[10, 0]}>待审核</Badge>,
            children: (
              <Card>
                {pendingTasks.length === 0 ? (
                  <Empty description="暂无待审核任务" />
                ) : (
                  <List dataSource={pendingTasks} renderItem={t => renderTask(t, true)} />
                )}
              </Card>
            ),
          },
          {
            key: 'completed',
            label: '已完成',
            children: (
              <Card>
                {completedTasks.length === 0 ? (
                  <Empty description="暂无审核记录" />
                ) : (
                  <List dataSource={completedTasks.slice().reverse()} renderItem={t => renderTask(t, false)} />
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* Review Modal */}
      <Modal
        title="退回修改"
        open={reviewModal !== null}
        onCancel={() => setReviewModal(null)}
        onOk={() => { if (reviewModal) handleReview(reviewModal, false); }}
        okText="确认退回"
        okButtonProps={{ danger: true }}
      >
        <p>请输入退回修改的具体意见：</p>
        <TextArea
          rows={4}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="请详细说明需要修改的内容..."
        />
      </Modal>
    </div>
  );
}
