// ============================================================
// 亮品牌 · 主应用（路由 + 布局 + 权限守卫）
// ============================================================

import React, { useState, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Tag, Badge, Spin, Modal, Button, Typography, Drawer, ConfigProvider } from 'antd';
import { theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  DashboardOutlined, UserOutlined,
  ProjectOutlined, ToolOutlined, AuditOutlined,
  DollarOutlined, BellOutlined, LogoutOutlined,
  SettingOutlined, ExportOutlined,
  ImportOutlined, KeyOutlined, TeamOutlined, MenuOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useApp } from './context';
import { ROLE_CONFIG, getMenuItems, hasPermission } from './permissions';
import type { Role } from './userTypes';
import Login from './pages/Login';
import ErrorBoundary, { PageErrorBoundary } from './ErrorBoundary';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import CustomerDetail from './pages/CustomerDetail';
import QuoteCreate from './pages/QuoteCreate';
import QuoteDetail from './pages/QuoteDetail';
import PackageQuotePage from './pages/PackageQuotePage';
import CustomQuotePage from './pages/CustomQuotePage';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import ProjectEngine from './pages/ProjectEngine';
import ServiceCustomize from './pages/ServiceCustomize';
import ReviewCenter from './pages/ReviewCenter';
import ServiceBlueprint from './pages/ServiceBlueprint';
import ProjectInitiation from './pages/ProjectInitiation';
import KnowledgePage from './pages/KnowledgePage';
import SettingsPage from './pages/SettingsPage';
import UserManager from './components/UserManager';
import DataTools from './components/DataTools';
import type { UserManagerRef } from './components/UserManager';
import type { DataToolsRef } from './components/DataTools';
import { getSiderGradient, getBrandName, getBrandLogo, getSystemTitle } from './theme';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

/** 渲染品牌 Logo（图片或文字） */
function renderBrandLogo(logo: string, height = 28): React.ReactNode {
  if (!logo) return null;
  if (logo.startsWith('/uploads/') || logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:')) {
    return <img src={logo} alt="Logo" style={{ height, maxWidth: 120, objectFit: 'contain' }} />;
  }
  return <span style={{ fontSize: height }}>{logo}</span>;
}

// 角色颜色映射
const ROLE_COLORS: Record<string, string> = {
  admin: '#f5222d',
  consultant: '#cf1322',
  strategist: '#722ed1',
  designer: '#eb2f96',
  pm: '#13c2c2',
};

// 角色标签（向后兼容）
const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  consultant: '咨询顾问',
  strategist: '策略师',
  designer: '设计师',
  pm: '项目经理',
};

// 权限守卫路由组件
function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const { isAuthenticated, user, loading, login } = useApp();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={(u, t) => login(u, t)} />;
  }

  if (permission && user && !hasPermission(user.role as Role, permission as any)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Typography.Title level={4}>暂无权限</Typography.Title>
          <Text type="secondary">您当前的岗位无权访问此页面</Text>
        </div>
      </div>
    );
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
}

