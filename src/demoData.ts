// ============================================================
// 亮品牌 · 演示数据（无后端时使用）
// 5 个真实案例项目，覆盖不同行业、套餐、阶段的全流程演示
// ============================================================

import type { Customer, Project, Quote, ReviewTask, ProjectDeliverable } from './types';
import type { EngineType, ID, ProjectPhase, DeliverableStatus } from './types';
import { createEmptyTimeline } from './brandTimeline';
import { createEmptyChecklist } from './brandChecklist';

const NOW = Date.now();
const DAY = 86400000;
const T = (daysAgo: number) => NOW - daysAgo * DAY;

// ==================== 辅助函数 ====================

function makeDeliverable(
  tpl: { id: string; name: string; engineType: EngineType; moduleId: string },
  status: DeliverableStatus,
  opts?: { content?: string; assignee?: string; reviewer?: string },
): ProjectDeliverable {
  const base = {
    id: `dd-${tpl.id}-${Math.random().toString(36).slice(2, 8)}`,
    templateId: tpl.id,
    name: tpl.name,
    engineType: tpl.engineType,
    moduleId: tpl.moduleId,
    phase: tpl.engineType as ProjectPhase,
    status,
    content: opts?.content || (status === 'approved' ? generateContent(tpl.name) : ''),
    version: status === 'approved' ? 2 : (status === 'draft' || status === 'revision_needed' ? 1 : 0),
    versions: status !== 'pending'
      ? [{ version: 1, content: '初始版本', createdAt: T(30), author: '系统演示' }]
      : [],
    reviewHistory: status === 'approved'
      ? [{ id: 'r1', status: 'approved', reviewer: '敬亮', comment: '内容符合要求，审核通过', createdAt: T(5) }]
      : status === 'revision_needed'
        ? [{ id: 'r1', status: 'revision_needed', reviewer: '敬亮', comment: '需补充竞品数据分析部分', createdAt: T(3) }]
        : [],
    isPeriodic: false,
    createdAt: T(45),
    updatedAt: T(status === 'approved' ? 3 : 10),
    ...opts,
  };
  return base as ProjectDeliverable;
}

