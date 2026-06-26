/// <reference types="vite/client" />
// ============================================================
// 亮品牌 · API 客户端
// 封装所有后端 API 调用，统一认证与错误处理
// ============================================================

// API 基础地址：开发环境走 Vite proxy，生产环境走同源
const API_BASE = import.meta.env.DEV ? '' : '';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = sessionStorage.getItem('lb_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      sessionStorage.setItem('lb_token', token);
    } else {
      sessionStorage.removeItem('lb_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('登录已过期');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '请求失败' }));
      throw new Error(err.error || `请求失败 (${res.status})`);
    }

    // 数据导出返回文件
    if (res.headers.get('content-type')?.includes('application/json') && path.includes('/export')) {
      const blob = await res.blob();
      return blob as unknown as T;
    }

    return res.json();
  }

  get<T = any>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T = any>(path: string, body?: any): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T = any>(path: string, body?: any): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T = any>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  // 导出文件（下载）
  async download(path: string, filename: string) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    if (!res.ok) throw new Error('导出失败');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const api = new ApiClient();
export default api;
