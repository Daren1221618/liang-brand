import React from 'react';
import { Tag, Typography, List, Row, Col } from 'antd';

const { Paragraph } = Typography;
import {
  BookOutlined, StarOutlined, AppstoreOutlined,
  BulbOutlined, FileTextOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { EngineType } from '../../types';
import { ENGINE_CONFIG } from '../../types';
import { SERVICE_TREE } from '../../serviceTree';
import { getEngineDetail } from '../../serviceDetailData';
import SectionBlock from '../../components/ui/SectionBlock';
import StatisticCard from '../../components/ui/StatisticCard';

const { Title, Text } = Typography;

interface EngineDetailPanelProps {
  engineType: EngineType;
}

export default function EngineDetailPanel({ engineType }: EngineDetailPanelProps) {
  const detail = getEngineDetail(engineType);
  const config = ENGINE_CONFIG[engineType];
  const engine = SERVICE_TREE.find(e => e.id === engineType)!;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 24, padding: '24px 0', background: `linear-gradient(135deg, ${config.color}11, ${config.color}22)`, borderRadius: 12 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{config.icon}</div>
        <Title level={3} style={{ marginBottom: 4 }}>{config.name}</Title>
        <Text type="secondary">{config.description}</Text>
      </div>

      <SectionBlock icon={<BookOutlined />} title="板块概述" color={config.color}>
        <Paragraph style={{ lineHeight: 1.8, fontSize: 14 }}>{detail.overview}</Paragraph>
      </SectionBlock>

      <SectionBlock icon={<StarOutlined />} title="核心价值" color={config.color}>
        <div style={{ padding: '12px 16px', background: `${config.color}08`, borderLeft: `3px solid ${config.color}`, borderRadius: '0 8px 8px 0' }}>
          <Text strong style={{ fontSize: 15, color: config.color }}>{detail.coreValue}</Text>
        </div>
      </SectionBlock>

      <SectionBlock icon={<AppstoreOutlined />} title="适用场景" color={config.color}>
        <List size="small" dataSource={detail.applicableScenes} renderItem={(scene, i) => (
          <List.Item style={{ padding: '6px 0' }}>
            <Tag color={config.color}>场景{i + 1}</Tag>
            <Text style={{ fontSize: 13 }}>{scene}</Text>
          </List.Item>
        )} />
      </SectionBlock>

      <SectionBlock icon={<BulbOutlined />} title="关键方法论" color={config.color}>
        <List size="small" dataSource={detail.keyMethods} renderItem={method => (
          <List.Item style={{ padding: '8px 0' }}>
            <Text style={{ fontSize: 13, lineHeight: 1.6 }}>{method}</Text>
          </List.Item>
        )} />
      </SectionBlock>

      <SectionBlock icon={<FileTextOutlined />} title="核心交付物" color={config.color}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {detail.deliverableHighlights.map((dh, i) => (
            <div key={i} style={{ padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
              <Text style={{ fontSize: 13 }}>{dh}</Text>
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock icon={<SafetyCertificateOutlined />} title="服务概览" color={config.color}>
        <Row gutter={12}>
          <Col span={8}><StatisticCard label="父项模块" value={engine.parents.length} color={config.color} /></Col>
          <Col span={8}><StatisticCard label="子项服务" value={engine.parents.reduce((s, p) => s + p.children.length, 0)} color={config.color} /></Col>
          <Col span={8}><StatisticCard label="总参考价" value={`¥${engine.parents.reduce((s, p) => s + p.defaultPrice, 0).toLocaleString()}`} color={config.color} /></Col>
        </Row>
      </SectionBlock>
    </div>
  );
}
