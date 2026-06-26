// ============================================================
// 亮品牌 · AI 上下文构建器
// 将项目数据、品牌信息、知识库内容组装为 AI 提示词
// ============================================================

import { getDb, jsonParse } from '../db.js';

export interface AIContext {
  /** 系统角色设定 */
  systemPrompt: string;
  /** 品牌基础信息 */
  brandInfo: string;
  /** 项目阶段信息 */
  phaseInfo: string;
  /** 知识库参考内容（RAG） */
  knowledgeChunks: string[];
  /** 已有交付物内容（用于优化场景） */
  existingContent?: string;
}

/**
 * 构建品牌基础信息上下文
 * 从项目的 brandChecklist 和 brandTimeline 中提取
 */
export function buildBrandInfoContext(project: any): string {
  const lines: string[] = [];
  const companyName = project.customerName || '未知品牌';

  lines.push(`# 品牌：${companyName}`);
  lines.push(`行业：${project.industry || '未知'}`);
  lines.push(`项目名：${project.name || ''}`);

  // 品牌自检信息
  const checklist = project.brandChecklist || {};
  if (Object.keys(checklist).length > 0) {
    lines.push('\n## 品牌自检信息');
    for (const [key, value] of Object.entries(checklist)) {
      if (typeof value === 'string' && value.trim()) {
        // 将 camelCase 转 readable label
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        lines.push(`- ${label}：${value}`);
      }
    }
  }

  // 品牌年谱
  const timeline = project.brandTimeline || {};
  if (timeline.entries && timeline.entries.length > 0) {
    lines.push('\n## 品牌年谱');
    for (const entry of timeline.entries) {
      const year = entry.year || entry.date || '';
      const title = entry.title || entry.event || '';
      const desc = entry.description || '';
      lines.push(`- ${year}：${title}${desc ? ' - ' + desc : ''}`);
    }
    if (timeline.teamReflection) {
      lines.push(`\n团队复盘思考：${timeline.teamReflection}`);
    }
    if (timeline.futureThinking) {
      lines.push(`未来展望：${timeline.futureThinking}`);
    }
  }

  return lines.join('\n');
}

/**
 * 构建阶段信息上下文
 * 当前引擎的阶段信息
 */
export function buildPhaseContext(project: any, engineType: string): string {
  const lines: string[] = [];

  lines.push(`## 当前工作阶段：${engineType}`);
  lines.push(`项目状态：${project.status || 'active'}`);

  // 列出该引擎下的已有交付物
  const deliverables = project.deliverables || [];
  const engineDels = deliverables.filter((d: any) => d.engineType === engineType);
  if (engineDels.length > 0) {
    lines.push(`\n该引擎已有 ${engineDels.length} 个交付物：`);
    for (const d of engineDels) {
      lines.push(`- ${d.name}（${d.status}）`);
    }
  }

  // 列出所有引擎的完成情况
  const completedByEngine: Record<string, number> = {};
  for (const d of deliverables) {
    completedByEngine[d.engineType] = (completedByEngine[d.engineType] || 0) + (d.status === 'approved' ? 1 : 0);
  }
  if (Object.keys(completedByEngine).length > 0) {
    lines.push('\n各引擎完成进度：');
    for (const [engine, count] of Object.entries(completedByEngine)) {
      lines.push(`- ${engine}：${count} 个已通过`);
    }
  }

  return lines.join('\n');
}

/**
 * 构建知识库参考内容
 * 从 knowledge_files 表中查询用户选中的文件内容
 * V1 阶段：直接使用文件提取的文本
 * V2 阶段：替换为向量检索
 */
export async function buildKnowledgeContext(fileIds: string[]): Promise<string[]> {
  if (!fileIds || fileIds.length === 0) return [];

  try {
    const db = getDb();
    const placeholders = fileIds.map(() => '?').join(',');
    const files = db.prepare(`SELECT file_name, extracted_text FROM knowledge_files WHERE id IN (${placeholders}) AND status = 'ready'`).all(...fileIds) as any[];

    return files
      .filter(f => f.extracted_text && f.extracted_text.trim())
      .map(f => `--- 参考文件：${f.file_name} ---\n${f.extracted_text.slice(0, 8000)}`); // 限制每个文件 8000 字符
  } catch {
    return [];
  }
}

/**
 * 构建完整 AI 上下文
 */
