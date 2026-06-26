// ============================================================
// 亮品牌 · 服务体系完整数据定义
// 基于"济南-莱喜莉品牌创建项目计划书"提取
// ============================================================

import { ServiceModule, EngineType, DeliverableTemplate, ToolTemplate } from './types';

// ========================
// 交付物模板全集（6大引擎）
// ========================

export const ALL_DELIVERABLES: DeliverableTemplate[] = [
  // ===== 亮竞争 =====
  {
    id: 'd-comp-eco', name: '《竞争生态圈层分析报告》', description: '识别直接/间接竞品、替代品，分析定位、产品、价格、渠道、营销策略',
    engineType: 'competition', moduleId: 'm-comp-eco', roles: ['consultant', 'strategist', 'pm'], estimatedHours: 16, isPeriodic: false,
  },
  {
    id: 'd-comp-bench', name: '《标杆品牌解构报告》', description: '选取3-5个行业内外标杆品牌，深度解构其成功基因',
    engineType: 'competition', moduleId: 'm-comp-bench', roles: ['consultant', 'strategist', 'pm'], estimatedHours: 12, isPeriodic: false,
  },
  {
    id: 'd-comp-trend', name: '《品类趋势与机会报告》', description: '研究品类历史与未来趋势，结合宏观环境识别机会窗口',
    engineType: 'competition', moduleId: 'm-comp-trend', roles: ['consultant', 'strategist', 'pm'], estimatedHours: 8, isPeriodic: false,
  },
  {
    id: 'd-comp-diff', name: '《市场机会与差异化定位建议书》', description: '绘制市场空白点地图，提出差异化方向',
    engineType: 'competition', moduleId: 'm-comp-diff', roles: ['strategist', 'pm'], estimatedHours: 8, isPeriodic: false,
  },
  {
    id: 'd-comp-monitor', name: '《季度竞争动态监测报告》', description: '每季度竞争动态分析，及时应对市场变化',
    engineType: 'competition', moduleId: 'm-comp-monitor', roles: ['consultant', 'strategist'], estimatedHours: 6, isPeriodic: true, periodicCount: 4,
  },
  {
    id: 'd-comp-barrier', name: '《竞争壁垒构建报告》', description: '竞争壁垒构建方案与实施路径',
    engineType: 'competition', moduleId: 'm-comp-barrier', roles: ['strategist', 'pm'], estimatedHours: 10, isPeriodic: false,
  },

  // ===== 亮战略 =====
  {
    id: 'd-strat-vision', name: '《企业战略与品牌定位白皮书》', description: '创始人战略意图、企业愿景使命价值观、品牌战略定位',
    engineType: 'strategy', moduleId: 'm-strat-vision', roles: ['consultant', 'strategist', 'pm'], estimatedHours: 20, isPeriodic: false,
  },
  {
    id: 'd-strat-product', name: '《产品核心卖点体系》', description: '产品卖点提炼、产品哲学、产品结构规划',
    engineType: 'strategy', moduleId: 'm-strat-product', roles: ['strategist', 'consultant'], estimatedHours: 12, isPeriodic: false,
  },
  {
    id: 'd-strat-position', name: '《品牌定位九宫格》', description: '品牌定位多维度拆解，明确核心差异化',
    engineType: 'strategy', moduleId: 'm-strat-position', roles: ['strategist'], estimatedHours: 8, isPeriodic: false,
  },
  {
    id: 'd-strat-profit', name: '《商业模式与盈利模型方案》', description: '商业模式创新、单店盈利模型、招商模式设计',
    engineType: 'strategy', moduleId: 'm-strat-profit', roles: ['strategist', 'pm'], estimatedHours: 16, isPeriodic: false,
  },
  {
    id: 'd-strat-iterate', name: '《战略迭代与第二曲线方案》', description: '年度战略复盘、第二曲线机会探索、战略调整方案',
    engineType: 'strategy', moduleId: 'm-strat-iterate', roles: ['strategist', 'consultant'], estimatedHours: 12, isPeriodic: false,
  },
  {
    id: 'd-strat-annual', name: '《年度战略规划书》', description: '下一年度战略目标、路径与资源配置',
    engineType: 'strategy', moduleId: 'm-strat-annual', roles: ['strategist', 'pm', 'consultant'], estimatedHours: 16, isPeriodic: false,
  },

  // ===== 亮形象 =====
  {
    id: 'd-img-identity', name: '《品牌识别系统手册》', description: '超级符号、色彩系统、字体规范、辅助图形、KV体系',
    engineType: 'image', moduleId: 'm-img-identity', roles: ['designer', 'strategist'], estimatedHours: 40, isPeriodic: false,
  },
  {
    id: 'd-img-persona', name: '《品牌IP化系统手册》', description: 'IP形象原型开发、表情动作库、品牌调性规范',
    engineType: 'image', moduleId: 'm-img-persona', roles: ['designer'], estimatedHours: 20, isPeriodic: false,
  },
  {
    id: 'd-img-product', name: '《产品道具系统设计》', description: '招牌菜品专属器皿设计、器皿工艺实现、呈现仪式感设计',
    engineType: 'image', moduleId: 'm-img-product', roles: ['designer'], estimatedHours: 24, isPeriodic: false,
  },
  {
    id: 'd-img-channel', name: '《数字化触点形象规范手册》', description: '美团/饿了么、大众点评、小红书/抖音品牌形象规范',
    engineType: 'image', moduleId: 'm-img-channel', roles: ['designer'], estimatedHours: 16, isPeriodic: false,
  },
  {
    id: 'd-img-dining', name: '《桌面体验系统手册》', description: '餐具系统、餐巾纸、牙签筷套、台号牌点餐工具设计',
    engineType: 'image', moduleId: 'm-img-dining', roles: ['designer'], estimatedHours: 20, isPeriodic: false,
  },
  {
    id: 'd-img-takeout', name: '《外卖体验系统设计》', description: '外卖手提袋、打包盒、开箱体验设计',
    engineType: 'image', moduleId: 'm-img-takeout', roles: ['designer'], estimatedHours: 16, isPeriodic: false,
  },
  {
    id: 'd-img-staff', name: '《员工形象与行为规范手册》', description: '员工身份标识、管理层/服务团队/后厨团队着装规范',
    engineType: 'image', moduleId: 'm-img-staff', roles: ['designer'], estimatedHours: 12, isPeriodic: false,
  },
  {
    id: 'd-img-derivative', name: '《品牌衍生品手册》', description: '品牌礼品、伴手礼体系、周边产品规划',
    engineType: 'image', moduleId: 'm-img-derivative', roles: ['designer', 'strategist'], estimatedHours: 14, isPeriodic: false,
  },
  {
    id: 'd-img-entrance', name: '《门头与入口空间导视系统手册》', description: '门头视觉规范、亮化设计、入口体验、外部导视',
    engineType: 'image', moduleId: 'm-img-entrance', roles: ['designer'], estimatedHours: 20, isPeriodic: false,
  },
  {
    id: 'd-img-signage', name: '《空间导视与温馨提示系统》', description: '内部导视功能指引、温馨提示牌、导视系统手册',
    engineType: 'image', moduleId: 'm-img-signage', roles: ['designer'], estimatedHours: 12, isPeriodic: false,
  },

  // ===== 亮空间 =====
  {
    id: 'd-space-concept', name: '《空间概念方案》', description: '空间概念设计、品牌叙事融入空间',
    engineType: 'space', moduleId: 'm-space-concept', roles: ['designer'], estimatedHours: 24, isPeriodic: false,
  },
  {
    id: 'd-space-plan', name: '《空间平面方案》', description: '平面布局、动线设计、功能分区',
    engineType: 'space', moduleId: 'm-space-plan', roles: ['designer'], estimatedHours: 20, isPeriodic: false,
  },
  {
    id: 'd-space-render', name: '门头造型效果图', description: '门头外观效果、招牌设计、橱窗展示',
    engineType: 'space', moduleId: 'm-space-render', roles: ['designer'], estimatedHours: 16, isPeriodic: false,
  },
  {
    id: 'd-space-construction', name: '《全套施工图文件》', description: '电气、水路、暖通、装修全套施工图',
    engineType: 'space', moduleId: 'm-space-construction', roles: ['designer'], estimatedHours: 32, isPeriodic: false,
  },
  {
    id: 'd-space-supervision', name: '《设计落地监理报告》', description: '施工质量监督、材料验收、偏差整改记录',
    engineType: 'space', moduleId: 'm-space-supervision', roles: ['designer', 'pm'], estimatedHours: 16, isPeriodic: false,
  },

  // ===== 亮营销 =====
  {
    id: 'd-mkt-framework', name: '《营销策略框架》', description: '年度营销方向、核心战役框架、媒体策略',
    engineType: 'marketing', moduleId: 'm-mkt-framework', roles: ['strategist', 'consultant'], estimatedHours: 16, isPeriodic: false,
  },
  {
    id: 'd-mkt-ogsm', name: '《OGSM营销落地表》', description: '目的、目标、策略、衡量指标完整规划',
    engineType: 'marketing', moduleId: 'm-mkt-ogsm', roles: ['strategist', 'pm'], estimatedHours: 10, isPeriodic: false,
  },
  {
    id: 'd-mkt-media', name: '《新媒体传播方案》', description: '新媒体矩阵规划、内容策略、投放计划',
    engineType: 'marketing', moduleId: 'm-mkt-media', roles: ['strategist', 'consultant'], estimatedHours: 12, isPeriodic: false,
  },
  {
    id: 'd-mkt-toolkit', name: '《新媒体传播与招商工具包》', description: '招商手册、招商策略、传播工具',
    engineType: 'marketing', moduleId: 'm-mkt-toolkit', roles: ['designer', 'strategist'], estimatedHours: 20, isPeriodic: false,
  },
  {
    id: 'd-mkt-campaign', name: '《战役执行报告》', description: '关键战役执行总结与效果评估',
    engineType: 'marketing', moduleId: 'm-mkt-campaign', roles: ['consultant', 'strategist'], estimatedHours: 8, isPeriodic: true, periodicCount: 2,
  },
  {
    id: 'd-mkt-calendar', name: '《年度营销日历》', description: '全年营销活动规划、节点排期、资源分配',
    engineType: 'marketing', moduleId: 'm-mkt-calendar', roles: ['strategist', 'pm'], estimatedHours: 8, isPeriodic: false,
  },

  // ===== 亮组织 =====
  {
    id: 'd-org-standard', name: '《运营标准手册》', description: 'SOP流程规范、服务标准、品控清单',
    engineType: 'organization', moduleId: 'm-org-standard', roles: ['consultant', 'pm'], estimatedHours: 20, isPeriodic: false,
  },
  {
    id: 'd-org-asset', name: '《品牌资产管理体系》', description: '品牌资产盘点与管理制度',
    engineType: 'organization', moduleId: 'm-org-asset', roles: ['strategist', 'pm'], estimatedHours: 12, isPeriodic: false,
  },
  {
    id: 'd-org-diagnosis', name: '《单店经营诊断报告》', description: '单店经营数据分析、诊断问题与优化建议',
    engineType: 'organization', moduleId: 'm-org-diagnosis', roles: ['consultant'], estimatedHours: 10, isPeriodic: true, periodicCount: 3,
  },
  {
    id: 'd-org-coach', name: '《单店经营与教练培养体系》', description: '内部教练培养方案、单店经营辅导机制',
    engineType: 'organization', moduleId: 'm-org-coach', roles: ['consultant', 'pm'], estimatedHours: 16, isPeriodic: false,
  },
  {
    id: 'd-org-structure', name: '《组织优化建议书》', description: '组织架构优化、岗位职责、绩效体系建议',
    engineType: 'organization', moduleId: 'm-org-structure', roles: ['consultant', 'pm'], estimatedHours: 12, isPeriodic: false,
  },
];

