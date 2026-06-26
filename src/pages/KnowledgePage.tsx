// ============================================================
// 亮品牌 · 知识库管理页面（全局视角）
// 统一管理所有项目的知识库文件
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, Button, Space, Tag, Table, Input, Select,
  message, Modal, Empty, Tooltip, Badge, Row, Col, Statistic, Progress,
  Upload, Dropdown, Popconfirm, Drawer,
} from 'antd';
import {
  UploadOutlined, DeleteOutlined, SearchOutlined,
  FileTextOutlined, FileImageOutlined, FileUnknownOutlined,
  VideoCameraOutlined, EyeOutlined, DownloadOutlined,
  InboxOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  LoadingOutlined, FolderOutlined, TagOutlined,
  CloudUploadOutlined, DatabaseOutlined, AppstoreOutlined,
  EditOutlined, LinkOutlined,
} from '@ant-design/icons';
import {
  uploadFiles, getFiles, getFile, deleteFile, updateFileTags,
  searchFiles, getDownloadUrl, getStats, batchDelete, batchTag,
  batchMove, getTags,
  type KnowledgeFile, type KnowledgeStats, type TagInfo,
} from '../knowledge';
import * as storage from '../storage';
import type { Project } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

// ========== 工具函数 ==========

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'document': return <FileTextOutlined style={{ color: '#1890ff' }} />;
    case 'image': return <FileImageOutlined style={{ color: '#52c41a' }} />;
    case 'video': return <VideoCameraOutlined style={{ color: '#722ed1' }} />;
    default: return <FileUnknownOutlined style={{ color: '#999' }} />;
  }
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  uploading: { color: 'processing', label: '上传中', icon: <LoadingOutlined /> },
  extracting: { color: 'processing', label: '提取中', icon: <LoadingOutlined /> },
  ready: { color: 'success', label: '就绪', icon: <CheckCircleOutlined /> },
  error: { color: 'error', label: '失败', icon: <ExclamationCircleOutlined /> },
};

const FILE_TYPE_LABELS: Record<string, { color: string; label: string }> = {
  document: { color: 'blue', label: '文档' },
  image: { color: 'green', label: '图片' },
  video: { color: 'purple', label: '视频' },
  audio: { color: 'orange', label: '音频' },
  other: { color: 'default', label: '其他' },
};

// ========== 主组件 ==========

