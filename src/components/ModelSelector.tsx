// ============================================================
// 亮品牌 · AI 模型选择器组件
// 支持选择 DeepSeek / 豆包 / 通义千问
// 支持查看模型状态和手动切换
// ============================================================

import React, { useState, useEffect } from 'react';
import { Select, Tag, Space, Tooltip, Badge, Divider } from 'antd';
import { RobotOutlined, ThunderboltOutlined, CloudOutlined, PictureOutlined } from '@ant-design/icons';
import { getModels, type ModelProvider, type ModelInfo, type ScenarioRoute } from '../ai';

const PROVIDER_CONFIG: Record<ModelProvider, { name: string; icon: React.ReactNode; color: string; desc: string }> = {
  deepseek: { name: 'DeepSeek', icon: <ThunderboltOutlined />, color: '#4d6bfe', desc: '推理能力强，性价比高' },
  doubao: { name: '豆包', icon: <RobotOutlined />, color: '#2f54eb', desc: '128k超长上下文' },
  qwen: { name: '通义千问', icon: <CloudOutlined />, color: '#ff7a45', desc: '多模态，支持图像生成' },
};

interface ModelSelectorProps {
  value?: ModelProvider | 'auto';
  onChange?: (value: ModelProvider | 'auto') => void;
  scenario?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'middle';
}

export default function ModelSelector({ value = 'auto', onChange, scenario, style, size = 'small' }: ModelSelectorProps) {
  const [modelInfo, setModelInfo] = useState<ModelInfo[]>([]);
  const [scenarioRoutes, setScenarioRoutes] = useState<ScenarioRoute[]>([]);

  useEffect(() => {
    getModels().then(data => {
      setModelInfo(data.info || []);
      setScenarioRoutes(data.scenarioRoutes || []);
    }).catch(() => {});
  }, []);

  // 根据场景推荐默认模型
  const defaultProvider = scenario
    ? scenarioRoutes.find(r => r.scenario === scenario)?.defaultProvider
    : undefined;

  const options = [
    {
      value: 'auto' as const,
      label: (
        <Space size={4}>
          <RobotOutlined />
          <span>自动选择</span>
          {defaultProvider && (
            <Tag color={PROVIDER_CONFIG[defaultProvider].color} style={{ fontSize: 10, margin: 0 }}>
              推荐{PROVIDER_CONFIG[defaultProvider].name}
            </Tag>
          )}
        </Space>
      ),
    },
    ...((Object.keys(PROVIDER_CONFIG) as ModelProvider[]).map(p => {
      const info = modelInfo.find(m => m.provider === p);
      const cfg = PROVIDER_CONFIG[p];
      const available = info?.hasApiKey;

      return {
        value: p,
        label: (
          <Space size={4}>
            {cfg.icon}
            <span>{cfg.name}</span>
            <Tag color={available ? 'green' : 'red'} style={{ fontSize: 10, margin: 0 }}>
              {available ? '已配置' : '未配置'}
            </Tag>
          </Space>
        ),
        disabled: !available,
      };
    })),
  ];

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      style={{ minWidth: size === 'small' ? 140 : 200, ...style }}
      size={size}
      popupMatchSelectWidth={false}
    />
  );
}

/** 模型状态展示（管理员可见） */
export function ModelStatusPanel() {
  const [modelInfo, setModelInfo] = useState<ModelInfo[]>([]);
  const [scenarioRoutes, setScenarioRoutes] = useState<ScenarioRoute[]>([]);

  useEffect(() => {
    getModels().then(data => {
      setModelInfo(data.info || []);
      setScenarioRoutes(data.scenarioRoutes || []);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <strong>模型状态</strong>
      </div>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {(Object.keys(PROVIDER_CONFIG) as ModelProvider[]).map(p => {
          const cfg = PROVIDER_CONFIG[p];
          const info = modelInfo.find(m => m.provider === p);
          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge status={info?.hasApiKey ? 'success' : 'error'} />
              <Tag color={cfg.color} icon={cfg.icon}>{cfg.name}</Tag>
              <span style={{ fontSize: 12, color: '#666' }}>
                {info?.hasApiKey ? info.defaultModel : '未配置 API Key'}
              </span>
              {info?.hasApiKey && (
                <span style={{ fontSize: 11, color: '#999' }}>
                  ({Math.round(info.maxContextTokens / 1000)}k tokens)
                </span>
              )}
            </div>
          );
        })}
      </Space>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ marginBottom: 8 }}>
        <strong>场景路由</strong>
      </div>
      <div style={{ fontSize: 12 }}>
        {scenarioRoutes.map(r => {
          const defaultCfg = PROVIDER_CONFIG[r.defaultProvider];
          return (
            <div key={r.scenario} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ minWidth: 100 }}>{r.label}</span>
              <Tag color={defaultCfg.color} style={{ fontSize: 10 }}>
                {defaultCfg.name}
              </Tag>
              {r.fallbackProvider && (
                <span style={{ color: '#999' }}>→ {PROVIDER_CONFIG[r.fallbackProvider].name}(备选)</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
