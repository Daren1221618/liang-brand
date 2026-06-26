import React from 'react';
import { Drawer, Button, Space, Tag, message } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import KnowledgePanel from '../../components/KnowledgePanel';

interface KnowledgeDrawerProps {
  open: boolean;
  projectId: string;
  selectedKnowledgeIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onClose: () => void;
}

export default function KnowledgeDrawer({
  open, projectId, selectedKnowledgeIds,
  onSelectionChange, onClose,
}: KnowledgeDrawerProps) {
  return (
    <Drawer
      title={
        <Space>
          <BookOutlined />
          <span>知识库 - 选择AI参考文件</span>
          {selectedKnowledgeIds.length > 0 && (
            <Tag color="blue">{selectedKnowledgeIds.length} 个已选</Tag>
          )}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={window.innerWidth <= 768 ? '100%' : 500}
      extra={
        <Space>
          {selectedKnowledgeIds.length > 0 && (
            <Button size="small" onClick={() => { onSelectionChange([]); message.info('已清空选择'); }}>
              清空选择
            </Button>
          )}
          <Button type="primary" size="small" onClick={() => {
            onClose();
            message.success(`已选择 ${selectedKnowledgeIds.length} 个参考文件`);
          }}>
            确认
          </Button>
        </Space>
      }
    >
      <KnowledgePanel
        projectId={projectId}
        selectable
        selectedFileIds={selectedKnowledgeIds}
        onSelectionChange={onSelectionChange}
        compact
      />
    </Drawer>
  );
}
