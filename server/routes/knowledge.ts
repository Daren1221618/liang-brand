// ============================================================
// 亮品牌 · 知识库模块
// 支持多种文件类型上传、文本提取、RAG 检索
// V1：文件上传 + 文本提取 + 简单检索
// V2：向量嵌入 + 语义检索
// ============================================================

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getDb, genId } from '../db.js';

const router = Router();

// ========== 文件存储配置 ==========

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads');
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${hash}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    // 允许的文件类型
    const allowed = [
      // 文档
      '.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.xlsx', '.xls', '.ppt', '.pptx',
      // 图片
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
      // 视频
      '.mp4', '.mov', '.avi', '.webm', '.mkv',
      // 音频
      '.mp3', '.wav', '.ogg',
      // 其他
      '.json', '.xml', '.html', '.htm',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${ext}`));
    }
  },
});

// ========== 数据库初始化（知识库表） ==========

export function initKnowledgeSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_files (
      id TEXT PRIMARY KEY,
      project_id TEXT DEFAULT '',
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT DEFAULT '',
      status TEXT DEFAULT 'uploading',
      extracted_text TEXT DEFAULT '',
      error_message TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_kf_project ON knowledge_files(project_id);
    CREATE INDEX IF NOT EXISTS idx_kf_status ON knowledge_files(status);
  `);
}

// ========== 文件类型判断 ==========

function getFileCategory(mimeType: string, ext: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xlsx', 'xls', 'ppt', 'pptx', 'json', 'xml', 'html', 'htm'].includes(ext)) return 'document';
  return 'other';
}

// ========== 文本提取（V1：基础版） ==========

async function extractText(filePath: string, fileName: string, mimeType: string): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();

  // 文本类文件直接读取
  if (['.txt', '.md', '.csv', '.json', '.xml', '.html', '.htm'].includes(ext)) {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  // PDF 提取
  if (ext === '.pdf') {
    try {
      // V1: 使用简单的 PDF 文本提取（后续可升级为 pdf-parse）
      const pdfParse = await import('pdf-parse' as any).catch(() => null);
      if (pdfParse) {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse.default(buffer);
        return data.text || '';
      }
      return '[PDF文件已上传。完整文本提取需要安装 pdf-parse 依赖。]';
    } catch {
      return '[PDF文件已上传，文本提取失败]';
    }
  }

  // Word 文档
  if (['.doc', '.docx'].includes(ext)) {
    try {
      const mammoth = await import('mammoth' as any).catch(() => null);
      if (mammoth) {
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      }
      return '[Word文档已上传。完整文本提取需要安装 mammoth 依赖。]';
    } catch {
      return '[Word文档已上传，文本提取失败]';
    }
  }

  // Excel
  if (['.xlsx', '.xls'].includes(ext)) {
    try {
      const xlsx = await import('xlsx' as any).catch(() => null);
      if (xlsx) {
        const workbook = xlsx.readFile(filePath);
        const texts: string[] = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csv = xlsx.utils.sheet_to_csv(sheet);
          texts.push(`--- Sheet: ${sheetName} ---\n${csv}`);
        }
        return texts.join('\n\n');
      }
      return '[Excel文件已上传。完整文本提取需要安装 xlsx 依赖。]';
    } catch {
      return '[Excel文件已上传，文本提取失败]';
    }
  }

  // PPT
  if (['.ppt', '.pptx'].includes(ext)) {
    return '[PPT文件已上传。文本提取功能即将支持。]';
  }

  // 图片 - 返回元信息
  if (mimeType.startsWith('image/')) {
    const stats = fs.statSync(filePath);
    return `[图片文件: ${fileName}, 大小: ${stats.size} bytes。V2版本将支持 OCR 和图像理解。]`;
  }

  // 视频
  if (mimeType.startsWith('video/')) {
    const stats = fs.statSync(filePath);
    return `[视频文件: ${fileName}, 大小: ${stats.size} bytes。V2版本将支持视频内容分析。]`;
  }

  return `[文件: ${fileName} 已上传，暂不支持该类型文本提取]`;
}

// ========== POST /api/knowledge/upload — 文件上传 ==========

