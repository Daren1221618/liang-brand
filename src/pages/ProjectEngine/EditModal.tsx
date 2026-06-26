import React from 'react';
import { Modal, Button, Input, Divider, Space, Typography, Upload, message } from 'antd';
import {
  UploadOutlined, RobotOutlined,
} from '@ant-design/icons';
import type { ProjectDeliverable } from '../../types';

const { TextArea } = Input;
const { Text } = Typography;

interface EditModalProps {
  open: boolean;
  deliverable: ProjectDeliverable | null;
  editContent: string;
  onContentChange: (content: string) => void;
  onClose: () => void;
  onSave: () => void;
  onSaveAndSubmit: () => void;
  onAIGenerate: (id: string) => void;
}

export default function EditModal({
  open, deliverable, editContent,
  onContentChange, onClose, onSave, onSaveAndSubmit, onAIGenerate,
}: EditModalProps) {
  return (
    <Modal
      title={`编辑 - ${deliverable?.name || ''}`}
      open={open}
      onCancel={onClose}
      width={Math.min(800, window.innerWidth - 32)}
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="save" onClick={onSave}>保存</Button>,
        <Button key="submit" type="primary" onClick={onSaveAndSubmit}>保存并提交审核</Button>,
      ]}
    >
      <TextArea
        rows={16}
        value={editContent}
        onChange={e => onContentChange(e.target.value)}
        placeholder="请输入内容，支持 Markdown 格式..."
        style={{ fontFamily: 'monospace' }}
      />
      <Divider style={{ margin: '12px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const text = e.target?.result as string;
                onContentChange(editContent ? editContent + '\n\n' + text : text);
                message.success(`已导入文件：${file.name}`);
              };
              reader.readAsText(file);
              return false;
            }}
            accept=".txt,.md,.csv,.json"
          >
            <Button icon={<UploadOutlined />}>导入文件内容</Button>
          </Upload>
          <Button icon={<RobotOutlined />} onClick={() => {
            if (deliverable) {
              onClose();
              onAIGenerate(deliverable.id);
            }
          }}>AI生成</Button>
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>支持 .txt .md .csv .json 文件导入</Text>
      </div>
    </Modal>
  );
}