function generateContent(name: string): string {
  const map: Record<string, string[]> = {
    'comp-eco': [
      '# 竞争生态圈层分析报告',
      '',
      '## 一、行业概况',
      '',
      '### 1.1 市场规模',
      '当前品类市场规模约为 **380 亿元**，年复合增长率 **12.3%**。其中：',
      '- 一线及新一线城市占比：58%',
      '- 下沉市场增长最快：+18.7%',
      '',
      '### 1.2 竞品格局',
      '| 品牌 | 市场份额 | 定位 | 价格带 |',
      '|------|---------|------|--------|',
      '| 竞品 A | 22% | 高端商务 | 180-280元 |',
      '| 竞品 B | 15% | 年轻时尚 | 80-120元 |',
      '| 竞品 C | 11% | 家庭亲民 | 60-90元 |',
      '| 本品牌 | ~3% | 待定位 | - |',
      '',
      '## 二、核心发现',
      '1. 赛道机会：中高端市场存在明显空白（120-180元区间）',
      '2. 竞争壁垒建议：差异化体验 + 品牌情感连接',
      '3. 关键行动：聚焦城市第三空间心智占位',
    ],
    'strat-vision': [
      '# 企业战略与品牌定位白皮书',
      '',
      '## 一、创始人战略意图解码',
      '',
      '> 我们不只是做餐饮，而是为城市人创造一个有温度的第三空间',
      '',
      '**核心关键词**：温度 / 第三空间 / 城市 / 归属感',
      '',
      '## 二、品牌战略定位',
      '',
      '| 维度 | 定义 |',
      '|------|------|',
      '| 品牌使命 | 让每一座城市都有温暖人心的品牌空间 |',
      '| 品牌愿景 | 成为城市文化生活方式引领者 |',
      '| 品牌价值观 | 真诚 / 匠心 / 温暖 / 共生 |',
      '| 品牌角色 | 城市温暖的守护者 |',
      '',
      '## 三、战略路径图',
      '',
      '- Year 1：品牌基础建设 + 单店模型验证',
      '- Year 2：区域复制 + 数字化运营体系',
      '- Year 3：跨城扩张 + 品牌生态构建',
    ],
    'img-identity': [
      '# 品牌识别系统（VIS）手册',
      '',
      '## 一、品牌超级符号',
      '',
      '### Logo 设计理念',
      '以温度为核心视觉元素，融合建筑空间感与现代简约美学。',
      '',
      '### 色彩系统',
      '- 主色：#CF1322（品牌红）- 热情、温暖、醒目',
      '- 辅色：#F5A623（暖金）- 品质、价值、信赖',
      '- 点缀：#2D2D30（深炭灰）- 稳重、专业、高级',
      '',
      '## 二、应用规范',
      '包含门头应用、菜单设计、员工制服、外卖包装等 20+ 触点规范。',
    ],
    'mkt-framework': [
      '# 年度营销策略框架',
      '',
      '## 一、营销目标',
      '',
      '| 指标 | 当前值 | 目标值 | 增长率 |',
      '|------|--------|--------|--------|',
      '| 月均营收 | 85万 | 150万 | +76% |',
      '| 会员数 | 3200 | 10000 | +212% |',
      '| NPS 分值 | 42 | 65 | +55% |',
      '| 复购率 | 28% | 45% | +61% |',
      '',
      '## 二、核心战役规划',
      '',
      '### 战役一：城市温度品牌认知战役（Q1）',
      '- 目标：提升品牌知名度至区域内 TOP 3',
      '- 渠道：小红书 KOC 种草 + 本地生活达人探店',
      '- 预算：15 万',
      '',
      '### 战役二：会员成长私域运营战役（Q2）',
      '- 目标：会员数突破 5000 人',
      '- 渠道：微信社群 + 会员日运营 + 积分体系',
      '- 预算：8 万',
      '',
      '### 战役三：新品引爆产品上市战役（Q3）',
      '- 目标：新品首周销量 2000 份',
      '- 渠道：抖音本地生活 + 大众点评推广',
      '- 预算：20 万',
    ],
    'org-standard': [
      '# 运营标准手册（SOP）',
      '',
      '## 一、开店标准流程',
      '',
      '### 每日开店（10:00）',
      '1. 检查店内环境整洁度',
      '2. 确认设备运行正常',
      '3. 召开 5 分钟晨会',
      '4. 检查备货情况',
      '5. 开启 POS 系统',
      '',
      '## 二、服务七步曲',
      '1. 迎客：进门 3 秒内问候',
      '2. 入座：主动引位，询问偏好',
      '3. 点餐：推荐招牌菜，确认忌口',
      '4. 上菜：报菜名，摆放位置正确',
      '5. 巡台：每桌至少关注 3 次',
      '6. 结账：主动快速，礼貌道谢',
      '7. 送客：目送离开，欢迎再来',
      '',
      '## 三、品控清单',
      '- 食材新鲜度检查标准',
      '- 出品温度与时间规范',
      '- 卫生清洁评分卡',
    ],
  };

  // 通过 templateId 匹配
  for (const [id, lines] of Object.entries(map)) {
    if (name.includes(id) || id.includes(name.split('-')[0])) {
      return lines.join('\n');
    }
  }
  return '# ' + name + '\n\n本交付物为演示内容。\n\n在实际项目中，此处将包含详细的方案文档、设计稿或分析报告。\n\n---\n\n*由 AI 辅助生成 / 亮品牌系统*';
}

// ==================== 客户数据（5 个） ====================

export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'c-001', name: '张总', company: '济南莱喜莉餐饮管理有限公司',
    industry: '餐饮', contact: '张明华', phone: '13905318888',
    email: 'zhangmh@laixili.com', wechat: 'zhang_laixili',
    stage: 'signed', createdAt: T(90), notes: '核心客户，3 家直营店，计划两年内开到 10 家',
    source: '老客户转介绍',
  },
  {
    id: 'c-002', name: '陈董', company: '云麓茶业有限公司',
    industry: '茶业/新零售', contact: '陈云麓', phone: '13807319999',
    email: 'chen@yunlu-tea.com', wechat: 'chen_yunlu',
    stage: 'signed', createdAt: T(365), notes: '远航计划客户，项目已完成交付，现进入年度维护期',
    source: '行业展会',
  },
  {
    id: 'c-003', name: '李校长', company: '星河未来教育集团',
    industry: '教育培训', contact: '李星河', phone: '18653126666',
    email: 'lixh@xinghe-edu.com', wechat: 'lixinghe_edu',
    stage: 'signed', createdAt: T(45), notes: 'K12 素质教育机构，想做品牌升级和校区标准化',
    source: '线上咨询',
  },
  {
    id: 'c-004', name: '王院长', company: '悦康医疗美容诊所',
    industry: '医疗健康', contact: '王悦康', phone: '13708917777',
    email: 'wang@yuekang-med.com', wechat: 'wangyuekang',
    stage: 'negotiating', createdAt: T(25), notes: '高端医美，对价格敏感但认可方法论，需要定制化方案',
    source: '朋友推荐',
  },
  {
    id: 'c-005', name: '赵总监', company: '锦瑟文化创意工作室',
    industry: '文化创意', contact: '赵锦瑟', phone: '15906445555',
    email: 'zhao@jinse-culture.com', wechat: 'zhaojinse',
    stage: 'quoting', createdAt: T(12), notes: '独立文创品牌，想从工作室升级为公司化运营',
    source: '小红书咨询',
  },
];

