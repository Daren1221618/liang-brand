// ============================================================
// 亮品牌 · 系统设置 API 路由
// GET /api/settings         — 获取所有设置（API Key 脱敏）
// GET /api/settings/:cat    — 获取指定分类设置
// GET /api/settings/public  — 获取公开设置（无需admin权限，前端初始化用）
// PUT /api/settings         — 批量更新设置
// PUT /api/settings/ai/test — 测试 AI 模型连通性
// POST /api/settings/reset  — 重置指定分类为默认值
// ============================================================

import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { refreshAIConfig } from '../ai/config.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Logo 图片上传配置
const LOGO_DIR = path.join(process.cwd(), 'data', 'uploads', 'logo');
if (!fs.existsSync(LOGO_DIR)) fs.mkdirSync(LOGO_DIR, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOGO_DIR),
  filename: (_req, _file, cb) => {
    const ext = path.extname(_file.originalname) || '.png';
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('仅支持 PNG/JPG/SVG/WebP/GIF/ICO 格式'));
  },
});

// ========== 工具函数 ==========

/** 需要脱敏的 key 前缀 */
const SENSITIVE_PREFIXES = ['ai.deepseek.apiKey', 'ai.doubao.apiKey', 'ai.qwen.apiKey'];

/** 脱敏 API Key：保留前缀 sk- 和后4位 */
function maskValue(key: string, value: string): string {
  if (!SENSITIVE_PREFIXES.some(p => key.startsWith(p)) || !value) return value;
  if (value.length <= 8) return '****';
  return value.slice(0, Math.max(value.indexOf('-') + 4, 3)) + '****' + value.slice(-4);
}

/** 获取所有设置（内部使用，不做脱敏） */
function getAllSettingsRaw(db: any): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as any[];
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

// ========== 路由 ==========

// 获取所有设置（admin，API Key 脱敏）
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value, category, label, description, updated_at, updated_by FROM settings ORDER BY category, key').all() as any[];
  const result = rows.map(r => ({
    key: r.key,
    value: maskValue(r.key, r.value),
    rawValue: r.value, // 前端编辑时需要原始值
    category: r.category,
    label: r.label,
    description: r.description,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  }));
  res.json(result);
});

// 获取指定分类的设置
router.get('/:category', (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value, category, label, description, updated_at, updated_by FROM settings WHERE category = ? ORDER BY key').all(req.params.category) as any[];
  const result = rows.map(r => ({
    key: r.key,
    value: maskValue(r.key, r.value),
    rawValue: r.value,
    category: r.category,
    label: r.label,
    description: r.description,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
  }));
  res.json(result);
});

// 公开设置 API（前端初始化用，非 admin 也可调用）
// 返回：品牌信息 + 主题色 + 引擎颜色 + 角色颜色（不含 API Key）
router.get('/public/info', (_req: Request, res: Response) => {
  const db = getDb();
  const publicCategories = ['brand', 'theme', 'engine', 'role', 'package'];
  const rows = db.prepare(
    `SELECT key, value FROM settings WHERE category IN (${publicCategories.map(() => '?').join(',')})`
  ).all(...publicCategories) as any[];
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  res.json(settings);
});

// 批量更新设置
router.put('/', (req: Request, res: Response) => {
  const db = getDb();
  const { settings, category } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: '无效的设置数据' });
  }

  const now = Date.now();
  const updater = (req as any).user?.username || 'admin';
  const upsert = db.prepare(
    'INSERT INTO settings (key, value, category, label, description, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by'
  );
  const getExisting = db.prepare('SELECT category, label, description FROM settings WHERE key = ?');

  let count = 0;
  for (const [key, value] of Object.entries(settings)) {
    const strValue = String(value ?? '');
    const existing = getExisting.get(key) as any;
    const cat = category || (existing?.category || 'general');
    const label = existing?.label || key;
    const description = existing?.description || '';
    upsert.run(key, strValue, cat, label, description, now, updater);
    count++;
  }

  // 如果更新了 AI 配置，刷新 AI 配置缓存
  const hasAIUpdate = Object.keys(settings).some(k => k.startsWith('ai.'));
  if (hasAIUpdate) {
    try { refreshAIConfig(); } catch (err) { console.error('AI 配置刷新失败:', err); }
  }

  res.json({ message: `已更新 ${count} 项设置` });
});

// 测试 AI 模型连通性
router.put('/ai/test', async (req: Request, res: Response) => {
  const { provider, apiKey, baseUrl, model } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: '缺少 provider 或 apiKey' });
  }

  const url = baseUrl || 'https://api.deepseek.com';
  const testModel = model || 'deepseek-chat';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      res.json({ success: true, message: `${provider} 连通性测试成功` });
    } else {
      const errText = await response.text();
      res.json({ success: false, message: `HTTP ${response.status}: ${errText.slice(0, 200)}` });
    }
  } catch (err: any) {
    res.json({ success: false, message: err.name === 'AbortError' ? '连接超时（10秒）' : `连接失败: ${err.message}` });
  }
});