// 主布局（含侧边栏和头部）
function AppLayout() {
  const { user, role, logout, refresh, reviewTasks, switchRole, publicSettings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [siderVisible, setSiderVisible] = useState(false);
  const userManagerRef = useRef<UserManagerRef>(null);
  const dataToolsRef = useRef<DataToolsRef>(null);

  const pendingReviews = reviewTasks.filter(t => t.status === 'pending_review').length;
  const menuItems = getMenuItems(role);
  const activeKey = '/' + (location.pathname.split('/')[1] || '');

  // 角色切换（管理员可切换角色体验）
  const roleMenu = {
    items: Object.entries(ROLE_CONFIG).map(([key, cfg]) => ({
      key,
      label: (
        <span>
          <Tag color={cfg.color} style={{ marginRight: 8 }}>{cfg.icon} {cfg.label}</Tag>
          {key === user?.role && <Text type="secondary" style={{ fontSize: 12 }}>（当前）</Text>}
        </span>
      ),
      disabled: key !== user?.role && user?.role !== 'admin',
    })),
    onClick: ({ key }: { key: string }) => {
      if (key !== user?.role && user?.role === 'admin') {
        switchRole(key as Role);
      }
    },
  };

  // 用户菜单
  const userMenu = {
    items: [
      { key: 'password', icon: <KeyOutlined />, label: '修改密码' },
      ...(user?.role === 'admin' ? [
        { type: 'divider' as const },
        { key: 'users', icon: <TeamOutlined />, label: '用户管理' },
        { key: 'export', icon: <ExportOutlined />, label: '导出数据' },
        { key: 'import', icon: <ImportOutlined />, label: '导入数据' },
      ] : []),
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
        Modal.confirm({
          title: '确认退出',
          content: '退出后需要重新登录',
          onOk: () => {
            logout();
            navigate('/login');
          },
        });
      } else if (key === 'password') {
        userManagerRef.current?.showPassword();
      } else if (key === 'users') {
        userManagerRef.current?.showUsers();
      } else if (key === 'export') {
        dataToolsRef.current?.exportData();
      } else if (key === 'import') {
        dataToolsRef.current?.importData();
      }
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 桌面端侧边栏 */}
      <div className="hide-mobile">
        <Sider
          width={220}
          style={{
            background: 'rgba(30, 30, 30, 0.92)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
          }}
        >
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 16px' }}>
            {renderBrandLogo(getBrandLogo(publicSettings), 28)}
            <span style={{ color: '#fff', fontSize: 17, fontWeight: 600, letterSpacing: 0.5 }}>{getBrandName(publicSettings)}</span>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            items={menuItems.map(item => {
              const iconMap: Record<string, React.ReactNode> = {
                DashboardOutlined: <DashboardOutlined />,
                UserOutlined: <UserOutlined />,
                DollarOutlined: <DollarOutlined />,
                ProjectOutlined: <ProjectOutlined />,
                AuditOutlined: <AuditOutlined />,
                ToolOutlined: <ToolOutlined />,
                BookOutlined: <BookOutlined />,
              };
              return {
                ...item,
                icon: iconMap[item.icon] || <DashboardOutlined />,
              };
            })}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
      </div>

      {/* 移动端侧边栏 Drawer */}
      <Drawer
        placement="left"
        open={siderVisible}
        onClose={() => setSiderVisible(false)}
        width={240}
        closable
        styles={{ body: { padding: 0, background: 'rgba(30, 30, 30, 0.95)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }, header: { display: 'none' } }}
        className="mobile-drawer"
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 16px' }}>
          {renderBrandLogo(getBrandLogo(publicSettings), 28)}
          <span style={{ color: '#fff', fontSize: 17, fontWeight: 600, letterSpacing: 0.5 }}>{getBrandName(publicSettings)}</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems.map(item => {
            const iconMap: Record<string, React.ReactNode> = {
              DashboardOutlined: <DashboardOutlined />,
              UserOutlined: <UserOutlined />,
              DollarOutlined: <DollarOutlined />,
              ProjectOutlined: <ProjectOutlined />,
              AuditOutlined: <AuditOutlined />,
              ToolOutlined: <ToolOutlined />,
              BookOutlined: <BookOutlined />,
            };
            return {
              ...item,
              icon: iconMap[item.icon] || <DashboardOutlined />,
            };
          })}
          onClick={({ key }) => { navigate(key); setSiderVisible(false); }}
        />
      </Drawer>

      <Layout className="app-main-layout">
        <Header className="app-header" style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(0,0,0,0.08)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          height: 64,
          lineHeight: '64px',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto', minWidth: 0 }}>
            {/* 移动端菜单按钮 */}
            <Button
              className="hide-desktop"
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setSiderVisible(true)}
            />
            <span className="hide-mobile" style={{ fontSize: 14, color: '#666', whiteSpace: 'nowrap' }}>
              {getSystemTitle(publicSettings)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'nowrap' }}>
            {hasPermission(role as Role, 'review:view') && (
              <Badge count={pendingReviews} size="small" offset={[2, -2]}>
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => navigate('/review')} />
              </Badge>
            )}
            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
                <Avatar size={32} style={{ background: ROLE_COLORS[role], flexShrink: 0 }}>
                  {ROLE_LABELS[role]?.charAt(0) || 'U'}
                </Avatar>
                <div className="hide-mobile" style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: '20px' }}>{user?.displayName || user?.username}</div>
                  <Tag color={ROLE_COLORS[role]} style={{ fontSize: 11, lineHeight: '18px', margin: 0, padding: '0 4px', transform: 'scale(0.9)', transformOrigin: 'left center' }}>
                    {ROLE_LABELS[role]}
                  </Tag>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 0, minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<PageErrorBoundary pageName="仪表盘"><Dashboard /></PageErrorBoundary>} />
            <Route path="/customers" element={<PageErrorBoundary pageName="客户管理"><CustomerList /></PageErrorBoundary>} />
            <Route path="/customers/:id" element={<PageErrorBoundary pageName="客户详情"><CustomerDetail /></PageErrorBoundary>} />
            <Route path="/quotes/new" element={<PageErrorBoundary pageName="创建报价"><QuoteCreate /></PageErrorBoundary>} />
            <Route path="/quotes/new/package/:planId" element={<PageErrorBoundary pageName="套餐报价"><PackageQuotePage /></PageErrorBoundary>} />
            <Route path="/quotes/new/custom" element={<PageErrorBoundary pageName="自定义报价"><CustomQuotePage /></PageErrorBoundary>} />
            <Route path="/quotes/:id" element={<PageErrorBoundary pageName="报价详情"><QuoteDetail /></PageErrorBoundary>} />
            <Route path="/projects" element={<PageErrorBoundary pageName="项目管理"><ProjectList /></PageErrorBoundary>} />
            <Route path="/projects/:id" element={<PageErrorBoundary pageName="项目详情"><ProjectDetail /></PageErrorBoundary>} />
            <Route path="/projects/:id/initiation" element={<PageErrorBoundary pageName="项目启动"><ProjectInitiation /></PageErrorBoundary>} />
            <Route path="/projects/:id/engine/:engineType" element={<PageErrorBoundary pageName="引擎工作台"><ProjectEngine /></PageErrorBoundary>} />
            <Route path="/projects/:id/service-customize" element={<PageErrorBoundary pageName="服务定制"><ServiceCustomize /></PageErrorBoundary>} />
            <Route path="/review" element={<PageErrorBoundary pageName="审核中心"><ReviewCenter /></PageErrorBoundary>} />
            <Route path="/knowledge" element={<PageErrorBoundary pageName="知识库"><KnowledgePage /></PageErrorBoundary>} />
            <Route path="/settings" element={<PageErrorBoundary pageName="系统设置"><SettingsPage /></PageErrorBoundary>} />
            <Route path="/service-blueprint" element={<PageErrorBoundary pageName="服务蓝图"><ServiceBlueprint /></PageErrorBoundary>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>

      <UserManager ref={userManagerRef} />
      <DataTools ref={dataToolsRef} onImportComplete={refresh} />
    </Layout>
  );
}

