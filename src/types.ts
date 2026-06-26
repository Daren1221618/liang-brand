// ============================================================
// 亮品牌 · 核心类型定义
// 基于品牌服务计划书，定义客户、项目、交付物、审核等全部实体
// ============================================================

// ---------- 通用 ----------
export type ID = string;
export type Timestamp = number;

export type Role = 'admin' | 'consultant' | 'strategist' | 'designer' | 'pm';
export const ROLE_LABELS: Record<Role, string> = {
  admin: '管理员',
  consultant: '咨询顾问',
  strategist: '策略师',
  designer: '设计师',
  pm: '项目经理',
};

export type DeliverableStatus = 'pending' | 'draft' | 'ai_generating' | 'reviewing' | 'approved' | 'revision_needed';
export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  pending: '待启动',
  draft: '草稿',
  ai_generating: 'AI生成中',
  reviewing: '审核中',
  approved: '已通过',
  revision_needed: '需修改',
};

export type CustomerStage = 'intention' | 'quoting' | 'negotiating' | 'signed' | 'lost';
export const CUSTOMER_STAGE_LABELS: Record<CustomerStage, string> = {
  intention: '意向客户',
  quoting: '报价中',
  negotiating: '洽谈中',
  signed: '已签约',
  lost: '已流失',
};

// ---------- 服务体系 ----------

// 六大引擎
export type EngineType = 'competition' | 'strategy' | 'image' | 'space' | 'marketing' | 'organization';
export const ENGINE_CONFIG: Record<EngineType, { name: string; icon: string; color: string; description: string }> = {
  competition: { name: '亮竞争', icon: '🏆', color: '#faad14', description: '赢在哪儿？——找准赛道，构建壁垒' },
  strategy: { name: '亮战略', icon: '🧭', color: '#cf1322', description: '去向何方？——明确方向，顶层设计' },
  image: { name: '亮形象', icon: '🎭', color: '#eb2f96', description: '凭什么爱？——打造峰值，情感共鸣' },
  space: { name: '亮空间', icon: '🏗️', color: '#52c41a', description: '身在何处？——营造场景叙事' },
  marketing: { name: '亮营销', icon: '📢', color: '#722ed1', description: '如何增长？——引爆市场，持续获客' },
  organization: { name: '亮组织', icon: '👥', color: '#13c2c2', description: '怎样持续？——内化能力，组织进化' },
};

// 服务模块（引擎下的子模块）
export interface ServiceModule {
  id: string;
  engineType: EngineType;
  name: string;
  description: string;
  deliverables: DeliverableTemplate[];
  roles: Role[]; // 适用的岗位
  tools: ToolTemplate[];
}

// 工具模板
export interface ToolTemplate {
  id: string;
  name: string;
  description: string;
  deliverableIds: string[]; // 该工具产出哪些交付物
}

// 交付物模板
export interface DeliverableTemplate {
  id: string;
  name: string;
  description: string;
  engineType: EngineType;
  moduleId: string;
  roles: Role[];
  estimatedHours: number;
  isPeriodic: boolean; // 是否周期性产出
  periodicCount?: number; // 周期性次数（如季度监测4次）
}

// ---------- 套餐体系 ----------
export type PackageType = 'navigate' | 'voyage' | 'set_sail';
export const PACKAGE_CONFIG: Record<PackageType, { name: string; months: number; price: number; description: string; engines: EngineType[]; deliverableCount: number }> = {
  navigate: {
    name: '领航计划',
    months: 6,
    price: 248000,
    description: '6个月战略深化，从1到10的系统化品牌升级',
    engines: ['competition', 'strategy', 'image', 'marketing', 'organization'],
    deliverableCount: 10,
  },
  voyage: {
    name: '远航计划',
    months: 12,
    price: 598000,
    description: '12个月全程护航，战略迭代、竞争壁垒、品牌资产化全链路',
    engines: ['competition', 'strategy', 'image', 'space', 'marketing', 'organization'],
    deliverableCount: 17,
  },
  set_sail: {
    name: '起航计划',
    months: 3,
    price: 68000,
    description: '3个月快速启动，完成品牌核心战略构建与基础体系搭建',
    engines: ['competition', 'strategy', 'marketing'],
    deliverableCount: 6,
  },
};

// ---------- 报价项 ----------
export interface QuoteItem {
  moduleId: string;
  moduleName: string;
  engineType: string;
  selected: boolean;
  price: number;
  duration: number;
  deliverableIds: string[];
  children?: QuoteChildItem[];
}

// ---------- 报价子项（服务树子项快照） ----------
export interface QuoteChildItem {
  id: string;
  name: string;
  annotation: string;
  price: number;
  duration: number;
  selected: boolean;
}

// ---------- 客户 ----------
export interface Customer {
  id: ID;
  name: string;
  company: string;
  industry: string;
  contact: string;
  phone: string;
  email: string;
  wechat: string;
  stage: CustomerStage;
  createdAt: Timestamp;
  notes: string;
  source: string; // 来源渠道
}

