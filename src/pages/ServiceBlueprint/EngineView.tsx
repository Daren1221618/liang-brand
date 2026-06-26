import React from 'react';
import { Row, Col, Card, Tag, Collapse, List, Typography, Tooltip, Space } from 'antd';
import { InfoCircleOutlined, EyeOutlined } from '@ant-design/icons';
import type { EngineType } from '../../types';
import { ENGINE_CONFIG } from '../../types';
import { SERVICE_TREE } from '../../serviceTree';
import { getEngineDetail } from '../../serviceDetailData';
import type { DetailItem } from './types';

const { Text, Paragraph } = Typography;

interface EngineViewProps {
  enginesTyped: [EngineType, typeof ENGINE_CONFIG[EngineType]][];
  searchText: string;
  onOpenDetail: (item: DetailItem) => void;
}

export default function EngineView({ enginesTyped, searchText, onOpenDetail }: EngineViewProps) {
  const kw = searchText.toLowerCase();

  const filteredEngines = kw
    ? enginesTyped.filter(([type]) => {
        const config = ENGINE_CONFIG[type];
        const engine = SERVICE_TREE.find(e => e.id === type);
        if (!engine) return false;
        if (config.name.includes(kw) || config.description.includes(kw)) return true;
        return engine.parents.some(p =>
          p.name.includes(kw) || p.annotation.includes(kw) ||
          p.children.some(c => c.name.includes(kw) || c.annotation.includes(kw))
        );
      })
    : enginesTyped;

  return (
    <Row gutter={[16, 16]}>
      {filteredEngines.map(([type, config]) => {
        const engine = SERVICE_TREE.find(e => e.id === type)!;
        const engineDetail = getEngineDetail(type);
        const moduleCount = engine.parents.length;
        const childCount = engine.parents.reduce((s, p) => s + p.children.length, 0);
        const totalPrice = engine.parents.reduce((s, p) => s + p.defaultPrice, 0);

        return (
          <Col xs={24} xl={12} key={type}>
            <Card
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{config.icon}</span>
                  <span>{config.name}</span>
                </span>
              }
              extra={
                <Space size={4}>
                  <Tag color={config.color}>{moduleCount} 模块</Tag>
                  <Tag>{childCount} 子项</Tag>
                  <Tag color="orange">¥{totalPrice.toLocaleString()}</Tag>
                </Space>
              }
              style={{ height: '100%' }}
              headStyle={{ borderBottom: `2px solid ${config.color}` }}
              bodyStyle={{ padding: '12px 24px 16px' }}
            >
              <div
                style={{ cursor: 'pointer', marginBottom: 12, padding: '8px 12px', background: '#fafafa', borderRadius: 8, border: `1px solid ${config.color}22` }}
                onClick={() => onOpenDetail({ type: 'engine', id: type, name: config.name, engineType: type })}
              >
                <Text type="secondary" style={{ fontSize: 13 }}>{config.description}</Text>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    <EyeOutlined style={{ marginRight: 4 }} />点击查看引擎详情：核心价值、适用场景、方法论
                  </Text>
                </div>
              </div>

              <Collapse
                size="small"
                ghost
                items={engine.parents.map(parent => ({
                  key: parent.id,
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'space-between' }}>
                      <span>
                        <Text strong style={{ fontSize: 13 }}>{parent.name}</Text>
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                          {parent.children.length}项 · {parent.defaultDuration}天 · ¥{parent.defaultPrice.toLocaleString()}
                        </Text>
                      </span>
                      <Tooltip title="点击查看详情">
                        <InfoCircleOutlined style={{ color: config.color, cursor: 'pointer' }}
                          onClick={e => { e.stopPropagation(); onOpenDetail({ type: 'parent', id: parent.id, name: parent.name, engineType: type as EngineType }); }}
                        />
                      </Tooltip>
                    </span>
                  ),
                  children: (
                    <div style={{ paddingLeft: 8 }}>
                      <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 8px', color: '#888', fontStyle: 'italic' }}>
                        {parent.annotation}
                      </Paragraph>
                      <List
                        size="small"
                        dataSource={parent.children}
                        renderItem={child => (
                          <List.Item
                            style={{ padding: '6px 0', cursor: 'pointer', borderRadius: 4 }}
                            onClick={() => onOpenDetail({ type: 'child', id: child.id, name: child.name, engineType: type as EngineType })}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                              <Space size={4}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }} />
                                <Text style={{ fontSize: 12 }}>{child.name}</Text>
                              </Space>
                              <Space size={8}>
                                <Text type="secondary" style={{ fontSize: 11 }}>¥{child.price.toLocaleString()}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>{child.duration}天</Text>
                                <Tooltip title={child.annotation}>
                                  <EyeOutlined style={{ fontSize: 11, color: '#999' }} />
                                </Tooltip>
                              </Space>
                            </div>
                          </List.Item>
                        )}
                      />
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
