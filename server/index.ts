// ============================================================
// 亮品牌 · 后端服务（Express + JWT + SQLite）
// 一键部署：docker-compose up -d
// ============================================================

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 根据环境加载配置：NODE_ENV=production → .env.production，否则 → .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb, genId, jsonParse, jsonStringify } from './db.js';
import aiRouter from './ai/index.js';
import knowledgeRouter from './routes/knowledge.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'liang-brand-jwt-secret-change-in-production';

// ========== 中间件 ==========
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// JWT认证中间件
function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// 管理员权限检查
function adminOnly(req: any, res: any, next: any) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: '仅管理员可执行此操作' });
  next();
}

// 静态文件服务（生产环境）
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// 上传文件静态服务（Logo、附件等）
const uploadDir = path.join(__dirname, '..', 'data', 'uploads');
app.use('/uploads', express.static(uploadDir));

// ========== 认证路由 ==========
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '请输入用户名和密码' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) return res.status(401).json({ error: '用户名或密码错误' });

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, displayName: user.display_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, displayName: user.display_name },
  });
});

app.get('/api/auth/me', authMiddleware, (req: any, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, role, display_name as displayName, created_at FROM users WHERE id = ?').get(req.user.id) as any;
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json(user);
});

app.put('/api/auth/password', authMiddleware, (req: any, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: '请输入旧密码和新密码' });
  if (newPassword.length < 6) return res.status(400).json({ error: '新密码至少6位' });

  const db = getDb();
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id) as any;
  if (!user || !bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(400).json({ error: '旧密码错误' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(hash, Date.now(), req.user.id);
  res.json({ message: '密码修改成功' });
});

// 用户管理（管理员）
app.get('/api/users', authMiddleware, adminOnly, (_req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, username, role, display_name as displayName, created_at, updated_at FROM users ORDER BY created_at').all();
  res.json(users);
});

app.post('/api/users', authMiddleware, adminOnly, (req: any, res) => {
  const { username, password, role, displayName } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  const validRoles = ['admin', 'consultant', 'strategist', 'designer', 'pm'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: '无效的角色' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(400).json({ error: '用户名已存在' });

  const hash = bcrypt.hashSync(password, 10);
  const now = Date.now();
  db.prepare('INSERT INTO users (id, username, password, role, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(genId(), username, hash, role, displayName || username, now, now);

  res.json({ message: '用户创建成功' });
});

app.delete('/api/users/:id', authMiddleware, adminOnly, (req: any, res) => {
  if (req.user.id === req.params.id) return res.status(400).json({ error: '不能删除自己' });
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: '用户已删除' });
});

// ========== 客户 CRUD ==========
app.get('/api/customers', authMiddleware, (_req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all() as any[];
  const customers = rows.map(r => ({
    ...r,
    createdAt: r.created_at,
  }));
  res.json(customers);
});

app.get('/api/customers/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const r = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id) as any;
  if (!r) return res.status(404).json({ error: '客户不存在' });
  res.json({
    ...r,
    createdAt: r.created_at,
  });
});

app.post('/api/customers', authMiddleware, (req, res) => {
  const db = getDb();
  const id = genId();
  const now = Date.now();
  const { name, company, industry, contact, phone, email, wechat, stage, notes, source } = req.body;
  db.prepare(
    'INSERT INTO customers (id, name, company, industry, contact, phone, email, wechat, stage, created_at, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, company, industry || '', contact || name, phone || '', email || '', wechat || '', stage || 'intention', now, notes || '', source || '');
  res.json({ id, created_at: now });
});

app.put('/api/customers/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const fields = ['name', 'company', 'industry', 'contact', 'phone', 'email', 'wechat', 'stage', 'notes', 'source'];
  const updates: string[] = [];
  const values: any[] = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  }
  if (updates.length === 0) return res.status(400).json({ error: '无更新字段' });
  values.push(req.params.id);
  db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: '更新成功' });
});

app.delete('/api/customers/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

// ========== 报价 CRUD ==========
app.get('/api/quotes', authMiddleware, (_req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM quotes ORDER BY created_at DESC').all() as any[];
  const quotes = rows.map(r => ({
    ...r,
    customerId: r.customer_id,
    customerName: r.customer_name,
    packageType: r.package_type,
    basePrice: r.base_price,
    discount: r.discount,
    taxRate: r.tax_rate,
    travelBudget: r.travel_budget,
    thirdPartyBudget: r.third_party_budget,
    totalPrice: r.total_price,
    createdAt: r.created_at,
    validUntil: r.valid_until,
    paymentSchedule: jsonParse(r.payment_schedule, []),
    items: jsonParse(r.items, []),
  }));
  res.json(quotes);
});

app.get('/api/quotes/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const r = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id) as any;
  if (!r) return res.status(404).json({ error: '报价不存在' });
  res.json({
    ...r,
    customerId: r.customer_id,
    customerName: r.customer_name,
    packageType: r.package_type,
    basePrice: r.base_price,
    discount: r.discount,
    taxRate: r.tax_rate,
    travelBudget: r.travel_budget,
    thirdPartyBudget: r.third_party_budget,
    totalPrice: r.total_price,
    createdAt: r.created_at,
    validUntil: r.valid_until,
    paymentSchedule: jsonParse(r.payment_schedule, []),
    items: jsonParse(r.items, []),
  });
});