// ========================
// 工具模板全集
// ========================

export const ALL_TOOLS: ToolTemplate[] = [
  // 亮竞争
  { id: 't-comp-eco', name: '竞争生态分析工具', description: '竞品识别、竞争生态圈层绘制', deliverableIds: ['d-comp-eco', 'd-comp-bench'] },
  { id: 't-comp-barrier', name: '竞争壁垒构建工具', description: '差异化定位、壁垒方案制定', deliverableIds: ['d-comp-trend', 'd-comp-diff', 'd-comp-barrier'] },
  // 亮战略
  { id: 't-strat-vision', name: '战略解码工作台', description: '创始人意图解码、愿景使命提炼', deliverableIds: ['d-strat-vision', 'd-strat-position'] },
  { id: 't-strat-model', name: '盈利模型构建器', description: '商业模式设计、单店损益模型', deliverableIds: ['d-strat-product', 'd-strat-profit'] },
  // 亮形象
  { id: 't-img-identity', name: '品牌识别系统工具', description: '超级符号、色彩系统、字体规范、辅助图形', deliverableIds: ['d-img-identity'] },
  { id: 't-img-persona', name: '品牌人格化工具', description: 'IP形象开发、表情动作库、调性规范', deliverableIds: ['d-img-persona', 'd-img-derivative'] },
  { id: 't-img-touchpoint', name: '全渠道触点工具', description: '产品道具、全渠道形象、桌面体验、外卖体验', deliverableIds: ['d-img-product', 'd-img-channel', 'd-img-dining', 'd-img-takeout'] },
  { id: 't-img-staff', name: '员工形象工具', description: '员工形象规范、门头导视系统', deliverableIds: ['d-img-staff', 'd-img-entrance', 'd-img-signage'] },
  // 亮空间
  { id: 't-space-design', name: '空间设计工作台', description: '概念设计、平面方案、效果图', deliverableIds: ['d-space-concept', 'd-space-plan', 'd-space-render'] },
  { id: 't-space-supervision', name: '施工监理套件', description: '施工图、监理报告', deliverableIds: ['d-space-construction', 'd-space-supervision'] },
  // 亮营销
  { id: 't-mkt-plan', name: '营销计划生成器', description: 'OGSM、营销日历、传播方案', deliverableIds: ['d-mkt-framework', 'd-mkt-ogsm', 'd-mkt-media', 'd-mkt-calendar'] },
  { id: 't-mkt-growth', name: '用户增长引擎', description: '战役执行、招商工具包', deliverableIds: ['d-mkt-toolkit', 'd-mkt-campaign'] },
  // 亮组织
  { id: 't-org-standard', name: '运营标准套件', description: 'SOP制定、品控体系', deliverableIds: ['d-org-standard', 'd-org-asset'] },
  { id: 't-org-asset', name: '资产管理台', description: '经营诊断、教练培养、组织优化', deliverableIds: ['d-org-diagnosis', 'd-org-coach', 'd-org-structure'] },
];

