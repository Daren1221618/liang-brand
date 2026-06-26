import React from 'react';
import { Tag, Typography, List, Steps, Empty, Space } from 'antd';

const { Paragraph } = Typography;
import {
  InfoCircleOutlined, BookOutlined,
  RocketOutlined, BulbOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import type { EngineType } from '../../types';
import { ENGINE_CONFIG } from '../../types';
import { SERVICE_TREE } from '../../serviceTree';
import { getParentDetail } from '../../serviceDetailData';
import SectionBlock from '../../components/ui/SectionBlock';

const { Title, Text } = Typography;

interface ChildDetailPanelProps {
  childId: string;
  engineType: EngineType;
  engineColor: string;
}

export default function ChildDetailPanel({ childId, engineType, engineColor }: ChildDetailPanelProps) {
  const engine = SERVICE_TREE.find(e => e.id === engineType);
  const parent = engine?.parents.find(p => p.children.some(c => c.id === childId));
  const child = parent?.children.find(c => c.id === childId);

  if (!parent || !child) return <Empty description="暂无详情" />;

  const parentDetail = getParentDetail(parent.id);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, padding: '20px 0', background: `linear-gradient(135deg, ${engineColor}11, ${engineColor}22)`, borderRadius: 12 }}>
        <Space>
          <Tag color={engineColor}>{ENGINE_CONFIG[engineType].icon} {ENGINE_CONFIG[engineType].name}</Tag>
          <Tag>{parent.name}</Tag>
        </Space>
        <Title level={4} style={{ marginBottom: 8, marginTop: 8 }}>{child.name}</Title>
        <Space size={16}>
          <Tag color="blue">¥{child.price.toLocaleString()}</Tag>
          <Tag color="orange">{child.duration} 天</Tag>
        </Space>
      </div>

      <SectionBlock icon={<InfoCircleOutlined />} title="服务说明" color={engineColor}>
        <Paragraph style={{ lineHeight: 1.8, fontSize: 14 }}>{child.annotation}</Paragraph>
      </SectionBlock>

      {parentDetail && (
        <SectionBlock icon={<BookOutlined />} title="所属模块背景" color={engineColor}>
          <Paragraph style={{ lineHeight: 1.8, fontSize: 13, color: '#555' }}>{parentDetail.overview.slice(0, 200)}...</Paragraph>
        </SectionBlock>
      )}

      {parentDetail && (
        <SectionBlock icon={<RocketOutlined />} title="执行流程（参考所属模块）" color={engineColor}>
          <Steps direction="vertical" size="small" current={-1} items={parentDetail.workflow.slice(0, 4).map((step, i) => ({
            title: <Text style={{ fontSize: 13 }}>步骤 {i + 1}</Text>,
            description: <Text type="secondary" style={{ fontSize: 12 }}>{step}</Text>,
          }))} />
        </SectionBlock>
      )}

      {parentDetail && (
        <SectionBlock icon={<BulbOutlined />} title="专业建议" color={engineColor}>
          <div style={{ padding: '12px 16px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
            <Text style={{ fontSize: 13, lineHeight: 1.8 }}>{parentDetail.tips}</Text>
          </div>
        </SectionBlock>
      )}

      <SectionBlock icon={<AppstoreOutlined />} title="同模块其他服务项" color={engineColor}>
        <List size="small" dataSource={parent.children.filter(c => c.id !== childId)} renderItem={sibling => (
          <List.Item style={{ padding: '6px 0' }}>
            <Space>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: engineColor }} />
              <Text style={{ fontSize: 13 }}>{sibling.name}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>¥{sibling.price.toLocaleString()} / {sibling.duration}天</Text>
            </Space>
          </List.Item>
        )} />
      </SectionBlock>
    </div>
  );
}
