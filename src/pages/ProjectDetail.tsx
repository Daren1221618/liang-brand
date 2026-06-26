// ============================================================
// 亮品牌 · 项目详情
// 展示项目概览、阶段流程、交付物进度、团队管理
// ============================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Button, Space, Tag, Tabs, Row, Col,
  Progress, List, Modal, Form, Input, Select, Descriptions,
  message, Divider, Timeline, Statistic, Badge,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, EditOutlined,
  CheckCircleOutlined, ClockCircleOutlined, SyncOutlined,
  TeamOutlined, ToolOutlined, AuditOutlined, SettingOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useApp } from '../context';
import * as storage from '../storage';
import {
  Project, ProjectPhase, PROJECT_PHASE_CONFIG, ENGINE_CONFIG,
  EngineType, DELIVERABLE_STATUS_LABELS, DeliverableStatus, Role, ROLE_LABELS,
} from '../types';
import { ALL_DELIVERABLES } from '../data';
import { getAllFields } from '../brandChecklist';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const PHASE_COLORS: Record<string, string> = {
  initiation: '#8c8c8c', competition: '#faad14', strategy: '#cf1322',
  image: '#eb2f96', space: '#52c41a', marketing: '#722ed1',
  organization: '#13c2c2', delivery: '#597ef7', completed: '#52c41a',
};

