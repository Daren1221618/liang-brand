// ============================================================
// 亮品牌 · 数据存储层（双模式：API / LocalStorage）
// 有后端时走 API，无后端时自动切换到 localStorage
// ============================================================

import api from './api';
import type { Customer, Project, Quote, ProjectDeliverable, ReviewTask, ID } from './types';
import type { UserInfo } from './userTypes';
import { createEmptyChecklist } from './brandChecklist';
import { createEmptyTimeline } from './brandTimeline';
import * as localDb from './localDb';

// ==================== 模式检测 ====================

let _useLocalMode: boolean | null = null;

/** 检测并缓存后端可用性 */
export async function detectBackendMode(): Promise<boolean> {
  if (_useLocalMode !== null) return !_useLocalMode;
  try {
    await api.get('/api/health');
    _useLocalMode = false;
    return true;
  } catch {
    _useLocalMode = true;
    localDb.initLocalDb();
    return false;
  }
}

/** 是否正在使用本地存储模式 */
export function isLocalMode(): boolean {
  return _useLocalMode === true;
}

// ==================== 认证 ====================

export async function login(username: string, password: string): Promise<{ token: string; user: UserInfo }> {
  if (isLocalMode()) {
    return localDb.localLogin(username, password);
  }
  return api.post('/api/auth/login', { username, password });
}

export async function getCurrentUser(): Promise<UserInfo> {
  if (isLocalMode()) {
    const user = localDb.localGetCurrentUser();
    if (!user) throw new Error('未登录');
    return user;
  }
  return api.get('/api/auth/me');
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  if (isLocalMode()) {
    // 本地模式不支持修改密码（模拟）
    console.log('[亮品牌] 本地模式不支持修改密码');
    return;
  }
  return api.put('/api/auth/password', { oldPassword, newPassword });
}

export async function getUsers(): Promise<UserInfo[]> {
  if (isLocalMode()) {
    return localDb.getLocalUsers();
  }
  return api.get('/api/users');
}

export async function createUser(data: { username: string; password: string; role: string; displayName: string }): Promise<void> {
  if (isLocalMode()) {
    console.log('[亮品牌] 本地模式不支持创建用户');
    return;
  }
  return api.post('/api/users', data);
}

export async function deleteUser(id: string): Promise<void> {
  if (isLocalMode()) {
    console.log('[亮品牌] 本地模式不支持删除用户');
    return;
  }
  return api.delete(`/api/users/${id}`);
}

// ==================== 客户 CRUD ====================

export async function getCustomers(): Promise<Customer[]> {
  if (isLocalMode()) return localDb.localGetCustomers();
  return api.get('/api/customers');
}

export async function getCustomer(id: ID): Promise<Customer | undefined> {
  if (isLocalMode()) return localDb.localGetCustomers().find(c => c.id === id);
  try { return await api.get(`/api/customers/${id}`); } catch { return undefined; }
}

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
  if (isLocalMode()) return localDb.localCreateCustomer(data);
  const res = await api.post<{ id: string; created_at: number }>('/api/customers', data);
  return { ...data, id: res.id, createdAt: res.created_at };
}

export async function updateCustomer(id: ID, data: Partial<Customer>): Promise<void> {
  if (isLocalMode()) { localDb.localUpdateCustomer(id, data); return; }
  await api.put(`/api/customers/${id}`, data);
}

export async function deleteCustomer(id: ID): Promise<void> {
  if (isLocalMode()) { localDb.localDeleteCustomer(id); return; }
  await api.delete(`/api/customers/${id}`);
}

// ==================== 报价 CRUD ====================

export async function getQuotes(): Promise<Quote[]> {
  if (isLocalMode()) return localDb.localGetQuotes();
  return api.get<Quote[]>('/api/quotes');
}

export async function getQuote(id: ID): Promise<Quote | undefined> {
  if (isLocalMode()) return localDb.localGetQuotes().find(q => q.id === id);
  try { return await api.get<Quote>(`/api/quotes/${id}`); } catch { return undefined; }
}

export async function createQuote(data: Omit<Quote, 'id' | 'createdAt'>): Promise<Quote> {
  if (isLocalMode()) return localDb.localCreateQuote(data);
  const res = await api.post<{ id: string; created_at: number }>('/api/quotes', data);
  return { ...data, id: res.id, createdAt: res.created_at };
}

export async function updateQuote(id: ID, data: Partial<Quote>): Promise<void> {
  if (isLocalMode()) { localDb.localUpdateQuote(id, data); return; }
  await api.put(`/api/quotes/${id}`, data);
}

export async function deleteQuote(id: ID): Promise<void> {
  if (isLocalMode()) { localDb.localDeleteQuote(id); return; }
  await api.delete(`/api/quotes/${id}`);
}

// ==================== 项目 CRUD ====================

export async function getProjects(): Promise<Project[]> {
  if (isLocalMode()) return localDb.localGetProjects();
  return api.get<Project[]>('/api/projects');
}

export async function getProject(id: ID): Promise<Project | undefined> {
  if (isLocalMode()) return localDb.localGetProject(id);
  try { return await api.get<Project>(`/api/projects/${id}`); } catch { return undefined; }
}

