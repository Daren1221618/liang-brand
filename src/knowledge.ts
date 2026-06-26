// ============================================================
// 亮品牌 · 知识库客户端（双模式）
// ============================================================

import api from './api';
import { isLocalMode } from './storage';

export interface KnowledgeFile {
  id: string;
  projectId: string;
  fileName: string;
  fileType: 'document' | 'image' | 'video' | 'audio' | 'other';
  fileSize: number;
  status: 'uploading' | 'extracting' | 'ready' | 'error';
  tags: string[];
  errorMessage?: string;
  textPreview?: string;
  extractedText?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SearchParams {
  keyword: string;
  projectId?: string;
  limit?: number;
}

export interface SearchResult extends KnowledgeFile {
  matchedText?: string;
}

// ========== API ==========

/** 本地模式：知识库功能不可用，返回空数据或提示 */
function localNotSupported(action: string): never {
  throw new Error(`「${action}」在本地模式下不可用，需要部署后端服务`);
}

/** 上传文件 */
export async function uploadFiles(
  files: File[],
  projectId?: string,
  tags?: string[]
): Promise<{ message: string; files: any[] }> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  if (projectId) formData.append('projectId', projectId);
  if (tags) formData.append('tags', JSON.stringify(tags));

  const token = api.getToken();
  const API_BASE = import.meta.env.DEV ? '' : '';

  const res = await fetch(`${API_BASE}/api/knowledge/upload`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '上传失败' }));
    throw new Error(err.error || '上传失败');
  }

  return res.json();
}

/** 获取文件列表 */
export async function getFiles(options?: { projectId?: string; status?: string; search?: string }): Promise<KnowledgeFile[]> {
  const params = new URLSearchParams();
  if (options?.projectId) params.set('projectId', options.projectId);
  if (options?.status) params.set('status', options.status);
  if (options?.search) params.set('search', options.search);

  const query = params.toString();
  return api.get(`/api/knowledge/files${query ? '?' + query : ''}`);
}

/** 获取文件详情 */
export async function getFile(id: string): Promise<KnowledgeFile> {
  return api.get(`/api/knowledge/files/${id}`);
}

/** 删除文件 */
export async function deleteFile(id: string): Promise<void> {
  return api.delete(`/api/knowledge/files/${id}`);
}

/** 更新文件标签 */
export async function updateFileTags(id: string, tags: string[], projectId?: string): Promise<void> {
  return api.put(`/api/knowledge/files/${id}`, { tags, projectId });
}

/** 搜索文件 */
export async function searchFiles(params: SearchParams): Promise<SearchResult[]> {
  return api.post('/api/knowledge/search', params);
}

/** 获取下载 URL */
export function getDownloadUrl(id: string): string {
  const API_BASE = import.meta.env.DEV ? '' : '';
  return `${API_BASE}/api/knowledge/download/${id}`;
}

/** 知识库统计 */
export interface KnowledgeStats {
  total: number;
  ready: number;
  extracting: number;
  error: number;
  totalSize: number;
  byType: Array<{ type: string; count: number }>;
  byProject: Array<{ projectId: string; count: number }>;
}

export async function getStats(): Promise<KnowledgeStats> {
  return api.get('/api/knowledge/stats');
}

/** 批量删除 */
export async function batchDelete(ids: string[]): Promise<{ message: string }> {
  return api.post('/api/knowledge/batch-delete', { ids });
}

/** 批量设置标签 */
export async function batchTag(options: {
  ids: string[];
  tags?: string[];
  addTags?: string[];
  removeTags?: string[];
}): Promise<{ message: string }> {
  return api.post('/api/knowledge/batch-tag', options);
}

/** 批量关联项目 */
export async function batchMove(ids: string[], projectId: string): Promise<{ message: string }> {
  return api.post('/api/knowledge/batch-move', { ids, projectId });
}

/** 获取所有标签 */
export interface TagInfo {
  name: string;
  count: number;
}

export async function getTags(): Promise<TagInfo[]> {
  return api.get('/api/knowledge/tags');
}