// ========================
// 服务模块全集
// ========================

export const ALL_MODULES: ServiceModule[] = [
  // ===== 亮竞争 =====
  {
    id: 'm-comp-eco', engineType: 'competition',
    name: '竞争生态分析', description: '识别直接/间接竞品、替代品，分析定位与策略',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-comp-eco'),
    roles: ['consultant', 'strategist', 'designer', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-comp-eco')!],
  },
  {
    id: 'm-comp-bench', engineType: 'competition',
    name: '标杆研究', description: '选取标杆品牌深度解构成功基因',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-comp-bench'),
    roles: ['consultant', 'strategist', 'designer', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-comp-eco')!],
  },
  {
    id: 'm-comp-trend', engineType: 'competition',
    name: '品类趋势研究', description: '品类演进趋势与机会窗口识别',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-comp-trend'),
    roles: ['consultant', 'strategist', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-comp-barrier')!],
  },
  {
    id: 'm-comp-diff', engineType: 'competition',
    name: '差异化定位', description: '市场空白点与差异化空间分析',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-comp-diff'),
    roles: ['strategist', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-comp-barrier')!],
  },
  {
    id: 'm-comp-monitor', engineType: 'competition',
    name: '竞争动态监测', description: '季度竞争动态监测机制',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-comp-monitor'),
    roles: ['consultant', 'strategist'],
    tools: [ALL_TOOLS.find(t => t.id === 't-comp-barrier')!],
  },
  {
    id: 'm-comp-barrier', engineType: 'competition',
    name: '竞争壁垒构建', description: '构建可持续竞争优势',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-comp-barrier'),
    roles: ['strategist', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-comp-barrier')!],
  },

  // ===== 亮战略 =====
  {
    id: 'm-strat-vision', engineType: 'strategy',
    name: '创始人战略解码工作坊', description: '引导创始人明确愿景、战略目标及核心驱动力',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-strat-vision'),
    roles: ['consultant', 'strategist', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-strat-vision')!],
  },
  {
    id: 'm-strat-product', engineType: 'strategy',
    name: '产品战略', description: '产品卖点提炼、产品哲学构建',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-strat-product'),
    roles: ['strategist', 'consultant'],
    tools: [ALL_TOOLS.find(t => t.id === 't-strat-model')!],
  },
  {
    id: 'm-strat-position', engineType: 'strategy',
    name: '品牌定位', description: '品牌定位多维度拆解',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-strat-position'),
    roles: ['strategist'],
    tools: [ALL_TOOLS.find(t => t.id === 't-strat-vision')!],
  },
  {
    id: 'm-strat-profit', engineType: 'strategy',
    name: '盈利模型', description: '商业模式创新、单店盈利模型',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-strat-profit'),
    roles: ['strategist', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-strat-model')!],
  },
  {
    id: 'm-strat-iterate', engineType: 'strategy',
    name: '战略迭代', description: '年度战略复盘与第二曲线探索',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-strat-iterate'),
    roles: ['strategist', 'consultant'],
    tools: [ALL_TOOLS.find(t => t.id === 't-strat-model')!],
  },
  {
    id: 'm-strat-annual', engineType: 'strategy',
    name: '年度战略规划', description: '下一年度战略目标与资源配置',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-strat-annual'),
    roles: ['strategist', 'pm', 'consultant'],
    tools: [ALL_TOOLS.find(t => t.id === 't-strat-vision')!],
  },

  // ===== 亮形象 =====
  {
    id: 'm-img-identity', engineType: 'image',
    name: '品牌识别系统', description: '超级符号、色彩系统、字体规范、辅助图形、KV体系',
    deliverables: ALL_DELIVERABLES.filter((d: any) => d.moduleId === 'm-img-identity'),
    roles: ['designer', 'strategist'],
    tools: [ALL_TOOLS.find((t: any) => t.id === 't-img-identity')!],
  },
  {
    id: 'm-img-persona', engineType: 'image',
    name: '品牌人格化塑造', description: 'IP形象原型开发、表情动作库、品牌调性规范',
    deliverables: ALL_DELIVERABLES.filter((d: any) => d.moduleId === 'm-img-persona'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find((t: any) => t.id === 't-img-persona')!],
  },
  {
    id: 'm-img-product', engineType: 'image',
    name: '产品道具设计', description: '招牌菜品器皿设计、器皿工艺实现、呈现仪式感设计',
    deliverables: ALL_DELIVERABLES.filter((d: any) => d.moduleId === 'm-img-product'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find((t: any) => t.id === 't-img-touchpoint')!],
  },
  {
    id: 'm-img-channel', engineType: 'image',
    name: '全渠道触点形象', description: '美团/饿了么、大众点评、小红书/抖音品牌形象规范',
    deliverables: ALL_DELIVERABLES.filter((d: any) => d.moduleId === 'm-img-channel'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find((t: any) => t.id === 't-img-touchpoint')!],
  },
  {
    id: 'm-img-dining', engineType: 'image',
    name: '桌面临场体验', description: '餐具系统、餐巾纸、牙签筷套、台号牌点餐工具',
    deliverables: ALL_DELIVERABLES.filter((d: any) => d.moduleId === 'm-img-dining'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find((t: any) => t.id === 't-img-touchpoint')!],
  },
  {
    id: 'm-img-takeout', engineType: 'image',
    name: '外卖体验设计', description: '外卖手提袋、打包盒、开箱体验',
    deliverables: ALL_DELIVERABLES.filter((d: any) => d.moduleId === 'm-img-takeout'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find((t: any) => t.id === 't-img-touchpoint')!],
  },
  {
    id: 'm-img-staff', engineType: 'image',
    name: '员工形象与品牌行为', description: '员工身份标识、管理层/服务团队/后厨着装规范',
    deliverables: ALL_DELIVERABLES.filter((d: any) => d.moduleId === 'm-img-staff'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find((t: any) => t.id === 't-img-staff')!],
  },
  {
    id: 'm-img-derivative', engineType: 'image',
    name: '品牌衍生品开发', description: '品牌礼品、伴手礼体系、周边产品规划',
    deliverables: ALL_DELIVERABLES.filter((d: any) => d.moduleId === 'm-img-derivative'),
    roles: ['designer', 'strategist'],
    tools: [ALL_TOOLS.find((t: any) => t.id === 't-img-persona')!],
  },
  {
    id: 'm-img-entrance', engineType: 'image',
    name: '门头导视与入口体验', description: '门头视觉规范、亮化设计、入口仪式感、外部导视',
    deliverables: ALL_DELIVERABLES.filter((d: any) => d.moduleId === 'm-img-entrance'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find((t: any) => t.id === 't-img-staff')!],
  },
  {
    id: 'm-img-signage', engineType: 'image',
    name: '空间导视与温馨提示', description: '内部导视功能指引、温馨提示牌、导视系统手册',
    deliverables: ALL_DELIVERABLES.filter((d: any) => d.moduleId === 'm-img-signage'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find((t: any) => t.id === 't-img-staff')!],
  },

  // ===== 亮空间 =====
  {
    id: 'm-space-concept', engineType: 'space',
    name: '空间概念规划', description: '空间概念设计、品牌叙事融入',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-space-concept'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find(t => t.id === 't-space-design')!],
  },
  {
    id: 'm-space-plan', engineType: 'space',
    name: '空间平面设计', description: '平面布局、动线设计、功能分区',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-space-plan'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find(t => t.id === 't-space-design')!],
  },
  {
    id: 'm-space-render', engineType: 'space',
    name: '效果图设计', description: '门头造型效果图',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-space-render'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find(t => t.id === 't-space-design')!],
  },
  {
    id: 'm-space-construction', engineType: 'space',
    name: '施工图', description: '电气、水路、暖通、装修全套施工图',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-space-construction'),
    roles: ['designer'],
    tools: [ALL_TOOLS.find(t => t.id === 't-space-supervision')!],
  },
  {
    id: 'm-space-supervision', engineType: 'space',
    name: '设计落地监理', description: '施工质量监督与验收',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-space-supervision'),
    roles: ['designer', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-space-supervision')!],
  },

  // ===== 亮营销 =====
  {
    id: 'm-mkt-framework', engineType: 'marketing',
    name: '营销策略框架', description: '年度营销方向、核心战役框架',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-mkt-framework'),
    roles: ['strategist', 'consultant'],
    tools: [ALL_TOOLS.find(t => t.id === 't-mkt-plan')!],
  },
  {
    id: 'm-mkt-ogsm', engineType: 'marketing',
    name: 'OGSM营销落地', description: '目的、目标、策略、衡量指标',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-mkt-ogsm'),
    roles: ['strategist', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-mkt-plan')!],
  },
  {
    id: 'm-mkt-media', engineType: 'marketing',
    name: '新媒体传播方案', description: '新媒体矩阵规划与内容策略',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-mkt-media'),
    roles: ['strategist', 'consultant'],
    tools: [ALL_TOOLS.find(t => t.id === 't-mkt-plan')!],
  },
  {
    id: 'm-mkt-toolkit', engineType: 'marketing',
    name: '招商工具包', description: '招商手册、招商策略',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-mkt-toolkit'),
    roles: ['designer', 'strategist'],
    tools: [ALL_TOOLS.find(t => t.id === 't-mkt-growth')!],
  },
  {
    id: 'm-mkt-campaign', engineType: 'marketing',
    name: '战役执行报告', description: '关键战役执行总结与效果评估',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-mkt-campaign'),
    roles: ['consultant', 'strategist'],
    tools: [ALL_TOOLS.find(t => t.id === 't-mkt-growth')!],
  },
  {
    id: 'm-mkt-calendar', engineType: 'marketing',
    name: '年度营销日历', description: '全年营销活动规划与排期',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-mkt-calendar'),
    roles: ['strategist', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-mkt-plan')!],
  },

  // ===== 亮组织 =====
  {
    id: 'm-org-standard', engineType: 'organization',
    name: '运营标准手册', description: 'SOP流程规范、服务标准、品控清单',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-org-standard'),
    roles: ['consultant', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-org-standard')!],
  },
  {
    id: 'm-org-asset', engineType: 'organization',
    name: '品牌资产管理', description: '品牌资产盘点与管理制度',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-org-asset'),
    roles: ['strategist', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-org-standard')!],
  },
  {
    id: 'm-org-diagnosis', engineType: 'organization',
    name: '单店经营诊断', description: '单店经营数据分析与优化建议',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-org-diagnosis'),
    roles: ['consultant'],
    tools: [ALL_TOOLS.find(t => t.id === 't-org-asset')!],
  },
  {
    id: 'm-org-coach', engineType: 'organization',
    name: '教练培养体系', description: '内部教练培养方案与辅导机制',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-org-coach'),
    roles: ['consultant', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-org-asset')!],
  },
  {
    id: 'm-org-structure', engineType: 'organization',
    name: '组织优化', description: '组织架构优化、岗位职责、绩效体系',
    deliverables: ALL_DELIVERABLES.filter(d => d.moduleId === 'm-org-structure'),
    roles: ['consultant', 'pm'],
    tools: [ALL_TOOLS.find(t => t.id === 't-org-asset')!],
  },
];

// ========================
// 套餐对应的模块和交付物
// ========================

import { PackageType, PACKAGE_CONFIG as _PC } from './types';

// Re-export PACKAGE_CONFIG for convenience
export { PACKAGE_CONFIG } from './types';

export const PACKAGE_DELIVERABLES: Record<PackageType, string[]> = {
  set_sail: [
    'd-comp-eco', 'd-comp-bench', 'd-comp-trend',
    'd-strat-vision', 'd-strat-product',
    'd-mkt-framework',
  ],
  navigate: [
    'd-comp-eco', 'd-comp-bench', 'd-comp-trend', 'd-comp-monitor',
    'd-strat-vision', 'd-strat-product', 'd-strat-iterate', 'd-strat-annual',
    'd-img-identity', 'd-img-persona', 'd-img-channel', 'd-img-dining', 'd-img-takeout', 'd-img-staff', 'd-img-derivative', 'd-img-entrance', 'd-img-signage',
    'd-mkt-framework', 'd-mkt-media', 'd-mkt-toolkit', 'd-mkt-campaign', 'd-mkt-calendar',
    'd-org-standard', 'd-org-asset', 'd-org-diagnosis', 'd-org-coach',
    'd-strat-profit', 'd-org-structure',
  ],
  voyage: [
    'd-comp-eco', 'd-comp-bench', 'd-comp-trend', 'd-comp-diff', 'd-comp-monitor', 'd-comp-barrier',
    'd-strat-vision', 'd-strat-product', 'd-strat-position', 'd-strat-profit', 'd-strat-iterate', 'd-strat-annual',
    'd-img-identity', 'd-img-persona', 'd-img-product', 'd-img-channel', 'd-img-dining', 'd-img-takeout', 'd-img-staff', 'd-img-derivative', 'd-img-entrance', 'd-img-signage',
    'd-space-concept', 'd-space-plan', 'd-space-render', 'd-space-construction', 'd-space-supervision',
    'd-mkt-framework', 'd-mkt-ogsm', 'd-mkt-media', 'd-mkt-toolkit', 'd-mkt-campaign', 'd-mkt-calendar',
    'd-org-standard', 'd-org-asset', 'd-org-diagnosis', 'd-org-coach', 'd-org-structure',
  ],
};

// ========================
// 领航计划月度工作计划
// ========================

export const NAVIGATE_MONTHLY_PLAN = [
  {
    month: 1, phase: 'competition' as const, engineTypes: ['competition' as const],
    tasks: ['竞争生态与市场诊断', '创始人战略解码与企业深度诊断', '组织能力初评'],
    keyDeliverables: ['《竞争生态与品类趋势报告》', '《品牌健康度诊断报告》', '首次工程会共识记录'],
  },
  {
    month: 2, phase: 'strategy' as const, engineTypes: ['strategy' as const, 'image' as const],
    tasks: ['战略顶层设计', '品牌命名与核心口号创意', '品牌识别基础设计', '品牌内部导入培训'],
    keyDeliverables: ['《企业战略与品牌定位白皮书》', '《品牌识别基础手册》', '内部培训课件'],
  },
  {
    month: 3, phase: 'strategy' as const, engineTypes: ['strategy' as const, 'marketing' as const],
    tasks: ['产品战略', '营销策略框架'],
    keyDeliverables: ['《产品核心卖点体系》', '《营销策略框架》'],
  },
  {
    month: 4, phase: 'image' as const, engineTypes: ['competition' as const, 'image' as const, 'marketing' as const],
    tasks: ['品牌体验系统深化', '竞争策略细化', '新媒体传播方案'],
    keyDeliverables: ['《竞争策略与市场机会报告》', '《新媒体传播方案》', '《品牌体验系统手册》（部分）'],
  },
  {
    month: 5, phase: 'image' as const, engineTypes: ['strategy' as const, 'image' as const, 'marketing' as const, 'organization' as const],
    tasks: ['单店盈利模型开发', '招商传播工具', '组织架构优化建议'],
    keyDeliverables: ['《商业模式与盈利模型方案》', '《招商工具包》', '《组织优化建议书》'],
  },
  {
    month: 6, phase: 'delivery' as const, engineTypes: ['image' as const, 'marketing' as const, 'organization' as const],
    tasks: ['年度营销日历', '品牌资产管理体系', '运营标准手册', '外部顾问团评审'],
    keyDeliverables: ['《运营标准与品牌资产管理体系》', '《品牌体验系统手册》（完整版）', '《年度营销日历》'],
  },
  {
    month: 7, phase: 'marketing' as const, engineTypes: ['marketing' as const, 'organization' as const, 'competition' as const],
    tasks: ['传播战役执行支持', '组织培训逐层展开', '竞争动态监测（季度）', '单店经营辅导（首轮）'],
    keyDeliverables: ['《季度竞争动态监测》（Q3）', '《单店经营诊断报告》（首轮）', '《战役执行报告》'],
  },
  {
    month: 8, phase: 'organization' as const, engineTypes: ['organization' as const, 'competition' as const],
    tasks: ['持续经营辅导', '竞争动态监测更新'],
    keyDeliverables: ['经营辅导跟进记录'],
  },
  {
    month: 9, phase: 'organization' as const, engineTypes: ['organization' as const],
    tasks: ['教练培养启动', '组织能力评估'],
    keyDeliverables: ['教练培养初步方案'],
  },
  {
    month: 10, phase: 'organization' as const, engineTypes: ['image' as const, 'strategy' as const],
    tasks: ['品牌资产年度盘点', '第二曲线探索工作坊'],
    keyDeliverables: ['《品牌资产与衍生品白皮书》', '《战略迭代与第二曲线方案》'],
  },
  {
    month: 11, phase: 'organization' as const, engineTypes: ['organization' as const, 'strategy' as const],
    tasks: ['团队教练培养体系构建', '年度战略规划初稿'],
    keyDeliverables: ['《单店经营与教练培养体系》'],
  },
  {
    month: 12, phase: 'delivery' as const, engineTypes: ['strategy' as const],
    tasks: ['年度战略规划定稿', '成果汇总移交'],
    keyDeliverables: ['《年度战略规划书》', '全套领航交付包'],
  },
];

// ========================
// 引擎与阶段的映射
// ========================

export const ENGINE_PHASE_MAP: Record<EngineType, string> = {
  competition: 'competition',
  strategy: 'strategy',
  image: 'image',
  space: 'space',
  marketing: 'marketing',
  organization: 'organization',
};
