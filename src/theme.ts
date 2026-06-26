// ============================================================
// 亮品牌 · 主题变量计算 + CSS 变量注入
// 从 settings API 读取配置后，通过 CSS 变量全局生效
// ============================================================

import { getPublicSettings } from './settings';

/** 默认主题色（settings 为空时的回退值） */
export const DEFAULTS: Record<string, string> = {
  'theme.primaryColor': '#cf1322',
  'theme.siderGradientStart': '#a8071a',
  'theme.siderGradientEnd': '#8c0a18',
  'theme.loginGradientStart': '#4a0000',
  'theme.loginGradientMid': '#7a0019',
  'theme.loginGradientEnd': '#a8071a',
  'brand.name': '亮品牌',
  'brand.systemTitle': '周期性项目服务系统',
  'brand.logo': '✦',
  // 引擎颜色
  'engine.competition.color': '#faad14',
  'engine.strategy.color': '#cf1322',
  'engine.image.color': '#eb2f96',
  'engine.space.color': '#52c41a',
  'engine.marketing.color': '#722ed1',
  'engine.organization.color': '#13c2c2',
  // 角色颜色
  'role.admin.color': '#f5222d',
  'role.consultant.color': '#cf1322',
  'role.strategist.color': '#722ed1',
  'role.designer.color': '#eb2f96',
  'role.pm.color': '#13c2c2',
  // 套餐配置
  'package.set_sail.name': '起航计划 · 快速启动',
  'package.set_sail.description': '3个月快速启动，完成品牌核心战略构建与基础体系搭建',
  'package.set_sail.price': '68000',
  'package.set_sail.months': '3',
  'package.navigate.name': '领航计划 · 卓越进阶',
  'package.navigate.description': '6个月系统升级，从1到10的战略深化（不含亮空间服务模块）',
  'package.navigate.price': '248000',
  'package.navigate.months': '6',
  'package.voyage.name': '远航计划 · 突破未来',
  'package.voyage.description': '12个月全程护航，战略迭代、持续增长的第二曲线（不含亮空间服务模块）',
  'package.voyage.price': '598000',
  'package.voyage.months': '12',
};

// ============================================================
// 模块级设置缓存（启动时加载，设置保存后刷新）
// 所有页面统一从这里读取，确保实时同步
// ============================================================
let _cachedSettings: Record<string, string> = { ...DEFAULTS };

/** 获取当前缓存的公开设置（只读副本） */
export function getCachedSettings(): Record<string, string> {
  return { ..._cachedSettings };
}

/** 从 API 刷新设置缓存并更新 CSS 变量 */
export async function refreshSettings(): Promise<Record<string, string>> {
  try {
    const settings = await getPublicSettings();
    _cachedSettings = { ...DEFAULTS, ...settings };
    applyThemeCSS(_cachedSettings);
    return _cachedSettings;
  } catch {
    return _cachedSettings;
  }
}

/** 获取设置值（带回退） */
export function getSetting(settings: Record<string, string>, key: string): string {
  return settings[key] || DEFAULTS[key] || '';
}

/** 将设置注入为 CSS 变量 */
export function applyThemeCSS(settings: Record<string, string>): void {
  const root = document.documentElement;
  const map: Record<string, string> = {
    'theme.primaryColor': '--brand-primary',
    'theme.siderGradientStart': '--brand-sider-start',
    'theme.siderGradientEnd': '--brand-sider-end',
    'theme.loginGradientStart': '--brand-login-start',
    'theme.loginGradientMid': '--brand-login-mid',
    'theme.loginGradientEnd': '--brand-login-end',
    'engine.competition.color': '--engine-competition',
    'engine.strategy.color': '--engine-strategy',
    'engine.image.color': '--engine-image',
    'engine.space.color': '--engine-space',
    'engine.marketing.color': '--engine-marketing',
    'engine.organization.color': '--engine-organization',
    'role.admin.color': '--role-admin',
    'role.consultant.color': '--role-consultant',
    'role.strategist.color': '--role-strategist',
    'role.designer.color': '--role-designer',
    'role.pm.color': '--role-pm',
  };

  for (const [key, varName] of Object.entries(map)) {
    const value = getSetting(settings, key);
    if (value) root.style.setProperty(varName, value);
  }

  // 品牌文本变量（用于登录页等未登录页面读取）
  root.style.setProperty('--brand-name', getSetting(settings, 'brand.name') || '');
  root.style.setProperty('--brand-logo', getSetting(settings, 'brand.logo') || '');
  root.style.setProperty('--brand-system-title', getSetting(settings, 'brand.systemTitle') || '');
}

