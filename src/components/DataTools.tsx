// ============================================================
// 亮品牌 · 数据工具组件（导出/导入）
// 从 App.tsx 拆出，通过 ref 暴露方法
// ============================================================

import React, { forwardRef, useImperativeHandle } from 'react';
import { Modal, message } from 'antd';
import * as storage from '../storage';

export interface DataToolsProps {
  onImportComplete?: () => void;
}

export interface DataToolsRef {
  exportData: () => Promise<void>;
  importData: () => void;
}

export default forwardRef<DataToolsRef, DataToolsProps>(function DataTools({ onImportComplete }, ref) {
  const handleExport = async () => {
    try {
      await storage.exportData();
      message.success('数据导出成功');
    } catch (err: any) {
      message.error(err.message || '导出失败');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      Modal.confirm({
        title: '确认导入',
        content: '导入将覆盖现有数据（相同ID的记录会被替换），此操作不可撤销。',
        onOk: async () => {
          try {
            const result = await storage.importData(file);
            message.success(result.message);
            onImportComplete?.();
          } catch (err: any) {
            message.error(err.message || '导入失败');
          }
        },
      });
    };
    input.click();
  };

  useImperativeHandle(ref, () => ({
    exportData: handleExport,
    importData: handleImport,
  }));

  return null;
});
