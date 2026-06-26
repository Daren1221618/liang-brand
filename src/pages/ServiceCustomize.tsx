// ============================================================
// 亮品牌 · 服务定制页面
// 可增删调整项目的服务模块和交付物
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Checkbox, Tag, Space, Button, Row, Col,
  Collapse, message, Divider, Alert, Descriptions,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, PlusOutlined,
  MinusCircleOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useApp } from '../context';
import * as storage from '../storage';
import { ENGINE_CONFIG, EngineType, DELIVERABLE_STATUS_LABELS } from '../types';
import { ALL_DELIVERABLES, ALL_MODULES } from '../data';

const { Title, Text, Paragraph } = Typography;

export default function ServiceCustomize() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, refresh } = useApp();

  const project = projects.find(p => p.id === id);
  if (!project) return <div style={{ padding: 24 }}>项目不存在</div>;

  // Current selected deliverable IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(project.deliverables.map(d => d.templateId)));

  const handleToggle = (templateId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return next;
    });
  };

  const handleToggleAll = (engineType: EngineType) => {
    const engineDeliverables = ALL_DELIVERABLES.filter(d => d.engineType === engineType);
    const allSelected = engineDeliverables.every(d => selectedIds.has(d.id));
    const next = new Set(selectedIds);
    if (allSelected) {
      engineDeliverables.forEach(d => next.delete(d.id));
    } else {
      engineDeliverables.forEach(d => next.add(d.id));
    }
    setSelectedIds(next);
  };

  const handleSave = () => {
    // Add new deliverables
    const newDeliverables = ALL_DELIVERABLES
      .filter(d => selectedIds.has(d.id) && !project.deliverables.some(pd => pd.templateId === d.id))
      .map(d => ({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        templateId: d.id,
        name: d.name,
        engineType: d.engineType,
        moduleId: d.moduleId,
        phase: d.engineType as any,
        status: 'pending' as const,
        content: '',
        version: 0,
        versions: [],
        reviewHistory: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

    // Keep existing ones that are still selected, remove unselected ones
    const keptDeliverables = project.deliverables.filter(d => selectedIds.has(d.templateId));

    storage.updateProject(project.id, {
      deliverables: [...keptDeliverables, ...newDeliverables],
    });
    refresh();
    message.success('服务内容已更新');
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="page-container">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${project.id}`)} style={{ marginBottom: 16 }}>
        返回项目
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>服务定制</Title>
          <Text type="secondary">{project.name} — 可自由增删服务模块与交付物</Text>
        </div>
        <Space wrap>
          <Tag color="blue">已选 {selectedIds.size} 项交付物</Tag>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存配置</Button>
        </Space>
      </div>

      <Alert
        message="服务定制说明"
        description="勾选/取消勾选来增减服务内容。新增的交付物将自动添加到项目中（状态：待启动）。已有内容的交付物不会被删除内容，只会从项目清单中移除。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* By Engine */}
      {Object.entries(ENGINE_CONFIG).map(([engineType, config]) => {
        const deliverables = ALL_DELIVERABLES.filter(d => d.engineType === engineType);
        const selectedCount = deliverables.filter(d => selectedIds.has(d.id)).length;
        const allSelected = selectedCount === deliverables.length && deliverables.length > 0;

        return (
          <Card
            key={engineType}
            size="small"
            style={{ marginBottom: 16 }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {config.icon} <Text strong>{config.name}</Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{config.description}</Text>
                </span>
                <Space>
                  <Tag color={selectedCount > 0 ? 'blue' : 'default'}>
                    {selectedCount}/{deliverables.length}
                  </Tag>
                  <Button
                    size="small"
                    type={allSelected ? 'default' : 'primary'}
                    onClick={() => handleToggleAll(engineType as EngineType)}
                  >
                    {allSelected ? '取消全选' : '全选'}
                  </Button>
                </Space>
              </div>
            }
          >
            <Row gutter={[12, 8]}>
              {deliverables.map(d => {
                const isSelected = selectedIds.has(d.id);
                const existing = project.deliverables.find(pd => pd.templateId === d.id);
                const hasContent = existing && existing.content;
                const isApproved = existing && existing.status === 'approved';

                return (
                  <Col xs={24} sm={12} lg={8} key={d.id}>
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: `1px solid ${isSelected ? '#cf1322' : '#f0f0f0'}`,
                        background: isSelected ? '#f0f5ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => handleToggle(d.id)}
                    >
                      <Checkbox checked={isSelected} style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</span>
                      </Checkbox>
                      <div style={{ fontSize: 11, color: '#999', marginLeft: 24 }}>
                        {d.description}
                        {d.isPeriodic && <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>×{d.periodicCount}</Tag>}
                      </div>
                      {existing && (
                        <div style={{ marginLeft: 24, marginTop: 2 }}>
                          <Tag color={
                            existing.status === 'approved' ? 'green' :
                            existing.status === 'reviewing' ? 'warning' :
                            existing.status === 'revision_needed' ? 'red' :
                            existing.status === 'draft' ? 'blue' : 'default'
                          } style={{ fontSize: 10 }}>
                            {DELIVERABLE_STATUS_LABELS[existing.status]}
                          </Tag>
                          {hasContent && <Tag style={{ fontSize: 10 }}>有内容</Tag>}
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        );
      })}
    </div>
  );
}