// ==================== 报价数据（3 个已创建） ====================

export const DEMO_QUOTES: Quote[] = [
  // 莱喜莉 - 已接受的领航计划
  {
    id: 'q-001', customerId: 'c-001', customerName: '济南莱喜莉餐饮管理有限公司',
    packageType: 'navigate',
    items: [
      { moduleId: 'm-comp-eco', moduleName: '竞争生态分析', engineType: 'competition', selected: true, price: 25000, duration: 7, deliverableIds: ['d-comp-eco'] },
      { moduleId: 'm-strat-vision', moduleName: '战略解码工作坊', engineType: 'strategy', selected: true, price: 35000, duration: 14, deliverableIds: ['d-strat-vision','d-strat-position'] },
      { moduleId: 'm-img-identity', moduleName: '品牌识别系统', engineType: 'image', selected: true, price: 55000, duration: 21, deliverableIds: ['d-img-identity'] },
      { moduleId: 'm-mkt-framework', moduleName: '营销策略框架', engineType: 'marketing', selected: true, price: 30000, duration: 14, deliverableIds: ['d-mkt-framework','d-mkt-media'] },
      { moduleId: 'm-org-standard', moduleName: '运营标准手册', engineType: 'organization', selected: true, price: 25000, duration: 18, deliverableIds: ['d-org-standard','d-org-coach'] },
    ],
    basePrice: 248000, discount: 8000, taxRate: 6, travelBudget: 24000, thirdPartyBudget: 16000,
    totalPrice: 279840,
    status: 'accepted', createdAt: T(80), validUntil: T(20),
    paymentSchedule: [
      { id: 'ps1', label: '预付款（签约）', percentage: 40, amount: 111936, condition: '签约后 3 个工作日内', paid: true, paidAt: T(78) },
      { id: 'ps2', label: '二期款（启动后 1 月）', percentage: 30, amount: 83952, condition: '项目启动后 30 天', paid: true, paidAt: T(50) },
      { id: 'ps3', label: '三期款（中期评审）', percentage: 20, amount: 55968, condition: '中期评审通过后', paid: false },
      { id: 'ps4', label: '尾款（结案）', percentage: 10, amount: 27984, condition: '全部交付物通过验收', paid: false },
    ],
    customerSnapshot: { company: '济南莱喜莉餐饮管理有限公司', contact: '张明华', phone: '13905318888', wechat: 'zhang_laixili', email: 'zhangmh@laixili.com', industry: '餐饮' },
  },
  // 云麓茶业 - 远航计划（历史）
  {
    id: 'q-002', customerId: 'c-002', customerName: '云麓茶业有限公司',
    packageType: 'voyage',
    items: [
      { moduleId: 'm-comp-eco', moduleName: '竞争生态分析', engineType: 'competition', selected: true, price: 35000, duration: 15, deliverableIds: ['d-comp-eco','d-comp-bench','d-comp-trend'] },
      { moduleId: 'm-strat-vision', moduleName: '战略解码工作坊', engineType: 'strategy', selected: true, price: 48000, duration: 21, deliverableIds: ['d-strat-vision','d-strat-product'] },
      { moduleId: 'm-img-identity', moduleName: '品牌识别系统', engineType: 'image', selected: true, price: 68000, duration: 30, deliverableIds: ['d-img-identity','d-img-persona'] },
      { moduleId: 'm-space-concept', moduleName: '空间概念规划', engineType: 'space', selected: true, price: 45000, duration: 20, deliverableIds: ['d-space-concept','d-space-plan'] },
      { moduleId: 'm-mkt-framework', moduleName: '营销策略框架', engineType: 'marketing', selected: true, price: 42000, duration: 18, deliverableIds: ['d-mkt-framework','d-mkt-toolkit'] },
      { moduleId: 'm-org-standard', moduleName: '运营标准手册', engineType: 'organization', selected: true, price: 35000, duration: 24, deliverableIds: ['d-org-standard','d-org-coach'] },
    ],
    basePrice: 598000, discount: 20000, taxRate: 6, travelBudget: 48000, thirdPartyBudget: 36000,
    totalPrice: 646280,
    status: 'accepted', createdAt: T(355), validUntil: T(295),
    paymentSchedule: [
      { id: 'ps1', label: '预付款', percentage: 40, amount: 258512, condition: '签约', paid: true, paidAt: T(353) },
      { id: 'ps2', label: '二期款', percentage: 30, amount: 193884, condition: '启动后 2 月', paid: true, paidAt: T(270) },
      { id: 'ps3', label: '三期款', percentage: 20, amount: 129256, condition: '中期', paid: true, paidAt: T(180) },
      { id: 'ps4', label: '尾款', percentage: 10, amount: 64628, condition: '结案', paid: true, paidAt: T(30) },
    ],
    customerSnapshot: { company: '云麓茶业有限公司', contact: '陈云麓', phone: '13807319999', wechat: 'chen_yunlu', email: 'chen@yunlu-tea.com', industry: '茶业/新零售' },
  },
  // 星河教育 - 起航计划
  {
    id: 'q-003', customerId: 'c-003', customerName: '星河未来教育集团',
    packageType: 'set_sail',
    items: [
      { moduleId: 'm-comp-eco', moduleName: '竞争生态分析', engineType: 'competition', selected: true, price: 18000, duration: 7, deliverableIds: ['d-comp-eco','d-comp-bench'] },
      { moduleId: 'm-strat-vision', moduleName: '战略解码工作坊', engineType: 'strategy', selected: true, price: 22000, duration: 10, deliverableIds: ['d-strat-vision','d-strat-product'] },
      { moduleId: 'm-mkt-framework', moduleName: '营销策略框架', engineType: 'marketing', selected: true, price: 15000, duration: 10, deliverableIds: ['d-mkt-framework'] },
    ],
    basePrice: 68000, discount: 0, taxRate: 6, travelBudget: 6000, thirdPartyBudget: 4000,
    totalPrice: 81680,
    status: 'sent', createdAt: T(38), validUntil: T(5),
    paymentSchedule: [
      { id: 'ps1', label: '预付款', percentage: 50, amount: 32684, condition: '签约', paid: false },
      { id: 'ps2', label: '尾款', percentage: 50, amount: 32684, condition: '交付', paid: false },
    ],
    customerSnapshot: { company: '星河未来教育集团', contact: '李星河', phone: '18653126666', wechat: 'lixinghe_edu', email: 'lixh@xinghe-edu.com', industry: '教育培训' },
  },
];

