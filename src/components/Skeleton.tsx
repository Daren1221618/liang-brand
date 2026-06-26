// ============================================================
// 亮品牌 · Apple 风格骨架屏组件
// ============================================================

import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #f0f0f2 25%, #e8e8ec 50%, #f0f0f2 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid rgba(0,0,0,0.04)',
      padding: 24,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <SkeletonBlock width="40%" height={20} style={{ marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock
          key={i}
          width={`${60 + Math.random() * 30}%`}
          height={14}
          style={{ marginBottom: 10 }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)' }}>
      {/* header */}
      <div style={{ display: 'flex', gap: 24, padding: '12px 16px', background: '#fbfbfd', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <SkeletonBlock width="25%" height={14} />
        <SkeletonBlock width="20%" height={14} />
        <SkeletonBlock width="15%" height={14} />
        <SkeletonBlock width="20%" height={14} />
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex', gap: 24, padding: '14px 16px',
            borderBottom: i < rows - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none',
          }}
        >
          <SkeletonBlock width="25%" height={14} />
          <SkeletonBlock width="20%" height={14} />
          <SkeletonBlock width="15%" height={14} />
          <SkeletonBlock width="20%" height={14} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.04)',
          padding: '20px 24px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <SkeletonBlock width="50%" height={13} style={{ marginBottom: 12 }} />
          <SkeletonBlock width="30%" height={28} />
        </div>
      ))}
    </div>
  );
}

// 注入 CSS 动画（仅注入一次）
if (typeof document !== 'undefined' && !document.getElementById('skeleton-style')) {
  const style = document.createElement('style');
  style.id = 'skeleton-style';
  style.textContent = `
    @keyframes skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}