/** 应用 antd ConfigProvider 的 theme token */
export function getThemeToken(settings: Record<string, string>) {
  return {
    colorPrimary: getSetting(settings, 'theme.primaryColor'),
  };
}

/** 获取 Ant Design 主色 */
export function getPrimaryColor(settings: Record<string, string>): string {
  return getSetting(settings, 'theme.primaryColor');
}

/** 获取侧边栏渐变 */
export function getSiderGradient(settings: Record<string, string>): string {
  const start = getSetting(settings, 'theme.siderGradientStart');
  const end = getSetting(settings, 'theme.siderGradientEnd');
  return `linear-gradient(180deg, ${start} 0%, ${end} 100%)`;
}

/** 获取登录页渐变 */
export function getLoginGradient(settings: Record<string, string>): string {
  const s = getSetting(settings, 'theme.loginGradientStart');
  const m = getSetting(settings, 'theme.loginGradientMid');
  const e = getSetting(settings, 'theme.loginGradientEnd');
  return `linear-gradient(135deg, ${s} 0%, ${m} 50%, ${e} 100%)`;
}

/** 获取引擎颜色 */
export function getEngineColor(settings: Record<string, string>, engine: string): string {
  return getSetting(settings, `engine.${engine}.color`);
}

/** 获取角色颜色 */
export function getRoleColor(settings: Record<string, string>, role: string): string {
  return getSetting(settings, `role.${role}.color`);
}

/** 获取品牌名 */
export function getBrandName(settings: Record<string, string>): string {
  return getSetting(settings, 'brand.name');
}

/** 获取品牌 Logo */
export function getBrandLogo(settings: Record<string, string>): string {
  return getSetting(settings, 'brand.logo');
}

/** 获取系统副标题 */
export function getSystemTitle(settings: Record<string, string>): string {
  return getSetting(settings, 'brand.systemTitle');
}

/** 从 API 加载公开设置并注入 CSS 变量 */
export async function loadAndApplyTheme(): Promise<Record<string, string>> {
  try {
    const settings = await getPublicSettings();
    _cachedSettings = { ...DEFAULTS, ...settings };
    applyThemeCSS(_cachedSettings);
    return _cachedSettings;
  } catch {
    applyThemeCSS({});
    return { ...DEFAULTS };
  }
}

/** 套餐配置项 */
export interface PackageSetting {
  id: string;
  name: string;
  description: string;
  price: number;
  months: number;
}

/** 获取所有套餐配置（从 settings 读取，fallback 到默认值） */
export function getPackageSettings(settings: Record<string, string>): PackageSetting[] {
  return ['set_sail', 'navigate', 'voyage'].map(id => ({
    id,
    name: getSetting(settings, `package.${id}.name`),
    description: getSetting(settings, `package.${id}.description`),
    price: Number(getSetting(settings, `package.${id}.price`)) || 0,
    months: Number(getSetting(settings, `package.${id}.months`)) || 0,
  }));
}

/** 获取指定套餐配置 */
export function getPackageSetting(settings: Record<string, string>, packageId: string): PackageSetting | undefined {
  return getPackageSettings(settings).find(p => p.id === packageId);
}

/** 获取指定套餐名称 */
export function getPackageName(settings: Record<string, string>, packageId: string): string {
  return getSetting(settings, `package.${packageId}.name`);
}
