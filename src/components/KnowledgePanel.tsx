// ============================================================
// 亮品牌 · 知识库面板组件
// 支持文件上传、管理、搜索、选择参考文件
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Upload, Button, Space, Tag, List, Input, Select,
  message, Modal, Empty, Progress, Tooltip, Badge, Typography,
  Dropdown,
} from 'antd';
import {
  UploadOutlined, DeleteOutlined, SearchOutlined,
  FileTextOutlined, FileImageOutlined, FileUnknownOutlined,
  VideoCameraOutlined, EyeOutlined, DownloadOutlined,
  PlusOutlined, TagOutlined, InboxOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, LoadingOutlined,
} from '@ant-design/icons';
import {
  uploadFiles, getFiles, deleteFile, updateFileTags,
  searchFiles, getDownloadUrl,
  type KnowledgeFile,
} from '../knowledge';

const { Text, Paragraph } = Typography;
const { Dragger } = Upload;

// 文件类型图标
function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'document': return <FileTextOutlined style={{ color: '#1890ff' }} />;
    case 'image': return <FileImageOutlined style={{ color: '#52c41a' }} />;
    case 'video': return <VideoCameraOutlined style={{ color: '#722ed1' }} />;
    default: return <FileUnknownOutlined style={{ color: '#999' }} />;
  }
}

// 文件大小格式化
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 状态标签
const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  uploading: { color: 'processing', label: '上传中', icon: <LoadingOutlined /> },
  extracting: { color: 'processing', label: '提取中', icon: <LoadingOutlined /> },
  ready: { color: 'success', label: '就绪', icon: <CheckCircleOutlined /> },
  error: { color: 'error', label: '失败', icon: <ExclamationCircleOutlined /> },
};

interface KnowledgePanelProps {
  /** 当前项目ID，用于关联文件 */
  projectId?: string;
  /** 选择模式：是否允许选择文件作为AI参考 */
  selectable?: boolean;
  /** 已选中的文件ID列表 */
  selectedFileIds?: string[];
  /** 选中文件变更回调 */
  onSelectionChange?: (fileIds: string[]) => void;
  /** 简洁模式（嵌入到弹窗中） */
  compact?: boolean;
}

