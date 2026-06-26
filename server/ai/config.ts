// ============================================================
// 亮品牌 · AI 多模型配置（支持 settings 表热更新）
// 支持 DeepSeek / 豆包(Doubao) / 通义千问(Qwen) 三大模型
// ============================================================

export type ModelProvider = 'deepseek' | 'doubao' | 'qwen';

export interface ModelConfig {
  provider: ModelProvider;
  apiKey: string;
  baseUrl: string;
  /** 默认文本模型 */
  defaultModel: string;
  /** 高级推理模型（DeepSeek-Reasoner 等） */
  reasoningModel?: string;
  /** 图像生成模型 */
  imageModel?: string;
  /** 最大上下文长度 */
  maxContextTokens: number;
  /** 是否可用 */
  enabled: boolean;
}

/** 模型能力分类 */
export type ModelCapability = 'reasoning' | 'generation' | 'optimization' | 'long-context' | 'image-gen' | 'image-understand';

/** 场景→模型映射 */
export interface ScenarioRoute {
  scenario: string;
  label: string;
  defaultProvider: ModelProvider;
  fallbackProvider?: ModelProvider;
  capability: ModelCapability;
  description: string;
}

// ========== 从环境变量加载初始配置 ==========

function envOr(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (!v) return fallback;
  return v === '1' || v === 'true';
}

