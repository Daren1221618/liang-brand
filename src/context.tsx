// ============================================================
// 亮品牌 · 全局状态上下文（含认证）
// ============================================================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Customer, Project, Quote, ReviewTask } from './types';
import type { Role, UserInfo } from './userTypes';
import * as storage from './storage';
import api from './api';
import { loadAndApplyTheme, refreshSettings as apiRefreshSettings } from './theme';

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
  const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
  const settingsInitRef = useRef(false);

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
  const login = useCallback((userInfo: UserInfo, token: string) => {
    api.setToken(token);
    setUser(userInfo);
    setOverrideRole(null);
    sessionStorage.setItem('lb_role', userInfo.role);
    refresh();
  }, [refresh]);

  // 登出处理
  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
    setOverrideRole(null);
    setCustomers([]);
    setProjects([]);
    setQuotes([]);
    setReviewTasks([]);
    sessionStorage.removeItem('lb_role');
  }, []);

  const updateUser = useCallback((userInfo: UserInfo) => {
    setUser(userInfo);
  }, []);

  const switchRole = useCallback((newRole: Role) => {
    setOverrideRole(newRole);
    sessionStorage.setItem('lb_role', newRole);
  }, []);

  // 刷新公开设置（套餐名称等变更后调用）
  const refreshPublicSettings = useCallback(async () => {
    try {
      const settings = await apiRefreshSettings();
      setPublicSettings({ ...settings });
    } catch {
      // 静默失败
    }
  }, []);

  // 初始化：检查已登录状态
  useEffect(() => {
    async function init() {
      // 加载公开设置（只需一次）
      if (!settingsInitRef.current) {
        settingsInitRef.current = true;
        try {
          const settings = await loadAndApplyTheme();
          setPublicSettings({ ...settings });
        } catch {
          // 忽略
        }
      }

      const token = api.getToken();
      if (token) {
        try {
          const currentUser = await storage.getCurrentUser();
          setUser(currentUser);
          sessionStorage.setItem('lb_role', currentUser.role);
          await refresh();
        } catch {
          // Token 过期，清除
          api.setToken(null);
        }
      }
      setLoading(false);
    }
    init();
  }, [refresh]);

  return (
    <AppContext.Provider value={{
      user, isAuthenticated: !!user, role,
      login, logout, updateUser, switchRole,
      customers, projects, quotes, reviewTasks,
      refresh, loading,
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
