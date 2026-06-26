// ============================================================
// 亮品牌 · 品牌年谱模块
// 记录品牌/企业从创立至今的完整发展路径
// 做对了什么 → 错过了什么 → 未来思考
// ============================================================

/** 年谱条目类型 */
export type TimelineEntryType = 'milestone' | 'success' | 'failure' | 'opportunity' | 'challenge' | 'thinking';

export const TIMELINE_TYPE_CONFIG: Record<TimelineEntryType, { label: string; icon: string; color: string; description: string }> = {
  milestone: { label: '里程碑', icon: '🏁', color: '#cf1322', description: '品牌发展中的关键节点（成立、开店、融资等）' },
  success: { label: '做对了', icon: '✅', color: '#52c41a', description: '带来了积极成果的决策或行动' },
  failure: { label: '做错了/错过了', icon: '❌', color: '#ff4d4f', description: '不成功的尝试或错失的发展窗口' },
  opportunity: { label: '发展机遇', icon: '🚀', color: '#faad14', description: '当下把握住的或正在面对的机会' },
  challenge: { label: '挑战与困难', icon: '⚠️', color: '#722ed1', description: '品牌发展过程中遇到的困难或瓶颈' },
  thinking: { label: '思考与规划', icon: '💡', color: '#13c2c2', description: '创始人/团队的战略思考和未来规划' },
};

/** 年谱条目 */
export interface TimelineEntry {
  id: string;
  /** 时间标签，如 "2019年3月"、"2021年"、"2023年Q2" */
  period: string;
  /** 条目类型 */
  type: TimelineEntryType;
  /** 标题 */
  title: string;
  /** 详细描述 */
  description: string;
  /** 该条目关联的维度（可选） */
  tags?: string[];
  /** 创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  updatedAt: number;
}

/** 品牌年谱整体数据 */
export interface BrandTimeline {
  entries: TimelineEntry[];
  /** 团队整体反思与总结 */
  teamReflection: string;
  /** 未来战略思考 */
  futureThinking: string;
  /** 最后更新时间 */
  updatedAt: number;
}

/** 创建空的年谱数据 */
export function createEmptyTimeline(): BrandTimeline {
  return {
    entries: [],
    teamReflection: '',
    futureThinking: '',
    updatedAt: Date.now(),
  };
}

/** 年谱引导问题模板 */
export const TIMELINE_GUIDE_QUESTIONS = {
  origin: [
    '品牌/企业是如何创立的？创始人的初心是什么？',
    '创业之初遇到了什么困难？是如何克服的？',
    '第一笔生意/第一个客户是怎么来的？',
  ],
  growth: [
    '发展过程中做对了哪些关键决策？带来了什么积极影响？',
    '有没有错过重要的发展窗口？当时为什么没有抓住？',
    '哪些时刻让您觉得"品牌上了一个台阶"？',
    '有没有做过不成功的尝试？学到了什么？',
  ],
  current: [
    '当前面临的最大机遇是什么？如何把握？',
    '当前最大的挑战或瓶颈是什么？',
    '团队对品牌现状的整体评价是什么？',
  ],
  future: [
    '对于品牌3-5年的发展，有什么战略思考？',
    '团队对品牌未来的期望是什么？',
    '有没有什么一直想做但还没开始的事情？',
  ],
};

/** 将年谱数据转为AI可读的上下文文本 */
export function timelineToContext(data: BrandTimeline, brandName: string): string {
  const lines: string[] = [`## 品牌年谱（${brandName}）\n`];

  if (data.entries.length > 0) {
    lines.push('### 发展历程');
    // 按时间排序
    const sorted = [...data.entries].sort((a, b) => a.period.localeCompare(b.period));

    let lastPeriod = '';
    for (const entry of sorted) {
      if (entry.period !== lastPeriod) {
        lines.push(`\n**${entry.period}**`);
        lastPeriod = entry.period;
      }
      const typeCfg = TIMELINE_TYPE_CONFIG[entry.type];
      lines.push(`- ${typeCfg.icon} ${entry.type === 'success' ? '✓' : entry.type === 'failure' ? '✗' : '●'} **${entry.title}**：${entry.description}`);
    }
    lines.push('');
  }

  if (data.teamReflection?.trim()) {
    lines.push('### 团队反思与总结');
    lines.push(data.teamReflection.trim());
    lines.push('');
  }

  if (data.futureThinking?.trim()) {
    lines.push('### 未来战略思考');
    lines.push(data.futureThinking.trim());
    lines.push('');
  }

  if (data.entries.length === 0 && !data.teamReflection?.trim() && !data.futureThinking?.trim()) {
    lines.push('*（品牌年谱暂未填写）*');
  }

  return lines.join('\n');
}
