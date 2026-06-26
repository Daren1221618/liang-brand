// ============================================================
// 亮品牌 · 全局状态上下文（含认证，支持双模式）
// 有后端走 API，无后端走 LocalStorage（GitHub Pages）
// ============================================================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Customer, Project, Quote, ReviewTask } from './types';
import type { Role, UserInfo } from './userTypes';
import * as storage from './storage';
import api from './api';
import { loadAndApplyTheme, refreshSettings as apiRefreshSettings } from './theme';
import { DEFAULT_PUBLIC_SETTINGS } from './localDb';
import { localLogout as dbLocalLogout, isLocalDbInitialized, initLocalDb } from './localDb';

// 安全 sessionStorage（某些环境不可用）
function safeSessionGet(key: string): string | null { try { return sessionStorage.getItem(key); } catch { return null; } }
function safeSessionSet(key: string, value: string | null): void { try { if (value) sessionStorage.setItem(key, value); else sessionStorage.removeItem(key); } catch {} }

interface AppState {
  // 认证
  user: UserInfo | null;
  isAuthenticated: boolean;
  role: Role;
  login: (user: UserInfo, token: string) => void;
  logout: () => void;
  updateUser: (user: UserInfo) => void;
  switchRole: (role: Role) => void;
  // 数据
  customers: Customer[];
  projects: Project[];
  quotes: Quote[];
  reviewTasks: ReviewTask[];
  refresh: () => Promise<void>;
  // 加载状态
  loading: boolean;
  isLocalMode: boolean;
  // 公开设置（套餐名称等，变更时自动刷新）
  publicSettings: Record<string, string>;
  refreshPublicSettings: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [overrideRole, setOverrideRole] = useState<Role | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingLocalMode, setUsingLocalMode] = useState(false);
  const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
  const settingsInitRef = useRef(false);
  const initDoneRef = useRef(false);

  const role: Role = overrideRole || user?.role || 'consultant';

  const refresh = useCallback(async () => {
    try {
      const [customersData, projectsData, quotesData, reviewTasksData] = await Promise.all([
        storage.getCustomers(),
        storage.getProjects(),
        storage.getQuotes(),
        storage.getReviewTasks(),
      ]);
      setCustomers(customersData);
      setProjects(projectsData);
      setQuotes(quotesData);
      setReviewTasks(reviewTasksData);
    } catch (err) {
      console.error('数据刷新失败:', err);
    }
  }, []);

  // 登录处理
  const doLogin = useCallback((userInfo: UserInfo, token: string) => {
    api.setToken(token);
    setUser(userInfo);
    setOverrideRole(null);
    safeSessionSet('lb_role', userInfo.role);
    refresh();
  }, [refresh]);

  // 登出处理
  const logout = useCallback(() => {
    if (storage.isLocalMode()) {
      dbLocalLogout();
    }
    api.setToken(null);
    setUser(null);
    setOverrideRole(null);
    setCustomers([]);
    setProjects([]);
    setQuotes([]);
    setReviewTasks([]);
    safeSessionSet('lb_role', null);
  }, []);

  const updateUser = useCallback((userInfo: UserInfo) => {
    setUser(userInfo);
  }, []);

  const switchRole = useCallback((newRole: Role) => {
    setOverrideRole(newRole);
    safeSessionSet('lb_role', newRole);
  }, []);

  // 刷新公开设置
  const refreshPublicSettings = useCallback(async () => {
    if (storage.isLocalMode()) {
      // 本地模式使用默认设置
      setPublicSettings({ ...DEFAULT_PUBLIC_SETTINGS });
      return;
    }
    try {
      const settings = await apiRefreshSettings();
      setPublicSettings({ ...settings });
    } catch {
      // 静默失败
    }
  }, []);

  // 初始化：检测模式 → 恢复登录态 → 加载数据
  useEffect(() => {
    async function init() {
      if (initDoneRef.current) return;
      initDoneRef.current = true;

      // 1. 检测后端可用性，决定使用哪种模式
      const hasBackend = await storage.detectBackendMode();
      setUsingLocalMode(storage.isLocalMode());
      console.log(`[亮品牌] 运行模式: ${storage.isLocalMode() ? '本地存储（LocalStorage）' : '服务器 API'}`);

      // 2. 加载公开设置
      if (!settingsInitRef.current) {
        settingsInitRef.current = true;
        try {
          if (storage.isLocalMode()) {
            setPublicSettings({ ...DEFAULT_PUBLIC_SETTINGS });
          } else {
            const settings = await loadAndApplyTheme();
            setPublicSettings({ ...settings });
          }
        } catch {
          setPublicSettings({ ...DEFAULT_PUBLIC_SETTINGS });
        }
      }

      // 3. 尝试恢复登录状态
      let hasValidUser = false;
      const token = api.getToken();
      if (token) {
        try {
          const currentUser = await storage.getCurrentUser();
          setUser(currentUser);
          safeSessionSet('lb_role', currentUser.role);
          hasValidUser = true;
        } catch {
          // Token 无效，清除
          api.setToken(null);
        }
      }

      // 4. 加载数据
      if (hasValidUser) {
        await refresh();
      }

      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  return (
    <AppContext.Provider value={{
      user, isAuthenticated: !!user, role,
      login: doLogin, logout, updateUser, switchRole,
      customers, projects, quotes, reviewTasks,
      refresh, loading,
      isLocalMode: usingLocalMode,
      publicSettings, refreshPublicSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