router.post('/upload', upload.array('files', 20), async (req: Request, res: Response) => {
  const { projectId = '', tags = '[]' } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: '未选择文件' });
  }

  const db = getDb();
  const results: any[] = [];

  for (const file of files) {
    const id = genId();
    const ext = path.extname(file.originalname).toLowerCase();
    const category = getFileCategory(file.mimetype, ext);
    const now = Date.now();

    // 插入记录
    db.prepare(
      'INSERT INTO knowledge_files (id, project_id, file_name, original_name, file_path, file_type, file_size, mime_type, status, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, projectId, file.filename, file.originalname, file.path, category, file.size, file.mimetype, 'extracting', tags, now, now);

    // 异步提取文本（不阻塞响应）
    extractText(file.path, file.originalname, file.mimetype)
      .then(text => {
        db.prepare('UPDATE knowledge_files SET extracted_text = ?, status = ?, updated_at = ? WHERE id = ?')
          .run(text.slice(0, 100000), 'ready', Date.now(), id); // 限制 100KB 文本
      })
      .catch(err => {
        db.prepare('UPDATE knowledge_files SET status = ?, error_message = ?, updated_at = ? WHERE id = ?')
          .run('error', err.message, Date.now(), id);
      });

    results.push({
      id,
      fileName: file.originalname,
      fileType: category,
      fileSize: file.size,
      status: 'extracting',
    });
  }

  res.json({ message: `成功上传 ${files.length} 个文件`, files: results });
});

// ========== GET /api/knowledge/files — 获取文件列表 ==========

router.get('/files', (req: Request, res: Response) => {
  const { projectId, status, search } = req.query;
  const db = getDb();

  let sql = 'SELECT * FROM knowledge_files WHERE 1=1';
  const params: any[] = [];

  if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (search) { sql += ' AND (original_name LIKE ? OR extracted_text LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  sql += ' ORDER BY created_at DESC';

  const files = db.prepare(sql).all(...params) as any[];

  res.json(files.map(f => ({
    id: f.id,
    projectId: f.project_id,
    fileName: f.original_name,
    fileType: f.file_type,
    fileSize: f.file_size,
    status: f.status,
    tags: JSON.parse(f.tags || '[]'),
    errorMessage: f.error_message,
    textPreview: f.extracted_text ? f.extracted_text.slice(0, 200) : '',
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  })));
});

// ========== GET /api/knowledge/files/:id — 获取单个文件详情 ==========

router.get('/files/:id', (req: Request, res: Response) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM knowledge_files WHERE id = ?').get(req.params.id) as any;
  if (!file) return res.status(404).json({ error: '文件不存在' });

  res.json({
    id: file.id,
    projectId: file.project_id,
    fileName: file.original_name,
    fileType: file.file_type,
    fileSize: file.file_size,
    mimeType: file.mime_type,
    status: file.status,
    tags: JSON.parse(file.tags || '[]'),
    errorMessage: file.error_message,
    extractedText: file.extracted_text,
    createdAt: file.created_at,
    updatedAt: file.updated_at,
  });
});

// ========== DELETE /api/knowledge/files/:id — 删除文件 ==========

router.delete('/files/:id', (req: Request, res: Response) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM knowledge_files WHERE id = ?').get(req.params.id) as any;
  if (!file) return res.status(404).json({ error: '文件不存在' });

  // 删除物理文件
  try {
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }
  } catch { /* ignore */ }

  db.prepare('DELETE FROM knowledge_files WHERE id = ?').run(req.params.id);
  res.json({ message: '文件已删除' });
});

// ========== PUT /api/knowledge/files/:id — 更新标签 ==========