export default function App() {
  const { isAuthenticated, loading, login, publicSettings } = useApp();
  const primaryColor = publicSettings['theme.primaryColor'] || '#cf1322';

  // Apple Design 主题 Token
  const appleTheme = {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: primaryColor,
      borderRadius: 12,
      fontSize: 15,
      colorBgContainer: '#ffffff',
      colorBgLayout: '#f5f5f7',
      colorBorder: 'rgba(0,0,0,0.06)',
      colorBorderSecondary: 'rgba(0,0,0,0.04)',
      colorText: '#1d1d1f',
      colorTextSecondary: '#6e6e73',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
      controlHeight: 36,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
      boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.08)',
    },
    components: {
      Card: { paddingLG: 24, borderRadiusLG: 16 },
      Button: { borderRadius: 9999, controlHeight: 36, fontSize: 14, fontWeight: 500 },
      Input: { borderRadius: 8, controlHeight: 36 },
      Select: { borderRadius: 8, controlHeight: 36 },
      Table: { borderRadius: 12, headerBg: '#fbfbfd', headerColor: '#6e6e73', rowHoverBg: 'rgba(0,0,0,0.015)' },
      Modal: { borderRadiusLG: 20, paddingLG: 24, paddingContentHorizontalLG: 32 },
      Tag: { borderRadiusSM: 9999 },
      Statistic: { titleFontSize: 13, contentFontSize: 28 },
    },
  };

  if (loading) {
    return (
      <ConfigProvider locale={zhCN} theme={appleTheme}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f5f7' }}>
          <Spin size="large" />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider key={primaryColor} locale={zhCN} theme={appleTheme}>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={login} />
        } />
        <Route path="*" element={
          isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </ConfigProvider>
  );
}
