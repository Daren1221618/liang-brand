import React from 'react';
import { Button, Space, Tag, Card, List, Upload, Typography, message, Empty } from 'antd';
import {
  EditOutlined, EyeOutlined, SendOutlined, RobotOutlined,
  AuditOutlined, UploadOutlined,
} from '@ant-design/icons';
import * as storage from '../../storage';
import { DELIVERABLE_STATUS_LABELS } from '../../types';
import type { Project, ProjectDeliverable, ServiceModule } from '../../types';
import { STATUS_COLORS } from './constants';

const { Paragraph, Text } = Typography;

interface ModuleListProps {
  project: Project;
  engineModules: ServiceModule[];
  onSetActive: (id: string) => void;
  onSetEditContent: (content: string) => void;
  onOpenEditModal: () => void;
  onOpenReviewModal: () => void;
  onAIGenerate: (id: string) => void;
  refresh: () => void;
}

export default function ModuleList({
  project, engineModules,
  onSetActive, onSetEditContent, onOpenEditModal, onOpenReviewModal,
  onAIGenerate, refresh,
}: ModuleListProps) {
  const renderActions = (d: ProjectDeliverable) => {
    const actions: React.ReactNode[] = [];
    actions.push(
      <Tag key="status" color={STATUS_COLORS[d.status]}>{DELIVERABLE_STATUS_LABELS[d.status]}</Tag>
    );

    if (d.content) {
      actions.push(
        <Button key="view" type="link" size="small" icon={<EyeOutlined />} onClick={() => { onSetActive(d.id); onSetEditContent(d.content); }}>
          查阅
        </Button>
      );
    }

    if (d.status !== 'pending' && d.status !== 'ai_generating') {
      actions.push(
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { onSetActive(d.id); onSetEditContent(d.content); onOpenEditModal(); }}>
          编辑
        </Button>
      );
    }

    if (d.status !== 'reviewing') {
      actions.push(
        <Button key="ai" type="link" size="small" icon={<RobotOutlined />} onClick={() => onAIGenerate(d.id)} disabled={d.status === 'ai_generating'}>
          AI生成
        </Button>
      );
    }

    actions.push(
      <Upload key="upload" showUploadList={false}
        beforeUpload={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            storage.updateDeliverable(project.id, d.id, { content: text, status: d.status === 'pending' ? 'draft' : d.status, updatedAt: Date.now() });
            refresh();
            message.success(`文件已导入到「${d.name}」`);
          };
          reader.readAsText(file);
          return false;
        }}
        accept=".txt,.md,.csv,.json"
      >
        <Button type="link" size="small" icon={<UploadOutlined />}>上传</Button>
      </Upload>
    );

    if ((d.status === 'draft' || d.status === 'revision_needed') && d.content) {
      actions.push(
        <Button key="submit" type="link" size="small" icon={<SendOutlined />} onClick={() => {
          onSetActive(d.id);
          storage.updateDeliverable(project.id, d.id, { status: 'reviewing' });
          storage.createReviewTask({
            deliverableId: d.id, deliverableName: d.name,
            projectId: project.id, projectName: project.name,
            engineType: d.engineType, reviewer: '待分配', status: 'pending_review',
          });
          refresh();
          message.success('已提交审核');
        }}>审核</Button>
      );
    }

    if (d.status === 'approved' && d.content) {
      actions.push(
        <Button key="resubmit" type="link" size="small" icon={<AuditOutlined />} onClick={() => {
          onSetActive(d.id);
          onOpenReviewModal();
        }}>再审</Button>
      );
    }

    return actions.filter(Boolean);
  };

  if (engineModules.length === 0) {
    return <Empty description="该引擎暂无服务模块" />;
  }

  return (
    <div>
      {engineModules.map(m => (
        <Card
          key={m.id}
          size="small"
          title={m.name}
          style={{ marginBottom: 16 }}
        >
          <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>{m.description}</Paragraph>
          <div style={{ marginBottom: 8 }}>
            <Text strong style={{ fontSize: 13 }}>关联交付物：</Text>
          </div>
          <List
            size="small"
            dataSource={m.deliverables}
            locale={{ emptyText: '暂无交付物' }}
            renderItem={md => {
              const d = project.deliverables.find(dd => dd.templateId === md.id);
              if (!d) return (
                <List.Item>
                  <List.Item.Meta title={md.name} description={md.description} />
                  <Tag color="default">未创建</Tag>
                </List.Item>
              );
              return (
                <List.Item actions={renderActions(d)}>
                  <List.Item.Meta title={d.name} description={md.description} />
                </List.Item>
              );
            }}
          />
        </Card>
      ))}
    </div>
  );
}
