// ============================================================
// 亮品牌 · 数据库层（SQLite）
// 初始化Schema、种子数据、数据库工具函数
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { initKnowledgeSchema } from './routes/knowledge.js';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'liangbrand.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    initKnowledgeSchema(db);
    seedData(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'consultant',
      display_name TEXT DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- 客户表
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      industry TEXT DEFAULT '',
      contact TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      wechat TEXT DEFAULT '',
      stage TEXT DEFAULT 'intention',
      created_at INTEGER NOT NULL,
      notes TEXT DEFAULT '',
      source TEXT DEFAULT ''
    );

    -- 报价表
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      package_type TEXT NOT NULL,
      items TEXT DEFAULT '[]',
      base_price REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      travel_budget REAL DEFAULT 0,
      third_party_budget REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      valid_until INTEGER DEFAULT 0,
      payment_schedule TEXT DEFAULT '[]'
    );

    -- 项目表（JSON字段存储复杂结构）
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      name TEXT NOT NULL,
      industry TEXT DEFAULT '',
      package_type TEXT NOT NULL,
      current_phase TEXT DEFAULT 'initiation',
      phases TEXT DEFAULT '[]',
      start_at INTEGER NOT NULL,
      end_at INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      team TEXT DEFAULT '[]',
      deliverables TEXT DEFAULT '[]',
      selected_module_ids TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      notes TEXT DEFAULT '',
      monthly_work_plan TEXT DEFAULT '[]',
      brand_checklist TEXT DEFAULT '{}',
      brand_timeline TEXT DEFAULT '{}'
    );

    -- 审核任务表
    CREATE TABLE IF NOT EXISTS review_tasks (
      id TEXT PRIMARY KEY,
      deliverable_id TEXT NOT NULL,
      deliverable_name TEXT NOT NULL,
      project_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      engine_type TEXT NOT NULL,
      reviewer TEXT NOT NULL,
      status TEXT DEFAULT 'pending_review',
      comment TEXT DEFAULT '',
      created_at INTEGER NOT NULL,
      reviewed_at INTEGER DEFAULT 0
    );

    -- 系统设置表（key-value + 分组）
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'general',
      label TEXT NOT NULL DEFAULT '',
      description TEXT DEFAULT '',
      updated_at INTEGER NOT NULL,
      updated_by TEXT DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

    -- AI 用量日志表（记录每次 AI 调用的 token 消耗）
    CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT '',
      scenario TEXT NOT NULL DEFAULT '',
      project_id TEXT DEFAULT '',
      deliverable_id TEXT DEFAULT '',
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage_logs(provider);
  `);

  // 种子设置默认值（仅在空表时写入）
  seedSettings(db);
}

// ========== ID 生成 ==========
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ========== 设置默认值种子 ==========
function seedSettings(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM settings').get() as any).c;
  if (count > 0) return; // 已有设置数据，跳过

  const now = Date.now();
  const defaults: Array<{ key: string; value: string; category: string; label: string; description: string }> = [
    // 品牌主题
    { key: 'brand.name', value: '亮品牌', category: 'brand', label: '品牌名称', description: '系统显示的品牌名称' },
    { key: 'brand.company', value: '长沙敬亮品牌策划有限公司', category: 'brand', label: '公司全称', description: '系统显示的公司全称' },
    { key: 'brand.systemTitle', value: '周期性项目服务系统', category: 'brand', label: '系统副标题', description: '登录页显示的副标题' },
    { key: 'brand.logo', value: '✦', category: 'brand', label: 'Logo', description: 'Logo 文字或 Emoji' },
    { key: 'theme.primaryColor', value: '#cf1322', category: 'theme', label: '主色调', description: 'Ant Design 主色' },
    { key: 'theme.siderGradientStart', value: '#a8071a', category: 'theme', label: '侧边栏渐变起始色', description: '' },
    { key: 'theme.siderGradientEnd', value: '#8c0a18', category: 'theme', label: '侧边栏渐变结束色', description: '' },
    { key: 'theme.loginGradientStart', value: '#4a0000', category: 'theme', label: '登录页渐变起始色', description: '' },
    { key: 'theme.loginGradientMid', value: '#7a0019', category: 'theme', label: '登录页渐变中间色', description: '' },
    { key: 'theme.loginGradientEnd', value: '#a8071a', category: 'theme', label: '登录页渐变结束色', description: '' },
    // AI 模型
    { key: 'ai.deepseek.apiKey', value: process.env.DEEPSEEK_API_KEY || '', category: 'ai', label: 'DeepSeek API Key', description: '' },
    { key: 'ai.deepseek.baseUrl', value: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com', category: 'ai', label: 'DeepSeek API 地址', description: '' },
    { key: 'ai.deepseek.defaultModel', value: process.env.DEEPSEEK_MODEL || 'deepseek-chat', category: 'ai', label: 'DeepSeek 默认模型', description: '' },
    { key: 'ai.deepseek.reasoningModel', value: process.env.DEEPSEEK_REASONING_MODEL || 'deepseek-reasoner', category: 'ai', label: 'DeepSeek 推理模型', description: '' },
    { key: 'ai.deepseek.enabled', value: 'true', category: 'ai', label: 'DeepSeek 启用', description: '' },
    { key: 'ai.doubao.apiKey', value: process.env.DOUBAO_API_KEY || '', category: 'ai', label: '豆包 API Key', description: '' },
    { key: 'ai.doubao.baseUrl', value: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3', category: 'ai', label: '豆包 API 地址', description: '' },
    { key: 'ai.doubao.defaultModel', value: process.env.DOUBAO_MODEL || 'doubao-pro-32k', category: 'ai', label: '豆包默认模型', description: '' },
    { key: 'ai.doubao.enabled', value: 'false', category: 'ai', label: '豆包启用', description: '' },
    { key: 'ai.qwen.apiKey', value: process.env.QWEN_API_KEY || '', category: 'ai', label: '通义千问 API Key', description: '' },
    { key: 'ai.qwen.baseUrl', value: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1', category: 'ai', label: '通义千问 API 地址', description: '' },
    { key: 'ai.qwen.defaultModel', value: process.env.QWEN_MODEL || 'qwen-plus', category: 'ai', label: '通义千问默认模型', description: '' },
    { key: 'ai.qwen.imageModel', value: process.env.QWEN_IMAGE_MODEL || 'qwen-vl-max', category: 'ai', label: '通义千问图像模型', description: '' },
    { key: 'ai.qwen.enabled', value: 'false', category: 'ai', label: '通义千问启用', description: '' },
    { key: 'ai.scenarioRoutes', value: JSON.stringify([
      { scenario: 'deliverable_generate', defaultProvider: 'deepseek', fallbackProvider: 'doubao' },
      { scenario: 'deliverable_optimize', defaultProvider: 'doubao', fallbackProvider: 'deepseek' },
      { scenario: 'checklist_fill', defaultProvider: 'deepseek', fallbackProvider: 'doubao' },
      { scenario: 'timeline_search', defaultProvider: 'deepseek', fallbackProvider: 'doubao' },
      { scenario: 'field_assist', defaultProvider: 'deepseek' },
      { scenario: 'image_generate', defaultProvider: 'qwen' },
    ]), category: 'ai', label: '场景路由配置', description: '每个场景使用的默认模型和备选模型' },
    // 知识库
    { key: 'knowledge.maxFileSize', value: '104857600', category: 'knowledge', label: '单文件大小上限', description: '字节，默认100MB' },
    { key: 'knowledge.maxBatchCount', value: '20', category: 'knowledge', label: '批量上传数量上限', description: '' },
    { key: 'knowledge.maxTextLength', value: '8000', category: 'knowledge', label: '文本提取字符上限', description: '' },
    { key: 'knowledge.maxStoredTextLength', value: '100000', category: 'knowledge', label: '存储文本上限', description: '字节' },
    // 套餐定价
    { key: 'package.set_sail.name', value: '起航计划 · 快速启动', category: 'package', label: '起航计划名称', description: '' },
    { key: 'package.set_sail.description', value: '3个月快速启动，完成品牌核心战略构建与基础体系搭建', category: 'package', label: '起航计划说明', description: '' },
    { key: 'package.set_sail.price', value: '68000', category: 'package', label: '起航计划价格', description: '' },
    { key: 'package.set_sail.months', value: '3', category: 'package', label: '起航计划服务月数', description: '' },
    { key: 'package.navigate.name', value: '领航计划 · 卓越进阶', category: 'package', label: '领航计划名称', description: '' },
    { key: 'package.navigate.description', value: '6个月系统升级，从1到10的战略深化（不含亮空间服务模块）', category: 'package', label: '领航计划说明', description: '' },
    { key: 'package.navigate.price', value: '248000', category: 'package', label: '领航计划价格', description: '' },
    { key: 'package.navigate.months', value: '6', category: 'package', label: '领航计划服务月数', description: '' },
    { key: 'package.voyage.name', value: '远航计划 · 突破未来', category: 'package', label: '远航计划名称', description: '' },
    { key: 'package.voyage.description', value: '12个月全程护航，战略迭代、持续增长的第二曲线（不含亮空间服务模块）', category: 'package', label: '远航计划说明', description: '' },
    { key: 'package.voyage.price', value: '598000', category: 'package', label: '远航计划价格', description: '' },
    { key: 'package.voyage.months', value: '12', category: 'package', label: '远航计划服务月数', description: '' },
    // 引擎颜色
    { key: 'engine.competition.color', value: '#faad14', category: 'engine', label: '亮竞争色', description: '' },
    { key: 'engine.strategy.color', value: '#cf1322', category: 'engine', label: '亮战略色', description: '' },
    { key: 'engine.image.color', value: '#eb2f96', category: 'engine', label: '亮形象色', description: '' },
    { key: 'engine.space.color', value: '#52c41a', category: 'engine', label: '亮空间色', description: '' },
    { key: 'engine.marketing.color', value: '#722ed1', category: 'engine', label: '亮营销色', description: '' },
    { key: 'engine.organization.color', value: '#13c2c2', category: 'engine', label: '亮组织色', description: '' },
    // 角色颜色
    { key: 'role.admin.color', value: '#f5222d', category: 'role', label: '管理员色', description: '' },
    { key: 'role.consultant.color', value: '#cf1322', category: 'role', label: '咨询顾问色', description: '' },
    { key: 'role.strategist.color', value: '#722ed1', category: 'role', label: '策略师色', description: '' },
    { key: 'role.designer.color', value: '#eb2f96', category: 'role', label: '设计师色', description: '' },
    { key: 'role.pm.color', value: '#13c2c2', category: 'role', label: '项目经理色', description: '' },
  ];

  const insert = db.prepare(
    'INSERT INTO settings (key, value, category, label, description, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const s of defaults) {
    insert.run(s.key, s.value, s.category, s.label, s.description, now, 'system');
  }
}

// ========== 种子数据 ==========
function seedData(db: Database.Database) {
  // 检查是否已初始化
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  if (userCount > 0) return;

  const now = Date.now();

  // --- 创建默认用户 ---
  const users = [
    { username: 'admin', password: 'admin123', role: 'admin', display_name: '系统管理员' },
    { username: 'consultant1', password: '123456', role: 'consultant', display_name: '张咨询' },
    { username: 'strategist1', password: '123456', role: 'strategist', display_name: '李策略' },
    { username: 'designer1', password: '123456', role: 'designer', display_name: '王设计' },
    { username: 'pm1', password: '123456', role: 'pm', display_name: '赵项目' },
  ];

  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password, role, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const insertCustomer = db.prepare(
    'INSERT INTO customers (id, name, company, industry, contact, phone, email, wechat, stage, created_at, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertQuote = db.prepare(
    'INSERT INTO quotes (id, customer_id, customer_name, package_type, items, base_price, discount, tax_rate, travel_budget, third_party_budget, total_price, status, created_at, valid_until, payment_schedule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertProject = db.prepare(
    'INSERT INTO projects (id, customer_id, customer_name, name, industry, package_type, current_phase, phases, start_at, end_at, status, team, deliverables, selected_module_ids, created_at, updated_at, notes, monthly_work_plan, brand_checklist, brand_timeline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertReview = db.prepare(
    'INSERT INTO review_tasks (id, deliverable_id, deliverable_name, project_id, project_name, engine_type, reviewer, status, comment, created_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  // 用户
  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    insertUser.run(genId(), u.username, hash, u.role, u.display_name, now, now);
  }

  // --- 客户数据 ---
  const demoCustomers = [
    { name: '李明华', company: '蜀味轩餐饮管理有限公司', industry: '餐饮', phone: '138 8888 6666', wechat: 'limh_swwx', email: 'limh@shuweixuan.com', source: '转介绍', stage: 'signed', notes: '四川火锅连锁品牌，现有门店12家，计划3年拓店至50家' },
    { name: '张伟', company: '锐思特企业管理集团', industry: '企业', phone: '139 6666 8888', wechat: 'zhangwei_rst', email: 'zw@ruisite.com', source: '线上咨询', stage: 'signed', notes: '综合性企业集团，涉及科技、教育、地产板块' },
    { name: '王丽', company: '花间集电商平台', industry: '电商', phone: '136 7777 9999', wechat: 'wangli_hjj', email: 'wl@huajianji.com', source: '活动获客', stage: 'quoting', notes: '美妆电商，年GMV 5000万，寻求品牌化转型' },
    { name: '陈强', company: '乐饮食品科技有限公司', industry: '快消', phone: '135 5555 3333', wechat: 'chenq_ly', email: 'cq@leyin.com', source: '主动拜访', stage: 'intention', notes: '果汁饮料品牌，覆盖华中地区，面临同质化竞争' },
    { name: '赵雪', company: '星光大道KTV连锁', industry: 'KTV', phone: '137 4444 2222', wechat: 'zhaox_xgdd', email: 'zx@xgdd.com', source: '转介绍', stage: 'intention', notes: '中高端KTV连锁，现有8家门店，计划品牌升级' },
  ];

  const planConfigs = [
    { id: 'navigate', name: '领航计划', months: 6, price: 248000 },
    { id: 'voyage', name: '远航计划', months: 12, price: 598000 },
    { id: 'custom', name: '定制服务计划', months: 3, price: 150000 },
  ];

  const projectPhases = JSON.stringify(['initiation', 'competition', 'strategy', 'image', 'space', 'marketing', 'organization', 'delivery', 'completed']);

  // 为每个客户创建报价和项目
  for (let ci = 0; ci < demoCustomers.length; ci++) {
    const c = demoCustomers[ci];
    const customerId = genId();
    insertCustomer.run(customerId, c.name, c.company, c.industry, c.name, c.phone, c.email, c.wechat, c.stage, now, c.notes, c.source);

    for (let pi = 0; pi < planConfigs.length; pi++) {
      const plan = planConfigs[pi];
      const quotePrice = plan.id === 'custom' ? 150000 + ci * 20000 : plan.price;
      const quoteStatus = pi === 0 ? 'accepted' : pi === 1 ? 'draft' : 'sent';
      const quoteId = genId();

      const paymentSchedule = JSON.stringify([
        { id: 'p1', label: '签约首付（50%）', percentage: 50, amount: Math.round(quotePrice * 0.5), condition: '合同签订后3日内', paid: pi === 0 },
        { id: 'p2', label: '服务中期（30%）', percentage: 30, amount: Math.round(quotePrice * 0.3), condition: `第${Math.ceil(plan.months / 2)}个月末`, paid: false },
        { id: 'p3', label: '尾款（20%）', percentage: 20, amount: quotePrice - Math.round(quotePrice * 0.5) - Math.round(quotePrice * 0.3), condition: '服务结束（成果交付前）', paid: false },
      ]);

      insertQuote.run(
        quoteId, customerId, c.company, plan.id, '[]',
        quotePrice, 0, 6, 5000, 0, quotePrice, quoteStatus,
        now, now + 30 * 86400000, paymentSchedule
      );

      // 已签约客户创建项目
      if (pi === 0 && c.stage === 'signed') {
        const team = JSON.stringify([
          { id: 't1', name: '张咨询', role: 'consultant', isInternal: true },
          { id: 't2', name: '李策略', role: 'strategist', isInternal: true },
          { id: 't3', name: '王设计', role: 'designer', isInternal: true },
          { id: 't4', name: '赵项目', role: 'pm', isInternal: true },
        ]);

        // 创建示例交付物
        const deliverableTemplates = [
          { name: '《竞争生态圈层分析报告》', engineType: 'competition', moduleId: 'm-comp-eco', status: 'approved' },
          { name: '《品牌定位白皮书》', engineType: 'strategy', moduleId: 'm-strat-vision', status: 'reviewing' },
          { name: '《品牌识别系统手册》', engineType: 'image', moduleId: 'm-img-identity', status: 'draft' },
          { name: '《营销策略框架》', engineType: 'marketing', moduleId: 'm-mkt-framework', status: 'pending' },
          { name: '《运营标准手册》', engineType: 'organization', moduleId: 'm-org-standard', status: 'pending' },
        ];

        const deliverables = deliverableTemplates.map(d => ({
          id: genId(),
          templateId: genId(),
          name: d.name,
          engineType: d.engineType,
          moduleId: d.moduleId,
          phase: d.engineType,
          status: d.status,
          assignee: d.status !== 'pending' ? '张咨询' : undefined,
          reviewer: '李策略',
          content: '',
          version: d.status === 'approved' ? 2 : d.status === 'draft' ? 1 : 0,
          versions: d.status === 'approved' ? [{ version: 1, content: '', createdAt: now - 86400000, author: '张咨询' }, { version: 2, content: '', createdAt: now, author: '张咨询' }] : d.status === 'draft' ? [{ version: 1, content: '', createdAt: now, author: '张咨询' }] : [],
          reviewHistory: d.status === 'approved' ? [{ id: genId(), status: 'approved', reviewer: '李策略', comment: '内容详实，通过审核', createdAt: now - 43200000 }] : [],
          createdAt: now - 172800000,
          updatedAt: now,
        }));

        // 创建审核任务
        const reviewingDeliverables = deliverables.filter(d => d.status === 'reviewing');
        for (const d of reviewingDeliverables) {
          // 注意：此时 projectId 还未生成，先创建项目后再更新
          // 这里先用占位符，后面统一修复
        }

        const projectId = genId();
        const projectName = `${c.company}-品牌创建项目`;
        const currentPhase = ci === 0 ? 'strategy' : 'initiation';
        const startAt = now - 172800000;
        const endAt = 0;
        const projectStatus = 'active';
        const selectedModuleIds = '[]';
        const monthlyWorkPlan = '[]';
        const brandChecklist = '{}';
        const brandTimelineData = JSON.stringify({ entries: [], teamReflection: '', futureThinking: '', updatedAt: now });
        const projectNotes = `来源于报价单 ${quoteId}`;

        insertProject.run(
          projectId,             // id
          customerId,            // customer_id
          c.company,             // customer_name
          projectName,           // name
          c.industry,            // industry
          plan.id,               // package_type
          currentPhase,          // current_phase
          projectPhases,         // phases
          startAt,               // start_at
          endAt,                 // end_at
          projectStatus,         // status
          team,                  // team
          JSON.stringify(deliverables), // deliverables
          selectedModuleIds,     // selected_module_ids
          startAt,               // created_at
          now,                   // updated_at
          projectNotes,          // notes
          monthlyWorkPlan,       // monthly_work_plan
          brandChecklist,        // brand_checklist
          brandTimelineData      // brand_timeline
        );

        // 创建审核任务（使用真实的 projectId）
        for (const d of reviewingDeliverables) {
          insertReview.run(
            genId(), d.id, d.name, projectId,
            projectName, d.engineType,
            '李策略', 'pending_review', '', now, 0
          );
        }
      }
    }
  }
}

// ========== 数据库操作工具 ==========
export function jsonParse<T = any>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

export function jsonStringify(data: any): string {
  return JSON.stringify(data);
}
