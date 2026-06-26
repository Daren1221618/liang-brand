import React from 'react';

interface StatisticCardProps {
  label: string;
  value: string | number;
  color: string;
}

export default function StatisticCard({ label, value, color }: StatisticCardProps) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 8px', background: `${color}08`, borderRadius: 8 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{label}</div>
    </div>
  );
}
