// ============================================================
// 亮品牌 · 工作台 Dashboard（Apple Design Style）
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Typography, List, Tag, Button, Space, Progress } from 'antd';
import {
  UserOutlined, ProjectOutlined, FileTextOutlined,
  DollarOutlined, AuditOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ArrowUpOutlined, RightOutlined,
} from '@ant-design/icons';
import { useApp } from '../context';
import { getDashboardStats } from '../storage';
import { ROLE_LABELS, Project, ReviewTask } from '../types';
import { SkeletonStats } from '../components/Skeleton';

const { Title, Paragraph, Text } = Typography;

export default function Dashboard() {
  const { role, customers, projects, quotes, reviewTasks, refresh } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: 0, intentionCustomers: 0, signedCustomers: 0,
    totalProjects: 0, activeProjects: 0, totalQuotes: 0,
    totalDeliverables: 0, completedDeliverables: 0, pendingReviews: 0, totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await getDashboardStats();
        setStats(s);
      } catch { /* use defaults */ }
      setLoading(false);
    })();
  }, [customers, projects, quotes, reviewTasks]);

  const recentProjects = projects.slice(-5).reverse();
  const pendingTasks = reviewTasks.filter(t => t.status === 'pending_review');

  return (
    <div className="page-container apple-fade-in">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>
          工作台
          <Tag color="blue" style={{ marginLeft: 12, verticalAlign: 'middle' }}>{ROLE_LABELS[role]}</Tag>
        </Title>
        <Paragraph type="secondary">品牌全周期管理，一目了然</Paragraph>
      </div>

      {/* 统计卡片 */}
      {loading ? (
        <SkeletonStats />
      ) : (
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/customers')}
            style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Statistic
              title="意向客户"
              value={loading ? 0 : stats.intentionCustomers}
              prefix={<UserOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#1d1d1f', fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/projects')}
            style={{ background: 'linear-gradient(135deg, #f0fff4 0%, #fff 100%)' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Statistic
              title="进行中项目"
              value={loading ? 0 : stats.activeProjects}
              prefix={<ProjectOutlined style={{ color: '#34c759' }} />}
              valueStyle={{ color: '#1d1d1f', fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => navigate('/review')}
            style={{ background: 'linear-gradient(135deg, #fffbe6 0%, #fff 100%)' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Statistic
              title="待审核"
              value={loading ? 0 : stats.pendingReviews}
              prefix={<AuditOutlined style={{ color: '#f5a623' }} />}
              valueStyle={{ color: '#1d1d1f', fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #fff 100%)' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Statistic
              title="累计收入"
              value={loading ? 0 : stats.totalRevenue}
              prefix="¥"
              precision={0}
              valueStyle={{ color: '#1d1d1f', fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>
      )}

      <Row gutter={[20, 20]}>
        {/* 最新项目 */}
        <Col xs={24} lg={14}>
          <Card
            title="最新项目"
            styles={{ body: { padding: 0 } }}
            extra={<Button type="link" style={{ fontWeight: 500 }} onClick={() => navigate('/projects')}>查看全部 <RightOutlined style={{ fontSize: 11 }} /></Button>}
          >
            {recentProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#86868b' }}>
                <ProjectOutlined style={{ fontSize: 32, marginBottom: 12, display: 'block', opacity: 0.4 }} />
                暂无项目，<a onClick={() => navigate('/customers')}>从客户管理开始</a>
              </div>
            ) : (
              <List
                dataSource={recentProjects}
                renderItem={(p) => {
                  const approved = p.deliverables.filter(d => d.status === 'approved').length;
                  const total = p.deliverables.length;
                  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
                  return (
                    <List.Item
                      style={{ cursor: 'pointer', padding: '14px 24px' }}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      actions={[
                        <Tag
                          color={p.status === 'active' ? '#34c759' : p.status === 'completed' ? '#007aff' : '#86868b'}
                          key="status"
                          style={{ border: 'none', padding: '2px 12px' }}
                        >
                          {p.status === 'active' ? '进行中' : p.status === 'completed' ? '已完成' : '已暂停'}
                        </Tag>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'linear-gradient(135deg, #cf132220, #cf132208)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <ProjectOutlined style={{ fontSize: 18, color: '#cf1322' }} />
                          </div>
                        }
                        title={<span style={{ fontWeight: 500, fontSize: 15 }}>{p.name}</span>}
                        description={
                          <Space size={4} split={<span style={{ color: '#aeaeb2' }}>·</span>}>
                            <Text type="secondary" style={{ fontSize: 13 }}>{p.customerName}</Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>{p.industry}</Text>
                          </Space>
                        }
                      />
                      <Progress
                        percent={pct}
                        size="small"
                        strokeColor={{ '0%': '#cf1322', '100%': '#34c759' }}
                        trailColor="#f0f0f0"
                        style={{ width: 100, minWidth: 60 }}
                        showInfo={false}
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        {/* 待办事项 */}
        <Col xs={24} lg={10}>
          <Card
            title="待审核任务"
            styles={{ body: { padding: 0 } }}
            extra={<Button type="link" style={{ fontWeight: 500 }} onClick={() => navigate('/review')}>审核中心 <RightOutlined style={{ fontSize: 11 }} /></Button>}
          >
            {pendingTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#86868b' }}>
                <CheckCircleOutlined style={{ fontSize: 32, marginBottom: 12, display: 'block', opacity: 0.4 }} />
                暂无待审核任务
              </div>
            ) : (
              <List
                size="small"
                dataSource={pendingTasks.slice(0, 5)}
                renderItem={(task) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '12px 24px' }}
                    onClick={() => navigate(`/review`)}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'rgba(245,166,35,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <ClockCircleOutlined style={{ fontSize: 16, color: '#f5a623' }} />
                        </div>
                      }
                      title={<span style={{ fontWeight: 500, fontSize: 14 }}>{task.deliverableName}</span>}
                      description={
                        <Space size={4} split={<span style={{ color: '#aeaeb2' }}>·</span>}>
                          <Text type="secondary" style={{ fontSize: 13 }}>{task.projectName}</Text>
                          <Text type="secondary" style={{ fontSize: 13 }}>{task.reviewer}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