// ==================== 项目数据（3 个活跃/完成 + 2 个潜在） ====================
// 项目 1: 莱喜莉 — 进行中（strategy 阶段），领航计划，核心演示项目
// 项目 2: 云麓茶业 — 已完成，远航计划，展示完整成果
// 项目 3: 星河教育 — 刚启动（competition 阶段），起航计划

function buildLaiXiliProject(): Project {
  return {
    id: 'p-001', customerId: 'c-001', customerName: '济南莱喜莉餐饮管理有限公司',
    name: '莱喜莉·品牌创建领航计划', industry: '餐饮', packageType: 'navigate',
    currentPhase: 'strategy',
    phases: ['initiation', 'competition', 'strategy', 'image', 'marketing', 'organization', 'delivery', 'completed'],
    startAt: T(70), endAt: undefined, status: 'active',
    team: [
      { id: 't1', name: '敬亮', role: 'consultant', isInternal: true },
      { id: 't2', name: '高见远', role: 'strategist', isInternal: true },
      { id: 't3', name: '寇豆码', role: 'designer', isInternal: true },
      { id: 't4', name: '严过关', role: 'pm', isInternal: true },
      { id: 't5', name: '张明华', role: 'pm', isInternal: false },
      { id: 't6', name: '李店长', role: 'pm', isInternal: false },
    ],
    deliverables: [
      // 亮竞争 — 已完成
      makeDeliverable({ id: 'd-comp-eco', name: '《竞争生态圈层分析报告》', engineType: 'competition', moduleId: 'm-comp-eco' }, 'approved', { assignee: '高见远', reviewer: '敬亮' }),
      makeDeliverable({ id: 'd-comp-bench', name: '《标杆品牌解构报告》', engineType: 'competition', moduleId: 'm-comp-bench' }, 'approved', { assignee: '高见远', reviewer: '敬亮' }),
      makeDeliverable({ id: 'd-comp-trend', name: '《品类趋势与机会报告》', engineType: 'competition', moduleId: 'm-comp-trend' }, 'approved', { assignee: '高见远', reviewer: '敬亮' }),
      // 亮战略 — 进行中
      makeDeliverable({ id: 'd-strat-vision', name: '《企业战略与品牌定位白皮书》', engineType: 'strategy', moduleId: 'm-strat-vision' }, 'draft', { assignee: '高见远', content: '# 战略白皮书\n\n## 品牌定位初稿\n\n正在进行中...' }),
      makeDeliverable({ id: 'd-strat-product', name: '《产品核心卖点体系》', engineType: 'strategy', moduleId: 'm-strat-product' }, 'draft', { assignee: '高见远' }),
      makeDeliverable({ id: 'd-strat-position', name: '《品牌定位九宫格》', engineType: 'strategy', moduleId: 'm-strat-position' }, 'pending'),
      makeDeliverable({ id: 'd-strat-profit', name: '《商业模式与盈利模型方案》', engineType: 'strategy', moduleId: 'm-strat-profit' }, 'pending'),
      makeDeliverable({ id: 'd-strat-iterate', name: '《战略迭代与第二曲线方案》', engineType: 'strategy', moduleId: 'm-strat-iterate' }, 'pending'),
      makeDeliverable({ id: 'd-strat-annual', name: '《年度战略规划书》', engineType: 'strategy', moduleId: 'm-strat-annual' }, 'pending'),
      // 亮形象 — 待启动
      makeDeliverable({ id: 'd-img-identity', name: '《品牌识别系统手册》', engineType: 'image', moduleId: 'm-img-identity' }, 'pending'),
      makeDeliverable({ id: 'd-img-persona', name: '《品牌IP化系统手册》', engineType: 'image', moduleId: 'm-img-persona' }, 'pending'),
      makeDeliverable({ id: 'd-img-channel', name: '《数字化触点形象规范手册》', engineType: 'image', moduleId: 'm-img-channel' }, 'pending'),
      makeDeliverable({ id: 'd-img-dining', name: '《桌面体验系统手册》', engineType: 'image', moduleId: 'm-img-dining' }, 'pending'),
      makeDeliverable({ id: 'd-img-takeout', name: '《外卖体验系统设计》', engineType: 'image', moduleId: 'm-img-takeout' }, 'pending'),
      makeDeliverable({ id: 'd-img-staff', name: '《员工形象与行为规范手册》', engineType: 'image', moduleId: 'm-img-staff' }, 'pending'),
      makeDeliverable({ id: 'd-img-derivative', name: '《品牌衍生品手册》', engineType: 'image', moduleId: 'm-img-derivative' }, 'pending'),
      makeDeliverable({ id: 'd-img-entrance', name: '《门头与入口空间导视系统手册》', engineType: 'image', moduleId: 'm-img-entrance' }, 'pending'),
      makeDeliverable({ id: 'd-img-signage', name: '《空间导视与温馨提示系统》', engineType: 'image', moduleId: 'm-img-signage' }, 'pending'),
      // 亮营销 — 待启动
      makeDeliverable({ id: 'd-mkt-framework', name: '《营销策略框架》', engineType: 'marketing', moduleId: 'm-mkt-framework' }, 'pending'),
      makeDeliverable({ id: 'd-mkt-media', name: '《新媒体传播方案》', engineType: 'marketing', moduleId: 'm-mkt-media' }, 'pending'),
      makeDeliverable({ id: 'd-mkt-toolkit', name: '《新媒体传播与招商工具包》', engineType: 'marketing', moduleId: 'm-mkt-toolkit' }, 'pending'),
      makeDeliverable({ id: 'd-mkt-campaign', name: '《战役执行报告》', engineType: 'marketing', moduleId: 'm-mkt-campaign' }, 'pending'),
      makeDeliverable({ id: 'd-mkt-calendar', name: '《年度营销日历》', engineType: 'marketing', moduleId: 'm-mkt-calendar' }, 'pending'),
      // 亮组织 — 待启动
      makeDeliverable({ id: 'd-org-standard', name: '《运营标准手册》', engineType: 'organization', moduleId: 'm-org-standard' }, 'pending'),
      makeDeliverable({ id: 'd-org-asset', name: '《品牌资产管理体系》', engineType: 'organization', moduleId: 'm-org-asset' }, 'pending'),
      makeDeliverable({ id: 'd-org-diagnosis', name: '《单店经营诊断报告》', engineType: 'organization', moduleId: 'm-org-diagnosis' }, 'pending'),
      makeDeliverable({ id: 'd-org-coach', name: '《单店经营与教练培养体系》', engineType: 'organization', moduleId: 'm-org-coach' }, 'pending'),
      makeDeliverable({ id: 'd-org-structure', name: '《组织优化建议书》', engineType: 'organization', moduleId: 'm-org-structure' }, 'pending'),
    ],
    selectedModuleIds: ['m-comp-eco','m-comp-bench','m-strat-vision','m-strat-product','m-img-identity','m-mkt-framework','m-org-standard'],
    createdAt: T(70), updatedAt: T(2), notes: '核心项目，目前处于战略深化阶段。客户配合度高。',
    monthlyWorkPlan: [
      { month: 1, phase: 'initiation' as ProjectPhase, engineTypes: [], tasks: ['召开项目启动会', '组建联合项目组', '签订项目协议'], keyDeliverables: ['启动会纪要', '项目组通讯录', '项目时间表'], status: 'completed' },
      { month: 2, phase: 'competition' as ProjectPhase, engineTypes: ['competition'], tasks: ['竞争生态调研', '标杆品牌研究', '品类趋势分析'], keyDeliverables: ['《竞争生态圈层分析报告》', '《标杆品牌解构报告》'], status: 'completed' },
      { month: 3, phase: 'strategy' as ProjectPhase, engineTypes: ['strategy'], tasks: ['创始人战略解码', '品牌定位工作坊', '产品卖点提炼'], keyDeliverables: ['《企业战略与品牌定位白皮书》', '《产品核心卖点体系》'], status: 'in_progress' },
      { month: 4, phase: 'strategy' as ProjectPhase, engineTypes: ['strategy','image'], tasks: ['盈利模型设计', '品牌识别基础设计'], keyDeliverables: ['《商业模式与盈利模型方案》', '《品牌识别基础手册》'], status: 'pending' },
      { month: 5, phase: 'image' as ProjectPhase, engineTypes: ['image','marketing'], tasks: ['形象系统深化', '新媒体传播方案'], keyDeliverables: ['《品牌体验系统手册》', '《新媒体传播方案》'], status: 'pending' },
      { month: 6, phase: 'delivery' as ProjectPhase, engineTypes: ['organization'], tasks: ['运营标准制定', '组织培训', '成果汇总移交'], keyDeliverables: ['《运营标准手册》', '全套领航交付包'], status: 'pending' },
    ],
    brandChecklist: createEmptyChecklist(),
    brandTimeline: createEmptyTimeline(),
  };
}

