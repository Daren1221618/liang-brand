import React from 'react';
import { Card, Tag, Row, Col, Typography } from 'antd';
import type { ToolTemplate } from '../../types';
import { ALL_DELIVERABLES } from '../../data';

const { Paragraph, Text } = Typography;

interface ToolListProps {
  engineTools: ToolTemplate[];
}

export default function ToolList({ engineTools }: ToolListProps) {
  return (
    <Row gutter={[16, 16]}>
      {engineTools.map(tool => (
        <Col xs={24} sm={12} key={tool.id}>
          <Card size="small" title={tool.name}>
            <Paragraph type="secondary" style={{ fontSize: 13 }}>{tool.description}</Paragraph>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>产出：</Text>
              <div style={{ marginTop: 4 }}>
                {tool.deliverableIds.map((dId: string) => {
                  const d = ALL_DELIVERABLES.find(dd => dd.id === dId);
                  return d ? <Tag key={dId} style={{ fontSize: 11, marginBottom: 2 }}>{d.name}</Tag> : null;
                })}
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
