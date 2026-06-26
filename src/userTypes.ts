// ============================================================
// 亮品牌 · 用户类型定义
// ============================================================

// 扩展 Role 类型，新增 admin 角色
export type Role = 'admin' | 'consultant' | 'strategist' | 'designer' | 'pm';

export interface UserInfo {
  id: string;
  username: string;
  role: Role;
  displayName: string;
  created_at?: number;
}