function buildYunLuTeaProject(): Project {
  const allApproved = (tpl: { id: string; name: string; engineType: EngineType; moduleId: string }) =>
    makeDeliverable(tpl, 'approved', { assignee: '寇豆码', reviewer: '敬亮' });
  return {
    id: 'p-002', customerId: 'c-002', customerName: '云麓茶业有限公司',
    name: '云麓茶业·远航品牌创建', industry: '茶业/新零售', packageType: 'voyage',
    currentPhase: 'completed',
    phases: ['initiation', 'competition', 'strategy', 'image', 'space', 'marketing', 'organization', 'delivery', 'completed'],
    startAt: T(340), endAt: T(35), status: 'completed',
    team: [
      { id: 't1', name: '敬亮', role: 'consultant', isInternal: true },
      { id: 't2', name: '高见远', role: 'strategist', isInternal: true },
      { id: 't3', name: '寇豆码', role: 'designer', isInternal: true },
      { id: 't4', name: '严过关', role: 'pm', isInternal: true },
      { id: 't5', name: '陈云麓', role: 'pm', isInternal: false },
    ],
    deliverables: [
      allApproved({ id: 'd-comp-eco', name: '《竞争生态圈层分析报告》', engineType: 'competition', moduleId: 'm-comp-eco' }),
      allApproved({ id: 'd-comp-bench', name: '《标杆品牌解构报告》', engineType: 'competition', moduleId: 'm-comp-bench' }),
      allApproved({ id: 'd-comp-trend', name: '《品类趋势与机会报告》', engineType: 'competition', moduleId: 'm-comp-trend' }),
      allApproved({ id: 'd-comp-diff', name: '《市场机会与差异化定位建议书》', engineType: 'competition', moduleId: 'm-comp-diff' }),
      allApproved({ id: 'd-strat-vision', name: '《企业战略与品牌定位白皮书》', engineType: 'strategy', moduleId: 'm-strat-vision' }),
      allApproved({ id: 'd-strat-product', name: '《产品核心卖点体系》', engineType: 'strategy', moduleId: 'm-strat-product' }),
      allApproved({ id: 'd-strat-position', name: '《品牌定位九宫格》', engineType: 'strategy', moduleId: 'm-strat-position' }),
      allApproved({ id: 'd-strat-profit', name: '《商业模式与盈利模型方案》', engineType: 'strategy', moduleId: 'm-strat-profit' }),
      allApproved({ id: 'd-img-identity', name: '《品牌识别系统手册》', engineType: 'image', moduleId: 'm-img-identity' }),
      allApproved({ id: 'd-img-persona', name: '《品牌IP化系统手册》', engineType: 'image', moduleId: 'm-img-persona' }),
      allApproved({ id: 'd-img-channel', name: '《数字化触点形象规范手册》', engineType: 'image', moduleId: 'm-img-channel' }),
      allApproved({ id: 'd-mkt-framework', name: '《营销策略框架》', engineType: 'marketing', moduleId: 'm-mkt-framework' }),
      allApproved({ id: 'd-mkt-toolkit', name: '《新媒体传播与招商工具包》', engineType: 'marketing', moduleId: 'm-mkt-toolkit' }),
      allApproved({ id: 'd-org-standard', name: '《运营标准手册》', engineType: 'organization', moduleId: 'm-org-standard' }),
      allApproved({ id: 'd-org-coach', name: '《单店经营与教练培养体系》', engineType: 'organization', moduleId: 'm-org-coach' }),
      allApproved({ id: 'd-space-concept', name: '《空间概念方案》', engineType: 'space', moduleId: 'm-space-concept' }),
      allApproved({ id: 'd-space-plan', name: '《空间平面方案》', engineType: 'space', moduleId: 'm-space-plan' }),
    ],
    selectedModuleIds: ['m-comp-eco','m-strat-vision','m-img-identity','m-mkt-framework','m-org-standard','m-space-concept'],
    createdAt: T(340), updatedAt: T(35), notes: '远航计划圆满交付。品牌全新升级后，门店业绩同比提升 47%，会员数从 2000 增至 12000+。',
    monthlyWorkPlan: [
      { month: 1, phase: 'initiation' as ProjectPhase, engineTypes: [], tasks: ['启动会','深度诊断'], keyDeliverables: ['诊断报告'], status: 'completed' },
      { month: 2, phase: 'competition' as ProjectPhase, engineTypes: ['competition'], tasks: ['竞争调研','标杆研究'], keyDeliverables: ['竞争报告'], status: 'completed' },
      { month: 3, phase: 'strategy' as ProjectPhase, engineTypes: ['strategy'], tasks: ['战略解码','品牌定位'], keyDeliverables: ['白皮书'], status: 'completed' },
      { month: 4, phase: 'image' as ProjectPhase, engineTypes: ['image'], tasks: ['VIS设计','IP开发'], keyDeliverables: ['识别手册'], status: 'completed' },
      { month: 5, phase: 'space' as ProjectPhase, engineTypes: ['space'], tasks: ['空间概念','平面方案'], keyDeliverables: ['空间方案'], status: 'completed' },
      { month: 6, phase: 'marketing' as ProjectPhase, engineTypes: ['marketing'], tasks: ['营销策略','传播方案'], keyDeliverables: ['营销框架'], status: 'completed' },
      { month: 7, phase: 'organization' as ProjectPhase, engineTypes: ['organization'], tasks: ['运营标准','培训体系'], keyDeliverables: ['SOP手册'], status: 'completed' },
    ].map((m, i) => ({ ...m, month: i + 1 })),
    brandChecklist: createEmptyChecklist(),
    brandTimeline: createEmptyTimeline(),
  };
}