export async function buildAIContext(options: {
  project: any;
  engineType: string;
  scenario: string;
  deliverableName?: string;
  deliverableContent?: string; // 已有内容（优化场景）
  knowledgeFileIds?: string[];
  customPrompt?: string; // 用户自定义提示词
}): Promise<AIContext> {
  const { project, engineType, scenario, deliverableName, deliverableContent, knowledgeFileIds, customPrompt } = options;

  // 1. 品牌信息
  const brandInfo = buildBrandInfoContext(project);

  // 2. 阶段信息
  const phaseInfo = buildPhaseContext(project, engineType);

  // 3. 知识库内容
  const knowledgeChunks = await buildKnowledgeContext(knowledgeFileIds || []);

  // 4. 系统提示词（根据场景不同）
  const systemPrompt = buildSystemPrompt(scenario, deliverableName, engineType);

  return {
    systemPrompt,
    brandInfo,
    phaseInfo,
    knowledgeChunks,
    existingContent: deliverableContent,
  };
}

/**
 * 构建系统提示词
 */
function buildSystemPrompt(scenario: string, deliverableName?: string, engineType?: string): string {
  const baseSystem = `你是亮品牌（长沙敬亮品牌策划有限公司）的AI品牌策划助手。你的任务是基于品牌信息，运用"亮点体系"方法论（亮竞争/亮战略/亮形象/亮空间/亮营销/亮组织），为品牌创建项目生成专业的策划内容。

核心原则：
1. 所有内容必须基于提供的品牌信息，不可凭空编造
2. 使用专业的品牌策划语言和框架
3. 内容结构清晰，层次分明
4. 适当使用表格、列表等格式增强可读性
5. 在不确定的地方标注"待确认"
6. 输出格式为 Markdown`;

  const scenarioPrompts: Record<string, string> = {
    deliverable_generate: `当前任务：生成交付物「${deliverableName || ''}」（${engineType || ''}引擎）。
要求：
1. 严格按照该交付物类型的专业格式输出
2. 结合品牌基础信息进行定制化生成
3. 如果提供了参考文件，将其中的关键信息融入内容
4. 确保内容具有可操作性，不是空泛的理论`,

    deliverable_optimize: `当前任务：优化/重新生成交付物「${deliverableName || ''}」。
要求：
1. 在已有内容基础上进行优化提升
2. 保留已有内容的核心观点和结构
3. 补充缺失的分析维度
4. 提升内容的专业性和深度
5. 确保与品牌信息的一致性`,

    checklist_fill: `当前任务：根据已有信息，智能补全品牌自检表的缺失字段。
要求：
1. 基于已有字段推断缺失字段的合理值
2. 如果无法确定，给出 2-3 个建议选项
3. 所有补全内容需要标记为"AI建议"
4. 格式：JSON，每个字段为一个键值对`,

    timeline_search: `当前任务：根据品牌信息，搜索并建议品牌年谱条目。
要求：
1. 基于品牌名称、行业、创建时间等信息推断可能的年谱条目
2. 给出具体的时间、事件名称和简要描述
3. 格式：JSON数组，每个条目包含 year, title, description`,

    field_assist: `当前任务：辅助填充指定字段。
要求：
1. 结合品牌信息给出专业建议
2. 提供 2-3 个选项供选择
3. 简洁明了，直接给出结果`,

    image_generate: `当前任务：为品牌生成相关图像。
要求：
1. 严格按照用户描述生成图像
2. 风格与品牌调性一致`,
  };

  return baseSystem + '\n\n' + (scenarioPrompts[scenario] || scenarioPrompts.deliverable_generate);
}

/**
 * 将 AIContext 组装为最终的消息列表
 */
export function buildMessages(context: AIContext, userMessage: string): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [];

  // 系统提示
  messages.push({ role: 'system', content: context.systemPrompt });

  // 品牌信息作为 system 级别的上下文
  const contextParts: string[] = [];
  if (context.brandInfo) contextParts.push(`【品牌信息】\n${context.brandInfo}`);
  if (context.phaseInfo) contextParts.push(`【项目进度】\n${context.phaseInfo}`);

  // 知识库参考内容
  if (context.knowledgeChunks.length > 0) {
    contextParts.push(`【参考文件】\n${context.knowledgeChunks.join('\n\n')}`);
  }

  // 已有内容（优化场景）
  if (context.existingContent) {
    contextParts.push(`【已有内容（请在此基础上优化）】\n${context.existingContent}`);
  }

  if (contextParts.length > 0) {
    messages.push({ role: 'system', content: contextParts.join('\n\n') });
  }

  // 用户消息
  messages.push({ role: 'user', content: userMessage });

  return messages;
}
