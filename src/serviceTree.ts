// ============================================================
// 亮品牌 · 服务数据模型（重构版）
// 层级结构：引擎(板块) → 父项 → 子项
// 每层都有说明、价格、工期
// ============================================================

export interface ServiceChild {
  id: string;
  name: string;
  annotation: string;    // 注解说明，如"明确问题所在，避免资源错配"
  price: number;          // 单价
  duration: number;       // 工期（天）
  isCustom?: boolean;     // 是否用户新增的
}

export interface ServiceParent {
  id: string;
  name: string;
  annotation: string;    // 父项注解
  engineType: string;     // 所属引擎
  children: ServiceChild[];
  defaultPrice: number;   // 默认总价（所有子项之和）
  defaultDuration: number;// 默认总工期
}

export interface ServiceEngine {
  id: string;              // engineType
  name: string;            // 如"亮竞争"
  icon: string;
  color: string;
  subtitle: string;        // 副标题，如"赢在哪儿？"
  annotation: string;      // 引擎详细说明
  slogan: string;          // 精炼标语，如"找准赛道，构建壁垒"
  note?: string;           // 补充说明（如增项服务提示）
  parents: ServiceParent[];
}

// ========================
// 完整服务树定义
// ========================

export const SERVICE_TREE: ServiceEngine[] = [
  // ==================== 亮竞争 ====================
  {
    id: 'competition', name: '亮竞争', icon: '🏆', color: '#faad14',
    subtitle: '赢在哪儿？',
    annotation: '帮助您回答"我在和谁竞争？如何赢得竞争？"——构建可持续的竞争优势，为战略决策提供基石。',
    slogan: '找准赛道，构建壁垒，洞察市场及消费者本质需求，明确品牌战略核心目标。',
    parents: [
      {
        id: 'comp-eco', name: '竞争生态分析', engineType: 'competition',
        annotation: '识别直接竞品、间接竞品、替代品，分析其定位、产品、价格、渠道、营销策略',
        defaultPrice: 18000, defaultDuration: 10,
        children: [
          { id: 'comp-eco-1', name: '直接竞品识别与分析', annotation: '锁定核心竞争对手，摸清竞争格局', price: 6000, duration: 3 },
          { id: 'comp-eco-2', name: '间接竞品与替代品分析', annotation: '发现潜在威胁，拓展竞争视野', price: 5000, duration: 3 },
          { id: 'comp-eco-3', name: '竞争生态圈层图绘制', annotation: '可视化竞争格局，明确竞争位势', price: 4000, duration: 2 },
          { id: 'comp-eco-4', name: '竞争机会点总结', annotation: '提炼可切入的市场机会', price: 3000, duration: 2 },
        ],
      },
      {
        id: 'comp-bench', name: '标杆品牌深度剖析', engineType: 'competition',
        annotation: '选取3-5个行业内外标杆品牌，深度解构其成功基因，提炼可借鉴经验',
        defaultPrice: 15000, defaultDuration: 8,
        children: [
          { id: 'comp-bench-1', name: '标杆品牌筛选与确定', annotation: '精准选对标，避免无效模仿', price: 3000, duration: 1 },
          { id: 'comp-bench-2', name: '标杆品牌战略意图拆解', annotation: '看透标杆的战略逻辑', price: 5000, duration: 3 },
          { id: 'comp-bench-3', name: '标杆品牌资源能力分析', annotation: '评估资源差距，找到追赶路径', price: 4000, duration: 2 },
          { id: 'comp-bench-4', name: '可借鉴经验提炼', annotation: '从标杆中提取可落地的经验', price: 3000, duration: 2 },
        ],
      },
      {
        id: 'comp-trend', name: '品类趋势研究', engineType: 'competition',
        annotation: '研究品类历史与未来趋势，结合宏观环境识别潜在机会窗口',
        defaultPrice: 12000, defaultDuration: 6,
        children: [
          { id: 'comp-trend-1', name: '品类演进史梳理', annotation: '理解品类从哪里来，看懂发展规律', price: 4000, duration: 2 },
          { id: 'comp-trend-2', name: '消费者趋势洞察', annotation: '把握消费需求变化方向', price: 4000, duration: 2 },
          { id: 'comp-trend-3', name: '机会窗口识别报告', annotation: '明确品类中的最佳切入时机', price: 4000, duration: 2 },
        ],
      },
      {
        id: 'comp-diff', name: '差异化定位', engineType: 'competition',
        annotation: '综合竞品分析和消费者需求，绘制市场空白点地图，提出差异化方向',
        defaultPrice: 10000, defaultDuration: 5,
        children: [
          { id: 'comp-diff-1', name: '市场空白点地图绘制', annotation: '可视化市场空白，发现蓝海', price: 5000, duration: 3 },
          { id: 'comp-diff-2', name: '差异化定位方向建议', annotation: '给出可落地的差异化策略方向', price: 5000, duration: 2 },
        ],
      },
    ],
  },

  // ==================== 亮战略 ====================
  {
    id: 'strategy', name: '亮战略', icon: '🧭', color: '#cf1322',
    subtitle: '去向何方？',
    annotation: '帮助您回答"我们是谁？要去哪里？"——定义企业使命、愿景与战略路径，统领一切行动。',
    slogan: '明确方向，顶层设计，品牌战略精准定位落地，创造一个消费者无法拒绝的消费理由。',
    parents: [
      {
        id: 'strat-vision', name: '创始人战略意图解码工作坊', engineType: 'strategy',
        annotation: '通过深度访谈和企业年谱工作坊形式，引导创始人明确长期愿景、战略目标及核心驱动力',
        defaultPrice: 25000, defaultDuration: 12,
        children: [
          { id: 'strat-vision-1', name: '创始人深度访谈', annotation: '挖掘创始人内心真实的战略意图', price: 8000, duration: 3 },
          { id: 'strat-vision-2', name: '企业年谱工作坊', annotation: '回顾发展历程，提炼核心能力', price: 8000, duration: 4 },
          { id: 'strat-vision-3', name: '企业愿景与使命定义', annotation: '明确企业的存在意义和终极目标', price: 5000, duration: 3 },
          { id: 'strat-vision-4', name: '核心价值观提炼', annotation: '形成指导一切决策的价值准则', price: 4000, duration: 2 },
        ],
      },
      {
        id: 'strat-diag', name: '商业机会诊断', engineType: 'strategy',
        annotation: '明确问题所在，避免资源错配',
        defaultPrice: 20000, defaultDuration: 10,
        children: [
          { id: 'strat-diag-1', name: '品牌心智份额量化审计', annotation: '量化品牌在目标客群中的认知度、美誉度、忠诚度', price: 8000, duration: 4 },
          { id: 'strat-diag-2', name: '产品力与供应链竞争力评估', annotation: '评估产品品质、创新能力、供应链效率', price: 7000, duration: 3 },
          { id: 'strat-diag-3', name: '品牌健康度诊断报告', annotation: '全面诊断品牌当前健康状态', price: 5000, duration: 3 },
        ],
      },
      {
        id: 'strat-position', name: '品牌战略定位', engineType: 'strategy',
        annotation: '以品牌目标为核心发展动力，构建品牌定位（核心价值），创建品牌价值系统',
        defaultPrice: 22000, defaultDuration: 10,
        children: [
          { id: 'strat-pos-1', name: '品牌定位陈述提炼', annotation: '一句话说清品牌是谁、为谁、做什么', price: 8000, duration: 3 },
          { id: 'strat-pos-2', name: '品牌定位九宫格', annotation: '多维度拆解品牌定位，确保精准', price: 6000, duration: 3 },
          { id: 'strat-pos-3', name: '品牌核心价值系统构建', annotation: '建立品牌价值金字塔', price: 5000, duration: 2 },
          { id: 'strat-pos-4', name: '品牌口号创意', annotation: '创造深入人心的品牌口号', price: 3000, duration: 2 },
        ],
      },
      {
        id: 'strat-product', name: '产品战略', engineType: 'strategy',
        annotation: '以品牌产品与文化为架构，推动品牌与用户之间的交互体验',
        defaultPrice: 18000, defaultDuration: 8,
        children: [
          { id: 'strat-prod-1', name: '产品结构规划', annotation: '明确产品矩阵和角色分工', price: 6000, duration: 3 },
          { id: 'strat-prod-2', name: '产品核心卖点体系', annotation: '提炼每个产品的独特卖点', price: 7000, duration: 3 },
          { id: 'strat-prod-3', name: '产品哲学构建', annotation: '赋予产品文化内涵和品牌意义', price: 5000, duration: 2 },
        ],
      },
      {
        id: 'strat-profit', name: '盈利模型', engineType: 'strategy',
        annotation: '构建可持续的商业模式与盈利模型，确保品牌健康发展',
        defaultPrice: 20000, defaultDuration: 10,
        children: [
          { id: 'strat-profit-1', name: '商业模式画布', annotation: '系统性梳理商业模式的九大要素', price: 8000, duration: 3 },
          { id: 'strat-profit-2', name: '单店损益模型', annotation: '精准计算门店盈亏平衡点', price: 8000, duration: 4 },
          { id: 'strat-profit-3', name: '招商模式设计', annotation: '设计可复制的扩张模式', price: 4000, duration: 3 },
        ],
      },
    ],
  },

  // ==================== 亮形象 ====================
  {
    id: 'image', name: '亮形象', icon: '🎭', color: '#eb2f96',
    subtitle: '凭什么爱？',
    annotation: '帮助您回答"如何让消费者爱上我们？"——将战略转化为可感知的品牌体验，创造情感连接。',
    slogan: '打造峰值，情感共鸣，让形象能自己说话，让消费者感觉到："哇哦，我好喜欢！"',
    parents: [
      {
        id: 'img-identity', name: '品牌识别系统', engineType: 'image',
        annotation: '建立品牌视觉基础系统，确保品牌在所有触点上具有高度辨识度和视觉一致性',
        defaultPrice: 48000, defaultDuration: 25,
        children: [
          { id: 'img-id-1', name: '超级符号与视觉锤设计', annotation: '创作具有高辨识度和记忆点的品牌标志，确保符合定位', price: 15000, duration: 8 },
          { id: 'img-id-2', name: '品牌色彩心理学应用系统', annotation: '定义主色、辅助色及其应用规范，确保色彩传递正确的情感联想', price: 8000, duration: 4 },
          { id: 'img-id-3', name: '专属字体与组合规范', annotation: '选择或设计专用字体，规定品牌名称、口号与标志的组合方式', price: 6000, duration: 3 },
          { id: 'img-id-4', name: '品牌辅助图形与纹理系统', annotation: '开发辅助图形、纹理，丰富品牌视觉层次，增强识别性', price: 8000, duration: 4 },
          { id: 'img-id-5', name: '品牌主视觉与KV体系', annotation: '设计品牌主视觉画面，并制定在不同媒介上的延展规范', price: 6000, duration: 3 },
          { id: 'img-id-6', name: '品牌识别基础手册', annotation: '完整的品牌视觉规范文档', price: 5000, duration: 3 },
        ],
      },
      {
        id: 'img-persona', name: '品牌人格化塑造', engineType: 'image',
        annotation: '赋予品牌独特的人格魅力，让品牌成为有温度、有故事、有性格的"人"',
        defaultPrice: 22000, defaultDuration: 12,
        children: [
          { id: 'img-prs-1', name: '品牌IP形象原型开发', annotation: '创意设计品牌IP形象（吉祥物），赋予其性格、故事', price: 10000, duration: 5 },
          { id: 'img-prs-2', name: '品牌人格化表情与动作库', annotation: '开发IP的多种表情、动作，用于社交媒体和场景互动', price: 7000, duration: 4 },
          { id: 'img-prs-3', name: '品牌调性与沟通语气规范', annotation: '定义品牌在文案、客服、社交媒体中的沟通语气（如亲切、幽默）', price: 5000, duration: 3 },
        ],
      },
      {
        id: 'img-product', name: '产品道具设计', engineType: 'image',
        annotation: '为招牌菜设计专属道具与呈现方式，提升菜品价值感和传播性',
        defaultPrice: 25000, defaultDuration: 15,
        children: [
          { id: 'img-pdt-1', name: '招牌菜品专属器皿设计', annotation: '为招牌菜设计专属餐具，提升菜品价值感和传播性', price: 10000, duration: 5 },
          { id: 'img-pdt-2', name: '器皿结构与工艺实现', annotation: '与供应商沟通，确保器皿可量产，材质、工艺符合要求', price: 8000, duration: 5 },
          { id: 'img-pdt-3', name: '产品呈现仪式感设计', annotation: '设计菜品上桌时的呈现方式、服务话术，创造仪式感', price: 7000, duration: 5 },
        ],
      },
      {
        id: 'img-channel', name: '全渠道触点形象', engineType: 'image',
        annotation: '规范品牌在各数字渠道上的视觉呈现，建立统一且专业的品牌线上形象',
        defaultPrice: 18000, defaultDuration: 10,
        children: [
          { id: 'img-ch-1', name: '美团/饿了么品牌形象规范', annotation: '规范外卖平台上的店铺头像、banner、菜品图风格', price: 6000, duration: 4 },
          { id: 'img-ch-2', name: '大众点评品牌形象规范', annotation: '规范点评页面视觉，包括头图、商家相册风格', price: 6000, duration: 3 },
          { id: 'img-ch-3', name: '小红书/抖音品牌形象规范', annotation: '规范社交媒体内容视觉风格，建立统一的品牌形象', price: 6000, duration: 3 },
        ],
      },
      {
        id: 'img-dining', name: '桌面临场体验', engineType: 'image',
        annotation: '设计桌面每一处细节，让顾客在用餐过程中持续感受品牌调性',
        defaultPrice: 22000, defaultDuration: 14,
        children: [
          { id: 'img-dn-1', name: '餐具系统设计与选型', annotation: '设计或选型基础餐具，确保风格统一', price: 6000, duration: 3 },
          { id: 'img-dn-2', name: '定制化餐巾纸设计', annotation: '设计印有品牌元素的餐巾纸', price: 3000, duration: 2 },
          { id: 'img-dn-3', name: '牙签/筷套等细节体验设计', annotation: '设计牙签套、筷套等小物，体现品牌用心', price: 4000, duration: 3 },
          { id: 'img-dn-4', name: '湿纸巾包装设计', annotation: '设计湿巾包装，可融入品牌信息', price: 3000, duration: 2 },
          { id: 'img-dn-5', name: '台号牌与点餐工具设计', annotation: '设计台号牌、菜单、点餐卡等桌面物料', price: 6000, duration: 4 },
        ],
      },
      {
        id: 'img-takeout', name: '外卖体验设计', engineType: 'image',
        annotation: '打造完整的外卖开箱体验，让消费者即使不进店也能感受到品牌的温度',
        defaultPrice: 20000, defaultDuration: 12,
        children: [
          { id: 'img-to-1', name: '外卖包装手提袋设计', annotation: '设计外卖手提袋，兼顾美观与实用性', price: 7000, duration: 4 },
          { id: 'img-to-2', name: '打包盒结构与视觉设计', annotation: '设计打包盒外观及结构，可考虑品牌色和符号', price: 8000, duration: 4 },
          { id: 'img-to-3', name: '外卖开箱体验设计', annotation: '设计外卖包装内部的卡片、封口贴等，创造开箱惊喜', price: 5000, duration: 4 },
        ],
      },
      {
        id: 'img-staff', name: '员工形象与品牌行为', engineType: 'image',
        annotation: '统一员工形象与行为规范，让每一位员工都成为品牌最好的代言人',
        defaultPrice: 15000, defaultDuration: 8,
        children: [
          { id: 'img-st-1', name: '员工身份标识系统设计', annotation: '设计工牌、胸针、姓名牌等', price: 4000, duration: 2 },
          { id: 'img-st-2', name: '管理层形象与着装规范', annotation: '设计管理层着装建议', price: 4000, duration: 2 },
          { id: 'img-st-3', name: '服务团队形象与着装规范', annotation: '设计服务员着装，体现品牌调性', price: 4000, duration: 2 },
          { id: 'img-st-4', name: '后厨团队形象与着装规范', annotation: '设计厨师服，可融入品牌元素', price: 3000, duration: 2 },
        ],
      },
      {
        id: 'img-derivative', name: '品牌衍生品开发', engineType: 'image',
        annotation: '开发品牌周边产品与礼品体系，延伸品牌影响力，增加品牌收入来源',
        defaultPrice: 18000, defaultDuration: 10,
        children: [
          { id: 'img-dv-1', name: '品牌礼品系统设计', annotation: '设计可用于活动的品牌礼品', price: 6000, duration: 3 },
          { id: 'img-dv-2', name: '品牌伴手礼体系开发', annotation: '设计伴手礼包装及组合，用于赠送给重要客人', price: 7000, duration: 4 },
          { id: 'img-dv-3', name: '品牌周边产品规划', annotation: '规划周边产品线，用于品牌延伸', price: 5000, duration: 3 },
        ],
      },
      {
        id: 'img-entrance', name: '门头导视与入口体验', engineType: 'image',
        annotation: '设计门头视觉与空间导视系统，让品牌在店外就开始吸引顾客',
        defaultPrice: 25000, defaultDuration: 15,
        children: [
          { id: 'img-en-1', name: '门头信息层级与视觉规范', annotation: '设计门头上的品牌名、品类、口号等信息层级和视觉呈现（不含造型）', price: 8000, duration: 4 },
          { id: 'img-en-2', name: '门头亮化与夜间吸引力设计', annotation: '设计门头灯光方案，确保夜间同样醒目', price: 7000, duration: 4 },
          { id: 'img-en-3', name: '入口仪式感与迎宾体验设计', annotation: '设计入口区域的迎宾装置、排队区体验等', price: 6000, duration: 4 },
          { id: 'img-en-4', name: '外部导视与引流系统', annotation: '设计从街道到店门口的引导标识', price: 4000, duration: 3 },
        ],
      },
      {
        id: 'img-signage', name: '空间导视与温馨提示', engineType: 'image',
        annotation: '设计店内导视系统和温馨提示，提升空间体验的品质感和品牌温度',
        defaultPrice: 15000, defaultDuration: 8,
        children: [
          { id: 'img-sg-1', name: '内部导视与功能指引', annotation: '设计店内洗手间、包间、收银台等功能区指引', price: 6000, duration: 3 },
          { id: 'img-sg-2', name: '空间温馨提示与服务沟通', annotation: '设计"小心台阶""wifi密码"等温馨提示牌', price: 4000, duration: 2 },
          { id: 'img-sg-3', name: '导视系统手册', annotation: '完整的导视系统使用文档', price: 5000, duration: 3 },
        ],
      },
    ],
  },

  // ==================== 亮空间 ====================
  {
    id: 'space', name: '亮空间', icon: '🏗️', color: '#52c41a',
    subtitle: '身在何处？',
    annotation: '帮助您回答"如何让顾客沉浸于品牌场景？"——将品牌战略转化为可感知的空间体验，创造沉浸式场景叙事。',
    slogan: '营造场景叙事，沉浸体验，让用户在场景世界里沉浸体验品牌与文化的交互。',
    note: '亮空间板块为增项服务模块，按实际场地面积及费用进行核定',
    parents: [
      {
        id: 'space-concept', name: '空间概念规划', engineType: 'space',
        annotation: '将品牌战略转化为空间叙事，让空间承载品牌故事',
        defaultPrice: 30000, defaultDuration: 15,
        children: [
          { id: 'sp-con-1', name: '品牌空间叙事脚本', annotation: '用故事串联空间体验动线', price: 8000, duration: 4 },
          { id: 'sp-con-2', name: '空间概念方案', annotation: '确定空间的整体风格和概念', price: 12000, duration: 5 },
          { id: 'sp-con-3', name: '空间功能分区规划', annotation: '合理划分各功能区', price: 5000, duration: 3 },
          { id: 'sp-con-4', name: '动线设计', annotation: '设计最优的客户体验动线', price: 5000, duration: 3 },
        ],
      },
      {
        id: 'space-design', name: '空间平面设计', engineType: 'space',
        annotation: '将概念转化为可落地的平面方案',
        defaultPrice: 25000, defaultDuration: 12,
        children: [
          { id: 'sp-des-1', name: '空间平面方案', annotation: '精确的平面布局设计', price: 12000, duration: 5 },
          { id: 'sp-des-2', name: '门头造型效果图', annotation: '品牌第一印象的门面设计', price: 8000, duration: 4 },
          { id: 'sp-des-3', name: '关键空间效果图', annotation: '大厅、包间等核心区域效果图', price: 5000, duration: 3 },
        ],
      },
      {
        id: 'space-build', name: '施工图与落地', engineType: 'space',
        annotation: '确保设计方案完美落地，施工质量可控',
        defaultPrice: 35000, defaultDuration: 20,
        children: [
          { id: 'sp-bld-1', name: '全套施工图文件', annotation: '电气、水路、暖通、装修全套施工图', price: 20000, duration: 8 },
          { id: 'sp-bld-2', name: '施工交底', annotation: '与施工方进行设计交底', price: 5000, duration: 2 },
          { id: 'sp-bld-3', name: '设计落地监理', annotation: '施工过程中的设计监理', price: 10000, duration: 10 },
        ],
      },
    ],
  },

  // ==================== 亮营销 ====================
  {
    id: 'marketing', name: '亮营销', icon: '📢', color: '#722ed1',
    subtitle: '如何增长？',
    annotation: '帮助您回答"如何让更多人知道并选择我们？"构建整合营销传播体系，持续驱动客流与复购。',
    slogan: '引爆市场，持续获客，让品牌营销从"短期促销"走向"长期资产积累"。',
    parents: [
      {
        id: 'mkt-strategy', name: '营销策略框架', engineType: 'marketing',
        annotation: '制定年度营销方向与核心战役框架，确保营销投入精准高效',
        defaultPrice: 20000, defaultDuration: 10,
        children: [
          { id: 'mkt-str-1', name: '年度营销方向规划', annotation: '明确全年营销的主线和重点', price: 8000, duration: 4 },
          { id: 'mkt-str-2', name: '核心战役框架设计', annotation: '规划年度关键营销战役', price: 7000, duration: 3 },
          { id: 'mkt-str-3', name: '媒体投放策略', annotation: '精准选择投放渠道和时机', price: 5000, duration: 3 },
        ],
      },
      {
        id: 'mkt-ogsm', name: 'OGSM营销落地', engineType: 'marketing',
        annotation: '将营销策略转化为可执行、可衡量的落地计划',
        defaultPrice: 15000, defaultDuration: 8,
        children: [
          { id: 'mkt-ogsm-1', name: '营销目的(O)与目标(G)设定', annotation: '明确营销要达成什么、衡量标准是什么', price: 5000, duration: 2 },
          { id: 'mkt-ogsm-2', name: '营销策略(S)制定', annotation: '制定达成目标的关键策略', price: 5000, duration: 3 },
          { id: 'mkt-ogsm-3', name: '衡量指标(M)体系', annotation: '建立营销效果的可量化指标', price: 5000, duration: 3 },
        ],
      },
      {
        id: 'mkt-content', name: '新媒体传播方案', engineType: 'marketing',
        annotation: '构建新媒体矩阵，制定内容策略与投放计划',
        defaultPrice: 18000, defaultDuration: 10,
        children: [
          { id: 'mkt-ct-1', name: '新媒体矩阵规划', annotation: '选择适合品牌的平台组合', price: 5000, duration: 2 },
          { id: 'mkt-ct-2', name: '内容策略制定', annotation: '规划内容方向和发布节奏', price: 7000, duration: 4 },
          { id: 'mkt-ct-3', name: '投放计划与预算分配', annotation: '优化投放效果，控制投放成本', price: 6000, duration: 4 },
        ],
      },
      {
        id: 'mkt-toolkit', name: '招商工具包', engineType: 'marketing',
        annotation: '为品牌扩张提供完整的招商工具支持',
        defaultPrice: 25000, defaultDuration: 12,
        children: [
          { id: 'mkt-tk-1', name: '招商手册设计', annotation: '专业招商物料，提升招商转化', price: 10000, duration: 4 },
          { id: 'mkt-tk-2', name: '招商策略制定', annotation: '制定精准的招商策略和话术', price: 8000, duration: 4 },
          { id: 'mkt-tk-3', name: '招商传播工具', annotation: 'H5、短视频等招商传播素材', price: 7000, duration: 4 },
        ],
      },
      {
        id: 'mkt-calendar', name: '年度营销日历', engineType: 'marketing',
        annotation: '全年营销活动规划与节点排期，确保营销节奏有序',
        defaultPrice: 10000, defaultDuration: 5,
        children: [
          { id: 'mkt-cal-1', name: '营销节点规划', annotation: '识别全年关键营销节点', price: 4000, duration: 2 },
          { id: 'mkt-cal-2', name: '活动排期与资源分配', annotation: '合理安排活动节奏和资源', price: 3000, duration: 2 },
          { id: 'mkt-cal-3', name: '年度营销日历文档', annotation: '形成可执行的年度营销日历', price: 3000, duration: 1 },
        ],
      },
    ],
  },

  // ==================== 亮组织 ====================
  {
    id: 'organization', name: '亮组织', icon: '👥', color: '#13c2c2',
    subtitle: '怎样持续？',
    annotation: '帮助您回答"如何让品牌能力内化为组织资产？"——构建内部能力与运营体系，保障战略落地与持续增值。',
    slogan: '内化能力，组织进化，执行到实处，实施恰到好处，项目有执行就能步步为赢。',
    parents: [
      {
        id: 'org-standard', name: '运营标准体系', engineType: 'organization',
        annotation: '建立标准化的运营流程，确保服务品质的一致性和可复制性',
        defaultPrice: 25000, defaultDuration: 15,
        children: [
          { id: 'org-std-1', name: '门店运营SOP制定', annotation: '标准化每日运营流程', price: 10000, duration: 5 },
          { id: 'org-std-2', name: '服务标准体系', annotation: '定义服务行为的最高标准', price: 8000, duration: 5 },
          { id: 'org-std-3', name: '品控检查清单', annotation: '建立可执行的品质控制机制', price: 7000, duration: 5 },
        ],
      },
      {
        id: 'org-asset', name: '品牌资产管理', engineType: 'organization',
        annotation: '系统化管理品牌资产，为品牌长期发展和资本化奠定基础',
        defaultPrice: 18000, defaultDuration: 8,
        children: [
          { id: 'org-ast-1', name: '品牌资产盘点', annotation: '全面梳理现有品牌资产', price: 8000, duration: 3 },
          { id: 'org-ast-2', name: '品牌资产管理制度', annotation: '建立品牌资产的使用和保护规范', price: 5000, duration: 3 },
          { id: 'org-ast-3', name: '品牌资产白皮书', annotation: '形成品牌资产的完整文档', price: 5000, duration: 2 },
        ],
      },
      {
        id: 'org-diag', name: '单店经营诊断', engineType: 'organization',
        annotation: '深度诊断门店经营状况，找出提升空间',
        defaultPrice: 15000, defaultDuration: 8,
        children: [
          { id: 'org-dia-1', name: '经营数据分析', annotation: '用数据说话，发现经营真相', price: 6000, duration: 3 },
          { id: 'org-dia-2', name: '现场诊断与访谈', annotation: '深入门店一线，发现真实问题', price: 5000, duration: 3 },
          { id: 'org-dia-3', name: '优化建议方案', annotation: '给出可落地的提升方案', price: 4000, duration: 2 },
        ],
      },
      {
        id: 'org-coach', name: '教练培养体系', engineType: 'organization',
        annotation: '构建内部教练体系，实现组织自我进化的能力',
        defaultPrice: 20000, defaultDuration: 12,
        children: [
          { id: 'org-coa-1', name: '内部教练培养方案', annotation: '培养企业内部的品牌教练', price: 8000, duration: 4 },
          { id: 'org-coa-2', name: '单店经营辅导机制', annotation: '建立持续的经营辅导体系', price: 7000, duration: 4 },
          { id: 'org-coa-3', name: '组织能力评估', annotation: '评估组织当前能力和成长空间', price: 5000, duration: 4 },
        ],
      },
    ],
  },
];