function buildXingHeEduProject(): Project {
  return {
    id: 'p-003', customerId: 'c-003', customerName: '星河未来教育集团',
    name: '星河教育·品牌升级起航计划', industry: '教育培训', packageType: 'set_sail',
    currentPhase: 'competition',
    phases: ['initiation', 'competition', 'strategy', 'marketing', 'delivery', 'completed'],
    startAt: T(35), endAt: undefined, status: 'active',
    team: [
      { id: 't1', name: '许清楚', role: 'consultant', isInternal: true },
      { id: 't2', name: '高见远', role: 'strategist', isInternal: true },
      { id: 't3', name: '李星河', role: 'pm', isInternal: false },
      { id: 't4', name: '王教务', role: 'pm', isInternal: false },
    ],
    deliverables: [
      makeDeliverable({ id: 'd-comp-eco', name: '《竞争生态圈层分析报告》', engineType: 'competition', moduleId: 'm-comp-eco' }, 'ai_generating', { assignee: '高见远', content: '正在由 AI 生成竞争分析报告...' }),
      makeDeliverable({ id: 'd-comp-bench', name: '《标杆品牌解构报告》', engineType: 'competition', moduleId: 'm-comp-bench' }, 'pending', { assignee: '许清楚' }),
      makeDeliverable({ id: 'd-comp-trend', name: '《品类趋势与机会报告》', engineType: 'competition', moduleId: 'm-comp-trend' }, 'pending'),
      makeDeliverable({ id: 'd-strat-vision', name: '《企业战略与品牌定位白皮书》', engineType: 'strategy', moduleId: 'm-strat-vision' }, 'pending'),
      makeDeliverable({ id: 'd-strat-product', name: '《产品核心卖点体系》', engineType: 'strategy', moduleId: 'm-strat-product' }, 'pending'),
      makeDeliverable({ id: 'd-mkt-framework', name: '《营销策略框架》', engineType: 'marketing', moduleId: 'm-mkt-framework' }, 'pending'),
    ],
    selectedModuleIds: ['m-comp-eco','m-comp-bench','m-strat-vision','m-strat-product','m-mkt-framework'],
    createdAt: T(35), updatedAt: T(1), notes: '刚启动的项目，正在进行竞争生态分析。K12 素质教育赛道竞争激烈，需要精准定位差异。',
    monthlyWorkPlan: [
      { month: 1, phase: 'initiation' as ProjectPhase, engineTypes: [], tasks: ['启动会','资料收集'], keyDeliverables: ['启动会纪要'], status: 'completed' },
      { month: 2, phase: 'competition' as ProjectPhase, engineTypes: ['competition'], tasks: ['竞品调研','趋势分析'], keyDeliverables: ['《竞争生态圈层分析报告》'], status: 'in_progress' },
      { month: 3, phase: 'strategy' as ProjectPhase, engineTypes: ['strategy'], tasks: ['战略解码','品牌定位'], keyDeliverables: ['《企业战略与品牌定位白皮书》'], status: 'pending' },
    ],
    brandChecklist: createEmptyChecklist(),
    brandTimeline: createEmptyTimeline(),
  };
}

