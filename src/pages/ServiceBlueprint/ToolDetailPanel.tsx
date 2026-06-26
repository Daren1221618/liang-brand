import React from 'react';
import { Tag, Typography, List, Empty } from 'antd';

const { Paragraph } = Typography;
import {
  BookOutlined, ToolOutlined,
  RocketOutlined, FileTextOutlined, BulbOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import type { EngineType } from '../../types';
import { ENGINE_CONFIG } from '../../types';
import { getToolDetail } from '../../serviceDetailData';
import SectionBlock from '../../components/ui/SectionBlock';

const { Title, Text } = Typography;

interface ToolDetailPanelProps {
  toolId: string;
  engineType: EngineType;
  engineColor: string;
}

export default function ToolDetailPanel({ toolId, engineType, engineColor }: ToolDetailPanelProps) {
  const detail = getToolDetail(toolId);

  if (!detail) return <Empty description="暂无详情" />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, padding: '20px 0', background: `linear-gradient(135deg, ${engineColor}11, ${engineColor}22)`, borderRadius: 12 }}>
        <Tag color={engineColor}>{ENGINE_CONFIG[engineType].icon} {ENGINE_CONFIG[engineType].name}</Tag>
        <Title level={4} style={{ marginBottom: 8, marginTop: 8 }}>
          <ToolOutlined style={{ marginRight: 8 }} />{detail.name}
        </Title>
      </div>

      <SectionBlock icon={<BookOutlined />} title="工具说明" color={engineColor}>
        <Paragraph style={{ lineHeight: 1.8, fontSize: 14 }}>{detail.overview}</Paragraph>
      </SectionBlock>

      <SectionBlock icon={<RocketOutlined />} title="使用方法" color={engineColor}>
        <div style={{ padding: '12px 16px', background: '#f6f8fa', borderRadius: 8 }}>
          {detail.usage.split('\n').map((line, i) => (
            <div key={i} style={{ fontSize: 13, lineHeight: 2, color: i === 0 ? '#333' : '#666' }}>
              {line}
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock icon={<FileTextOutlined />} title="产出物" color={engineColor}>
        <List size="small" dataSource={detail.outputProducts} renderItem={(op) => (
          <List.Item style={{ padding: '6px 0' }}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            <Text style={{ fontSize: 13 }}>{op}</Text>
          </List.Item>
        )} />
      </SectionBlock>

      <SectionBlock icon={<BulbOutlined />} title="使用建议" color={engineColor}>
        <div style={{ padding: '12px 16px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
          <Text style={{ fontSize: 13, lineHeight: 1.8 }}>{detail.tips}</Text>
        </div>
      </SectionBlock>
    </div>
  );
}
