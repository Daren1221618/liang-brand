// ============================================================
// 亮品牌 · 本地存储引擎（LocalStorage 模式）
// 用于无后端环境（GitHub Pages / 纯静态部署）
// 使用 localStorage 作为持久化存储，支持完整 CRUD
// ============================================================

import type { Customer, Project, Quote, ReviewTask, ProjectDeliverable, ID } from './types';
import type { UserInfo } from './userTypes';
import { getDemoData } from './demoData';
import { createEmptyChecklist } from './brandChecklist';
import { createEmptyTimeline } from './brandTimeline';

// ==================== 基础工具 ====================

const PREFIX = 'lb_';

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function lsSet(key: string, value: any): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      console.warn('[亮品牌] localStorage 已满，请清理部分数据');
    }
  }
}

function lsRemove(key: string): void {
  try { localStorage.removeItem(PREFIX + key); } catch {}
}

/** 生成唯一 ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// ==================== 默认用户（本地模式） ====================

const LOCAL_USERS: Record<string, { password: string; user: UserInfo }> = {
  admin:   { password: 'admin123', user: { id: 'u-admin',   username: 'admin',   displayName: '系统管理员', role: 'admin' } },
  jingliang: { password: '123456',   user: { id: 'u-jl',     username: 'jingliang', displayName: '敬亮',       role: 'consultant' } },
  designer: { password: '123456',   user: { id: 'u-design', username: 'designer',  displayName: '设计师',     role: 'designer' } },
  pm:      { password: '123456',   user: { id: 'u-pm',     username: 'pm',        displayName: '项目经理',   role: 'pm' } },
  strategist: { password: '123456', user: { id: 'u-strat',  username: 'strategist', displayName: '战略师',     role: 'strategist' } },
};

// ==================== 初始化检测 ====================

let _initialized = false;

/** 是否已初始化过演示数据 */
export function isLocalDbInitialized(): boolean {
  return lsGet<boolean>('_init') === true;
}

/** 初始化：首次使用时写入演示数据 */
export function initLocalDb(): void {
  if (_initialized || isLocalDbInitialized()) {
    _initialized = true;
    return;
  }

  const demo = getDemoData();
  lsSet('customers', demo.customers);
  lsSet('quotes', demo.quotes);
  lsSet('projects', demo.projects);
  lsSet('reviewTasks', demo.reviewTasks);
  lsSet('_init', true);
  _initialized = true;
  console.log('[亮品牌] 本地存储引擎已初始化（含 5 个案例项目）');
}

// ==================== 认证 ====================

export function localLogin(username: string, password: string): { token: string; user: UserInfo } {
  const entry = LOCAL_USERS[username];
  if (!entry || entry.password !== password) {
    throw new Error('用户名或密码错误');
  }
  const token = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  lsSet('_currentUser', entry.user);
  lsSet('_token', token);
  return { token, user: entry.user };
}

export function localGetCurrentUser(): UserInfo | null {
  return lsGet<UserInfo>('_currentUser');
}

export function localLogout(): void {
  lsRemove('_currentUser');
  lsRemove('_token');
}

export function localGetToken(): string | null {
  return lsGet<string>('_token');
}

export function getLocalUsers(): UserInfo[] {
  return Object.values(LOCAL_USERS).map(e => e.user);
}

// ==================== 客户 CRUD ====================

export function localGetCustomers(): Customer[] {
  return lsGet<Customer[]>('customers') || [];
}

export function localCreateCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Customer {
  const customers = localGetCustomers();
  const newCustomer: Customer = {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
  };
  customers.push(newCustomer);
  lsSet('customers', customers);
  return newCustomer;
}

export function localUpdateCustomer(id: ID, data: Partial<Customer>): void {
  const customers = localGetCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx >= 0) {
    customers[idx] = { ...customers[idx], ...data };
    lsSet('customers', customers);
  }
}

export function localDeleteCustomer(id: ID): void {
  lsSet('customers', localGetCustomers().filter(c => c.id !== id));
}

