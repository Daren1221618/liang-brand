// ============================================================
// 亮品牌 · 服务体系总览（主入口）
// 拆分后的主组件仅负责视图切换和详情抽屉
// ============================================================

import React, { useState, useMemo } from 'react';
import { Typography, Drawer, Input, Segmented, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { EngineType } from '../../types';
import { ENGINE_CONFIG } from '../../types';
import { SERVICE_TREE } from '../../serviceTree';
import { ALL_DELIVERABLES, ALL_TOOLS } from '../../data';
import type { DetailItem } from './types';
import EngineView from './EngineView';
import ModuleView from './ModuleView';
import DeliverableView from './DeliverableView';
import EngineDetailPanel from './EngineDetailPanel';
import ParentDetailPanel from './ParentDetailPanel';
import ChildDetailPanel from './ChildDetailPanel';
import ToolDetailPanel from './ToolDetailPanel';
import DeliverableDetailPanel from './DeliverableDetailPanel';

const { Title, Paragraph, Text } = Typography;

type ViewMode = 'engine' | 'module' | 'deliverable';

export default function ServiceBlueprint() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<DetailItem | null>(null);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('engine');

  const enginesTyped = Object.entries(ENGINE_CONFIG) as [EngineType, typeof ENGINE_CONFIG[EngineType]][];

  const handleOpenDetail = (item: DetailItem) => {
    setActiveItem(item);
    setDrawerOpen(true);
  };

  const totalChildren = SERVICE_TREE.reduce((s, e) => s + e.parents.reduce((s2, p) => s2 + p.children.length, 0), 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Title level={3}>亮品牌 · 服务体系总览</Title>
        <Paragraph type="secondary">
          六大服务引擎 × 工具 × 交付物 — 完整服务体系蓝图。点击任意项查看详情。
        </Paragraph>
      </div>

      {/* Toolbar */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="搜索板块、服务模块、工具、交付物..."
          prefix={<SearchOutlined />}
          allowClear
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 360, flex: '1 1 200px' }}
        />
        <Segmented
          value={viewMode}
          options={[
            { label: '按引擎', value: 'engine' },
            { label: '按模块', value: 'module' },
            { label: '按交付物', value: 'deliverable' },
          ]}
          onChange={v => setViewMode(v as ViewMode)}
        />
        <Text type="secondary" style={{ marginLeft: 'auto' }}>
          共 {totalChildren} 项服务 · {ALL_TOOLS.length} 个工具 · {ALL_DELIVERABLES.length} 个交付物
        </Text>
      </div>

      {/* View */}
      {viewMode === 'engine' && (
        <EngineView enginesTyped={enginesTyped} searchText={searchText} onOpenDetail={handleOpenDetail} />
      )}
      {viewMode === 'module' && (
        <ModuleView enginesTyped={enginesTyped} onOpenDetail={handleOpenDetail} />
      )}
      {viewMode === 'deliverable' && (
        <DeliverableView enginesTyped={enginesTyped} onOpenDetail={handleOpenDetail} />
      )}

      {/* Detail Drawer */}
      <Drawer
        title={null}
        placement="right"
        width={window.innerWidth <= 768 ? '100%' : 680}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
        destroyOnClose
      >
        {activeItem && (
          activeItem.type === 'engine' ? (
            <EngineDetailPanel engineType={activeItem.engineType} />
          ) : activeItem.type === 'parent' ? (
            <ParentDetailPanel parentId={activeItem.id} engineType={activeItem.engineType} engineColor={ENGINE_CONFIG[activeItem.engineType].color} />
          ) : activeItem.type === 'child' ? (
            <ChildDetailPanel childId={activeItem.id} engineType={activeItem.engineType} engineColor={ENGINE_CONFIG[activeItem.engineType].color} />
          ) : activeItem.type === 'tool' ? (
            <ToolDetailPanel toolId={activeItem.id} engineType={activeItem.engineType} engineColor={ENGINE_CONFIG[activeItem.engineType].color} />
          ) : activeItem.type === 'deliverable' ? (
            <DeliverableDetailPanel deliverableId={activeItem.id} engineType={activeItem.engineType} engineColor={ENGINE_CONFIG[activeItem.engineType].color} />
          ) : (
            <Empty description="暂无详情" />
          )
        )}
      </Drawer>
    </div>
  );
}
