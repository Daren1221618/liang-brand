// ============================================================
// 亮品牌 · 权限控制系统
// 系统级 + 项目级两级权限矩阵
// ============================================================

import type { Role } from './userTypes';

// ========== 权限类型 ==========
export type PermissionKey =
  | 'customer:view' | 'customer:create' | 'customer:edit' | 'customer:delete'
  | 'quote:view' | 'quote:create' | 'quote:edit' | 'quote:delete'
  | 'project:view' | 'project:create' | 'project:edit' | 'project:delete'
  | 'project:phase' | 'project:team' | 'project:customize'
  | 'deliverable:view' | 'deliverable:edit' | 'deliverable:submit'
  | 'review:view' | 'review:approve'
  | 'blueprint:view' | 'blueprint:edit'
  | 'user:manage' | 'data:export' | 'data:import'
  | 'initiation:view' | 'initiation:edit'
  | 'settings:view' | 'settings:edit';

// ========== 系统级权限矩阵 ==========
const SYSTEM_PERMISSIONS: Record<Exclude<Role, 'admin'>, PermissionKey[]> = {
  consultant: [
    'customer:view', 'customer:edit', // 仅关联客户
    'quote:view',
    'project:view', 'project:create',
    'deliverable:view', 'deliverable:edit', 'deliverable:submit',
    'review:view', 'review:approve', // 审核自有交付物
    'blueprint:view',
    'initiation:view', 'initiation:edit',
  ],
  strategist: [
    'customer:view', 'customer:edit',
    'quote:view',
    'project:view',
    'deliverable:view', 'deliverable:edit', 'deliverable:submit',
    'review:view',
    'blueprint:view',
    'initiation:view', 'initiation:edit',
  ],
  designer: [
    'customer:view',
    'quote:view', // 仅查看
    'project:view',
    'deliverable:view', 'deliverable:edit', 'deliverable:submit',
    'review:view',
    'blueprint:view',
  ],
  pm: [
    'customer:view', 'customer:edit',
    'quote:view', 'quote:create', 'quote:edit',
    'project:view', 'project:create', 'project:edit',
    'project:phase', 'project:team', 'project:customize',
    'deliverable:view', 'deliverable:edit', 'deliverable:submit',
    'review:view', 'review:approve', // 全部审核
    'blueprint:view',
    'initiation:view', 'initiation:edit',
    'data:export', // 项目报告导出
  ],
};

// ========== 权限检查 ==========
export function hasPermission(role: Role, permission: PermissionKey): boolean {
  if (role === 'admin') return true; // 管理员拥有所有权限
  const perms = SYSTEM_PERMISSIONS[role];
  return perms?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: PermissionKey[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

// ========== 角色配置 ==========
export const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: string }> = {
  admin: { label: '管理员', color: '#f5222d', icon: '👑' },
  consultant: { label: '咨询顾问', color: '#cf1322', icon: '💼' },
  strategist: { label: '策略师', color: '#722ed1', icon: '🎯' },
  designer: { label: '设计师', color: '#eb2f96', icon: '🎨' },
  pm: { label: '项目经理', color: '#13c2c2', icon: '📋' },
};

// 获取允许访问的菜单项
export function getMenuItems(role: Role) {
  const items = [];
  items.push({ key: '/', icon: 'DashboardOutlined', label: '工作台' });
  if (hasPermission(role, 'customer:view')) items.push({ key: '/customers', icon: 'UserOutlined', label: '客户管理' });
  if (hasAnyPermission(role, ['quote:view', 'quote:create'])) items.push({ key: '/quotes', icon: 'DollarOutlined', label: '报价管理' });
  if (hasPermission(role, 'project:view')) items.push({ key: '/projects', icon: 'ProjectOutlined', label: '项目管理' });
  items.push({ key: '/knowledge', icon: 'BookOutlined', label: '知识库' });
  if (hasPermission(role, 'review:view')) items.push({ key: '/review', icon: 'AuditOutlined', label: '审核中心' });
  if (hasPermission(role, 'blueprint:view')) items.push({ key: '/service-blueprint', icon: 'ToolOutlined', label: '服务体系' });
  if (hasPermission(role, 'settings:view')) items.push({ key: '/settings', icon: 'SettingOutlined', label: '系统设置' });
  return items;
}
