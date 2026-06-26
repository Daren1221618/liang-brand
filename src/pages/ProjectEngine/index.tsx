// ============================================================
// 亮品牌 · 引擎工作台（主入口）
// 拆分后的主组件仅负责状态管理和布局编排
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Space, Tag, Tabs, Row, Col, Alert, Empty, Tooltip, Badge, Typography } from 'antd';
import { ArrowLeftOutlined, BookOutlined } from '@ant-design/icons';
import { useApp } from '../../context';
import * as storage from '../../storage';
import type { EngineType } from '../../types';
import { ENGINE_CONFIG } from '../../types';
import { ALL_MODULES, ALL_TOOLS } from '../../data';
import type { ModelProvider } from '../../ai';
import ModelSelector from '../../components/ModelSelector';
import DeliverableCard from './DeliverableCard';
import DeliverableDetail from './DeliverableDetail';
import ModuleList from './ModuleList';
import ToolList from './ToolList';
import EditModal from './EditModal';
import ReviewModal from './ReviewModal';
import KnowledgeDrawer from './KnowledgeDrawer';
import { useAIGenerate } from './hooks/useAIGenerate';
import { useDeliverableActions } from './hooks/useDeliverableActions';

const { Title, Text } = Typography;

export default function ProjectEngine() {
  const { id, engineType } = useParams<{ id: string; engineType: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projects, refresh } = useApp();

  // 选中与编辑状态
  const [activeDeliverable, setActiveDeliverable] = useState<string | null>(null);

  // AI 模型与知识库选择
  const [selectedModel, setSelectedModel] = useState<ModelProvider | 'auto'>('auto');
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);
  const [knowledgeDrawer, setKnowledgeDrawer] = useState(false);

  // 从 URL 参数自动定位交付物（审核中心跳转）
  useEffect(() => {
    const deliverableId = searchParams.get('deliverableId');
    if (deliverableId) {
      setActiveDeliverable(deliverableId);
    }
  }, [searchParams]);

  const project = projects.find(p => p.id === id);
  if (!project) return <div style={{ padding: 24 }}>项目不存在</div>;

  const engine = engineType as EngineType;
  const engineCfg = ENGINE_CONFIG[engine];
  if (!engineCfg) return <div style={{ padding: 24 }}>引擎不存在</div>;

  const engineDeliverables = project.deliverables.filter(d => d.engineType === engine);
  const engineModules = ALL_MODULES.filter(m => m.engineType === engine);
  const engineTools = ALL_TOOLS.filter(t =>
    engineDeliverables.some(d => t.deliverableIds.includes(d.templateId))
  );

  const activeD = activeDeliverable
    ? project.deliverables.find(d => d.id === activeDeliverable)
    : null;

  // ======================== Hooks ========================

  const { generatingId, streamContent, handleAIGenerate, handleStopGenerate } = useAIGenerate({
    projectId: project.id,
    engineType: engine,
    selectedModel,
    selectedKnowledgeIds,
    onSetActive: setActiveDeliverable,
    refresh,
  });

  const {
    editModal, setEditModal,
    reviewModal, setReviewModal,
    editContent, setEditContent,
    reviewComment, setReviewComment,
    handleStartDeliverable,
    handleSaveContent,
    handleSubmitReview,
    handleReview,
    handleEdit,
    handleView,
    handleCardSubmitReview,
    handleCardReview,
  } = useDeliverableActions({
    project,
    activeD: activeD || null,
    refresh,
    onSetActive: setActiveDeliverable,
  });

  // ======================== Render ========================

  const needBrandCheck = !project.brandChecklist || Object.keys(project.brandChecklist).filter(k => project.brandChecklist[k]?.trim()).length < 5;
  const needTimeline = !project.brandTimeline || project.brandTimeline.entries.length === 0;

  return (
    <div className="page-container">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${project.id}`)} style={{ marginBottom: 16 }}>
        返回项目
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>{engineCfg.icon} {engineCfg.name}工作台</Title>
          <Text type="secondary">{project.name} · {engineCfg.description}</Text>
        </div>
        <Space>
          <ModelSelector
            value={selectedModel}
            onChange={setSelectedModel}
            scenario="deliverable_generate"
          />
          <Tooltip title={selectedKnowledgeIds.length > 0 ? `已选${selectedKnowledgeIds.length}个参考文件` : '选择知识库参考文件'}>
            <Badge count={selectedKnowledgeIds.length} size="small">
              <Button size="small" icon={<BookOutlined />} onClick={() => setKnowledgeDrawer(true)}>
                知识库
              </Button>
            </Badge>
          </Tooltip>
          <Tag color={engineCfg.color}>{engineDeliverables.filter(d => d.status === 'approved').length}/{engineDeliverables.length} 已完成</Tag>
        </Space>
      </div>

      <Row gutter={24}>
        {/* Left: Tabs */}
        <Col xs={24} lg={16}>
          <Tabs
            defaultActiveKey="deliverables"
            items={[
              {
                key: 'deliverables',
                label: `交付物 (${engineDeliverables.length})`,
                children: (
                  <div>
                    {needBrandCheck && (
                      <Alert
                        message="品牌自检尚未完成"
                        description="AI生成内容的质量取决于品牌自检和年谱信息的完整度。建议先到启动阶段完成品牌自检和年谱梳理。"
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                        action={<Button size="small" onClick={() => navigate(`/projects/${project.id}/initiation`)}>前往填写</Button>}
                      />
                    )}
                    {needTimeline && (
                      <Alert
                        message="品牌年谱尚未填写"
                        description="品牌年谱是AI生成的重要参考信息源，建议尽早梳理。"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                        action={<Button size="small" onClick={() => navigate(`/projects/${project.id}/initiation`)}>前往填写</Button>}
                      />
                    )}
                    {engineDeliverables.length === 0 ? (
                      <Empty description="该引擎暂无交付物" />
                    ) : (
                      engineDeliverables.map(d => (
                        <DeliverableCard
                          key={d.id}
                          deliverable={d}
                          isActive={activeDeliverable === d.id}
                          onStart={handleStartDeliverable}
                          onAIGenerate={handleAIGenerate}
                          onEdit={handleEdit}
                          onView={handleView}
                          onSubmitReview={handleCardSubmitReview}
                          onReview={handleCardReview}
                        />
                      ))
                    )}
                  </div>
                ),
              },
              {
                key: 'tools',
                label: `工具 (${engineTools.length})`,
                children: <ToolList engineTools={engineTools} />,
              },
              {
                key: 'modules',
                label: `服务模块 (${engineModules.length})`,
                children: (
                  <ModuleList
                    project={project}
                    engineModules={engineModules}
                    onSetActive={setActiveDeliverable}
                    onSetEditContent={setEditContent}
                    onOpenEditModal={() => setEditModal(true)}
                    onOpenReviewModal={() => setReviewModal(true)}
                    onAIGenerate={handleAIGenerate}
                    refresh={refresh}
                  />
                ),
              },
            ]}
          />
        </Col>

        {/* Right: Deliverable Detail */}
        <Col xs={24} lg={8}>
          <DeliverableDetail
            project={project}
            deliverable={activeD || null}
            generatingId={generatingId}
            streamContent={streamContent}
            onStopGenerate={handleStopGenerate}
            onSetEditContent={setEditContent}
            onOpenEditModal={() => setEditModal(true)}
            refresh={refresh}
          />
        </Col>
      </Row>

      {/* Modals & Drawers */}
      <EditModal
        open={editModal}
        deliverable={activeD || null}
        editContent={editContent}
        onContentChange={setEditContent}
        onClose={() => setEditModal(false)}
        onSave={handleSaveContent}
        onSaveAndSubmit={() => { handleSaveContent(); handleSubmitReview(); }}
        onAIGenerate={handleAIGenerate}
      />
      <ReviewModal
        open={reviewModal}
        deliverable={activeD || null}
        reviewComment={reviewComment}
        onCommentChange={setReviewComment}
        onClose={() => setReviewModal(false)}
        onReview={handleReview}
      />
      <KnowledgeDrawer
        open={knowledgeDrawer}
        projectId={project.id}
        selectedKnowledgeIds={selectedKnowledgeIds}
        onSelectionChange={setSelectedKnowledgeIds}
        onClose={() => setKnowledgeDrawer(false)}
      />
    </div>
  );
}
