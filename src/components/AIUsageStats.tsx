// ============================================================
// 亮品牌 · AI Token 用量统计
// 显示 AI 模型调用次数与 Token 消耗
// ============================================================

import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Table, Tag, Spin, Empty, Typography } from 'antd';
import { api } from '../api';

const { Title, Text } = Typography;

interface UsageData {
  totals: {
    total_calls: number;
    total_prompt: number;
    total_completion: number;
    total_tokens: number;
    today_tokens: number;
  };
  byProvider: Array<{ provider: string; calls: number; tokens: number }>;
  byScenario: Array<{ scenario: string; calls: number; tokens: number }>;
}

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: 'DeepSeek',
  doubao: '豆包',
  qwen: '通义千问',
};

const SCENARIO_LABELS: Record<string, string> = {
  deliverable_generate: '交付物生成',
  deliverable_optimize: '交付物优化',
  checklist_fill: '品牌自检补全',
  timeline_search: '年谱搜索',
  field_assist: '字段辅助',
  image_generate: '图像生成',
};

export default function AIUsageStats() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await api.get<UsageData>('/api/ai/usage');
        setData(result);
      } catch {
        // 静默失败
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>;

  if (!data) return <Empty description="暂无用量数据" />;

  const providerColumns = [
    { title: '模型', dataIndex: 'provider', key: 'provider', render: (v: string) =>
      <Tag color={v === 'deepseek' ? 'blue' : v === 'doubao' ? 'purple' : 'cyan'}>{PROVIDER_LABELS[v] || v}</Tag>
    },
    { title: '调用次数', dataIndex: 'calls', key: 'calls', render: (v: number) => v.toLocaleString() },
    { title: 'Token 消耗', dataIndex: 'tokens', key: 'tokens', render: (v: number) => v.toLocaleString() },
  ];

  const scenarioColumns = [
    { title: '场景', dataIndex: 'scenario', key: 'scenario', render: (v: string) => SCENARIO_LABELS[v] || v },
    { title: '调用次数', dataIndex: 'calls', key: 'calls', render: (v: number) => v.toLocaleString() },
    { title: 'Token 消耗', dataIndex: 'tokens', key: 'tokens', render: (v: number) => v.toLocaleString() },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card styles={{ body: { padding: '16px 20px' } }}>
            <Statistic title="总调用次数" value={data.totals.total_calls} suffix="次" valueStyle={{ fontSize: 24 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card styles={{ body: { padding: '16px 20px' } }}>
            <Statistic title="今日 Token" value={data.totals.today_tokens} suffix="t" valueStyle={{ fontSize: 24, color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card styles={{ body: { padding: '16px 20px' } }}>
            <Statistic title="总 Prompt" value={data.totals.total_prompt} suffix="t" valueStyle={{ fontSize: 24 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card styles={{ body: { padding: '16px 20px' } }}>
            <Statistic title="总 Completion" value={data.totals.total_completion} suffix="t" valueStyle={{ fontSize: 24 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card title="按模型统计" size="small" styles={{ body: { padding: 0 } }}>
            <Table
              dataSource={data.byProvider}
              columns={providerColumns}
              rowKey="provider"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title="按场景统计" size="small" styles={{ body: { padding: 0 } }}>
            <Table
              dataSource={data.byScenario}
              columns={scenarioColumns}
              rowKey="scenario"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