app.post('/api/quotes', authMiddleware, (req, res) => {
  const db = getDb();
  const id = genId();
  const now = Date.now();
  const { customerId, customerName, packageType, items, basePrice, discount, taxRate, travelBudget, thirdPartyBudget, totalPrice, status, validUntil, paymentSchedule } = req.body;
  db.prepare(
    'INSERT INTO quotes (id, customer_id, customer_name, package_type, items, base_price, discount, tax_rate, travel_budget, third_party_budget, total_price, status, created_at, valid_until, payment_schedule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id, customerId, customerName, packageType,
    jsonStringify(items || []), basePrice || 0, discount || 0, taxRate || 0,
    travelBudget || 0, thirdPartyBudget || 0, totalPrice || 0, status || 'draft',
    now, validUntil || 0, jsonStringify(paymentSchedule || [])
  );
  res.json({ id, created_at: now });
});

app.put('/api/quotes/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const map: Record<string, string> = {
    customer_id: 'customerId', customer_name: 'customerName', package_type: 'packageType',
    base_price: 'basePrice', discount: 'discount', tax_rate: 'taxRate',
    travel_budget: 'travelBudget', third_party_budget: 'thirdPartyBudget',
    total_price: 'totalPrice', status: 'status', valid_until: 'validUntil',
  };
  const updates: string[] = [];
  const values: any[] = [];
  for (const [col, key] of Object.entries(map)) {
    if (req.body[key] !== undefined) { updates.push(`${col} = ?`); values.push(req.body[key]); }
  }
  if (req.body.items !== undefined) { updates.push('items = ?'); values.push(jsonStringify(req.body.items)); }
  if (req.body.paymentSchedule !== undefined) { updates.push('payment_schedule = ?'); values.push(jsonStringify(req.body.paymentSchedule)); }
  if (updates.length === 0) return res.status(400).json({ error: '无更新字段' });
  values.push(req.params.id);
  db.prepare(`UPDATE quotes SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: '更新成功' });
});

app.delete('/api/quotes/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

// ========== 项目 CRUD ==========
app.get('/api/projects', authMiddleware, (_req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as any[];
  const projects = rows.map(r => ({
    ...r,
    customerId: r.customer_id,
    customerName: r.customer_name,
    packageType: r.package_type,
    currentPhase: r.current_phase,
    startAt: r.start_at,
    endAt: r.end_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    team: jsonParse(r.team, []),
    deliverables: jsonParse(r.deliverables, []),
    selectedModuleIds: jsonParse(r.selected_module_ids, []),
    phases: jsonParse(r.phases, []),
    monthlyWorkPlan: jsonParse(r.monthly_work_plan, []),
    brandChecklist: jsonParse(r.brand_checklist, {}),
    brandTimeline: jsonParse(r.brand_timeline, {}),
  }));
  res.json(projects);
});

app.get('/api/projects/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const r = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;
  if (!r) return res.status(404).json({ error: '项目不存在' });
  res.json({
    ...r,
    customerId: r.customer_id,
    customerName: r.customer_name,
    packageType: r.package_type,
    currentPhase: r.current_phase,
    startAt: r.start_at,
    endAt: r.end_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    team: jsonParse(r.team, []),
    deliverables: jsonParse(r.deliverables, []),
    selectedModuleIds: jsonParse(r.selected_module_ids, []),
    phases: jsonParse(r.phases, []),
    monthlyWorkPlan: jsonParse(r.monthly_work_plan, []),
    brandChecklist: jsonParse(r.brand_checklist, {}),
    brandTimeline: jsonParse(r.brand_timeline, {}),
  });
});

app.post('/api/projects', authMiddleware, (req, res) => {
  const db = getDb();
  const id = genId();
  const now = Date.now();
  const { customerId, customerName, name, industry, packageType, phases, team, deliverables, notes, brandChecklist, brandTimeline } = req.body;
  db.prepare(
    'INSERT INTO projects (id, customer_id, customer_name, name, industry, package_type, current_phase, phases, start_at, status, team, deliverables, selected_module_ids, created_at, updated_at, notes, monthly_work_plan, brand_checklist, brand_timeline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id, customerId, customerName, name || `${customerName}-品牌创建项目`,
    industry || '', packageType, 'initiation',
    jsonStringify(phases || ['initiation', 'competition', 'strategy', 'image', 'space', 'marketing', 'organization', 'delivery', 'completed']),
    now, 'active',
    jsonStringify(team || []),
    jsonStringify(deliverables || []),
    jsonStringify(req.body.selectedModuleIds || []),
    now, now, notes || '', '[]',
    jsonStringify(brandChecklist || {}),
    jsonStringify(brandTimeline || {})
  );
  res.json({ id, created_at: now });
});

app.put('/api/projects/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const simpleFields: Record<string, string> = {
    customer_name: 'customerName', name: 'name', industry: 'industry',
    package_type: 'packageType', current_phase: 'currentPhase',
    start_at: 'startAt', end_at: 'endAt', status: 'status', notes: 'notes',
  };
  const jsonFields: Record<string, string> = {
    phases: 'phases', team: 'team', deliverables: 'deliverables',
    selected_module_ids: 'selectedModuleIds', monthly_work_plan: 'monthlyWorkPlan',
    brand_checklist: 'brandChecklist', brand_timeline: 'brandTimeline',
  };

  const updates: string[] = [];
  const values: any[] = [];

  for (const [col, key] of Object.entries(simpleFields)) {
    if (req.body[key] !== undefined) { updates.push(`${col} = ?`); values.push(req.body[key]); }
  }
  for (const [col, key] of Object.entries(jsonFields)) {
    if (req.body[key] !== undefined) { updates.push(`${col} = ?`); values.push(jsonStringify(req.body[key])); }
  }

  if (updates.length === 0) return res.status(400).json({ error: '无更新字段' });
  updates.push('updated_at = ?');
  values.push(Date.now());
  values.push(req.params.id);

  db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: '更新成功' });
});

app.delete('/api/projects/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

// ========== 审核任务 ==========
app.get('/api/review-tasks', authMiddleware, (_req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM review_tasks ORDER BY created_at DESC').all() as any[];
  const tasks = rows.map(r => ({
    ...r,
    deliverableId: r.deliverable_id,
    deliverableName: r.deliverable_name,
    projectId: r.project_id,
    projectName: r.project_name,
    engineType: r.engine_type,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
  }));
  res.json(tasks);
});

app.post('/api/review-tasks', authMiddleware, (req, res) => {
  const db = getDb();
  const id = genId();
  const now = Date.now();
  const { deliverableId, deliverableName, projectId, projectName, engineType, reviewer } = req.body;
  db.prepare(
    'INSERT INTO review_tasks (id, deliverable_id, deliverable_name, project_id, project_name, engine_type, reviewer, status, comment, created_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, deliverableId, deliverableName, projectId, projectName, engineType, reviewer, 'pending_review', '', now, 0);
  res.json({ id, created_at: now });
});

app.put('/api/review-tasks/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const fields: Record<string, string> = {
    status: 'status', comment: 'comment', reviewer: 'reviewer',
  };
  const updates: string[] = [];
  const values: any[] = [];
  for (const [col, key] of Object.entries(fields)) {
    if (req.body[key] !== undefined) { updates.push(`${col} = ?`); values.push(req.body[key]); }
  }
  if (req.body.status && req.body.status !== 'pending_review') {
    updates.push('reviewed_at = ?');
    values.push(Date.now());
  }
  if (updates.length === 0) return res.status(400).json({ error: '无更新字段' });
  values.push(req.params.id);
  db.prepare(`UPDATE review_tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: '更新成功' });
});