router.put('/files/:id', (req: Request, res: Response) => {
  const { tags, projectId } = req.body;
  const db = getDb();

  const updates: string[] = [];
  const values: any[] = [];

  if (tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(tags)); }
  if (projectId !== undefined) { updates.push('project_id = ?'); values.push(projectId); }

  if (updates.length === 0) return res.status(400).json({ error: '无更新字段' });

  updates.push('updated_at = ?');
  values.push(Date.now());
  values.push(req.params.id);

  db.prepare(`UPDATE knowledge_files SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ message: '更新成功' });
});

// ========== POST /api/knowledge/search — 简单文本检索 ==========

router.post('/search', (req: Request, res: Response) => {
  const { keyword, projectId, limit = 10 } = req.body;
  if (!keyword) return res.status(400).json({ error: '缺少搜索关键词' });

  const db = getDb();
  let sql = 'SELECT * FROM knowledge_files WHERE status = ? AND extracted_text LIKE ?';
  const params: any[] = ['ready', `%${keyword}%`];

  if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const files = db.prepare(sql).all(...params) as any[];

  res.json(files.map(f => ({
    id: f.id,
    projectId: f.project_id,
    fileName: f.original_name,
    fileType: f.file_type,
    fileSize: f.file_size,
    textPreview: f.extracted_text ? f.extracted_text.slice(0, 300) : '',
    matchedText: extractMatchedText(f.extracted_text, keyword),
    createdAt: f.created_at,
  })));
});

/** 提取匹配关键词前后的文本片段 */
function extractMatchedText(text: string, keyword: string): string {
  if (!text) return '';
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return '';
  const start = Math.max(0, idx - 100);
  const end = Math.min(text.length, idx + keyword.length + 200);
  return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
}

// ========== GET /api/knowledge/download/:id — 下载文件 ==========

router.get('/download/:id', (req: Request, res: Response) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM knowledge_files WHERE id = ?').get(req.params.id) as any;
  if (!file) return res.status(404).json({ error: '文件不存在' });
  if (!fs.existsSync(file.file_path)) return res.status(404).json({ error: '文件已被删除' });

  res.download(file.file_path, file.original_name);
});

// ========== GET /api/knowledge/stats — 知识库统计 ==========

router.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();

  const total = (db.prepare('SELECT COUNT(*) as c FROM knowledge_files').get() as any).c;
  const ready = (db.prepare("SELECT COUNT(*) as c FROM knowledge_files WHERE status = 'ready'").get() as any).c;
  const extracting = (db.prepare("SELECT COUNT(*) as c FROM knowledge_files WHERE status = 'extracting'").get() as any).c;
  const error = (db.prepare("SELECT COUNT(*) as c FROM knowledge_files WHERE status = 'error'").get() as any).c;
  const totalSize = (db.prepare('SELECT COALESCE(SUM(file_size), 0) as s FROM knowledge_files').get() as any).s;

  // 按类型统计
  const byType = db.prepare('SELECT file_type as type, COUNT(*) as count FROM knowledge_files GROUP BY file_type').all() as any[];
  // 按项目统计
  const byProject = db.prepare(`
    SELECT COALESCE(NULLIF(project_id, ''), '未关联项目') as projectId, COUNT(*) as count 
    FROM knowledge_files GROUP BY COALESCE(NULLIF(project_id, ''), '未关联项目')
  `).all() as any[];

  res.json({ total, ready, extracting, error, totalSize, byType, byProject });
});

// ========== POST /api/knowledge/batch-delete — 批量删除 ==========

router.post('/batch-delete', (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择要删除的文件' });
  }

  const db = getDb();
  let deleted = 0;

  for (const id of ids) {
    const file = db.prepare('SELECT * FROM knowledge_files WHERE id = ?').get(id) as any;
    if (file) {
      try { if (fs.existsSync(file.file_path)) fs.unlinkSync(file.file_path); } catch { /* ignore */ }
      db.prepare('DELETE FROM knowledge_files WHERE id = ?').run(id);
      deleted++;
    }
  }

  res.json({ message: `已删除 ${deleted} 个文件` });
});

// ========== POST /api/knowledge/batch-tag — 批量设置标签 ==========

router.post('/batch-tag', (req: Request, res: Response) => {
  const { ids, tags, addTags, removeTags } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择文件' });
  }

  const db = getDb();
  let updated = 0;

  for (const id of ids) {
    const file = db.prepare('SELECT tags FROM knowledge_files WHERE id = ?').get(id) as any;
    if (!file) continue;

    let currentTags: string[] = JSON.parse(file.tags || '[]');

    if (tags !== undefined) {
      currentTags = tags;
    } else {
      if (Array.isArray(addTags)) {
        const tagSet = new Set(currentTags);
        addTags.forEach((t: string) => tagSet.add(t));
        currentTags = [...tagSet];
      }
      if (Array.isArray(removeTags)) {
        const removeSet = new Set(removeTags);
        currentTags = currentTags.filter(t => !removeSet.has(t));
      }
    }

    db.prepare('UPDATE knowledge_files SET tags = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(currentTags), Date.now(), id);
    updated++;
  }

  res.json({ message: `已更新 ${updated} 个文件的标签` });
});

// ========== POST /api/knowledge/batch-move — 批量关联项目 ==========

router.post('/batch-move', (req: Request, res: Response) => {
  const { ids, projectId } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择文件' });
  }

  const db = getDb();
  const result = db.prepare('UPDATE knowledge_files SET project_id = ?, updated_at = ? WHERE id = ?')
    .run(projectId || '', Date.now(), ...ids);

  // SQLite run returns changes count for single param, need loop for array
  let updated = 0;
  for (const id of ids) {
    db.prepare('UPDATE knowledge_files SET project_id = ?, updated_at = ? WHERE id = ?')
      .run(projectId || '', Date.now(), id);
    updated++;
  }

  res.json({ message: `已将 ${updated} 个文件关联到项目` });
});

// ========== GET /api/knowledge/tags — 获取所有标签 ==========

router.get('/tags', (_req: Request, res: Response) => {
  const db = getDb();
  const files = db.prepare("SELECT tags FROM knowledge_files WHERE tags != '[]'").all() as any[];

  const tagCount: Record<string, number> = {};
  for (const f of files) {
    try {
      const tags: string[] = JSON.parse(f.tags || '[]');
      for (const t of tags) {
        tagCount[t] = (tagCount[t] || 0) + 1;
      }
    } catch { /* ignore */ }
  }

  const tags = Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  res.json(tags);
});

export default router;