export const modelConfigs: Record<ModelProvider, ModelConfig> = {
  deepseek: {
    provider: 'deepseek',
    apiKey: envOr('DEEPSEEK_API_KEY', ''),
    baseUrl: envOr('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
    defaultModel: envOr('DEEPSEEK_MODEL', 'deepseek-chat'),
    reasoningModel: envOr('DEEPSEEK_REASONING_MODEL', 'deepseek-reasoner'),
    maxContextTokens: 64000,
    enabled: envBool('DEEPSEEK_ENABLED', true),
  },
  doubao: {
    provider: 'doubao',
    apiKey: envOr('DOUBAO_API_KEY', ''),
    baseUrl: envOr('DOUBAO_BASE_URL', 'https://ark.cn-beijing.volces.com/api/v3'),
    defaultModel: envOr('DOUBAO_MODEL', 'doubao-pro-32k'),
    maxContextTokens: 128000,
    enabled: envBool('DOUBAO_ENABLED', true),
  },
  qwen: {
    provider: 'qwen',
    apiKey: envOr('QWEN_API_KEY', ''),
    baseUrl: envOr('QWEN_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
    defaultModel: envOr('QWEN_MODEL', 'qwen-plus'),
    imageModel: envOr('QWEN_IMAGE_MODEL', 'qwen-vl-max'),
    maxContextTokens: 128000,
    enabled: envBool('QWEN_ENABLED', true),
  },
};

// ========== 场景路由表（默认值，可被 settings 表覆盖） ==========

export const scenarioRoutes: ScenarioRoute[] = [
  {
    scenario: 'deliverable_generate',
    label: '交付物生成',
    defaultProvider: 'deepseek',
    fallbackProvider: 'doubao',
    capability: 'reasoning',
    description: '基于品牌信息生成交付物内容（六大引擎）',
  },
  {
    scenario: 'deliverable_optimize',
    label: '交付物优化/重生成',
    defaultProvider: 'doubao',
    fallbackProvider: 'deepseek',
    capability: 'long-context',
    description: '基于已有内容进行优化或重新生成',
  },
  {
    scenario: 'checklist_fill',
    label: '品牌自检补全',
    defaultProvider: 'deepseek',
    fallbackProvider: 'doubao',
    capability: 'reasoning',
    description: '一键补全品牌自检表缺失字段',
  },
  {
    scenario: 'timeline_search',
    label: '年谱搜索补全',
    defaultProvider: 'deepseek',
    fallbackProvider: 'doubao',
    capability: 'reasoning',
    description: '搜索并补全品牌年谱条目',
  },
  {
    scenario: 'field_assist',
    label: '单字段辅助',
    defaultProvider: 'deepseek',
    capability: 'generation',
    description: '辅助填充单个字段（联网搜索+推理）',
  },
  {
    scenario: 'image_generate',
    label: '图像生成',
    defaultProvider: 'qwen',
    capability: 'image-gen',
    description: '生成品牌相关图像（通义万相）',
  },
];

// ========== 热更新机制 ==========

let lastSettingsHash = '';

/** 从 settings 表刷新 AI 配置（管理员保存设置后自动调用） */
export function refreshAIConfig(): void {
  try {
    const { getDb } = require('../db.js');
    const db = getDb();
    const rows = db.prepare("SELECT key, value FROM settings WHERE category = 'ai'").all() as any[];

    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value;

    // 计算哈希，避免无意义刷新
    const hash = JSON.stringify(settings);
    if (hash === lastSettingsHash) return;
    lastSettingsHash = hash;

    // 更新 DeepSeek 配置
    if (settings['ai.deepseek.apiKey'] !== undefined) modelConfigs.deepseek.apiKey = settings['ai.deepseek.apiKey'];
    if (settings['ai.deepseek.baseUrl']) modelConfigs.deepseek.baseUrl = settings['ai.deepseek.baseUrl'];
    if (settings['ai.deepseek.defaultModel']) modelConfigs.deepseek.defaultModel = settings['ai.deepseek.defaultModel'];
    if (settings['ai.deepseek.reasoningModel']) modelConfigs.deepseek.reasoningModel = settings['ai.deepseek.reasoningModel'];
    if (settings['ai.deepseek.enabled'] !== undefined) modelConfigs.deepseek.enabled = settings['ai.deepseek.enabled'] === 'true';

    // 更新豆包配置
    if (settings['ai.doubao.apiKey'] !== undefined) modelConfigs.doubao.apiKey = settings['ai.doubao.apiKey'];
    if (settings['ai.doubao.baseUrl']) modelConfigs.doubao.baseUrl = settings['ai.doubao.baseUrl'];
    if (settings['ai.doubao.defaultModel']) modelConfigs.doubao.defaultModel = settings['ai.doubao.defaultModel'];
    if (settings['ai.doubao.enabled'] !== undefined) modelConfigs.doubao.enabled = settings['ai.doubao.enabled'] === 'true';

    // 更新通义千问配置
    if (settings['ai.qwen.apiKey'] !== undefined) modelConfigs.qwen.apiKey = settings['ai.qwen.apiKey'];
    if (settings['ai.qwen.baseUrl']) modelConfigs.qwen.baseUrl = settings['ai.qwen.baseUrl'];
    if (settings['ai.qwen.defaultModel']) modelConfigs.qwen.defaultModel = settings['ai.qwen.defaultModel'];
    if (settings['ai.qwen.imageModel']) modelConfigs.qwen.imageModel = settings['ai.qwen.imageModel'];
    if (settings['ai.qwen.enabled'] !== undefined) modelConfigs.qwen.enabled = settings['ai.qwen.enabled'] === 'true';

    // 更新场景路由
    if (settings['ai.scenarioRoutes']) {
      try {
        const routes = JSON.parse(settings['ai.scenarioRoutes']);
        if (Array.isArray(routes)) {
          for (const route of routes) {
            const existing = scenarioRoutes.find(r => r.scenario === route.scenario);
            if (existing && route.defaultProvider) {
              existing.defaultProvider = route.defaultProvider;
              existing.fallbackProvider = route.fallbackProvider;
            }
          }
        }
      } catch (err) {
        console.error('场景路由配置解析失败:', err);
      }
    }

    // 清空适配器缓存（强制下次请求重新创建）
    try {
      const adapters = require('./adapters.js');
      if (adapters.clearCache) adapters.clearCache();
    } catch { /* adapters 模块可能尚未加载 */ }

    console.log('[AI] 配置已热更新');
  } catch (err) {
    console.error('[AI] 配置热更新失败:', err);
  }
}

// ========== 工具函数 ==========

/** 获取指定场景的模型配置 */
export function getModelForScenario(scenario: string): { config: ModelConfig; route: ScenarioRoute } | null {
  const route = scenarioRoutes.find(r => r.scenario === scenario);
  if (!route) return null;

  let config = modelConfigs[route.defaultProvider];
  if (!config.enabled && route.fallbackProvider) {
    config = modelConfigs[route.fallbackProvider];
  }
  if (!config.enabled) return null;

  return { config, route };
}

/** 获取所有已启用的模型提供商 */
export function getEnabledProviders(): ModelProvider[] {
  return (Object.keys(modelConfigs) as ModelProvider[]).filter(k => modelConfigs[k].enabled && modelConfigs[k].apiKey);
}

/** 获取提供商信息（前端展示用） */
export function getProviderInfo() {
  return (Object.keys(modelConfigs) as ModelProvider[]).map(k => {
    const c = modelConfigs[k];
    return {
      provider: k,
      enabled: c.enabled,
      hasApiKey: !!c.apiKey,
      defaultModel: c.defaultModel,
      maxContextTokens: c.maxContextTokens,
    };
  });
}