const STATUS_COLORS: Record<DeliverableStatus, string> = {
  pending: 'default', draft: 'processing', ai_generating: 'purple',
  reviewing: 'warning', approved: 'success', revision_needed: 'error',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, refresh } = useApp();

  const project = projects.find(p => p.id === id);
  if (!project) return <div style={{ padding: 24 }}>项目不存在</div>;

  const [memberModal, setMemberModal] = useState(false);
  const [memberForm] = Form.useForm();

  // Phase navigation
  // Brand checklist & timeline stats
  const allChecklistFields = getAllFields();
  const filledChecklistCount = allChecklistFields.filter((f: any) => project.brandChecklist?.[f.id]?.trim()).length;
  const checklistTotal = allChecklistFields.length;
  const timelineCount = project.brandTimeline?.entries?.length || 0;
  const initiationReady = filledChecklistCount > 0 || timelineCount > 0;

  const phaseOrder: ProjectPhase[] = ['initiation', 'competition', 'strategy', 'image', 'space', 'marketing', 'organization', 'delivery', 'completed'];
  const currentIdx = phaseOrder.indexOf(project.currentPhase);

  const handlePhaseChange = (phase: ProjectPhase) => {
    storage.updateProject(project.id, { currentPhase: phase });
    refresh();
    message.success(`已切换到：${PROJECT_PHASE_CONFIG[phase].name}`);
  };

  const handleAddMember = (values: any) => {
    const team = [...project.team, { id: Date.now().toString(), ...values }];
    storage.updateProject(project.id, { team });
    refresh();
    setMemberModal(false);
    memberForm.resetFields();
    message.success('成员已添加');
  };

  const handleRemoveMember = (memberId: string) => {
    storage.updateProject(project.id, {
      team: project.team.filter(m => m.id !== memberId),
    });
    refresh();
  };

  // Deliverable stats
  const totalD = project.deliverables.length;
  const approvedD = project.deliverables.filter(d => d.status === 'approved').length;
  const inProgressD = project.deliverables.filter(d => ['draft', 'ai_generating', 'reviewing'].includes(d.status)).length;
  const overallPct = totalD > 0 ? Math.round((approvedD / totalD) * 100) : 0;

  // Group deliverables by engine
  const byEngine: Record<string, typeof project.deliverables> = {};
  project.deliverables.forEach(d => {
    if (!byEngine[d.engineType]) byEngine[d.engineType] = [];
    byEngine[d.engineType].push(d);
  });

  const tabItems = [
    {
      key: 'overview',
      label: '项目概览',
      children: (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            {/* Phase flow */}
            <Card title="项目阶段流程" size="small" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 8 }}>
                {phaseOrder.map((phase, idx) => {
                  const cfg = PROJECT_PHASE_CONFIG[phase];
                  const isActive = phase === project.currentPhase;
                  const isCompleted = idx < currentIdx;
                  const hasDeliverables = project.deliverables.some(d => d.phase === phase);
                  return (
                    <React.Fragment key={phase}>
                      <div
                        style={{
                          textAlign: 'center', cursor: phase === 'initiation' ? 'pointer' : 'pointer', minWidth: 90, flexShrink: 0,
                          opacity: isCompleted || isActive ? 1 : 0.5,
                        }}
                        onClick={() => {
                          if (phase === 'initiation') {
                            navigate(`/projects/${project.id}/initiation`);
                          } else {
                            handlePhaseChange(phase);
                          }
                        }}
                      >
                        <div style={{
                          width: 48, height: 48, borderRadius: '50%', margin: '0 auto 6px',
                          background: isActive ? PHASE_COLORS[phase] : isCompleted ? '#52c41a' : '#f0f0f0',
                          color: isActive || isCompleted ? '#fff' : '#999',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20, transition: 'all 0.3s',
                          boxShadow: isActive ? `0 0 0 4px ${PHASE_COLORS[phase]}33` : 'none',
                        }}>
                          {isCompleted ? '✓' : cfg.icon}
                        </div>
                        <div style={{
                          fontSize: 11, fontWeight: isActive ? 600 : 400,
                          color: isActive ? PHASE_COLORS[phase] : '#666',
                        }}>
                          {cfg.name}
                        </div>
                        {hasDeliverables && (
                          <Text style={{ fontSize: 10, color: '#999', marginTop: 4, display: 'block' }}>
                            {project.deliverables.filter(d => d.phase === phase && d.status === 'approved').length}/{project.deliverables.filter(d => d.phase === phase).length}
                          </Text>
                        )}
                        {phase === 'initiation' && initiationReady && (
                          <Text style={{ fontSize: 10, color: '#52c41a', marginTop: 2, display: 'block' }}>
                            自检{filledChecklistCount}项 · 年谱{timelineCount}条
                          </Text>
                        )}
                      </div>
                      {idx < phaseOrder.length - 1 && (
                        <div style={{
                          height: 2, width: 20, flexShrink: 0, alignSelf: 'center',
                          background: idx < currentIdx ? '#52c41a' : '#f0f0f0',
                          marginTop: -20,
                        }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </Card>
          </Col>

          {/* Stats */}
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="总进度" value={overallPct} suffix="%" valueStyle={{ color: '#cf1322' }} />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                {approvedD}/{totalD} 项交付物已完成
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="进行中" value={inProgressD} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="项目成员" value={project.team.length} prefix={<TeamOutlined />} />
            </Card>
          </Col>

          {/* Deliverables by Engine */}
          <Col span={24}>
            <Card title="交付物进度总览">
              <Row gutter={[16, 16]}>
                {Object.entries(byEngine).map(([engine, deliverables]) => {
                  const cfg = ENGINE_CONFIG[engine as EngineType];
                  const done = deliverables.filter(d => d.status === 'approved').length;
                  return (
                    <Col xs={24} sm={12} lg={8} key={engine}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => navigate(`/projects/${project.id}/engine/${engine}`)}
                        style={{ borderLeft: `4px solid ${cfg.color}` }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text strong>{cfg.icon} {cfg.name}</Text>
                          <Tag>{done}/{deliverables.length}</Tag>
                        </div>
                        <Progress
                          percent={deliverables.length > 0 ? Math.round((done / deliverables.length) * 100) : 0}
                          size="small"
                          strokeColor={cfg.color}
                        />
                        <div style={{ marginTop: 8 }}>
                          {deliverables.slice(0, 3).map(d => (
                            <div key={d.id} style={{ fontSize: 12, padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                              <Tag color={STATUS_COLORS[d.status]} style={{ fontSize: 10 }}>{DELIVERABLE_STATUS_LABELS[d.status]}</Tag>
                            </div>
                          ))}
                          {deliverables.length > 3 && (
                            <Text type="secondary" style={{ fontSize: 11 }}>...还有{deliverables.length - 3}项</Text>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', marginTop: 8 }}>
                          <Button type="link" size="small">进入引擎 <RightOutlined /></Button>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'deliverables',
      label: `交付物清单 (${totalD})`,
      children: (
        <Card>
          <List
            dataSource={project.deliverables}
            renderItem={(d) => {
              const tpl = ALL_DELIVERABLES.find(t => t.id === d.templateId);
              const engineCfg = ENGINE_CONFIG[d.engineType];
              return (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${project.id}/engine/${d.engineType}`)}
                  actions={[
                    <Tag key="status" color={STATUS_COLORS[d.status]}>{DELIVERABLE_STATUS_LABELS[d.status]}</Tag>,
                    <Button key="view" type="link" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/engine/${d.engineType}`); }}>查看</Button>,
                  ]}
                >
                    <List.Item.Meta
                    avatar={<span style={{ fontSize: 24 }}>{engineCfg.icon}</span>}
                    title={
                      <span>
                        {d.name}
                      </span>
                    }
                    description={`${engineCfg.name} · ${tpl?.description || ''}`}
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      ),
    },
    {
      key: 'team',
      label: `团队 (${project.team.length})`,
      children: (
        <Card>
          <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => setMemberModal(true)}>
            添加成员
          </Button>
          <Row gutter={[16, 16]}>
            {project.team.map(member => (
              <Col xs={12} sm={8} lg={6} key={member.id}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>
                    {member.isInternal ? '🏠' : '🏢'}
                  </div>
                  <div style={{ fontWeight: 600 }}>{member.name}</div>
                  <Tag color="blue" style={{ marginTop: 4 }}>{ROLE_LABELS[member.role]}</Tag>
                  <Tag style={{ marginTop: 4 }}>{member.isInternal ? '我方' : '客方'}</Tag>
                  <div style={{ marginTop: 8 }}>
                    <Button size="small" danger onClick={() => handleRemoveMember(member.id)}>移除</Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          {project.team.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              暂无团队成员，请添加项目组成员
            </div>
          )}
        </Card>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} style={{ marginBottom: 16 }}>返回项目列表</Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>{project.name}</Title>
          <Text type="secondary">{project.customerName} · {project.industry} · 启动于 {dayjs(project.startAt).format('YYYY-MM-DD')}</Text>
        </div>
        <Space wrap>
          <Button icon={<SettingOutlined />} onClick={() => navigate(`/projects/${project.id}/service-customize`)}>服务定制</Button>
          <Button icon={<AuditOutlined />} onClick={() => navigate('/review')}>审核中心</Button>
        </Space>
      </div>

      <Tabs items={tabItems} defaultActiveKey="overview" />

      {/* Add Member Modal */}
      <Modal title="添加团队成员" open={memberModal} onCancel={() => setMemberModal(false)} footer={null} width={Math.min(520, window.innerWidth - 32)}>
        <Form form={memberForm} layout="vertical" onFinish={handleAddMember}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="成员姓名" />
          </Form.Item>
          <Form.Item name="role" label="岗位" rules={[{ required: true }]}>
            <Select>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isInternal" label="所属" initialValue={true}>
            <Select>
              <Select.Option value={true}>我方（亮品牌）</Select.Option>
              <Select.Option value={false}>客方（客户）</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setMemberModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">添加</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