// ==================== 报价 CRUD ====================

export function localGetQuotes(): Quote[] {
  return lsGet<Quote[]>('quotes') || [];
}

export function localCreateQuote(data: Omit<Quote, 'id' | 'createdAt'>): Quote {
  const quotes = localGetQuotes();
  const newQuote: Quote = {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
  };
  quotes.push(newQuote);
  lsSet('quotes', quotes);
  return newQuote;
}

export function localUpdateQuote(id: ID, data: Partial<Quote>): void {
  const quotes = localGetQuotes();
  const idx = quotes.findIndex(q => q.id === id);
  if (idx >= 0) {
    quotes[idx] = { ...quotes[idx], ...data };
    lsSet('quotes', quotes);
  }
}

export function localDeleteQuote(id: ID): void {
  lsSet('quotes', localGetQuotes().filter(q => q.id !== id));
}

// ==================== 项目 CRUD ====================

export function localGetProjects(): Project[] {
  return lsGet<Project[]>('projects') || [];
}

export function localGetProject(id: ID): Project | undefined {
  return localGetProjects().find(p => p.id === id);
}

export async function localCreateProject(
  customerId: ID,
  customerName: string,
  industry: string,
  packageType: Quote['packageType'],
  selectedDeliverableIds: string[],
  name?: string,
): Promise<Project> {
  const { ALL_DELIVERABLES } = await import('./data');
  const now = Date.now();
  const deliverables: ProjectDeliverable[] = selectedDeliverableIds.map(dId => {
    const tpl = ALL_DELIVERABLES.find(d => d.id === dId);
    if (!tpl) return null;
    return {
      id: generateId(),
      templateId: tpl.id,
      name: tpl.name,
      engineType: tpl.engineType,
      moduleId: tpl.moduleId,
      phase: tpl.engineType as any,
      status: 'pending',
      content: '',
      version: 0,
      versions: [],
      reviewHistory: [],
      isPeriodic: false,
      createdAt: now,
      updatedAt: now,
    };
  }).filter(Boolean) as ProjectDeliverable[];

  const phases: any[] = ['initiation', 'competition', 'strategy', 'image', 'space', 'marketing', 'organization', 'delivery', 'completed'];

  const newProject: Project = {
    id: generateId(),
    customerId,
    customerName,
    name: name || `${customerName}-品牌创建项目`,
    industry,
    packageType,
    currentPhase: 'initiation',
    phases,
    startAt: now,
    status: 'active',
    team: [],
    deliverables,
    selectedModuleIds: selectedDeliverableIds,
    createdAt: now,
    updatedAt: now,
    notes: '',
    monthlyWorkPlan: [],
    brandChecklist: createEmptyChecklist(),
    brandTimeline: createEmptyTimeline(),
  };

  const projects = localGetProjects();
  projects.push(newProject);
  lsSet('projects', projects);
  return newProject;
}

export function localUpdateProject(id: ID, data: Partial<Project>): void {
  const projects = localGetProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx >= 0) {
    projects[idx] = { ...projects[idx], ...data, updatedAt: Date.now() };
    lsSet('projects', projects);
  }
}

export function localDeleteProject(id: ID): void {
  lsSet('projects', localGetProjects().filter(p => p.id !== id));
}

// ==================== 交付物更新 ====================

export function localUpdateDeliverable(
  projectId: ID,
  deliverableId: ID,
  data: Partial<ProjectDeliverable>,
): void {
  const projects = localGetProjects();
  const pIdx = projects.findIndex(p => p.id === projectId);
  if (pIdx < 0) throw new Error('项目不存在');

  const project = projects[pIdx];
  const dIdx = project.deliverables.findIndex(d => d.id === deliverableId);
  if (dIdx < 0) throw new Error('交付物不存在');

  project.deliverables[dIdx] = {
    ...project.deliverables[dIdx],
    ...data,
    updatedAt: Date.now(),
  };
  project.updatedAt = Date.now();
  lsSet('projects', projects);
}

