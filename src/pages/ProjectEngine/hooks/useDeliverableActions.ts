// ============================================================
// 亮品牌 · 交付物操作 Hook
// 封装引擎工作台中所有交付物增删改查操作
// ============================================================

import { useState, useCallback } from 'react';
import { message } from 'antd';
import * as storage from '../../../storage';
import type { Project, ProjectDeliverable, ReviewRecord } from '../../../types';

interface UseDeliverableActionsParams {
  project: Project;
  activeD: ProjectDeliverable | null;
  refresh: () => void;
  onSetActive: (id: string | null) => void;
}

export function useDeliverableActions({
  project,
  activeD,
  refresh,
  onSetActive,
}: UseDeliverableActionsParams) {
  // 编辑/审核弹窗状态
  const [editModal, setEditModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  // ---- 开始编辑交付物 ----
  const handleStartDeliverable = useCallback((dId: string) => {
    storage.updateDeliverable(project.id, dId, { status: 'draft' });
    refresh();
    onSetActive(dId);
    message.success('已开始编辑');
  }, [project.id, refresh, onSetActive]);

  // ---- 保存编辑内容 ----
  const handleSaveContent = useCallback(() => {
    if (!activeD) return;
    const version = {
      version: (activeD.version || 0) + 1,
      content: editContent,
      createdAt: Date.now(),
      author: '当前用户',
    };
    storage.updateDeliverable(project.id, activeD.id, {
      content: editContent,
      version: version.version,
      versions: [...activeD.versions, version],
      updatedAt: Date.now(),
    });
    refresh();
    setEditModal(false);
    message.success('内容已保存');
  }, [activeD, editContent, project.id, refresh]);

  // ---- 提交审核 ----
  const handleSubmitReview = useCallback(() => {
    if (!activeD) return;
    storage.updateDeliverable(project.id, activeD.id, { status: 'reviewing' });
    storage.createReviewTask({
      deliverableId: activeD.id,
      deliverableName: activeD.name,
      projectId: project.id,
      projectName: project.name,
      engineType: activeD.engineType,
      reviewer: '待分配',
      status: 'pending_review',
    });
    refresh();
    message.success('已提交审核');
  }, [activeD, project.id, project.name, refresh]);

  // ---- 审核通过/退回 ----
  const handleReview = useCallback(async (approved: boolean) => {
    if (!activeD) return;
    const record: ReviewRecord = {
      id: Date.now().toString(),
      status: approved ? 'approved' : 'revision_needed',
      reviewer: '审核人',
      comment: reviewComment,
      createdAt: Date.now(),
    };
    await storage.updateDeliverable(project.id, activeD.id, {
      status: approved ? 'approved' : 'revision_needed',
      reviewHistory: [...activeD.reviewHistory, record],
    });
    try {
      const tasks = await storage.getReviewTasks();
      const task = tasks.find((t: any) => t.deliverableId === activeD.id && t.status === 'pending_review');
      if (task) {
        await storage.updateReviewTask(task.id, { status: approved ? 'approved' : 'rejected', comment: reviewComment });
      }
    } catch { /* ignore */ }
    refresh();
    setReviewModal(false);
    onSetActive(null);
    message.success(approved ? '审核通过' : '已退回修改');
  }, [activeD, reviewComment, project.id, refresh, onSetActive]);

  // ---- 卡片操作回调 ----
  const handleEdit = useCallback((dId: string, content: string) => {
    onSetActive(dId);
    setEditContent(content);
    setEditModal(true);
  }, [onSetActive]);

  const handleView = useCallback((dId: string, content: string) => {
    onSetActive(dId);
    setEditContent(content);
  }, [onSetActive]);

  const handleCardSubmitReview = useCallback((dId: string) => {
    onSetActive(dId);
    const d = project.deliverables.find(dd => dd.id === dId);
    if (d) {
      storage.updateDeliverable(project.id, dId, { status: 'reviewing' });
      storage.createReviewTask({
        deliverableId: dId, deliverableName: d.name,
        projectId: project.id, projectName: project.name,
        engineType: d.engineType, reviewer: '待分配', status: 'pending_review',
      });
      refresh();
      message.success('已提交审核');
    }
  }, [project, refresh, onSetActive]);

  const handleCardReview = useCallback((dId: string) => {
    onSetActive(dId);
    setReviewModal(true);
  }, [onSetActive]);

  return {
    // 弹窗状态
    editModal, setEditModal,
    reviewModal, setReviewModal,
    editContent, setEditContent,
    reviewComment, setReviewComment,
    // 操作方法
    handleStartDeliverable,
    handleSaveContent,
    handleSubmitReview,
    handleReview,
    handleEdit,
    handleView,
    handleCardSubmitReview,
    handleCardReview,
  };
}