// ========== 统计 ==========
app.get('/api/stats', authMiddleware, (_req, res) => {
  const db = getDb();
  const customers = db.prepare('SELECT * FROM customers').all() as any[];
  const projects = db.prepare('SELECT * FROM projects').all() as any[];
  const quotes = db.prepare('SELECT * FROM quotes').all() as any[];
  const reviewTasks = db.prepare('SELECT * FROM review_tasks').all() as any[];

  const activeProjects = projects.filter(p => p.status === 'active');
  let totalDeliverables = 0, completedDeliverables = 0;
  for (const p of activeProjects) {
    const dels = jsonParse(p.deliverables, []);
    totalDeliverables += dels.length;
    completedDeliverables += dels.filter((d: any) => d.status === 'approved').length;
  }

  res.json({
    totalCustomers: customers.length,
    intentionCustomers: customers.filter(c => c.stage === 'intention').length,
    signedCustomers: customers.filter(c => c.stage === 'signed').length,
    totalProjects: projects.length,
    activeProjects: activeProjects.length,
    totalQuotes: quotes.length,
    totalDeliverables,
    completedDeliverables,
    pendingReviews: reviewTasks.filter(t => t.status === 'pending_review').length,
    totalRevenue: quotes.filter(q => q.status === 'accepted').reduce((s: number, q: any) => s + q.total_price, 0),
  });
});

