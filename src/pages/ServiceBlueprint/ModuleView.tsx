import React from 'react';
import { Card, Tabs, Row, Col, Tag, Typography, Space } from 'antd';

const { Paragraph } = Typography;
import { ToolOutlined, FileTextOutlined } from '@ant-design/icons';
import type { EngineType } from '../../types';
import { ENGINE_CONFIG } from '../../types';
import { ALL_MODULES, ALL_TOOLS } from '../../data';
import type { DetailItem } from './types';

const { Text } = Typography;

interface ModuleViewProps {
  enginesTyped: [EngineType, typeof ENGINE_CONFIG[EngineType]][];
  onOpenDetail: (item: DetailItem) => void;
}

export default function ModuleView({ enginesTyped, onOpenDetail }: ModuleViewProps) {
  return (
    <Card>
      <Tabs
        type="card"
        items={enginesTyped.map(([type, config]) => {
          const modules = ALL_MODULES.filter(m => m.engineType === type);
          return {
            key: type,
            label: <span>{config.icon} {config.name} ({modules.length})</span>,
            children: (
              <div>
                <Row gutter={[12, 12]}>
                  {modules.map(mod => {
                    const modTools = ALL_TOOLS.filter(t => mod.tools.some(mt => mt.id === t.id));
                    return (
                      <Col xs={24} md={12} xl={8} key={mod.id}>
                        <Card
                          size="small"
                          title={<Text strong style={{ fontSize: 13 }}>{mod.name}</Text>}
                          hoverable
                          onClick={() => onOpenDetail({ type: 'parent', id: mod.id, name: mod.name, engineType: type })}
                          style={{ height: '100%', cursor: 'pointer' }}
                          headStyle={{ borderBottom: `2px solid ${config.color}` }}
                        >
                          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 12, marginBottom: 8 }}>
                            {mod.description}
                          </Paragraph>
                          <Space size={4} wrap>
                            <Tag color="blue" icon={<ToolOutlined />}>{modTools.length} 工具</Tag>
                            <Tag color="green" icon={<FileTextOutlined />}>{mod.deliverables.length} 交付物</Tag>
                          </Space>
                          <div style={{ marginTop: 8 }}>
                            {modTools.map(t => (
                              <Tag
                                key={t.id}
                                style={{ fontSize: 11, cursor: 'pointer', marginBottom: 2 }}
                                onClick={e => { e.stopPropagation(); onOpenDetail({ type: 'tool', id: t.id, name: t.name, engineType: type }); }}
                              >
                                🔧 {t.name}
                              </Tag>
                            ))}
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            ),
          };
        })}
      />
    </Card>
  );
}