// 重置指定分类为默认值
router.post('/reset', (req: Request, res: Response) => {
  const { category } = req.body;
  if (!category) {
    return res.status(400).json({ error: '请指定要重置的分类' });
  }

  // 导入默认值
  const defaults: Record<string, Record<string, string>> = {
    brand: {
      'brand.name': '亮品牌',
      'brand.company': '长沙敬亮品牌策划有限公司',
      'brand.systemTitle': '周期性项目服务系统',
      'brand.logo': '✦',
    },
    theme: {
      'theme.primaryColor': '#cf1322',
      'theme.siderGradientStart': '#a8071a',
      'theme.siderGradientEnd': '#8c0a18',
      'theme.loginGradientStart': '#4a0000',
      'theme.loginGradientMid': '#7a0019',
      'theme.loginGradientEnd': '#a8071a',
    },
    ai: {
      'ai.deepseek.apiKey': process.env.DEEPSEEK_API_KEY || '',
      'ai.deepseek.baseUrl': process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      'ai.deepseek.defaultModel': process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      'ai.deepseek.reasoningModel': process.env.DEEPSEEK_REASONING_MODEL || 'deepseek-reasoner',
      'ai.deepseek.enabled': 'true',
      'ai.doubao.apiKey': process.env.DOUBAO_API_KEY || '',
      'ai.doubao.baseUrl': process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
      'ai.doubao.defaultModel': process.env.DOUBAO_MODEL || 'doubao-pro-32k',
      'ai.doubao.enabled': 'false',
      'ai.qwen.apiKey': process.env.QWEN_API_KEY || '',
      'ai.qwen.baseUrl': process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      'ai.qwen.defaultModel': process.env.QWEN_MODEL || 'qwen-plus',
      'ai.qwen.imageModel': process.env.QWEN_IMAGE_MODEL || 'qwen-vl-max',
      'ai.qwen.enabled': 'false',
      'ai.scenarioRoutes': JSON.stringify([
        { scenario: 'deliverable_generate', defaultProvider: 'deepseek', fallbackProvider: 'doubao' },
        { scenario: 'deliverable_optimize', defaultProvider: 'doubao', fallbackProvider: 'deepseek' },
        { scenario: 'checklist_fill', defaultProvider: 'deepseek', fallbackProvider: 'doubao' },
        { scenario: 'timeline_search', defaultProvider: 'deepseek', fallbackProvider: 'doubao' },
        { scenario: 'field_assist', defaultProvider: 'deepseek' },
        { scenario: 'image_generate', defaultProvider: 'qwen' },
      ]),
    },
    knowledge: {
      'knowledge.maxFileSize': '104857600',
      'knowledge.maxBatchCount': '20',
      'knowledge.maxTextLength': '8000',
      'knowledge.maxStoredTextLength': '100000',
    },
    package: {
      'package.set_sail.price': '68000',
      'package.set_sail.months': '3',
      'package.navigate.price': '248000',
      'package.navigate.months': '6',
      'package.voyage.price': '598000',
      'package.voyage.months': '12',
    },
    engine: {
      'engine.competition.color': '#faad14',
      'engine.strategy.color': '#cf1322',
      'engine.image.color': '#eb2f96',
      'engine.space.color': '#52c41a',
      'engine.marketing.color': '#722ed1',
      'engine.organization.color': '#13c2c2',
    },
    role: {
      'role.admin.color': '#f5222d',
      'role.consultant.color': '#cf1322',
      'role.strategist.color': '#722ed1',
      'role.designer.color': '#eb2f96',
      'role.pm.color': '#13c2c2',
    },
  };

  const catDefaults = defaults[category];
  if (!catDefaults) {
    return res.status(400).json({ error: `未知分类: ${category}` });
  }

  const db = getDb();
  const now = Date.now();
  const updater = (req as any).user?.username || 'admin';
  const update = db.prepare('UPDATE settings SET value = ?, updated_at = ?, updated_by = ? WHERE key = ?');
  let count = 0;

  for (const [key, value] of Object.entries(catDefaults)) {
    const result = update.run(value, now, updater, key);
    if (result.changes > 0) count++;
  }

  // 如果重置了 AI 配置，刷新缓存
  if (category === 'ai') {
    try { refreshAIConfig(); } catch (err) { console.error('AI 配置刷新失败:', err); }
  }

  res.json({ message: `已重置 ${count} 项设置` });
});

// 上传品牌 Logo 图片
router.post('/upload-logo', logoUpload.single('logo'), (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    return res.status(400).json({ error: '请选择图片文件' });
  }

  const logoPath = `/uploads/logo/${file.filename}`;

  // 更新设置中的 logo 值
  const db = getDb();
  const now = Date.now();
  const updater = (req as any).user?.username || 'admin';

  // 删除旧 Logo 文件（如果存在且是上传的图片）
  const existing = db.prepare("SELECT value FROM settings WHERE key = 'brand.logo'").get() as any;
  if (existing?.value?.startsWith('/uploads/logo/')) {
    const oldPath = path.join(process.cwd(), 'data', existing.value);
    if (fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch { /* 忽略删除失败 */ }
    }
  }

  db.prepare(
    "INSERT INTO settings (key, value, category, label, description, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by"
  ).run('brand.logo', logoPath, 'brand', 'Logo', '品牌Logo（支持文字或图片URL）', now, updater);

  res.json({ url: logoPath, message: 'Logo 已上传' });
});

export default router;