export default function KnowledgePanel({
  projectId,
  selectable = false,
  selectedFileIds = [],
  onSelectionChange,
  compact = false,
}: KnowledgePanelProps) {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFiles({ projectId, search: searchKeyword || undefined });
      setFiles(data);
    } catch (err: any) {
      message.error(err.message);
    }
    setLoading(false);
  }, [projectId, searchKeyword]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      await uploadFiles(files, projectId);
      message.success(`成功上传 ${files.length} 个文件`);
      loadFiles();
    } catch (err: any) {
      message.error(err.message);
    }
    setUploading(false);
  };

  const handleDelete = async (id: string, fileName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文件「${fileName}」吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteFile(id);
          message.success('已删除');
          loadFiles();
        } catch (err: any) {
          message.error(err.message);
        }
      },
    });
  };

  const toggleSelect = (fileId: string) => {
    if (!selectable) return;
    const newIds = selectedFileIds.includes(fileId)
      ? selectedFileIds.filter(id => id !== fileId)
      : [...selectedFileIds, fileId];
    onSelectionChange?.(newIds);
  };

  const uploadDragger = (
    <Dragger
      multiple
      showUploadList={false}
      disabled={uploading}
      beforeUpload={(_file, fileList) => {
        // 只有最后一个文件时触发上传
        if (fileList.indexOf(_file) === fileList.length - 1) {
          handleUpload(fileList as unknown as File[]);
        }
        return false; // 阻止自动上传
      }}
      accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.json,.xml"
    >
      <p className="ant-upload-drag-icon"><InboxOutlined /></p>
      <p className="ant-upload-text">点击或拖拽文件上传</p>
      <p className="ant-upload-hint">
        支持 PDF、Word、Excel、PPT、图片、视频等格式
      </p>
    </Dragger>
  );

  if (compact) {
    return (
      <div>
        {!compact && <div style={{ marginBottom: 12 }}>{uploadDragger}</div>}
        <Input
          placeholder="搜索文件..."
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          allowClear
          style={{ marginBottom: 12 }}
        />
        <List
          size="small"
          loading={loading}
          dataSource={files}
          locale={{ emptyText: <Empty description="暂无文件" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          style={{ maxHeight: 400, overflow: 'auto' }}
          renderItem={file => {
            const statusInfo = STATUS_MAP[file.status] || STATUS_MAP.ready;
            const isSelected = selectedFileIds.includes(file.id);

            return (
              <List.Item
                key={file.id}
                style={{
                  padding: '8px 12px',
                  cursor: selectable ? 'pointer' : 'default',
                  background: isSelected ? '#f0f5ff' : undefined,
                  borderRadius: 4,
                  marginBottom: 4,
                }}
                onClick={() => toggleSelect(file.id)}
                actions={[
                  selectable && (
                    <Tag color={isSelected ? 'blue' : 'default'} key="select">
                      {isSelected ? '已选为参考' : '选为参考'}
                    </Tag>
                  ),
                  file.status === 'ready' && (
                    <Tooltip title="查看" key="view">
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                      />
                    </Tooltip>
                  ),
                  <Tooltip title="下载" key="download">
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={(e) => { e.stopPropagation(); window.open(getDownloadUrl(file.id)); }}
                    />
                  </Tooltip>,
                  <Tooltip title="删除" key="delete">
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => { e.stopPropagation(); handleDelete(file.id, file.fileName); }}
                    />
                  </Tooltip>
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getFileIcon(file.fileType)}
                  title={
                    <Space size={4}>
                      <Text ellipsis style={{ maxWidth: 200 }}>{file.fileName}</Text>
                      <Tag color={statusInfo.color} style={{ fontSize: 10 }}>
                        {statusInfo.label}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatSize(file.fileSize)}
                      {file.textPreview && ` · ${file.textPreview.slice(0, 50)}...`}
                    </Text>
                  }
                />
              </List.Item>
            );
          }}
        />

        {/* 文件预览弹窗 */}
        <Modal
          title={previewFile?.fileName || '文件详情'}
          open={!!previewFile}
          onCancel={() => setPreviewFile(null)}
          width={700}
          footer={[
            <Button key="close" onClick={() => setPreviewFile(null)}>关闭</Button>,
          ]}
        >
          {previewFile && (
            <div>
              <Space style={{ marginBottom: 16 }}>
                <Tag>{previewFile.fileType}</Tag>
                <Tag>{formatSize(previewFile.fileSize)}</Tag>
                <Tag color={STATUS_MAP[previewFile.status].color}>{STATUS_MAP[previewFile.status].label}</Tag>
              </Space>
              {previewFile.tags.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ marginRight: 8 }}>标签：</span>
                  {previewFile.tags.map(t => <Tag key={t}>{t}</Tag>)}
                </div>
              )}
              {previewFile.extractedText ? (
                <div
                  style={{
                    maxHeight: 400,
                    overflow: 'auto',
                    padding: 12,
                    background: '#fafafa',
                    borderRadius: 4,
                    fontSize: 13,
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {previewFile.extractedText}
                </div>
              ) : (
                <Empty description="暂无提取的文本内容" />
              )}
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <Card
      title={
        <Space>
          <span>知识库</span>
          {selectedFileIds.length > 0 && (
            <Badge count={selectedFileIds.length} style={{ backgroundColor: '#1890ff' }}>
              <span>已选参考文件</span>
            </Badge>
          )}
        </Space>
      }
      extra={
        <Space>
          <Input
            placeholder="搜索..."
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            allowClear
            style={{ width: 200 }}
            size="small"
          />
          <Button
            icon={<SearchOutlined />}
            size="small"
            onClick={() => loadFiles()}
          >
            刷新
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {/* 上传区域 */}
      {uploadDragger}

      {/* 文件列表 */}
      <div style={{ marginTop: 16 }}>
        <List
          loading={loading}
          dataSource={files}
          locale={{ emptyText: <Empty description="知识库为空，请上传参考文件" /> }}
          renderItem={file => {
            const statusInfo = STATUS_MAP[file.status] || STATUS_MAP.ready;
            const isSelected = selectedFileIds.includes(file.id);

            return (
              <List.Item
                key={file.id}
                style={{
                  cursor: selectable ? 'pointer' : 'default',
                  background: isSelected ? '#e6f4ff' : undefined,
                  borderRadius: 6,
                  marginBottom: 4,
                  padding: '10px 16px',
                  border: isSelected ? '1px solid #1890ff' : '1px solid #f0f0f0',
                }}
                onClick={() => toggleSelect(file.id)}
                actions={[
                  selectable && (
                    <Button
                      key="select"
                      size="small"
                      type={isSelected ? 'primary' : 'default'}
                      ghost={isSelected}
                      onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
                    >
                      {isSelected ? '✓ 已选为参考' : '选为参考'}
                    </Button>
                  ),
                  file.status === 'ready' && (
                    <Tooltip title="预览" key="view">
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                      />
                    </Tooltip>
                  ),
                  <Tooltip title="下载" key="download">
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={(e) => { e.stopPropagation(); window.open(getDownloadUrl(file.id)); }}
                    />
                  </Tooltip>,
                  <Tooltip title="删除" key="delete">
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => { e.stopPropagation(); handleDelete(file.id, file.fileName); }}
                    />
                  </Tooltip>
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getFileIcon(file.fileType)}
                  title={
                    <Space size={4}>
                      <Text strong>{file.fileName}</Text>
                      <Tag color={statusInfo.color} icon={statusInfo.icon} style={{ fontSize: 10 }}>
                        {statusInfo.label}
                      </Tag>
                      {file.tags.map(t => <Tag key={t} style={{ fontSize: 10 }}>{t}</Tag>)}
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatSize(file.fileSize)}
                      </Text>
                      {file.textPreview && (
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }} ellipsis>
                          {file.textPreview.slice(0, 80)}...
                        </Text>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </div>

      {/* 文件预览弹窗 */}
      <Modal
        title={previewFile?.fileName || '文件详情'}
        open={!!previewFile}
        onCancel={() => setPreviewFile(null)}
        width={700}
        footer={[
          <Button key="download" onClick={() => previewFile && window.open(getDownloadUrl(previewFile.id))}>
            下载原文件
          </Button>,
          <Button key="close" type="primary" onClick={() => setPreviewFile(null)}>
            关闭
          </Button>,
        ]}
      >
        {previewFile && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag>{previewFile.fileType}</Tag>
              <Tag>{formatSize(previewFile.fileSize)}</Tag>
              <Tag color={STATUS_MAP[previewFile.status].color}>{STATUS_MAP[previewFile.status].label}</Tag>
            </Space>
            {previewFile.tags.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text strong>标签：</Text>
                {previewFile.tags.map(t => <Tag key={t}>{t}</Tag>)}
              </div>
            )}
            {previewFile.extractedText ? (
              <div
                style={{
                  maxHeight: 400,
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
                {previewFile.extractedText}
              </div>
            ) : (
              <Empty description="暂无提取的文本内容" />
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
