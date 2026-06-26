import React from 'react';
import { Tag, Typography, List, Steps, Empty, Space } from 'antd';

const { Paragraph } = Typography;
import {
  BookOutlined, StarOutlined, UserOutlined,
  RocketOutlined, BulbOutlined, FileTextOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import type { EngineType } from '../../types';
import { ENGINE_CONFIG } from '../../types';
import { SERVICE_TREE } from '../../serviceTree';
import { getParentDetail } from '../../serviceDetailData';
import SectionBlock from '../../components/ui/SectionBlock';

const { Title, Text } = Typography;

interface ParentDetailPanelProps {
  parentId: string;
  engineType: EngineType;
  engineColor: string;
}

export default function ParentDetailPanel({ parentId, engineType, engineColor }: ParentDetailPanelProps) {
  const detail = getParentDetail(parentId);
  const parent = SERVICE_TREE.flatMap(e => e.parents).find(p => p.id === parentId);

  if (!detail || !parent) return <Empty description="暂无详情" />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, padding: '20px 0', background: `linear-gradient(135deg, ${engineColor}11, ${engineColor}22)`, borderRadius: 12 }}>
        <Tag color={engineColor} style={{ marginBottom: 8 }}>{ENGINE_CONFIG[engineType].icon} {ENGINE_CONFIG[engineType].name}</Tag>
        <Title level={4} style={{ marginBottom: 4 }}>{detail.title}</Title>
        <Space size={16}>
          <Tag>{parent.children.length} 子项</Tag>
          <Tag color="blue">¥{parent.defaultPrice.toLocaleString()}</Tag>
          <Tag color="orange">{parent.defaultDuration} 天</Tag>
        </Space>
      </div>

      <SectionBlock icon={<BookOutlined />} title="详细说明" color={engineColor}>
        <Paragraph style={{ lineHeight: 1.8, fontSize: 14 }}>{detail.overview}</Paragraph>
      </SectionBlock>

      <SectionBlock icon={<StarOutlined />} title="核心价值" color={engineColor}>
        <div style={{ padding: '12px 16px', background: `${engineColor}08`, borderLeft: `3px solid ${engineColor}`, borderRadius: '0 8px 8px 0' }}>
          <Text strong style={{ fontSize: 14, color: engineColor }}>{detail.value}</Text>
        </div>
      </SectionBlock>

      <SectionBlock icon={<UserOutlined />} title="适用客户" color={engineColor}>
        <Text style={{ fontSize: 13, lineHeight: 1.8 }}>{detail.targetClient}</Text>
      </SectionBlock>

      <SectionBlock icon={<RocketOutlined />} title="操作流程" color={engineColor}>
        <Steps direction="vertical" size="small" current={-1} items={detail.workflow.map((step, i) => ({
          title: <Text style={{ fontSize: 13 }}>步骤 {i + 1}</Text>,
          description: <Text type="secondary" style={{ fontSize: 12 }}>{step}</Text>,
        }))} />
      </SectionBlock>

      <SectionBlock icon={<BulbOutlined />} title="专业建议" color={engineColor}>
        <div style={{ padding: '12px 16px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
          <Text style={{ fontSize: 13, lineHeight: 1.8 }}>{detail.tips}</Text>
        </div>
      </SectionBlock>

      <SectionBlock icon={<FileTextOutlined />} title="交付物形式" color={engineColor}>
        <Text style={{ fontSize: 13 }}>{detail.outputFormat}</Text>
      </SectionBlock>

      <SectionBlock icon={<AppstoreOutlined />} title="子项明细" color={engineColor}>
        <List size="small" dataSource={parent.children} renderItem={(child, i) => (
          <List.Item style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space>
                <Tag color={engineColor}>{i + 1}</Tag>
                <div>
                  <Text style={{ fontSize: 13 }}>{child.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>{child.annotation}</Text>
                </div>
              </Space>
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>¥{child.price.toLocaleString()}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{child.duration}天</Text>
              </Space>
            </div>
          </List.Item>
        )} />
      </SectionBlock>
    </div>
  );
}
