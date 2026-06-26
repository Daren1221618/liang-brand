// ============================================================
// 亮品牌 · AI 路由（所有 AI 相关 API 端点）
// SSE 流式输出 + 多模型路由
// ============================================================

import { Router, Request, Response } from 'express';
import { modelConfigs, getModelForScenario, getEnabledProviders, getProviderInfo, scenarioRoutes, type ModelProvider } from './config.js';
import { buildAIContext, buildMessages } from './contextBuilder.js';
import { getAdapter, type ChatMessage } from './adapters.js';
import { getDb, genId } from '../db.js';

const router = Router();

// ========== SSE 辅助函数 ==========

function sseSend(res: Response, event: string, data: any) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sseDone(res: Response) {
  res.write('event: done\ndata: {}\n\n');
  res.end();
}

// ========== POST /api/ai/generate — 交付物生成（SSE 流式） ==========

router.post('/generate', async (req: Request, res: Response) => {
  const {
    projectId,
    deliverableId,
    deliverableName,
    engineType,
    scenario = 'deliverable_generate',
    provider: userProvider,
    knowledgeFileIds = [],
    customPrompt,
    existingContent, // 用于优化场景
  } = req.body;

  if (!projectId || !deliverableName) {
    return res.status(400).json({ error: '缺少必要参数：projectId, deliverableName' });
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    // 1. 查询项目数据
    const db = getDb();
    const projectRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
    if (!projectRow) {
      sseSend(res, 'error', { message: '项目不存在' });
      sseDone(res);
      return;
    }

    // 解析项目 JSON 字段
    const project = {
      ...projectRow,
      customerId: projectRow.customer_id,
      customerName: projectRow.customer_name,
      industry: projectRow.industry,
      deliverables: JSON.parse(projectRow.deliverables || '[]'),
      brandChecklist: JSON.parse(projectRow.brand_checklist || '{}'),
      brandTimeline: JSON.parse(projectRow.brand_timeline || '{}'),
    };

    // 2. 确定使用的模型
    let config;
    if (userProvider && modelConfigs[userProvider]?.enabled) {
      config = modelConfigs[userProvider];
    } else {
      const route = getModelForScenario(scenario);
      if (!route) {
        sseSend(res, 'error', { message: '无可用模型，请检查API Key配置' });
        sseDone(res);
        return;
      }
      config = route.config;
    }

    sseSend(res, 'model', { provider: config.provider, model: config.defaultModel });

    // 3. 构建 AI 上下文
    const context = await buildAIContext({
      project,
      engineType,
      scenario,
      deliverableName,
      deliverableContent: existingContent,
      knowledgeFileIds,
      customPrompt,
    });

    // 4. 构建消息
    const userMessage = customPrompt || `请生成交付物「${deliverableName}」的完整内容。要求使用 Markdown 格式，结构清晰，内容专业。`;
    const messages = buildMessages(context, userMessage);

    // 5. 获取适配器并流式调用
    const adapter = getAdapter(config.provider, config);

    // 如果是 DeepSeek 且场景是推理，使用 reasoning 模型
    const useModel = (config.provider === 'deepseek' && config.reasoningModel && scenario === 'deliverable_generate')
      ? config.reasoningModel
      : config.defaultModel;

    await adapter.chatStream(
      messages as ChatMessage[],
      {
        onToken: (token) => {
          sseSend(res, 'token', { content: token });
        },
        onDone: (fullText) => {
          // 记录 token 用量
          logAIUsage(db, {
            provider: config.provider,
            model: useModel,
            scenario,
            projectId: projectId || '',
            deliverableId: deliverableId || '',
            promptTokens: adapter.lastUsage?.promptTokens || 0,
            completionTokens: adapter.lastUsage?.completionTokens || 0,
            totalTokens: adapter.lastUsage?.totalTokens || 0,
          });

          // 如果有 deliverableId，更新交付物内容
          if (deliverableId) {
            try {
              const dels = JSON.parse(projectRow.deliverables || '[]');
              const delIndex = dels.findIndex((d: any) => d.id === deliverableId);
              if (delIndex >= 0) {
                const oldDel = dels[delIndex];
                const newVersion = {
                  version: (oldDel.version || 0) + 1,
                  content: fullText,
                  createdAt: Date.now(),
                  author: 'AI助手',
                };
                dels[delIndex] = {
                  ...oldDel,
                  content: fullText,
                  version: newVersion.version,
                  versions: [...(oldDel.versions || []), newVersion],
                  status: 'draft',
                  updatedAt: Date.now(),
                };
                db.prepare('UPDATE projects SET deliverables = ?, updated_at = ? WHERE id = ?')
                  .run(JSON.stringify(dels), Date.now(), projectId);
              }
            } catch { /* ignore update error */ }
          }

          sseSend(res, 'complete', { content: fullText });
          sseDone(res);
        },
        onError: (error) => {
          // 生成失败，回滚交付物状态
          if (deliverableId) {
            try {
              const dels = JSON.parse(projectRow.deliverables || '[]');
              const delIndex = dels.findIndex((d: any) => d.id === deliverableId);
              if (delIndex >= 0) {
                dels[delIndex].status = dels[delIndex].versions?.length > 0 ? 'draft' : 'pending';
                db.prepare('UPDATE projects SET deliverables = ?, updated_at = ? WHERE id = ?')
                  .run(JSON.stringify(dels), Date.now(), projectId);
              }
            } catch { /* ignore */ }
          }
          sseSend(res, 'error', { message: error.message });
          sseDone(res);
        },
      },
      useModel
    );
  } catch (err: any) {
    sseSend(res, 'error', { message: err.message });
    sseDone(res);
  }
});

