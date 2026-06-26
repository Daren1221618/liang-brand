import React from 'react';
import { Modal, Button, Input } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ProjectDeliverable } from '../../types';

const { TextArea } = Input;

interface ReviewModalProps {
  open: boolean;
  deliverable: ProjectDeliverable | null;
  reviewComment: string;
  onCommentChange: (comment: string) => void;
  onClose: () => void;
  onReview: (approved: boolean) => void;
}

export default function ReviewModal({
  open, deliverable, reviewComment,
  onCommentChange, onClose, onReview,
}: ReviewModalProps) {
  return (
    <Modal
      title={`审核 - ${deliverable?.name || ''}`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="reject" danger icon={<CloseCircleOutlined />} onClick={() => onReview(false)}>
          退回修改
        </Button>,
        <Button key="approve" type="primary" icon={<CheckCircleOutlined />} onClick={() => onReview(true)}>
          审核通过
        </Button>,
      ]}
    >
      {deliverable?.content && (
        <div className="content-preview" style={{ marginBottom: 16, maxHeight: 300, overflow: 'auto' }}>
          {deliverable.content}
        </div>
      )}
      <TextArea
        rows={4}
        value={reviewComment}
        onChange={e => onCommentChange(e.target.value)}
        placeholder="请输入审核意见（退回修改时必填）..."
      />
    </Modal>
  );
}
