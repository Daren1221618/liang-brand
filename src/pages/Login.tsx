// ============================================================
// 亮品牌 · 登录页面（Apple Design Style）
// ============================================================

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Alert, Space, Tag } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../api';
import type { UserInfo } from '../userTypes';
import { ROLE_CONFIG } from '../permissions';
import type { Role } from '../userTypes';

interface LoginPageProps {
  onLogin: (user: UserInfo, token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 动态获取主题（从 CSS 变量读取，主题已由 main.tsx 注入）
  const [themeColors, setThemeColors] = useState({
    primaryColor: '#cf1322',
    brandName: '亮品牌',
    systemTitle: '周期性项目服务系统',
    brandLogo: '✦',
  });

  useEffect(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const p = style.getPropertyValue('--brand-primary').trim() || '#cf1322';
    setThemeColors({
      primaryColor: p,
      brandName: style.getPropertyValue('--brand-name').trim() || '亮品牌',
      systemTitle: style.getPropertyValue('--brand-system-title').trim() || '周期性项目服务系统',
      brandLogo: style.getPropertyValue('--brand-logo').trim() || '✦',
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ token: string; user: UserInfo }>('/api/auth/login', { username, password });
      api.setToken(res.token);
      onLogin(res.user, res.token);
      message.success(`欢迎回来，${res.user.displayName}`);
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #1d1d1f 0%, #2d2d30 40%, #3a3a3c 100%)',
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 背景装饰：Apple 风格光斑 */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(207,19,34,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(114,46,209,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* 登录卡片：毛玻璃 */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '40px 32px',
        position: 'relative',
        animation: 'apple-fade-in 0.6s cubic-bezier(0, 0, 0.2, 1)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {themeColors.brandLogo.startsWith('/uploads/') || themeColors.brandLogo.startsWith('http') ? (
            <img src={themeColors.brandLogo} alt="Logo" style={{ height: 56, maxWidth: 160, objectFit: 'contain', marginBottom: 12 }} />
          ) : (
            <div style={{ fontSize: 48, marginBottom: 12, filter: 'drop-shadow(0 2px 8px rgba(207,19,34,0.3))' }}>{themeColors.brandLogo}</div>
          )}
          <Typography.Title level={3} style={{ margin: 0, color: '#fff', letterSpacing: 1, fontWeight: 600 }}>
            {themeColors.brandName}
          </Typography.Title>
          <Typography.Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {themeColors.systemTitle}
          </Typography.Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            style={{
              marginBottom: 16,
              background: 'rgba(255,59,48,0.12)',
              border: '1px solid rgba(255,59,48,0.2)',
              borderRadius: 12,
            }}
          />
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
              用户名
            </label>
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
              size="large"
              placeholder="请输入用户名"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              autoComplete="username"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: 12,
                height: 44,
              }}
            />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
              密码
            </label>
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
              size="large"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: 12,
                height: 44,
              }}
            />
          </div>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{
              height: 48,
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 12,
              background: themeColors.primaryColor,
              border: 'none',
              boxShadow: `0 4px 16px ${themeColors.primaryColor}44`,
            }}
          >
            登 录
          </Button>
        </form>

        {/* 默认账号提示 */}
        <div style={{
          marginTop: 28,
          padding: '14px 16px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12,
          color: 'rgba(255,255,255,0.35)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.5)' }}>默认账号</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, cfg]) => (
              <Tag key={role} color={cfg.color} style={{ margin: 0, border: 'none', opacity: 0.8 }}>
                {cfg.icon} {cfg.label}
              </Tag>
            ))}
          </div>
          <div style={{ marginTop: 6 }}>管理员: admin / admin123 · 其他: 123456</div>
        </div>
      </div>
    </div>
  );
}