// ========== POST /api/ai/checklist — 品牌自检一键补全 ==========

router.post('/checklist', async (req: Request, res: Response) => {
  const { projectId, fields } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: '缺少 projectId' });
  }

  try {
    const db = getDb();
    const projectRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
    if (!projectRow) return res.status(404).json({ error: '项目不存在' });

    const project = {
      ...projectRow,
      customerName: projectRow.customer_name,
      industry: projectRow.industry,
      brandChecklist: JSON.parse(projectRow.brand_checklist || '{}'),
      brandTimeline: JSON.parse(projectRow.brand_timeline || '{}'),
    };

    const context = await buildAIContext({
      project,
      engineType: 'initiation',
      scenario: 'checklist_fill',
    });

    const userMessage = `请根据已有品牌信息，补全以下缺失字段。只输出 JSON 格式，键为字段ID，值为建议内容。\n\n待补全字段：${JSON.stringify(fields)}\n\n已有数据：${JSON.stringify(project.brandChecklist)}`;

    const messages = buildMessages(context, userMessage);

    const route = getModelForScenario('checklist_fill');
    if (!route) return res.status(503).json({ error: '无可用模型' });

    const adapter = getAdapter(route.config.provider, route.config);
    const result = await adapter.chat(messages as ChatMessage[]);

    // 尝试解析 JSON
    let suggestions: Record<string, string> = {};
    try {
      // 提取 JSON 块
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      suggestions = { _raw: result };
    }

    res.json({ suggestions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== POST /api/ai/timeline — 年谱搜索补全 ==========

router.post('/timeline', async (req: Request, res: Response) => {
  const { projectId, query } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: '缺少 projectId' });
  }

  try {
    const db = getDb();
    const projectRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
    if (!projectRow) return res.status(404).json({ error: '项目不存在' });

    const project = {
      ...projectRow,
      customerName: projectRow.customer_name,
      industry: projectRow.industry,
      brandChecklist: JSON.parse(projectRow.brand_checklist || '{}'),
      brandTimeline: JSON.parse(projectRow.brand_timeline || '{}'),
    };

    const context = await buildAIContext({
      project,
      engineType: 'initiation',
      scenario: 'timeline_search',
    });

    const existingEntries = project.brandTimeline?.entries || [];
    const userMessage = query
      ? `请搜索关于"${query}"的品牌年谱条目。基于品牌信息${project.customerName}，给出可能的年份、事件和描述。输出 JSON 数组。已有年谱条目：${JSON.stringify(existingEntries)}`
      : `请根据品牌信息${project.customerName}，推测可能的品牌年谱条目。输出 JSON 数组，每个条目包含 year, title, type, description。已有年谱条目：${JSON.stringify(existingEntries)}`;

    const messages = buildMessages(context, userMessage);

    const route = getModelForScenario('timeline_search');
    if (!route) return res.status(503).json({ error: '无可用模型' });

    const adapter = getAdapter(route.config.provider, route.config);
    const result = await adapter.chat(messages as ChatMessage[]);

    let entries: any[] = [];
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        entries = JSON.parse(jsonMatch[0]);
      }
    } catch {
      entries = [{ _raw: result }];
    }

    res.json({ entries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== POST /api/ai/assist — 单字段辅助 ==========

router.post('/assist', async (req: Request, res: Response) => {
  const { projectId, fieldLabel, fieldValue, engineType } = req.body;

  if (!projectId || !fieldLabel) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const db = getDb();
    const projectRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
    if (!projectRow) return res.status(404).json({ error: '项目不存在' });

    const project = {
      ...projectRow,
      customerName: projectRow.customer_name,
      industry: projectRow.industry,
      brandChecklist: JSON.parse(projectRow.brand_checklist || '{}'),
      brandTimeline: JSON.parse(projectRow.brand_timeline || '{}'),
    };

    const context = await buildAIContext({
      project,
      engineType: engineType || 'initiation',
      scenario: 'field_assist',
    });

    const userMessage = `请为「${fieldLabel}」字段提供专业建议。${fieldValue ? `当前值为："${fieldValue}"。` : '该字段当前为空。'}请给出2-3个建议选项，每个选项用编号列出，简洁明了。`;

    const messages = buildMessages(context, userMessage);

    const route = getModelForScenario('field_assist');
    if (!route) return res.status(503).json({ error: '无可用模型' });

    const adapter = getAdapter(route.config.provider, route.config);
    const result = await adapter.chat(messages as ChatMessage[]);

    res.json({ suggestion: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== POST /api/ai/image-generate — 图像生成 ==========

router.post('/image-generate', async (req: Request, res: Response) => {
  const { prompt, size, style, projectId, deliverableId } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: '缺少 prompt' });
  }

  try {
    const route = getModelForScenario('image_generate');
    if (!route) return res.status(503).json({ error: '图像生成模型不可用，请配置通义千问 API Key' });

    const adapter = getAdapter(route.config.provider, route.config);

    if (!adapter.generateImage) {
      return res.status(503).json({ error: '当前模型不支持图像生成' });
    }

    const results = await adapter.generateImage(prompt, { size, style });

    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========== GET /api/ai/models — 可用模型列表 ==========

router.get('/models', (_req: Request, res: Response) => {
  const providers = getEnabledProviders();
  const info = getProviderInfo();

  res.json({
    providers,
    info,
    scenarioRoutes,
  });
});

export default router;

// ========== Token 用量记录 ==========

function logAIUsage(db: any, data: {
  provider: string;
  model: string;
  scenario: string;
  projectId: string;
  deliverableId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}) {
  try {
    const id = genId();
    db.prepare(
      'INSERT INTO ai_usage_logs (id, provider, model, scenario, project_id, deliverable_id, prompt_tokens, completion_tokens, total_tokens, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, data.provider, data.model, data.scenario, data.projectId, data.deliverableId, data.promptTokens, data.completionTokens, data.totalTokens, Date.now());
  } catch {
    // 用量记录失败不影响主流程
  }
}

// ========== GET /api/ai/usage — Token 用量统计 ==========

router.get('/usage', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const totals = db.prepare(`
      SELECT
        COUNT(*) as total_calls,
        COALESCE(SUM(prompt_tokens), 0) as total_prompt,
        COALESCE(SUM(completion_tokens), 0) as total_completion,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(CASE WHEN created_at > ? THEN total_tokens ELSE 0 END), 0) as today_tokens
      FROM ai_usage_logs
    `).get(Date.now() - 86400000) as any;

    const byProvider = db.prepare(`
      SELECT provider, COUNT(*) as calls, SUM(total_tokens) as tokens
      FROM ai_usage_logs
      GROUP BY provider ORDER BY tokens DESC
    `).all();

    const byScenario = db.prepare(`
      SELECT scenario, COUNT(*) as calls, SUM(total_tokens) as tokens
      FROM ai_usage_logs
      GROUP BY scenario ORDER BY tokens DESC
    `).all();

    res.json({
      totals,
      byProvider,
      byScenario,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