// ========================
// 套餐预设（哪些父项默认选中）
// ========================

export interface PackagePreset {
  id: string;
  name: string;
  months: number;
  basePrice: number;
  description: string;
  descriptionDetail: string;  // 详细说明
  selectedParentIds: string[]; // 默认选中的父项ID
  includedEngineIds: string[]; // 包含的引擎
}

export const PACKAGE_PRESETS: PackagePreset[] = [
  {
    id: 'navigate',
    name: '领航计划 · 卓越进阶',
    months: 6,
    basePrice: 368000,
    description: '6个月系统升级，从1到10的战略深化（不含亮空间服务模块）',
    descriptionDetail: '在6个月内，完成战略深化、品牌系统构建、竞争策略细化、增长引擎启动和组织优化。帮助企业从单点突破走向系统化运营，建立可复制的品牌资产和运营标准。',
    selectedParentIds: [
      'comp-eco', 'comp-bench', 'comp-trend',
      'strat-vision', 'strat-diag', 'strat-position', 'strat-product', 'strat-profit',
      'img-identity', 'img-persona', 'img-channel', 'img-dining', 'img-takeout', 'img-staff', 'img-derivative', 'img-entrance', 'img-signage',
      'mkt-strategy', 'mkt-content', 'mkt-toolkit', 'mkt-calendar',
      'org-standard', 'org-asset', 'org-diag', 'org-coach',
    ],
    includedEngineIds: ['competition', 'strategy', 'image', 'marketing', 'organization'],
  },
  {
    id: 'voyage',
    name: '远航计划 · 突破未来',
    months: 12,
    basePrice: 598000,
    description: '12个月全程护航，战略迭代、持续增长的第二曲线（不含亮空间服务模块）',
    descriptionDetail: '在12个月内，陪伴企业实现战略迭代、竞争壁垒构建、品牌资产化、增长引擎持续运转和组织赋能。通过深度服务，帮助企业构建持续进化的能力，实现从优秀到卓越的跨越。',
    selectedParentIds: [
      'comp-eco', 'comp-bench', 'comp-trend', 'comp-diff',
      'strat-vision', 'strat-diag', 'strat-position', 'strat-product', 'strat-profit',
      'img-identity', 'img-persona', 'img-product', 'img-channel', 'img-dining', 'img-takeout', 'img-staff', 'img-derivative', 'img-entrance', 'img-signage',
      'space-concept', 'space-design', 'space-build',
      'mkt-strategy', 'mkt-ogsm', 'mkt-content', 'mkt-toolkit', 'mkt-calendar',
      'org-standard', 'org-asset', 'org-diag', 'org-coach',
    ],
    includedEngineIds: ['competition', 'strategy', 'image', 'space', 'marketing', 'organization'],
  },
];

// ========================
// 辅助函数
// ========================

/** 获取所有父项的扁平列表 */
export function getAllParents(): ServiceParent[] {
  return SERVICE_TREE.flatMap(e => e.parents);
}

/** 获取某个父项下的所有子项 */
export function getChildrenOfParent(parentId: string): ServiceChild[] {
  const parent = getAllParents().find(p => p.id === parentId);
  return parent?.children || [];
}

/** 计算一组子项的总价和总工期 */
export function calcChildrenTotal(children: ServiceChild[]): { price: number; duration: number; count: number } {
  return {
    price: children.reduce((s, c) => s + c.price, 0),
    duration: children.reduce((s, c) => s + c.duration, 0),
    count: children.length,
  };
}
