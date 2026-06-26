// ============================================================
// 亮品牌 · 数据存储层（API 模式）
// 所有数据通过后端 API 读写，统一认证与错误处理
// ============================================================

import api from './api';
import type { Customer, Project, Quote, ProjectDeliverable, ReviewTask, ID, ProjectPhase } from './types';
import type { UserInfo } from './userTypes';
import { createEmptyChecklist } from './brandChecklist';
import { createEmptyTimeline } from './brandTimeline';

// ========== 认证 ==========

export async function login(username: string, password: string): Promise<{ token: string; user: UserInfo }> {
  return api.post('/api/auth/login', { username, password });
}

export async function getCurrentUser(): Promise<UserInfo> {
  return api.get('/api/auth/me');
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  return api.put('/api/auth/password', { oldPassword, newPassword });
}

export async function getUsers(): Promise<UserInfo[]> {
  return api.get('/api/users');
}

export async function createUser(data: { username: string; password: string; role: string; displayName: string }): Promise<void> {
  return api.post('/api/users', data);
}

export async function deleteUser(id: string): Promise<void> {
  return api.delete(`/api/users/${id}`);
}

// ========== 客户 ==========

export async function getCustomers(): Promise<Customer[]> {
  return api.get('/api/customers');
}

export async function getCustomer(id: ID): Promise<Customer | undefined> {
  try { return await api.get(`/api/customers/${id}`); } catch { return undefined; }
}

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
  const res = await api.post<{ id: string; created_at: number }>('/api/customers', data);
  return { ...data, id: res.id, createdAt: res.created_at };
}

export async function updateCustomer(id: ID, data: Partial<Customer>): Promise<void> {
  await api.put(`/api/customers/${id}`, data);
}

export async function deleteCustomer(id: ID): Promise<void> {
  await api.delete(`/api/customers/${id}`);
}

// ========== 报价 ==========

export async function getQuotes(): Promise<Quote[]> {
  return api.get<Quote[]>('/api/quotes');
}

export async function getQuote(id: ID): Promise<Quote | undefined> {
  try {
    return await api.get<Quote>(`/api/quotes/${id}`);
  } catch { return undefined; }
}

export async function createQuote(data: Omit<Quote, 'id' | 'createdAt'>): Promise<Quote> {
  const res = await api.post<{ id: string; created_at: number }>('/api/quotes', data);
  return { ...data, id: res.id, createdAt: res.created_at };
}

export async function updateQuote(id: ID, data: Partial<Quote>): Promise<void> {
  await api.put(`/api/quotes/${id}`, data);
}

export async function deleteQuote(id: ID): Promise<void> {
  await api.delete(`/api/quotes/${id}`);
}

// ========== 项目 ==========

export async function getProjects(): Promise<Project[]> {
  return api.get<Project[]>('/api/projects');
}

export async function getProject(id: ID): Promise<Project | undefined> {
  try { return await api.get<Project>(`/api/projects/${id}`); } catch { return undefined; }
}

export async function createProject(
  _quoteId: string,
  customerId: ID,
  customerName: string,
  industry: string,
  packageType: Quote['packageType'],
  selectedDeliverableIds: string[],
  name?: string,
): Promise<Project> {
  // 构建交付物列表
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
      phase: tpl.engineType as ProjectPhase,
      status: 'pending' as const,
      content: '',
      version: 0,
      versions: [],
      reviewHistory: [],
      createdAt: now,
      updatedAt: now,
    };
  }).filter(Boolean) as ProjectDeliverable[];

  const phases: ProjectPhase[] = ['initiation', 'competition', 'strategy', 'image', 'space', 'marketing', 'organization', 'delivery', 'completed'];

  const res = await api.post<{ id: string; created_at: number }>('/api/projects', {
    customerId,
    customerName,
    name: name || `${customerName}-品牌创建项目`,
    industry,
    packageType,
    phases,
    deliverables,
    notes: `来源于报价单 ${_quoteId}`,
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
    notes: `来源于报价单 ${_quoteId}`,
    monthlyWorkPlan: [],
    brandChecklist: createEmptyChecklist(),
    brandTimeline: createEmptyTimeline(),
  };
}

export async function updateProject(id: ID, data: Partial<Project>): Promise<void> {
  await api.put(`/api/projects/${id}`, data);
}

export async function deleteProject(id: ID): Promise<void> {
  await api.delete(`/api/projects/${id}`);
}

// ========== 交付物 ==========

export async function updateDeliverable(
  projectId: ID,
  deliverableId: ID,
  data: Partial<ProjectDeliverable>,
): Promise<void> {
  // 交付物嵌套在项目内，需要读取项目 → 修改交付物 → 写回
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

// ========== 审核 ==========

export async function getReviewTasks(): Promise<ReviewTask[]> {
  return api.get('/api/review-tasks');
}

export async function createReviewTask(data: Omit<ReviewTask, 'id' | 'createdAt'>): Promise<ReviewTask> {
  const res = await api.post<{ id: string; created_at: number }>('/api/review-tasks', data);
  return { ...data, id: res.id, createdAt: res.created_at };
}

export async function updateReviewTask(id: ID, data: Partial<ReviewTask>): Promise<void> {
  await api.put(`/api/review-tasks/${id}`, data);
}

// ========== 统计 ==========

export async function getDashboardStats() {
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

// ========== 品牌自检 ==========

export async function updateBrandChecklist(projectId: ID, data: Partial<Record<string, string>>): Promise<void> {
  const project = await getProject(projectId);
  if (!project) throw new Error('项目不存在');
  const merged = { ...project.brandChecklist, ...data };
  await api.put(`/api/projects/${projectId}`, { brandChecklist: merged });
}

// ========== 品牌年谱 ==========

export async function updateBrandTimeline(projectId: ID, data: Partial<Project['brandTimeline']>): Promise<void> {
  const project = await getProject(projectId);
  if (!project) throw new Error('项目不存在');
  const merged = { ...project.brandTimeline, ...data, updatedAt: Date.now() };
  await api.put(`/api/projects/${projectId}`, { brandTimeline: merged });
}

// ========== 数据导出/导入 ==========

export async function exportData(): Promise<void> {
  await api.download('/api/data/export', `liang-brand-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

export async function importData(file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const text = await file.text();
  const json = JSON.parse(text);
  return api.post('/api/data/import', json);
}