export async function createProject(
  quoteId: string,
  customerId: ID,
  customerName: string,
  industry: string,
  packageType: Quote['packageType'],
  selectedDeliverableIds: string[],
  name?: string,
): Promise<Project> {
  if (isLocalMode()) {
    return localDb.localCreateProject(customerId, customerName, industry, packageType, selectedDeliverableIds, name);
  }

  const now = Date.now();
  const { ALL_DELIVERABLES } = await import('./data');
  const deliverables: ProjectDeliverable[] = selectedDeliverableIds.map(dId => {
    const tpl = ALL_DELIVERABLES.find(d => d.id === dId);
    if (!tpl) return null;
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      templateId: tpl.id,
      name: tpl.name,
      engineType: tpl.engineType,
      moduleId: tpl.moduleId,
      phase: tpl.engineType as any,
      status: 'pending' as const,
      content: '',
      version: 0,
      versions: [],
      reviewHistory: [],
      createdAt: now,
      updatedAt: now,
    };
  }).filter(Boolean) as ProjectDeliverable[];

  const phases: any[] = ['initiation', 'competition', 'strategy', 'image', 'space', 'marketing', 'organization', 'delivery', 'completed'];

  const res = await api.post<{ id: string; created_at: number }>('/api/projects', {
    customerId,
    customerName,
    name: name || `${customerName}-品牌创建项目`,
    industry,
    packageType,
    phases,
    deliverables,
    notes: `来源于报价单 ${quoteId}`,
    brandChecklist: createEmptyChecklist(),
    brandTimeline: createEmptyTimeline(),
  });

  return {
    id: res.id,
    customerId,
    customerName,
    name: name || `${customerName}-品牌创建项目`,
    industry,
    packageType,
    currentPhase: 'initiation',
    phases,
    startAt: res.created_at,
    status: 'active',
    team: [],
    deliverables,
    selectedModuleIds: [],
    createdAt: res.created_at,
    updatedAt: res.created_at,
    notes: `来源于报价单 ${quoteId}`,
    monthlyWorkPlan: [],
    brandChecklist: createEmptyChecklist(),
    brandTimeline: createEmptyTimeline(),
  };
}

export async function updateProject(id: ID, data: Partial<Project>): Promise<void> {
  if (isLocalMode()) { localDb.localUpdateProject(id, data); return; }
  await api.put(`/api/projects/${id}`, data);
}

export async function deleteProject(id: ID): Promise<void> {
  if (isLocalMode()) { localDb.localDeleteProject(id); return; }
  await api.delete(`/api/projects/${id}`);
}

// ==================== 交付物更新 ====================

export async function updateDeliverable(
  projectId: ID,
  deliverableId: ID,
  data: Partial<ProjectDeliverable>,
): Promise<void> {
  if (isLocalMode()) {
    localDb.localUpdateDeliverable(projectId, deliverableId, data);
    return;
  }

  // API 模式：读取项目 → 修改 → 写回
  const project = await getProject(projectId);
  if (!project) throw new Error('项目不存在');

  const idx = project.deliverables.findIndex(d => d.id === deliverableId);
  if (idx < 0) throw new Error('交付物不存在');

  project.deliverables[idx] = {
    ...project.deliverables[idx],
    ...data,
    updatedAt: Date.now(),
  };

  await api.put(`/api/projects/${projectId}`, { deliverables: project.deliverables });
}

// ==================== 审核 CRUD ====================

export async function getReviewTasks(): Promise<ReviewTask[]> {
  if (isLocalMode()) return localDb.localGetReviewTasks();
  return api.get('/api/review-tasks');
}

export async function createReviewTask(data: Omit<ReviewTask, 'id' | 'createdAt'>): Promise<ReviewTask> {
  if (isLocalMode()) return localDb.localCreateReviewTask(data);
  const res = await api.post<{ id: string; created_at: number }>('/api/review-tasks', data);
  return { ...data, id: res.id, createdAt: res.created_at };
}

export async function updateReviewTask(id: ID, data: Partial<ReviewTask>): Promise<void> {
  if (isLocalMode()) { localDb.localUpdateReviewTask(id, data); return; }
  await api.put(`/api/review-tasks/${id}`, data);
}

// ==================== 统计 ====================

export async function getDashboardStats() {
  if (isLocalMode()) return localDb.localGetDashboardStats();
  return api.get<{
    totalCustomers: number;
    intentionCustomers: number;
    signedCustomers: number;
    totalProjects: number;
    activeProjects: number;
    totalQuotes: number;
    totalDeliverables: number;
    completedDeliverables: number;
    pendingReviews: number;
    totalRevenue: number;
  }>('/api/stats');
}

// ==================== 品牌自检/年谱 ====================

export async function updateBrandChecklist(projectId: ID, data: Partial<Record<string, string>>): Promise<void> {
  if (isLocalMode()) { localDb.localUpdateBrandChecklist(projectId, data); return; }
  const project = await getProject(projectId);
  if (!project) throw new Error('项目不存在');
  const merged = { ...project.brandChecklist, ...data };
  await api.put(`/api/projects/${projectId}`, { brandChecklist: merged });
}

export async function updateBrandTimeline(projectId: ID, data: Partial<Project['brandTimeline']>): Promise<void> {
  if (isLocalMode()) { localDb.localUpdateBrandTimeline(projectId, data); return; }
  const project = await getProject(projectId);
  if (!project) throw new Error('项目不存在');
  const merged = { ...project.brandTimeline, ...data, updatedAt: Date.now() };
  await api.put(`/api/projects/${projectId}`, { brandTimeline: merged });
}

// ==================== 数据导出/导入 ====================

export async function exportData(): Promise<void> {
  if (isLocalMode()) {
    const json = localDb.localExportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liang-brand-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await api.download('/api/data/export', `liang-brand-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

export async function importData(file: File): Promise<{ message: string }> {
  if (isLocalMode()) {
    const text = await file.text();
    return localDb.localImportData(text);
  }
  const formData = new FormData();
  formData.append('file', file);
  const text = await file.text();
  const json = JSON.parse(text);
  return api.post('/api/data/import', json);
}
