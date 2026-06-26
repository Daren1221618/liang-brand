import React from 'react';
import { Card, Tag, Divider, Space, Button, Typography } from 'antd';
import {
  EditOutlined, EyeOutlined, SendOutlined, RobotOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ProjectDeliverable } from '../../types';
import { DELIVERABLE_STATUS_LABELS } from '../../types';
import { ALL_DELIVERABLES } from '../../data';
import { STATUS_COLORS } from './constants';

const { Text } = Typography;

interface DeliverableCardProps {
  deliverable: ProjectDeliverable;
  isActive: boolean;
  onStart: (id: string) => void;
  onAIGenerate: (id: string, isRegenerate?: boolean) => void;
  onEdit: (id: string, content: string) => void;
  onView: (id: string, content: string) => void;
  onSubmitReview: (id: string) => void;
  onReview: (id: string) => void;
}

export default function DeliverableCard({
  deliverable: d, isActive,
  onStart, onAIGenerate, onEdit, onView, onSubmitReview, onReview,
}: DeliverableCardProps) {
  const tpl = ALL_DELIVERABLES.find(t => t.id === d.templateId);
  const isGenerating = d.status === 'ai_generating';

  return (
    <Card
      size="small"
      className="deliverable-card"
      style={{
        borderLeft: `4px solid ${d.status === 'approved' ? '#52c41a' : d.status === 'revision_needed' ? '#ff4d4f' : '#d9d9d9'}`,
        background: isActive ? '#f0f5ff' : '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {d.name}
            {d.isPeriodic && <Tag color="orange" style={{ marginLeft: 8, fontSize: 10 }}>周期×{d.periodicCount}</Tag>}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>{tpl?.description || ''}</Text>
          {d.content && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>
              v{d.version} · {dayjs(d.updatedAt).format('MM-DD HH:mm')}
            </div>
          )}
        </div>
        <Tag color={STATUS_COLORS[d.status]}>{DELIVERABLE_STATUS_LABELS[d.status]}</Tag>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      <Space size="small" wrap>
        {d.status === 'pending' && (
          <Button size="small" type="primary" onClick={() => onStart(d.id)}>开始</Button>
        )}
        {(d.status === 'pending' || d.status === 'draft') && (
          <Button size="small" icon={<RobotOutlined />} onClick={() => onAIGenerate(d.id)} loading={isGenerating}>
            AI生成
          </Button>
        )}
        {d.status === 'draft' && d.content && (
          <>
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(d.id, d.content)}>编辑</Button>
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(d.id, d.content)}>查看</Button>
            <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => onSubmitReview(d.id)}>提交审核</Button>
          </>
        )}
        {d.status === 'reviewing' && (
          <Button size="small" icon={<AuditOutlined />} onClick={() => onReview(d.id)}>审核</Button>
        )}
        {d.status === 'revision_needed' && (
          <>
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(d.id, d.content)}>查看反馈</Button>
            <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => onEdit(d.id, d.content)}>修改</Button>
          </>
        )}
        {d.status === 'approved' && (
          <>
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(d.id, d.content)}>查阅</Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(d.id, d.content)}>编辑</Button>
            <Button size="small" icon={<RobotOutlined />} onClick={() => onAIGenerate(d.id, true)}>AI重新生成</Button>
          </>
        )}
      </Space>
    </Card>
  );
}