export default function KnowledgePage() {
  // 数据
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTags, setAllTags] = useState<TagInfo[]>([]);

  // 筛选
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('');

  // 操作
  const [uploading, setUploading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // 批量操作
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [batchTagInput, setBatchTagInput] = useState<string[]>([]);

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFiles({
        projectId: filterProject || undefined,
        search: searchKeyword || undefined,
      });
      let filtered = data;
      if (filterType) filtered = filtered.filter(f => f.fileType === filterType);
      if (filterStatus) filtered = filtered.filter(f => f.status === filterStatus);
      if (filterTag) filtered = filtered.filter(f => f.tags.includes(filterTag));
      setFiles(filtered);
    } catch (err: any) {
      message.error(err.message);
    }
    setLoading(false);
  }, [filterProject, searchKeyword, filterType, filterStatus, filterTag]);

  // 加载统计
  const loadStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch { /* ignore */ }
  }, []);

  // 加载项目列表（用于筛选和关联）
  const loadProjects = useCallback(async () => {
    try {
      const data = await storage.getProjects();
      setProjects(data);
    } catch { /* ignore */ }
  }, []);

  // 加载标签
  const loadTags = useCallback(async () => {
    try {
      const data = await getTags();
      setAllTags(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadFiles();
    loadStats();
    loadProjects();
    loadTags();
  }, [loadFiles, loadStats, loadProjects, loadTags]);

  // 上传
  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      await uploadFiles(files, filterProject || undefined);
      message.success(`成功上传 ${files.length} 个文件`);
      loadFiles();
      loadStats();
      loadTags();
    } catch (err: any) {
      message.error(err.message);
    }
    setUploading(false);
  };

  // 预览
  const handlePreview = async (fileId: string) => {
    setPreviewLoading(true);
    setPreviewFile(null);
    setPreviewContent('');
    try {
      const detail = await getFile(fileId);
      setPreviewFile(detail);
      setPreviewContent(detail.extractedText || '');
    } catch (err: any) {
      message.error(err.message);
    }
    setPreviewLoading(false);
  };

  // 删除单个
  const handleDelete = async (id: string, fileName: string) => {
    try {
      await deleteFile(id);
      message.success('已删除');
      loadFiles();
      loadStats();
      loadTags();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    try {
      const result = await batchDelete(selectedRowKeys);
      message.success(result.message);
      setSelectedRowKeys([]);
      loadFiles();
      loadStats();
      loadTags();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // 批量打标签
  const handleBatchTag = async () => {
    try {
      const result = await batchTag({ ids: selectedRowKeys, addTags: batchTagInput });
      message.success(result.message);
      setTagModalOpen(false);
      setBatchTagInput([]);
      setSelectedRowKeys([]);
      loadFiles();
      loadTags();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // 批量关联项目
  const handleBatchMove = async (projectId: string) => {
    try {
      const result = await batchMove(selectedRowKeys, projectId);
      message.success(result.message);
      setMoveModalOpen(false);
      setSelectedRowKeys([]);
      loadFiles();
      loadStats();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // 搜索
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadFiles();
      return;
    }
    setLoading(true);
    try {
      const results = await searchFiles({ keyword: searchKeyword, limit: 50 });
      setFiles(results.map(r => ({ ...r, tags: (r as any).tags || [] })));
    } catch (err: any) {
      message.error(err.message);
    }
    setLoading(false);
  };

  // 获取项目名称映射
  const projectNameMap: Record<string, string> = {};
  for (const p of projects) {
    projectNameMap[p.id] = p.name;
  }

  // 表格列定义
  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 260,
      ellipsis: true,
      render: (name: string, record: KnowledgeFile) => (
        <Space size={8}>
          {getFileIcon(record.fileType)}
          <Tooltip title={name}>
            <Text strong ellipsis style={{ maxWidth: 200 }}>{name}</Text>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      filters: [
        { text: '就绪', value: 'ready' },
        { text: '提取中', value: 'extracting' },
        { text: '失败', value: 'error' },
      ],
      render: (status: string) => {
        const info = STATUS_MAP[status] || STATUS_MAP.ready;
        return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
      },
    },
    {
      title: '类型',
      dataIndex: 'fileType',
      key: 'fileType',
      width: 80,
      filters: Object.entries(FILE_TYPE_LABELS).map(([k, v]) => ({ text: v.label, value: k })),
      render: (type: string) => {
        const info = FILE_TYPE_LABELS[type] || FILE_TYPE_LABELS.other;
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 90,
      sorter: (a: KnowledgeFile, b: KnowledgeFile) => a.fileSize - b.fileSize,
      render: (size: number) => formatSize(size),
    },
    {
      title: '关联项目',
      dataIndex: 'projectId',
      key: 'projectId',
      width: 180,
      ellipsis: true,
      render: (pid: string) => {
        if (!pid) return <Text type="secondary">未关联</Text>;
        const name = projectNameMap[pid] || pid.slice(0, 8) + '...';
        return <Text>{name}</Text>;
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 160,
      render: (tags: string[]) => (
        <Space size={4} wrap>
          {tags?.slice(0, 3).map(t => <Tag key={t} style={{ fontSize: 11 }}>{t}</Tag>)}
          {tags?.length > 3 && <Tag style={{ fontSize: 11 }}>+{tags.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '文本预览',
      key: 'preview',
      width: 200,
      ellipsis: true,
      render: (_: any, record: KnowledgeFile) => (
        record.textPreview ? (
          <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
            {record.textPreview.slice(0, 80)}...
          </Text>
        ) : <Text type="secondary" style={{ fontSize: 12 }}>无文本</Text>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a: KnowledgeFile, b: KnowledgeFile) => a.createdAt - b.createdAt,
      render: (ts: number) => new Date(ts).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: KnowledgeFile) => (
        <Space size={4}>
          {record.status === 'ready' && (
            <Tooltip title="预览">
              <Button type="link" size="small" icon={<EyeOutlined />}
                onClick={() => handlePreview(record.id)} />
            </Tooltip>
          )}
          <Tooltip title="下载">
            <Button type="link" size="small" icon={<DownloadOutlined />}
              onClick={() => window.open(getDownloadUrl(record.id))} />
          </Tooltip>
          <Popconfirm title={`删除「${record.fileName}」？`}
            onConfirm={() => handleDelete(record.id, record.fileName)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>📚 知识库管理</Title>
          <Text type="secondary">统一管理所有项目的参考文件与知识资产</Text>
        </div>
        <Space>
          <Button icon={uploading ? <LoadingOutlined /> : <CloudUploadOutlined />}
            onClick={() => { /* 点击上传区域触发 */ }}>
            {uploading ? '上传中...' : '上传文件'}
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="文件总数"
                value={stats.total}
                prefix={<DatabaseOutlined />}
                suffix="个"
                valueStyle={{ fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="就绪可用"
                value={stats.ready}
                prefix={<CheckCircleOutlined />}
                suffix={`/ ${stats.total}`}
                valueStyle={{ fontSize: 22, color: '#52c41a' }}
              />
              <Progress percent={stats.total > 0 ? Math.round((stats.ready / stats.total) * 100) : 0}
                size="small" showInfo={false} strokeColor="#52c41a" style={{ marginTop: 8 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="总存储"
                value={(stats.totalSize / (1024 * 1024)).toFixed(1)}
                prefix={<AppstoreOutlined />}
                suffix="MB"
                valueStyle={{ fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="处理失败"
                value={stats.error}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ fontSize: 22, color: stats.error > 0 ? '#ff4d4f' : undefined }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 上传区域 */}
      <Dragger
        multiple
        showUploadList={false}
        disabled={uploading}
        beforeUpload={(_file, fileList) => {
          if (fileList.indexOf(_file) === fileList.length - 1) {
            handleUpload(fileList as unknown as File[]);
          }
          return false;
        }}
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.json,.xml"
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持 PDF、Word、Excel、PPT、图片、视频等格式，单文件最大 100MB
        </p>
      </Dragger>

      {/* 筛选栏 + 批量操作 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索文件名或内容..."
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              onClear={() => { setSearchKeyword(''); loadFiles(); }}
            />
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              placeholder="关联项目"
              value={filterProject || undefined}
              onChange={v => setFilterProject(v || '')}
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: '', label: '全部项目' },
                { value: '__none__', label: '未关联' },
                ...projects.map(p => ({ value: p.id, label: p.name })),
              ]}
            />
          </Col>
          <Col xs={6} sm={4} md={3}>
            <Select
              placeholder="文件类型"
              value={filterType || undefined}
              onChange={v => setFilterType(v || '')}
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: '', label: '全部类型' },
                ...Object.entries(FILE_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
            />
          </Col>
          <Col xs={6} sm={4} md={3}>
            <Select
              placeholder="状态"
              value={filterStatus || undefined}
              onChange={v => setFilterStatus(v || '')}
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: '', label: '全部状态' },
                { value: 'ready', label: '就绪' },
                { value: 'extracting', label: '提取中' },
                { value: 'error', label: '失败' },
              ]}
            />
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              placeholder="标签筛选"
              value={filterTag || undefined}
              onChange={v => setFilterTag(v || '')}
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: '', label: '全部标签' },
                ...allTags.map(t => ({ value: t.name, label: `${t.name} (${t.count})` })),
              ]}
            />
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button onClick={() => {
                setSearchKeyword('');
                setFilterProject('');
                setFilterType('');
                setFilterStatus('');
                setFilterTag('');
              }}>重置</Button>
            </Space>
          </Col>
        </Row>

        {/* 批量操作栏 */}
        {selectedRowKeys.length > 0 && (
          <div style={{
            marginTop: 12, padding: '8px 16px',
            background: '#f0f5ff', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Space>
              <Tag color="blue">{selectedRowKeys.length} 个文件已选中</Tag>
            </Space>
            <Space>
              <Button size="small" icon={<TagOutlined />}
                onClick={() => setTagModalOpen(true)}>批量打标签</Button>
              <Button size="small" icon={<LinkOutlined />}
                onClick={() => setMoveModalOpen(true)}>关联项目</Button>
              <Popconfirm
                title={`确认删除 ${selectedRowKeys.length} 个文件？`}
                description="删除后无法恢复，包括物理文件"
                onConfirm={handleBatchDelete}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>批量删除</Button>
              </Popconfirm>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Space>
          </div>
        )}
      </Card>

      {/* 文件列表表格 */}
      <Card size="small">
        <Table
          dataSource={files}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个文件`,
          }}
          locale={{ emptyText: <Empty description="知识库为空，请上传参考文件" /> }}
        />
      </Card>

      {/* 文件预览抽屉 */}
      <Drawer
        title={previewFile?.fileName || '文件详情'}
        open={!!previewFile || previewLoading}
        onClose={() => { setPreviewFile(null); setPreviewContent(''); }}
        width={window.innerWidth <= 768 ? '100%' : 700}
        extra={
          previewFile && (
            <Space>
              {previewFile.tags.length > 0 && previewFile.tags.map(t => (
                <Tag key={t}>{t}</Tag>
              ))}
              <Button icon={<DownloadOutlined />}
                onClick={() => previewFile && window.open(getDownloadUrl(previewFile.id))}>
                下载
              </Button>
            </Space>
          )
        }
      >
        {previewLoading && <div style={{ textAlign: 'center', padding: 40 }}><LoadingOutlined style={{ fontSize: 24 }} /></div>}
        {previewFile && !previewLoading && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag>{FILE_TYPE_LABELS[previewFile.fileType]?.label || previewFile.fileType}</Tag>
              <Tag>{formatSize(previewFile.fileSize)}</Tag>
              <Tag color={STATUS_MAP[previewFile.status]?.color}>{STATUS_MAP[previewFile.status]?.label}</Tag>
              {previewFile.projectId && (
                <Tag icon={<FolderOutlined />}>{projectNameMap[previewFile.projectId] || '未知项目'}</Tag>
              )}
            </Space>

            {/* 标签编辑 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>标签：</Text>
              <Select
                mode="tags"
                style={{ width: '100%', marginTop: 8 }}
                placeholder="输入标签后按回车添加"
                defaultValue={previewFile.tags}
                onChange={async (newTags) => {
                  try {
                    await updateFileTags(previewFile.id, newTags);
                    message.success('标签已更新');
                    loadFiles();
                    loadTags();
                  } catch (err: any) {
                    message.error(err.message);
                  }
                }}
              />
            </div>

            {/* 提取文本 */}
            {previewContent ? (
              <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>
                  提取文本（{previewContent.length} 字）
                </Text>
                <div
                  style={{
                    maxHeight: 500,
                    overflow: 'auto',
                    padding: 16,
                    background: '#fafafa',
                    borderRadius: 6,
                    fontSize: 13,
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    border: '1px solid #f0f0f0',
                  }}
                >
                  {previewContent}
                </div>
              </div>
            ) : (
              <Empty description="该文件暂无可提取的文本内容" />
            )}
          </div>
        )}
      </Drawer>

      {/* 批量打标签弹窗 */}
      <Modal
        title={`批量打标签（${selectedRowKeys.length} 个文件）`}
        open={tagModalOpen}
        onCancel={() => { setTagModalOpen(false); setBatchTagInput([]); }}
        onOk={handleBatchTag}
        okText="应用"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">输入标签后按回车添加，这些标签将被追加到所选文件上</Text>
        </div>
        {/* 已有标签快速选择 */}
        {allTags.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>常用标签：</Text>
            <Space wrap>
              {allTags.slice(0, 20).map(t => (
                <Tag.CheckableTag
                  key={t.name}
                  checked={batchTagInput.includes(t.name)}
                  onChange={(checked) => {
                    if (checked) {
                      setBatchTagInput(prev => [...prev, t.name]);
                    } else {
                      setBatchTagInput(prev => prev.filter(x => x !== t.name));
                    }
                  }}
                >
                  {t.name} ({t.count})
                </Tag.CheckableTag>
              ))}
            </Space>
          </div>
        )}
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder="输入自定义标签..."
          value={batchTagInput}
          onChange={setBatchTagInput}
        />
      </Modal>

      {/* 批量关联项目弹窗 */}
      <Modal
        title={`关联项目（${selectedRowKeys.length} 个文件）`}
        open={moveModalOpen}
        onCancel={() => setMoveModalOpen(false)}
        footer={null}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">选择要关联的项目，所选文件将归属到该项目</Text>
        </div>
        <Select
          style={{ width: '100%' }}
          placeholder="选择项目..."
          allowClear
          showSearch
          optionFilterProp="label"
          onChange={(value) => {
            handleBatchMove(value || '');
          }}
          options={[
            { value: '', label: '取消关联' },
            ...projects.map(p => ({ value: p.id, label: p.name })),
          ]}
        />
      </Modal>
    </div>
  );
}