export const DEMO_PROJECTS: Project[] = [
  buildLaiXiliProject(),
  buildYunLuTeaProject(),
  buildXingHeEduProject(),
];

// ==================== 审核任务 ====================

export const DEMO_REVIEW_TASKS: ReviewTask[] = [
  {
    id: 'rv-001', deliverableId: DEMO_PROJECTS[0].deliverables[3].id,
    deliverableName: '《企业战略与品牌定位白皮书》',
    projectId: 'p-001', projectName: '莱喜莉·品牌创建领航计划',
    engineType: 'strategy', reviewer: '敬亮',
    status: 'pending_review', comment: undefined,
    createdAt: T(1),
  },
  {
    id: 'rv-002', deliverableId: DEMO_PROJECTS[0].deliverables[4].id,
    deliverableName: '《产品核心卖点体系》',
    projectId: 'p-001', projectName: '莱喜莉·品牌创建领航计划',
    engineType: 'strategy', reviewer: '高见远',
    status: 'pending_review', comment: undefined,
    createdAt: T(2),
  },
  {
    id: 'rv-003', deliverableId: DEMO_PROJECTS[2].deliverables[0].id,
    deliverableName: '《竞争生态圈层分析报告》',
    projectId: 'p-003', projectName: '星河教育·品牌升级起航计划',
    engineType: 'competition', reviewer: '许清楚',
    status: 'reviewing', comment: 'AI 生成内容待人工复核',
    reviewedAt: T(0.5), createdAt: T(3),
  },
];

// ==================== 导出统一接口 ====================

/** 获取所有演示数据 */
export function getDemoData() {
  return {
    customers: DEMO_CUSTOMERS,
    quotes: DEMO_QUOTES,
    projects: DEMO_PROJECTS,
    reviewTasks: DEMO_REVIEW_TASKS,
  };
}
