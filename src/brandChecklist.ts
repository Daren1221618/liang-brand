// ============================================================
// 亮品牌 · 品牌自检默认模板
// 基于《品牌现状自检表》优化，适配六大引擎服务体系
// ============================================================

export interface ChecklistSection {
  id: string;
  title: string;
  description: string;
  fields: ChecklistField[];
}

export interface ChecklistField {
  id: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date';
  options?: string[];
  /** 该字段与哪些引擎/交付物关联（用于AI生成参考） */
  relatedTo?: string[];
  /** 填写引导提示 */
  guide?: string;
}

/** 品牌自检数据（扁平key-value存储） */
export type ChecklistData = Record<string, string>;

/** 默认模板 */
export const CHECKLIST_TEMPLATE: ChecklistSection[] = [
  {
    id: 'basic',
    title: '一、企业基础信息',
    description: '品牌/企业的基本画像，为竞争分析和战略定位提供基础输入',
    fields: [
      {
        id: 'brand_name', label: '品牌/公司名称', type: 'text',
        placeholder: '如：蜀味轩餐饮管理有限公司',
        relatedTo: ['competition', 'strategy'],
        guide: '填写品牌在工商注册的全称及对外使用的品牌简称',
      },
      {
        id: 'brand_stage', label: '品牌发展阶段', type: 'select',
        options: ['初创期（0-1年）', '成长期（1-3年）', '扩张期（3-5年）', '成熟期（5年以上）', '转型期'],
        relatedTo: ['strategy', 'organization'],
        guide: '判断品牌所处生命周期，影响策略方向',
      },
      {
        id: 'found_date', label: '成立时间', type: 'text',
        placeholder: '如：2019年3月',
        relatedTo: ['competition'],
      },
      {
        id: 'founder_bg', label: '创始人背景', type: 'textarea',
        placeholder: '创始人之前从事什么行业？有什么特殊经历或资源？',
        relatedTo: ['strategy'],
        guide: '创始人的行业认知、人脉资源和创业动机是品牌战略的重要参考',
      },
      {
        id: 'team_size', label: '全职团队人数', type: 'number',
        placeholder: '如：35',
        relatedTo: ['organization'],
      },
      {
        id: 'revenue_range', label: '年营收范围', type: 'select',
        options: ['50万以内', '50-200万', '200-500万', '500-1000万', '1000-3000万', '3000万以上'],
        relatedTo: ['strategy'],
      },
      {
        id: 'store_count', label: '门店/网点数量', type: 'number',
        placeholder: '如：12（如有多店请填写总数）',
        relatedTo: ['space', 'organization'],
      },
      {
        id: 'location_city', label: '所在城市', type: 'text',
        placeholder: '如：济南',
        relatedTo: ['marketing'],
      },
    ],
  },
  {
    id: 'product',
    title: '二、产品与业务',
    description: '核心产品/服务的基本信息，是品牌战略定位和产品卖点体系的输入',
    fields: [
      {
        id: 'product_summary', label: '一句话描述你卖什么', type: 'textarea',
        placeholder: '如：正宗四川火锅，主打鲜毛肚和手工锅底，面向家庭聚餐场景',
        relatedTo: ['strategy', 'competition'],
        guide: '尝试用"品类+核心特色+目标场景"的格式描述',
      },
      {
        id: 'product_price_range', label: '核心产品单价范围', type: 'text',
        placeholder: '如：客单价 80-120 元',
        relatedTo: ['strategy', 'competition'],
      },
      {
        id: 'product_advantages', label: '相比竞争对手的核心优势', type: 'multiselect',
        options: ['产品品质/口感', '食材/原料优势', '设计颜值', '价格更低', '服务体验', '创始人故事', '品牌历史', '技术/工艺', '供应链优势', '说不清楚'],
        relatedTo: ['competition', 'strategy'],
        guide: '可选多项，影响差异化定位方向',
      },
      {
        id: 'product_bestseller', label: '招牌/明星产品', type: 'textarea',
        placeholder: '如：鲜毛肚、手工牛油锅底、现炸酥肉',
        relatedTo: ['image', 'strategy'],
        guide: '列出3-5个最能代表品牌的产品，后续将用于产品道具设计',
      },
      {
        id: 'customer_rejection', label: '客户不购买的主要原因', type: 'multiselect',
        options: ['觉得贵', '看不懂好在哪', '担心售后', '已有固定选择', '犹豫不决', '位置不方便', '不了解品牌', '其他'],
        relatedTo: ['competition', 'marketing'],
      },
      {
        id: 'supply_chain', label: '供应链/合作伙伴情况', type: 'textarea',
        placeholder: '如：核心食材来自四川原产地，与XX供应商合作3年',
        relatedTo: ['organization'],
      },
    ],
  },
  {
    id: 'customer',
    title: '三、客户与市场',
    description: '目标客群画像与市场表现，是竞争分析和营销策略的关键输入',
    fields: [
      {
        id: 'target_customer', label: '理想中的核心客户画像', type: 'textarea',
        placeholder: '年龄、性别、职业、消费习惯、消费能力、生活方式…',
        relatedTo: ['strategy', 'marketing'],
        guide: '越具体越好，如"25-35岁年轻白领，注重生活品质，周末喜欢和朋友聚餐"',
      },
      {
        id: 'customer_channel', label: '客户来源渠道', type: 'multiselect',
        options: ['朋友介绍/口碑', '小红书/抖音', '美团/大众点评', '线下门店自然客流', '展会/活动', '微信公众号/视频号', '百度搜索', '传单/户外广告', '其他'],
        relatedTo: ['marketing'],
      },
      {
        id: 'customer_loyalty', label: '客户复购情况', type: 'select',
        options: ['很少复购', '有一些复购', '复购率较高', '高复购+转介绍'],
        relatedTo: ['organization', 'marketing'],
      },
      {
        id: 'market_pain', label: '最头疼的市场问题', type: 'select',
        options: ['没名气，没人知道', '有人问，但不下单', '下单后留不住', '价格战，利润薄', '扩张困难', '招人难留人难', '其他'],
        relatedTo: ['competition', 'marketing', 'organization'],
        guide: '选择当前最迫切的问题，将作为后续服务的优先方向',
      },
      {
        id: 'market_region', label: '当前市场覆盖范围', type: 'text',
        placeholder: '如：济南市，计划拓展至山东省内',
        relatedTo: ['strategy', 'marketing'],
      },
      {
        id: 'competitor_awareness', label: '已知的直接竞争对手', type: 'textarea',
        placeholder: '如：小龙坎、蜀大侠（同品类竞品）',
        relatedTo: ['competition'],
        guide: '列出您认为的主要竞争对手名称，越详细越好',
      },
    ],
  },
  {
    id: 'brand',
    title: '四、品牌现状',
    description: '品牌资产现状盘点，是亮形象和品牌识别系统的输入',
    fields: [
      {
        id: 'brand_materials', label: '现有品牌物料', type: 'multiselect',
        options: ['Logo', '名片', '包装', '微信公众号/视频号', '小红书账号', '抖音账号', '产品手册/折页', '门店招牌', '员工工服', '外卖包装', '几乎都没有'],
        relatedTo: ['image'],
        guide: '勾选目前已有的品牌物料，作为品牌升级的起点',
      },
      {
        id: 'brand_keywords', label: '希望客户用哪三个词形容品牌', type: 'text',
        placeholder: '如：正宗、热情、有仪式感',
        relatedTo: ['strategy', 'image'],
        guide: '这三个词将直接影响品牌调性和视觉设计方向',
      },
      {
        id: 'brand_slogan', label: '现有品牌口号（slogan）', type: 'text',
        placeholder: '如：没有请填"无"',
        relatedTo: ['strategy', 'image'],
      },
      {
        id: 'brand_story', label: '品牌故事/创始故事', type: 'textarea',
        placeholder: '品牌是如何诞生的？有什么打动人心的故事？',
        relatedTo: ['strategy', 'image', 'marketing'],
        guide: '好的品牌故事是营销传播的核心素材，可以适当感性描述',
      },
      {
        id: 'brand_vision', label: '创始人对品牌的愿景', type: 'textarea',
        placeholder: '3-5年后，您希望品牌成为什么样？',
        relatedTo: ['strategy'],
        guide: '这是战略顶层设计的重要参考，请尽可能真实表达',
      },
      {
        id: 'brand_budget', label: '过去一年品牌推广费用', type: 'text',
        placeholder: '如：约5万元',
        relatedTo: ['marketing'],
      },
      {
        id: 'brand_culture', label: '企业文化/价值观', type: 'textarea',
        placeholder: '团队认同的核心价值观是什么？',
        relatedTo: ['organization', 'strategy'],
      },
    ],
  },
  {
    id: 'space',
    title: '五、空间与体验',
    description: '门店空间现状，是亮空间引擎的关键输入',
    fields: [
      {
        id: 'store_area', label: '门店面积', type: 'text',
        placeholder: '如：200平米（有多店请分别说明）',
        relatedTo: ['space'],
      },
      {
        id: 'store_style', label: '当前门店装修风格', type: 'text',
        placeholder: '如：现代简约偏中式，以原木色和暖黄色为主调',
        relatedTo: ['space', 'image'],
      },
      {
        id: 'store_location', label: '门店位置特点', type: 'textarea',
        placeholder: '如：商场B1层、街边店、社区底商…周边环境如何？',
        relatedTo: ['space', 'marketing'],
      },
      {
        id: 'store_dining_experience', label: '当前店内体验描述', type: 'textarea',
        placeholder: '如：入座后服务员会主动介绍招牌菜，餐具统一但较普通',
        relatedTo: ['image', 'organization'],
        guide: '从顾客到店→入座→点餐→用餐→离店的全流程体验',
      },
      {
        id: 'delivery_experience', label: '外卖/线上服务体验现状', type: 'textarea',
        placeholder: '如：有美团和饿了么，外卖包装用通用纸袋',
        relatedTo: ['image', 'marketing'],
      },
    ],
  },
  {
    id: 'expectation',
    title: '六、合作期待与目标',
    description: '明确客户的核心诉求和期望，为服务定制提供方向',
    fields: [
      {
        id: 'top_problems', label: '最想解决的三个问题', type: 'textarea',
        placeholder: '（1）...\n（2）...\n（3）...',
        relatedTo: ['strategy', 'marketing', 'organization'],
        guide: '请按优先级排序，这决定了服务的重心',
      },
      {
        id: 'brand_ideas', label: '想了很久但未落地的品牌想法', type: 'textarea',
        placeholder: '如：想做联名活动、想做品牌周边、想升级门店…',
        relatedTo: ['strategy', 'image', 'marketing'],
      },
      {
        id: 'other_notes', label: '其他重要补充', type: 'textarea',
        placeholder: '还有什么没问到但您觉得很重要的事情？',
        relatedTo: ['competition', 'strategy'],
      },
      {
        id: 'success_criteria', label: '如何定义本次合作的成功', type: 'textarea',
        placeholder: '如：门店翻台率提升30%、月营收突破50万、品牌在本地有认知度…',
        relatedTo: ['strategy', 'marketing', 'organization'],
        guide: '量化的目标更容易衡量成果',
      },
    ],
  },
];

/** 获取所有字段的扁平列表 */
export function getAllFields(): ChecklistField[] {
  return CHECKLIST_TEMPLATE.flatMap(s => s.fields);
}

/** 将 ChecklistData 转为AI可读的上下文文本 */
export function checklistToContext(data: ChecklistData, brandName: string): string {
  const lines: string[] = [`## 品牌自检信息（${brandName}）\n`];

  for (const section of CHECKLIST_TEMPLATE) {
    const filledFields = section.fields.filter(f => data[f.id] && data[f.id].trim());
    if (filledFields.length === 0) continue;

    lines.push(`### ${section.title}`);
    for (const field of filledFields) {
      const value = data[field.id]!.trim();
      if (field.type === 'multiselect' && value) {
        lines.push(`- **${field.label}**：${value.split(',').join('、')}`);
      } else {
        lines.push(`- **${field.label}**：${value}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** 创建空的 ChecklistData */
export function createEmptyChecklist(): ChecklistData {
  const data: ChecklistData = {};
  for (const field of getAllFields()) {
    data[field.id] = '';
  }
  return data;
}
