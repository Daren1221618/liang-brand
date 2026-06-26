import React from 'react';
import { Tag, Typography, List, Space, Empty } from 'antd';

const { Paragraph } = Typography;
import {
  BookOutlined, FileTextOutlined, AppstoreOutlined,
  UserOutlined, ClockCircleOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import type { EngineType } from '../../types';
import { ENGINE_CONFIG, ROLE_LABELS } from '../../types';
import { ALL_DELIVERABLES } from '../../data';
import { getDeliverableDetail } from '../../serviceDetailData';
import SectionBlock from '../../components/ui/SectionBlock';

const { Title, Text } = Typography;

interface DeliverableDetailPanelProps {
  deliverableId: string;
  engineType: EngineType;
  engineColor: string;
}

export default function DeliverableDetailPanel({ deliverableId, engineType, engineColor }: DeliverableDetailPanelProps) {
  const detail = getDeliverableDetail(deliverableId);
  const template = ALL_DELIVERABLES.find(d => d.id === deliverableId);

  if (!detail || !template) return <Empty description="暂无详情" />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, padding: '20px 0', background: `linear-gradient(135deg, ${engineColor}11, ${engineColor}22)`, borderRadius: 12 }}>
        <Tag color={engineColor}>{ENGINE_CONFIG[engineType].icon} {ENGINE_CONFIG[engineType].name}</Tag>
        <Title level={4} style={{ marginBottom: 8, marginTop: 8 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />{detail.name}
        </Title>
        <Space size={12} wrap>
          <Tag icon={<ClockCircleOutlined />}>{detail.estimatedEffort}</Tag>
          {template.isPeriodic && <Tag color="orange">周期性 {template.periodicCount} 次</Tag>}
        </Space>
      </div>

      <SectionBlock icon={<BookOutlined />} title="详细说明" color={engineColor}>
        <Paragraph style={{ lineHeight: 1.8, fontSize: 14 }}>{detail.overview}</Paragraph>
      </SectionBlock>

      <SectionBlock icon={<AppstoreOutlined />} title="内容结构" color={engineColor}>
        <List size="small" dataSource={detail.contentStructure} renderItem={(item, i) => (
          <List.Item style={{ padding: '6px 0' }}>
            <Tag color={engineColor} style={{ width: 24, textAlign: 'center', marginRight: 0 }}>{i + 1}</Tag>
            <Text style={{ fontSize: 13 }}>{item}</Text>
          </List.Item>
        )} />
      </SectionBlock>

      <SectionBlock icon={<UserOutlined />} title="参与岗位" color={engineColor}>
        <Space size={8} wrap>
          {detail.applicableRoles.map(role => (
            <Tag key={role} color="blue">{ROLE_LABELS[role as keyof typeof ROLE_LABELS]}</Tag>
          ))}
        </Space>
      </SectionBlock>

      <SectionBlock icon={<ClockCircleOutlined />} title="预估工作量" color={engineColor}>
        <Text style={{ fontSize: 13 }}>{detail.estimatedEffort}</Text>
      </SectionBlock>

      <SectionBlock icon={<CheckCircleOutlined />} title="验收标准" color={engineColor}>
        <div style={{ padding: '12px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
          <Text style={{ fontSize: 13, lineHeight: 1.8 }}>{detail.acceptanceCriteria}</Text>
        </div>
      </SectionBlock>
    </div>
  );
}
