// ============================================================
// 亮品牌 · 多模型适配器
// 统一封装 DeepSeek / 豆包 / 通义千问 的 API 调用
// 所有适配器遵循 OpenAI Chat Completions 兼容协议
// ============================================================

import OpenAI from 'openai';
import type { ModelConfig } from './config.js';

// ========== 通用类型 ==========

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
  onUsage?: (usage: { promptTokens: number; completionTokens: number; totalTokens: number }) => void;
}

export interface ImageGenerateResult {
  url?: string;
  base64?: string;
  revisedPrompt?: string;
}

// ========== 适配器接口 ==========

export interface ModelAdapter {
  /** 非流式文本生成 */
  chat(messages: ChatMessage[], model?: string): Promise<string>;
  /** 流式文本生成（SSE） */
  chatStream(messages: ChatMessage[], callbacks: StreamCallbacks, model?: string): Promise<void>;
  /** 图像生成（仅部分模型支持） */
  generateImage?(
    prompt: string,
    options?: { size?: string; style?: string; n?: number }
  ): Promise<ImageGenerateResult[]>;
  /** 获取可用模型列表 */
  listModels?(): Promise<string[]>;
}

// ========== 工厂函数：创建适配器 ==========

export function createAdapter(config: ModelConfig): ModelAdapter {
  // 所有三个模型都兼容 OpenAI 协议，创建统一的 OpenAI client
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    dangerouslyAllowBrowser: false, // 仅服务端
  });

  return new OpenAICompatibleAdapter(client, config);
}

// ========== OpenAI 兼容适配器 ==========

class OpenAICompatibleAdapter implements ModelAdapter {
  private client: OpenAI;
  private config: ModelConfig;
  public lastUsage: { promptTokens: number; completionTokens: number; totalTokens: number } | null = null;

  constructor(client: OpenAI, config: ModelConfig) {
    this.client = client;
    this.config = config;
  }

  async chat(messages: ChatMessage[], model?: string): Promise<string> {
    const useModel = model || this.config.defaultModel;
    try {
      const response = await this.client.chat.completions.create({
        model: useModel,
        messages: messages.map(m => ({ role: m.role as any, content: m.content })),
        max_tokens: 4096,
        temperature: 0.7,
      });

      const choice = response.choices[0];
      // DeepSeek-Reasoner 返回 reasoning_content
      const reasoning = (choice as any).message?.reasoning_content;
      const content = choice.message?.content || '';

      // 记录 token 用量
      if (response.usage) {
        this.lastUsage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        };
      }

      if (reasoning) {
        return `<think_process>\n${reasoning}\n</think_process>\n\n${content}`;
      }

      return content;
    } catch (err: any) {
      throw new Error(`[${this.config.provider}] API调用失败: ${err.message}`);
    }
  }

  async chatStream(messages: ChatMessage[], callbacks: StreamCallbacks, model?: string): Promise<void> {
    const useModel = model || this.config.defaultModel;
    let fullText = '';
    let reasoningText = '';

    try {
      const stream = await this.client.chat.completions.create({
        model: useModel,
        messages: messages.map(m => ({ role: m.role as any, content: m.content })),
        max_tokens: 4096,
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta as any;
        // DeepSeek-Reasoner 先返回 reasoning_content（思维链），再返回 content（最终答案）
        if (delta?.reasoning_content) {
          reasoningText += delta.reasoning_content;
          // 推理阶段也发送 token，避免长时间无响应被误认为失败
          callbacks.onToken(delta.reasoning_content);
        }
        if (delta?.content) {
          fullText += delta.content;
          callbacks.onToken(delta.content);
        }

        // 捕获最后一个 chunk 中的 token 用量信息（部分模型会在最终 chunk 返回 usage）
        if ((chunk as any).usage) {
          const usage = (chunk as any).usage;
          this.lastUsage = {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0,
          };
          if (callbacks.onUsage && this.lastUsage) {
            callbacks.onUsage(this.lastUsage);
          }
        }
      }

      // 如果有推理过程，附加到最终文本前
      const finalText = reasoningText
        ? `<think_process>\n${reasoningText}\n</think_process>\n\n${fullText}`
        : fullText;

      callbacks.onDone(finalText);
    } catch (err: any) {
      callbacks.onError(new Error(`[${this.config.provider}] 流式调用失败: ${err.message}`));
    }
  }

  async generateImage(
    prompt: string,
    options?: { size?: string; style?: string; n?: number }
  ): Promise<ImageGenerateResult[]> {
    // 通义千问使用兼容的图像生成 API
    try {
      const imageModel = this.config.imageModel || this.config.defaultModel;
      const response = await this.client.chat.completions.create({
        model: imageModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content || '';
      // 解析可能的图像 URL
      const urlMatches = content.match(/https?:\/\/[^\s"<>]+\.(png|jpg|jpeg|webp|gif)/gi);

      if (urlMatches && urlMatches.length > 0) {
        return urlMatches.map(url => ({ url, revisedPrompt: prompt }));
      }

      return [{ url: undefined, base64: undefined, revisedPrompt: prompt }];
    } catch (err: any) {
      throw new Error(`[${this.config.provider}] 图像生成失败: ${err.message}`);
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      return response.data.map(m => m.id);
    } catch {
      return [this.config.defaultModel];
    }
  }
}

// ========== 适配器缓存 ==========

const adapterCache = new Map<string, ModelAdapter>();

/**
 * 获取或创建模型适配器（带缓存）
 */
export function getAdapter(provider: string, config: ModelConfig): ModelAdapter {
  const cacheKey = `${provider}:${config.apiKey.slice(-8)}`;
  if (!adapterCache.has(cacheKey)) {
    adapterCache.set(cacheKey, createAdapter(config));
  }
  return adapterCache.get(cacheKey)!;
}

/**
 * 清空适配器缓存（配置热更新后调用）
 */
export function clearCache(): void {
  adapterCache.clear();
}