// ========== 数据导出/导入 ==========
app.get('/api/data/export', authMiddleware, adminOnly, (_req, res) => {
  const db = getDb();
  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    customers: db.prepare('SELECT * FROM customers').all(),
    quotes: db.prepare('SELECT * FROM quotes').all(),
    projects: db.prepare('SELECT * FROM projects').all(),
    reviewTasks: db.prepare('SELECT * FROM review_tasks').all(),
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="liang-brand-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(data);
});

app.post('/api/data/import', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const data = req.body;
  if (!data.version) return res.status(400).json({ error: '无效的备份文件' });

  let count = 0;
  const insertCustomer = db.prepare(
    'INSERT OR REPLACE INTO customers (id, name, company, industry, contact, phone, email, wechat, stage, created_at, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertQuote = db.prepare(
    'INSERT OR REPLACE INTO quotes (id, customer_id, customer_name, package_type, items, base_price, discount, tax_rate, travel_budget, third_party_budget, total_price, status, created_at, valid_until, payment_schedule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertProject = db.prepare(
    'INSERT OR REPLACE INTO projects (id, customer_id, customer_name, name, industry, package_type, current_phase, phases, start_at, end_at, status, team, deliverables, selected_module_ids, created_at, updated_at, notes, monthly_work_plan, brand_checklist, brand_timeline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertReview = db.prepare(
    'INSERT OR REPLACE INTO review_tasks (id, deliverable_id, deliverable_name, project_id, project_name, engine_type, reviewer, status, comment, created_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    for (const c of (data.customers || [])) {
      insertCustomer.run(c.id, c.name, c.company, c.industry || '', c.contact || '', c.phone || '', c.email || '', c.wechat || '', c.stage || 'intention', c.created_at, c.notes || '', c.source || '');
      count++;
    }
    for (const q of (data.quotes || [])) {
      insertQuote.run(q.id, q.customer_id, q.customer_name, q.package_type, q.items || '[]', q.base_price || 0, q.discount || 0, q.tax_rate || 0, q.travel_budget || 0, q.third_party_budget || 0, q.total_price || 0, q.status || 'draft', q.created_at, q.valid_until || 0, q.payment_schedule || '[]');
      count++;
    }
    for (const p of (data.projects || [])) {
      insertProject.run(p.id, p.customer_id, p.customer_name, p.name, p.industry || '', p.package_type, p.current_phase || 'initiation', p.phases || '[]', p.start_at, p.end_at || 0, p.status || 'active', p.team || '[]', p.deliverables || '[]', p.selected_module_ids || '[]', p.created_at, p.updated_at, p.notes || '', p.monthly_work_plan || '[]', p.brand_checklist || '{}', p.brand_timeline || '{}');
      count++;
    }
    for (const r of (data.reviewTasks || [])) {
      insertReview.run(r.id, r.deliverable_id, r.deliverable_name, r.project_id, r.project_name, r.engine_type, r.reviewer, r.status || 'pending_review', r.comment || '', r.created_at, r.reviewed_at || 0);
      count++;
    }
  });

  try {
    transaction();
    res.json({ message: `导入成功，共 ${count} 条记录` });
  } catch (err: any) {
    res.status(500).json({ error: `导入失败: ${err.message}` });
  }
});

// ========== AI 路由 ==========
app.use('/api/ai', authMiddleware, aiRouter);

// ========== 知识库路由 ==========
app.use('/api/knowledge', authMiddleware, knowledgeRouter);

// ========== 公开设置（无需登录，前端主题初始化用）==========
// 必须在 admin 设置路由之前注册，否则会被 settingsRouter 拦截
app.get('/api/settings/public/info', (_req, res) => {
  const db = getDb();
  const publicCategories = ['brand', 'theme', 'engine', 'role', 'package'];
  const rows = db.prepare(
    `SELECT key, value FROM settings WHERE category IN (${publicCategories.map(() => '?').join(',')})`
  ).all(...publicCategories) as any[];
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  res.json(settings);
});

// ========== 系统设置路由（admin 权限） ==========
app.use('/api/settings', authMiddleware, adminOnly, settingsRouter);

// ========== 健康检查 ==========
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== SPA 路由回退 ==========
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ========== 启动 ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ✦ 亮品牌 · 周期性项目服务系统
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 服务已启动: http://localhost:${PORT}
  📊 API地址:    http://localhost:${PORT}/api
  🔑 默认账号:   admin / admin123
  
  提示：生产环境请修改 JWT_SECRET 环境变量
  `);
});
