import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface SectionBlockProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}

export default function SectionBlock({ icon, title, color, children }: SectionBlockProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, borderBottom: `1px solid ${color}33`, paddingBottom: 8 }}>
        <span style={{ color, fontSize: 16 }}>{icon}</span>
        <Text strong style={{ fontSize: 15 }}>{title}</Text>
      </div>
      {children}
    </div>
  );
}