// ---------- 报价 ----------
export interface Quote {
  id: ID;
  customerId: ID;
  customerName: string;
  packageType: PackageType | 'custom';
  items: QuoteItem[];
  basePrice: number;
  discount: number;
  taxRate: number;
  travelBudget: number;
  thirdPartyBudget: number;
  totalPrice: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  validUntil: Timestamp;
  paymentSchedule: PaymentTerm[];
  /** 增项服务快照 */
  additionItems?: Array<{ id: string; name: string; price: number; duration: number; note: string }>;
  /** 总工期（天） */
  totalDuration?: number;
  /** 已选服务项数 */
  totalSelected?: number;
  /** 客户信息快照 */
  customerSnapshot?: {
    company: string;
    contact: string;
    phone: string;
    wechat: string;
    email: string;
    industry: string;
  };
}

export interface PaymentTerm {
  id: string;
  label: string;
  percentage: number;
  amount: number;
  condition: string;
  paid: boolean;
  paidAt?: Timestamp;
}

import { ChecklistData } from './brandChecklist';
import { BrandTimeline } from './brandTimeline';

// ---------- 项目 ----------
export type ProjectPhase = 
  | 'initiation'    // 启动阶段
  | 'competition'   // 亮竞争
  | 'strategy'      // 亮战略
  | 'image'         // 亮形象
  | 'space'         // 亮空间
  | 'marketing'     // 亮营销
  | 'organization'  // 亮组织
  | 'delivery'      // 交付结算
  | 'completed';    // 已完成

export const PROJECT_PHASE_CONFIG: Record<ProjectPhase, { name: string; icon: string; description: string }> = {
  initiation: { name: '启动阶段', icon: '🚀', description: '签约、组建项目组、召开启动会' },
  competition: { name: '亮竞争', icon: '🏆', description: '竞争诊断与市场分析' },
  strategy: { name: '亮战略', icon: '🧭', description: '战略定位与品牌架构' },
  image: { name: '亮形象', icon: '🎭', description: '品牌感知体验形象设计与情感连接' },
  space: { name: '亮空间', icon: '🏗️', description: '空间设计与落地' },
  marketing: { name: '亮营销', icon: '📢', description: '营销战役与增长' },
  organization: { name: '亮组织', icon: '👥', description: '运营标准与组织赋能' },
  delivery: { name: '交付结算', icon: '📦', description: '成果汇总移交与结算' },
  completed: { name: '已完成', icon: '✅', description: '项目完成归档' },
};

export interface Project {
  id: ID;
  customerId: ID;
  customerName: string;
  name: string;
  industry: string;
  packageType: PackageType | 'custom';
  currentPhase: ProjectPhase;
  phases: ProjectPhase[];
  startAt: Timestamp;
  endAt?: Timestamp;
  status: 'active' | 'paused' | 'completed' | 'terminated' | 'cancelled';
  team: TeamMember[];
  deliverables: ProjectDeliverable[];
  selectedModuleIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes: string;
  monthlyWorkPlan: MonthlyWorkPlan[];
  /** 品牌自检数据（启动阶段填写） */
  brandChecklist: ChecklistData;
  /** 品牌年谱数据（启动阶段填写） */
  brandTimeline: BrandTimeline;
}

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  isInternal: boolean; // 我方/客方
  avatar?: string;
}

export interface MonthlyWorkPlan {
  month: number;
  phase: ProjectPhase;
  engineTypes: EngineType[];
  tasks: string[];
  keyDeliverables: string[];
  status: 'pending' | 'in_progress' | 'completed';
}

// ---------- 交付物实例 ----------
export interface ProjectDeliverable {
  id: ID;
  templateId: string;
  name: string;
  engineType: EngineType;
  moduleId: string;
  phase: ProjectPhase;
  status: DeliverableStatus;
  assignee?: string; // 负责人
  reviewer?: string; // 审核人
  content: string; // 内容（Markdown或HTML）
  version: number;
  versions: DeliverableVersion[];
  reviewHistory: ReviewRecord[];
  isPeriodic?: boolean; // 是否周期性
  periodicCount?: number; // 周期性次数
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueAt?: Timestamp;
}

export interface DeliverableVersion {
  version: number;
  content: string;
  createdAt: Timestamp;
  author: string;
}

export interface ReviewRecord {
  id: string;
  status: 'approved' | 'revision_needed';
  reviewer: string;
  comment: string;
  createdAt: Timestamp;
}

// ---------- 审核流程 ----------
export interface ReviewTask {
  id: string;
  deliverableId: string;
  deliverableName: string;
  projectId: string;
  projectName: string;
  engineType: EngineType;
  reviewer: string;
  status: 'pending_review' | 'approved' | 'rejected';
  comment?: string;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
}
