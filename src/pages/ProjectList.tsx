// ============================================================
// 亮品牌 · 项目列表
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Tag, Input, Button, Space, Typography, Progress, message, Dropdown, Modal } from 'antd';
import { SearchOutlined, ProjectOutlined, StopOutlined, CloseCircleOutlined, DeleteOutlined, ReloadOutlined, MoreOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useApp } from '../context';
import { PROJECT_PHASE_CONFIG, Project, ProjectPhase } from '../types';
import { PACKAGE_CONFIG } from '../data';
import { getPackageName } from '../theme';
import { updateProject, deleteProject } from '../storage';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '进行中', color: 'green' },
  paused: { label: '已暂停', color: 'orange' },
  completed: { label: '已结束', color: 'blue' },
  terminated: { label: '已终止', color: 'red' },
  cancelled: { label: '已删除', color: 'default' },
};

export default function ProjectList() {
  const { projects, refresh, publicSettings } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = projects.filter(p =>
    p.name.includes(search) || p.customerName.includes(search)
  );

  const handleChangeStatus = async (project: Project, newStatus: string) => {
    try {
      const updateData: Partial<Project> = { status: newStatus as any };
      if (newStatus === 'active' && (project.status === 'completed' || project.status === 'terminated' || project.status === 'paused')) {
        // 重启/恢复项目：清除结束时间
        updateData.endAt = 0;
      } else {
        updateData.endAt = Date.now();
      }
      await updateProject(project.id, updateData);
      const labelMap: Record<string, string> = {
        completed: '已结束服务',
        terminated: '已终止服务',
        paused: '已暂停服务',
        active: '已重启项目',
      };
      message.success(labelMap[newStatus] || '操作成功');
      refresh();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (project: Project) => {
    try {
      await deleteProject(project.id);
      message.success('项目已删除');
      refresh();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '项目', dataIndex: 'name', key: 'name',
      render: (text: string, record: Project) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.customerName} · {record.industry}</div>
        </div>
      ),
    },
    {
      title: '套餐', dataIndex: 'packageType', key: 'packageType',
      render: (pkg: string) => {
        const settingName = getPackageName(publicSettings, pkg);
        const cfg = PACKAGE_CONFIG[pkg as keyof typeof PACKAGE_CONFIG];
        return cfg ? <Tag color="blue">{settingName || cfg.name}</Tag> : <Tag>定制</Tag>;
      },
      responsive: ['md'] as any,
    },
    {
      title: '当前阶段', dataIndex: 'currentPhase', key: 'currentPhase',
      render: (phase: ProjectPhase) => {
        const cfg = PROJECT_PHASE_CONFIG[phase];
        return <span>{cfg.icon} {cfg.name}</span>;
      },
      filters: Object.entries(PROJECT_PHASE_CONFIG).map(([k, v]) => ({ text: v.name, value: k })),
      onFilter: (value: any, record: Project) => record.currentPhase === value,
      responsive: ['lg'] as any,
    },
    {
      title: '进度', key: 'progress',
      render: (_: any, record: Project) => {
        const approved = record.deliverables.filter(d => d.status === 'approved').length;
        const total = record.deliverables.length;
        const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress percent={pct} size="small" style={{ width: 80, minWidth: 60 }} />
            <Text type="secondary" className="action-label">{approved}/{total}</Text>
          </div>
        );
      },
      responsive: ['md'] as any,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => {
        const s = STATUS_MAP[status];
        return s ? <Tag color={s.color}>{s.label}</Tag> : status;
      },
    },
    {
      title: '开始时间', dataIndex: 'startAt', key: 'startAt',
      render: (t: number) => dayjs(t).format('YYYY-MM-DD'),
      sorter: (a: Project, b: Project) => a.startAt - b.startAt,
      responsive: ['sm'] as any,
    },
    {
      title: '操作', key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Project) => {
        const isActive = record.status === 'active';
        const isPaused = record.status === 'paused';
        const canRestart = record.status === 'completed' || record.status === 'terminated';

        const menuItems: MenuProps['items'] = [];

        // 进行中的项目：暂停、结束、终止
        if (isActive) {
          menuItems.push({
            key: 'pause',
            icon: <PauseCircleOutlined />,
            label: '暂停服务',
            danger: false,
          });
          menuItems.push({
            key: 'end',
            icon: <StopOutlined />,
            label: '结束服务',
          });
          menuItems.push({
            key: 'terminate',
            icon: <CloseCircleOutlined />,
            label: '终止服务',
            danger: true,
          });
        }

        // 暂停中的项目：恢复
        if (isPaused) {
          menuItems.push({
            key: 'resume',
            icon: <PlayCircleOutlined />,
            label: '恢复服务',
          });
          menuItems.push({
            key: 'terminate',
            icon: <CloseCircleOutlined />,
            label: '终止服务',
            danger: true,
          });
        }

        // 已结束/已终止的项目：重启
        if (canRestart) {
          menuItems.push({
            key: 'restart',
            icon: <ReloadOutlined />,
            label: '重启项目',
          });
        }

        // 所有非 active 状态：都显示删除
        menuItems.push({ type: 'divider' });
        menuItems.push({
          key: 'delete',
          icon: <DeleteOutlined />,
          label: '删除项目',
          danger: true,
        });

        const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
          if (key === 'restart') {
            handleChangeStatus(record, 'active');
          } else if (key === 'pause') {
            handleChangeStatus(record, 'paused');
          } else if (key === 'end') {
            handleChangeStatus(record, 'completed');
          } else if (key === 'terminate') {
            handleChangeStatus(record, 'terminated');
          } else if (key === 'resume') {
            handleChangeStatus(record, 'active');
          } else if (key === 'delete') {
            Modal.confirm({
              title: '删除项目',
              content: `确定要删除「${record.name}」？此操作不可恢复。`,
              okText: '确认删除',
              cancelText: '取消',
              okButtonProps: { danger: true },
              onOk: () => handleDelete(record),
            });
          }
        };

        return (
          <Space size={4} wrap onClick={e => e.stopPropagation()}>
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/projects/${record.id}`)}
            >
              <ProjectOutlined />
              <span className="action-label">进入</span>
            </Button>
            <Dropdown
              menu={{ items: menuItems, onClick: handleMenuClick }}
              trigger={['click']}
            >
              <Button type="link" size="small" icon={<MoreOutlined />} onClick={e => e.stopPropagation()}>
                <span className="action-label">更多</span>
              </Button>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header page-header-row">
        <div>
          <Title level={3} style={{ margin: 0 }}>项目管理</Title>
          <Text type="secondary">管理所有品牌创建与升级项目</Text>
        </div>
      </div>

      <Card>
        <Input
          placeholder="搜索项目名称、客户..."
          prefix={<SearchOutlined />}
          size="large"
          style={{ marginBottom: 16 }}
          onChange={e => setSearch(e.target.value)}
          allowClear
        />
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          onRow={(record) => ({ onClick: () => navigate(`/projects/${record.id}`), style: { cursor: 'pointer' } })}
        />
      </Card>

    </div>
  );
}
