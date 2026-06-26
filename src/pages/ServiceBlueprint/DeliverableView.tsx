import React from 'react';
import { Card, Tabs, List, Tag, Typography, Space } from 'antd';
import {
  FileTextOutlined, ClockCircleOutlined, UserOutlined, EyeOutlined,
} from '@ant-design/icons';
import type { EngineType } from '../../types';
import { ENGINE_CONFIG, ROLE_LABELS } from '../../types';
import { ALL_DELIVERABLES } from '../../data';
import { getDeliverableDetail } from '../../serviceDetailData';
import type { DetailItem } from './types';

const { Text } = Typography;

interface DeliverableViewProps {
  enginesTyped: [EngineType, typeof ENGINE_CONFIG[EngineType]][];
  onOpenDetail: (item: DetailItem) => void;
}

export default function DeliverableView({ enginesTyped, onOpenDetail }: DeliverableViewProps) {
  return (
    <Card>
      <Tabs
        type="card"
        items={enginesTyped.map(([type, config]) => {
          const deliverables = ALL_DELIVERABLES.filter(d => d.engineType === type);
          return {
            key: type,
            label: <span>{config.icon} {config.name} ({deliverables.length})</span>,
            children: (
              <List
                dataSource={deliverables}
                renderItem={d => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '12px 16px' }}
                    onClick={() => onOpenDetail({ type: 'deliverable', id: d.id, name: d.name, engineType: type })}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined style={{ fontSize: 20, color: config.color }} />}
                      title={
                        <Space>
                          <Text strong>{d.name}</Text>
                          {d.isPeriodic && <Tag color="orange" style={{ fontSize: 11 }}>周期 {d.periodicCount} 次</Tag>}
                        </Space>
                      }
                      description={
                        <Space size={16} wrap>
                          <Text type="secondary" style={{ fontSize: 12 }}>{d.description}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            <ClockCircleOutlined /> {d.estimatedHours}h
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            <UserOutlined /> {d.roles.map(r => ROLE_LABELS[r]).join('、')}
                          </Text>
                        </Space>
                      }
                    />
                    <EyeOutlined style={{ color: '#999' }} />
                  </List.Item>
                )}
              />
            ),
          };
        })}
      />
    </Card>
  );
}
