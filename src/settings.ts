// ============================================================
// 亮品牌 · 设置 API 客户端（双模式）
// ============================================================

import api from './api';
import { isLocalMode } from './storage';
import { DEFAULT_PUBLIC_SETTINGS } from './localDb';

export interface SettingItem {
  key: string;
  value: string;      // 脱敏后的值
  rawValue: string;   // 原始值（编辑用）
  category: string;
  label: string;
  description: string;
  updatedAt: number;
  updatedBy: string;
}

/** 获取所有设置（admin） */
export async function getAllSettings(): Promise<SettingItem[]> {
  return api.get<SettingItem[]>('/api/settings');
}

/** 获取指定分类的设置 */
export async function getSettingsByCategory(category: string): Promise<SettingItem[]> {
  return api.get<SettingItem[]>(`/api/settings/${category}`);
}

/** 获取公开设置（非 admin 也可调用，前端主题初始化用） */
export async function getPublicSettings(): Promise<Record<string, string>> {
  if (isLocalMode()) return { ...DEFAULT_PUBLIC_SETTINGS };
  return api.get<Record<string, string>>('/api/settings/public/info');
}

/** 批量更新设置 */
export async function updateSettings(settings: Record<string, string>, category?: string): Promise<{ message: string }> {
  return api.put('/api/settings', { settings, category });
}

/** 测试 AI 模型连通性 */
export async function testAIConnection(data: {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}): Promise<{ success: boolean; message: string }> {
  return api.put('/api/settings/ai/test', data);
}

/** 重置指定分类为默认值 */
export async function resetSettingsCategory(category: string): Promise<{ message: string }> {
  return api.post('/api/settings/reset', { category });
}

/** 上传品牌 Logo 图片 */
export async function uploadLogo(file: File): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append('logo', file);
  const token = (api as any).getToken?.() || (() => { try { return sessionStorage.getItem('lb_token'); } catch { return null; } })();
  const res = await fetch('/api/settings/upload-logo', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '上传失败' }));
    throw new Error(err.error || '上传失败');
  }
  return res.json();
}
