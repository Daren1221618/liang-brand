// ============================================================
// 亮品牌 · AI 客户端
// 封装所有 AI 相关的 API 调用（含 SSE 流式）
// ============================================================

import api from './api';

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
  return api.post('/api/ai/checklist', { projectId, fields });
}

/** 年谱搜索补全 */
export async function searchTimeline(projectId: string, query?: string): Promise<{ entries: any[] }> {
  return api.post('/api/ai/timeline', { projectId, query });
}

/** 单字段辅助 */
export async function fieldAssist(projectId: string, fieldLabel: string, fieldValue: string, engineType?: string): Promise<{ suggestion: string }> {
  return api.post('/api/ai/assist', { projectId, fieldLabel, fieldValue, engineType });
}

/** 图像生成 */
export async function generateImage(prompt: string, options?: { size?: string; style?: string; projectId?: string; deliverableId?: string }): Promise<any> {
  return api.post('/api/ai/image-generate', { prompt, ...options });
}

/** 获取可用模型列表 */
export async function getModels(): Promise<ModelsResponse> {
  return api.get('/api/ai/models');
}