// ==================== 审核 CRUD ====================

export function localGetReviewTasks(): ReviewTask[] {
  return lsGet<ReviewTask[]>('reviewTasks') || [];
}

export function localCreateReviewTask(data: Omit<ReviewTask, 'id' | 'createdAt'>): ReviewTask {
  const tasks = localGetReviewTasks();
  const newTask: ReviewTask = {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
  };
  tasks.push(newTask);
  lsSet('reviewTasks', tasks);
  return newTask;
}

export function localUpdateReviewTask(id: ID, data: Partial<ReviewTask>): void {
  const tasks = localGetReviewTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...data };
    lsSet('reviewTasks', tasks);
  }
}

// ==================== 统计 ====================

export function localGetDashboardStats() {
  const customers = localGetCustomers();
  const projects = localGetProjects();
  const quotes = localGetQuotes();
  const reviewTasks = localGetReviewTasks();

  const allDeliverables = projects.flatMap(p => p.deliverables);
  const completedDeliverables = allDeliverables.filter(d => d.status === 'approved');

  // 从付款进度计算营收
  let totalRevenue = 0;
  quotes.forEach(q => {
    if (q.status === 'accepted') {
      q.paymentSchedule?.forEach(ps => {
        if (ps.paid) totalRevenue += ps.amount || 0;
      });
    }
  });

  return {
    totalCustomers: customers.length,
    intentionCustomers: customers.filter(c => c.stage === 'intention').length,
    signedCustomers: customers.filter(c => c.stage === 'signed').length,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalQuotes: quotes.length,
    totalDeliverables: allDeliverables.length,
    completedDeliverables: completedDeliverables.length,
    pendingReviews: reviewTasks.filter(t => t.status === 'pending_review').length,
    totalRevenue,
  };
}

// ==================== 品牌自检/年谱 ====================

export function localUpdateBrandChecklist(projectId: ID, data: Partial<Record<string, string>>): void {
  const projects = localGetProjects();
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx >= 0) {
    projects[idx].brandChecklist = { ...projects[idx].brandChecklist, ...data };
    lsSet('projects', projects);
  }
}

export function localUpdateBrandTimeline(projectId: ID, data: Partial<Project['brandTimeline']>): void {
  const projects = localGetProjects();
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx >= 0) {
    projects[idx].brandTimeline = { ...projects[idx].brandTimeline, ...data, updatedAt: Date.now() };
    lsSet('projects', projects);
  }
}

// ==================== 数据导出/导入 ====================

export function localExportData(): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    customers: localGetCustomers(),
    quotes: localGetQuotes(),
    projects: localGetProjects(),
    reviewTasks: localGetReviewTasks(),
  };
  return JSON.stringify(data, null, 2);
}

export function localImportData(jsonStr: string): { message: string; count: number } {
  try {
    const data = JSON.parse(jsonStr);
    let count = 0;
    if (Array.isArray(data.customers)) { lsSet('customers', data.customers); count += data.customers.length; }
    if (Array.isArray(data.quotes)) { lsSet('quotes', data.quotes); count += data.quotes.length; }
    if (Array.isArray(data.projects)) { lsSet('projects', data.projects); count += data.projects.length; }
    if (Array.isArray(data.reviewTasks)) { lsSet('reviewTasks', data.reviewTasks); count += data.reviewTasks.length; }
    return { message: '导入成功', count };
  } catch {
    throw new Error('数据格式错误，无法导入');
  }
}

// ==================== 公开设置（本地默认值） ====================

export const DEFAULT_PUBLIC_SETTINGS: Record<string, string> = {
  brand_name: '亮品牌',
  brand_system_title: '周期性项目服务系统',
  brand_primary: '#cf1322',
  brand_logo: '\u2726',
  navigate_name: '领航计划',
  voyage_name: '远航计划',
  set_sail_name: '起航计划',
  custom_name: '定制方案',
  navigate_price: '248000',
  voyage_price: '598000',
  set_sail_price: '68000',
};
