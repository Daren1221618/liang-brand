import React from 'react';
import { Card, Tag, Space, Button, List, Spin, Empty, Typography, message } from 'antd';
import {
  EditOutlined, RobotOutlined, StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ProjectDeliverable, ReviewRecord } from '../../types';
import { DELIVERABLE_STATUS_LABELS } from '../../types';
import * as storage from '../../storage';
import { STATUS_COLORS } from './constants';

const { Text } = Typography;

interface DeliverableDetailProps {
  project: { id: string; name: string };
  deliverable: ProjectDeliverable | null;
  generatingId: string | null;
  streamContent: string;
  onStopGenerate: () => void;
  onSetEditContent: (content: string) => void;
  onOpenEditModal: () => void;
  refresh: () => void;
}

export default function DeliverableDetail({
  project, deliverable: activeD,
  generatingId, streamContent,
  onStopGenerate, onSetEditContent, onOpenEditModal, refresh,
}: DeliverableDetailProps) {
  if (!activeD) {
    return (
      <Card title="选择交付物查看详情" style={{ position: 'sticky', top: 80 }}>
        <Empty description="点击左侧交付物查看详情" />
      </Card>
    );
  }

  return (
    <Card
      title={activeD.name}
      style={{ position: 'sticky', top: 80 }}
    >
      <div style={{ marginBottom: 12 }}>
        <Tag color={STATUS_COLORS[activeD.status]}>{DELIVERABLE_STATUS_LABELS[activeD.status]}</Tag>
        <Tag>v{activeD.version}</Tag>
      </div>

      {activeD.status === 'ai_generating' && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#722ed1' }}>
            <RobotOutlined /> AI 正在生成内容...
          </div>
          <Button
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={onStopGenerate}
            style={{ marginTop: 12 }}
          >
            停止生成
          </Button>
          {streamContent && (
            <div
              className="content-preview"
              style={{
                marginTop: 16, maxHeight: 400, overflow: 'auto',
                textAlign: 'left', padding: 12, background: '#fafafa',
                borderRadius: 6, fontSize: 13, lineHeight: 1.8,
                whiteSpace: 'pre-wrap', border: '1px solid #f0f0f0',
              }}
            >
              {streamContent}
            </div>
          )}
        </div>
      )}

      {activeD.content && activeD.status !== 'ai_generating' && (
        <div className="content-preview" style={{ marginBottom: 16, maxHeight: 400, overflow: 'auto' }}>
          {activeD.content}
        </div>
      )}

      {!activeD.content && activeD.status !== 'ai_generating' && activeD.status !== 'pending' && (
        <Empty description="暂无内容，请使用AI生成或手动编辑" />
      )}

      {/* Review History */}
      {activeD.reviewHistory.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text strong>审核记录</Text>
          <List
            size="small"
            dataSource={activeD.reviewHistory}
            renderItem={(r: ReviewRecord) => (
              <List.Item>
                <div>
                  <Tag color={r.status === 'approved' ? 'green' : 'red'}>
                    {r.status === 'approved' ? '通过' : '退回'}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {r.reviewer} · {dayjs(r.createdAt).format('MM-DD HH:mm')}
                  </Text>
                  {r.comment && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{r.comment}</div>}
                </div>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Quick actions */}
      {activeD.status === 'draft' && activeD.content && (
        <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button icon={<EditOutlined />} onClick={() => { onSetEditContent(activeD.content); onOpenEditModal(); }}>编辑</Button>
          <Button type="primary" onClick={() => {
            storage.updateDeliverable(project.id, activeD.id, { status: 'reviewing' });
            storage.createReviewTask({
              deliverableId: activeD.id, deliverableName: activeD.name,
              projectId: project.id, projectName: project.name,
              engineType: activeD.engineType, reviewer: '待分配', status: 'pending_review',
            });
            refresh();
            message.success('已提交审核');
          }}>提交审核</Button>
        </Space>
      )}
    </Card>
  );
}
