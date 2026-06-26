// ============================================================
// 亮品牌 · AI 客户端（双模式）
// 封装所有 AI 相关的 API 调用（含 SSE 流式）
// ============================================================

import api from './api';
import { isLocalMode } from './storage';

// ========== 类型定义 ==========

export type ModelProvider = 'deepseek' | 'doubao' | 'qwen';

export interface ModelInfo {
  provider: ModelProvider;
  enabled: boolean;
  hasApiKey: boolean;
  defaultModel: string;
  maxContextTokens: number;
}

export interface ScenarioRoute {
  scenario: string;
  label: string;
  defaultProvider: ModelProvider;
  fallbackProvider?: ModelProvider;
  capability: string;
  description: string;
}

export interface ModelsResponse {
  providers: ModelProvider[];
  info: ModelInfo[];
  scenarioRoutes: ScenarioRoute[];
}

// ========== SSE 流式交付物生成 ==========

export interface StreamCallbacks {
  onModel?: (provider: string, model: string) => void;
  onToken: (token: string) => void;
  onComplete?: (content: string) => void;
  onError?: (error: string) => void;
}

/**
 * 流式生成交付物内容
 * 返回 abort 函数用于取消请求
 * 本地模式下返回模拟数据
 */
export function streamGenerate(options: {
  projectId: string;
  deliverableId?: string;
  deliverableName: string;
  engineType: string;
  scenario?: string;
  provider?: ModelProvider;
  knowledgeFileIds?: string[];
  customPrompt?: string;
  existingContent?: string;
}, callbacks: StreamCallbacks): () => void {
  // 本地模式：模拟 AI 生成过程
  if (isLocalMode()) {
    console.log('[亮品牌] 本地模式：模拟 AI 生成「' + options.deliverableName + '」');
    const mockContent = generateMockContent(options.deliverableName, options.engineType);
    // 模拟逐字输出
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < mockContent.length) {
        // 每次输出几个字
        const chunk = mockContent.slice(idx, idx + Math.floor(Math.random() * 8) + 4);
        callbacks.onToken(chunk);
        idx += chunk.length;
      } else {
        clearInterval(timer);
        callbacks.onComplete?.(mockContent);
      }
    }, 30);
    return () => clearInterval(timer);
  }

  const controller = new AbortController();

  const token = api.getToken();
  const API_BASE = import.meta.env.DEV ? '' : '';

  fetch(`${API_BASE}/api/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      projectId: options.projectId,
      deliverableId: options.deliverableId,
      deliverableName: options.deliverableName,
      engineType: options.engineType,
      scenario: options.scenario || 'deliverable_generate',
      provider: options.provider,
      knowledgeFileIds: options.knowledgeFileIds || [],
      customPrompt: options.customPrompt,
      existingContent: options.existingContent,
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: '请求失败' }));
        callbacks.onError?.(err.error || `请求失败 (${response.status})`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.('无法读取响应流');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('event:')) continue;
          const eventMatch = line.match(/^event: (\w+)/);
          const dataLine = line.split('\n').find(l => l.startsWith('data:'));
          if (!eventMatch || !dataLine) continue;

          const event = eventMatch[1];
          try {
            const data = JSON.parse(dataLine.replace(/^data: /, ''));

            switch (event) {
              case 'model':
                callbacks.onModel?.(data.provider, data.model);
                break;
              case 'token':
                fullContent += data.content;
                callbacks.onToken(data.content);
                break;
              case 'complete':
                callbacks.onComplete?.(data.content || fullContent);
                break;
              case 'error':
                callbacks.onError?.(data.message);
                break;
              case 'done':
                if (fullContent) {
                  callbacks.onComplete?.(fullContent);
                }
                break;
            }
          } catch { /* ignore parse error */ }
        }
      }

      // 处理 buffer 残留（流结束后可能还有最后一个 SSE 事件）
      if (buffer.trim()) {
        const eventMatch = buffer.match(/^event: (\w+)/);
        const dataLine = buffer.split('\n').find(l => l.startsWith('data:'));
        if (eventMatch && dataLine) {
          try {
            const data = JSON.parse(dataLine.replace(/^data: /, ''));
            if (eventMatch[1] === 'complete') {
              callbacks.onComplete?.(data.content || fullContent);
            } else if (eventMatch[1] === 'done' && fullContent) {
              callbacks.onComplete?.(fullContent);
            } else if (eventMatch[1] === 'error') {
              callbacks.onError?.(data.message);
            }
          } catch { /* ignore */ }
        }
      }
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        callbacks.onError?.(err.message);
      }
    });

  return () => controller.abort();
}

// ========== 非流式 API ==========

/** 品牌自检一键补全 */
export async function fillChecklist(projectId: string, fields: string[]): Promise<Record<string, string>> {
  if (isLocalMode()) {
    const result: Record<string, string> = {};
    fields.forEach(f => { result[f] = '【待填写】'; });
    return result;
  }
  return api.post('/api/ai/checklist', { projectId, fields });
}

/** 年谱搜索补全 */
export async function searchTimeline(projectId: string, query?: string): Promise<{ entries: any[] }> {
  if (isLocalMode()) return { entries: [] };
  return api.post('/api/ai/timeline', { projectId, query });
}

/** 单字段辅助 */
export async function fieldAssist(projectId: string, fieldLabel: string, fieldValue: string, engineType?: string): Promise<{ suggestion: string }> {
  if (isLocalMode()) return { suggestion: `建议：结合「${fieldLabel}」的核心要素进行深化描述` };
  return api.post('/api/ai/assist', { projectId, fieldLabel, fieldValue, engineType });
}

/** 图像生成 */
export async function generateImage(prompt: string, options?: { size?: string; style?: string; projectId?: string; deliverableId?: string }): Promise<any> {
  if (isLocalMode()) throw new Error('图像生成在本地模式下不可用，需要配置 AI API Key');
  return api.post('/api/ai/image-generate', { prompt, ...options });
}

/** 获取可用模型列表 */
export async function getModels(): Promise<ModelsResponse> {
  if (isLocalMode()) {
    return {
      providers: [],
      info: [],
      scenarioRoutes: [],
    };
  }
  return api.get('/api/ai/models');
}

// ========== 本地模式模拟数据 ==========

/** 根据交付物名称生成模拟内容 */
function generateMockContent(name: string, engineType: string): string {
  const templates: Record<string, string> = {
    competition: [
      '# 竞争生态圈层分析报告',
      '',
      '## 一、行业概况',
      '',
      '当前品类市场呈现以下特征：',
      '- 市场规模持续增长，年复合增长率约 12%',
      '- 头部品牌集中度逐步提升，TOP5 占据约 50% 份额',
      '- 新兴细分赛道涌现，差异化机会增多',
      '',
      '## 二、竞品分析',
      '',
      '| 品牌 | 定位 | 优势 | 劣势 |',
      '|------|------|------|------|',
      '| 竞品A | 高端 | 品牌认知度高 | 价格昂贵 |',
      '| 竞品B | 大众 | 渠道覆盖广 | 同质化严重 |',
      '| 竞品C | 细分 | 专业性强 | 规模有限 |',
      '',
      '## 三、核心发现与建议',
      '',
      '1. **赛道定位**：建议聚焦「中高端品质」空白带',
      '2. **差异化方向**：以「体验感 + 情感连接」构建壁垒',
      '3. **关键行动**：优先占领目标客群心智高地',
      '',
      '> *本内容由系统演示生成（本地模式）*',
    ].join('\n'),
    strategy: [
      '# 企业战略与品牌定位白皮书',
      '',
      '## 一、战略意图解码',
      '',
      '基于对创始团队和业务现状的深度理解：',
      '',
      '**核心使命**：为用户创造超越期待的价值体验',
      '**愿景目标**：成为行业标杆品牌',
      '',
      '## 二、品牌定位',
      '',
      '- **角色定位**：[待定义]',
      '- **价值主张**：[待定义]',
      '- **个性表达**：[待定义]',
      '',
      '## 三、战略路径',
      '',
      'Phase 1: 基础建设 → Phase 2: 规模复制 → Phase 3: 生态延伸',
      '',
      '> *本内容由系统演示生成（本地模式）*',
    ].join('\n'),
    image: [
      '# 品牌识别系统手册',
      '',
      '## 一、品牌超级符号',
      '',
      '### Logo 设计理念',
      '[设计理念描述]',
      '',
      '## 二、色彩体系',
      '',
      '- **主色**：#CF1322（品牌红）',
      '- **辅色**：#F5A623（暖金）',
      '- **点缀**：#2D2D30（深炭灰）',
      '',
      '## 三、字体规范',
      '',
      '- 标题字体：思源黑体 Bold',
      '- 正文字体：思源黑体 Regular',
      '',
      '> *本内容由系统演示生成（本地模式）*',
    ].join('\n'),
    marketing: [
      '# 营销策略框架',
      '',
      '## 一、营销目标',
      '',
      '| 指标 | 当前值 | 目标值 |',
      '|------|--------|--------|',
      '| 品牌知名度 | - | 区域 TOP3 |',
      '| 会员数 | - | 5000+ |',
      '',
      '## 二、核心战役规划',
      '',
      '- Q1：品牌认知战役',
      '- Q2：私域运营战役',
      '- Q3：产品上市战役',
      '',
      '> *本内容由系统演示生成（本地模式）*',
    ].join('\n'),
    organization: [
      '# 运营标准手册（SOP）',
      '',
      '## 一、开店流程',
      '',
      '1. 环境检查',
      '2. 设备确认',
      '3. 晨会召开',
      '',
      '## 二、服务规范',
      '',
      '- 迎客 → 入座 → 点餐 → 上菜 → 巡台 → 结账 → 送客',
      '',
      '## 三、品控清单',
      '',
      '- 食材新鲜度检查',
      '- 出品温度控制',
      '',
      '> *本内容由系统演示生成（本地模式）*',
    ].join('\n'),
  };

  return templates[engineType] || templates.strategy || (
    '# ' + name + '\n\n' +
    '本内容在本地模式下自动生成。\n\n' +
    '在实际项目中，此处将由 AI 根据项目背景资料生成专业内容。\n\n' +
    '> *亮品牌系统 · 本地演示模式*\n'
  );
}
