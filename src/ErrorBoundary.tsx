// ============================================================
// 亮品牌 · 三层错误边界组件
// 支持自定义 fallback、错误回调、开发者模式堆栈展示
// ============================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

// ---------- 公共 Props ----------
interface ErrorBoundaryProps {
  children: ReactNode;
  /** 自定义 fallback 渲染函数，接收 error 和 reset 回调 */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** 错误回调，可用于上报监控 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 是否显示"返回首页"按钮（默认 true） */
  showHomeButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] 捕获错误:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo } = this.state;

    // 如果提供了自定义 fallback，使用它
    if (this.props.fallback) {
      return this.props.fallback(error!, this.handleReset);
    }

    // 默认 fallback UI
    const isDev = import.meta.env?.DEV;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        padding: 24,
        background: '#fafafa',
      }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <Result
            status="error"
            title="页面出现了问题"
            subTitle={error?.message || '发生了未知错误，请稍后重试'}
            extra={[
              <Button key="retry" icon={<ReloadOutlined />} onClick={this.handleReset}>
                重试
              </Button>,
              <Button key="reload" type="primary" icon={<ReloadOutlined />} onClick={this.handleReload}>
                刷新页面
              </Button>,
              this.props.showHomeButton !== false && (
                <Button key="home" icon={<HomeOutlined />} onClick={this.handleGoHome}>
                  返回首页
                </Button>
              ),
            ].filter(Boolean)}
          />

          {/* 开发者模式：显示错误堆栈 */}
          {isDev && errorInfo && (
            <div style={{
              marginTop: 16,
              textAlign: 'left',
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 12px',
                background: '#f6f8fa',
                borderBottom: '1px solid #e8e8e8',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <BugOutlined style={{ color: '#999' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>开发者信息（仅开发环境可见）</Text>
              </div>
              <Paragraph
                style={{
                  margin: 0,
                  padding: 12,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: 200,
                  overflow: 'auto',
                  color: '#666',
                }}
              >
                {error?.stack}
                {'\n\n--- Component Stack ---\n'}
                {errorInfo.componentStack}
              </Paragraph>
            </div>
          )}
        </div>
      </div>
    );
  }
}

// ============================================================
// 页面级错误边界 — 用于包裹每个路由页面
// 崩溃时只影响当前页面，侧边栏和导航不受影响
// ============================================================

interface PageErrorBoundaryProps {
  children: ReactNode;
  /** 页面名称，用于错误提示 */
  pageName?: string;
  /** 错误回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<PageErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[PageErrorBoundary] ${this.props.pageName || '页面'} 捕获错误:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const pageName = this.props.pageName || '此页面';

      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          padding: 24,
        }}>
          <Result
            status="warning"
            title={`${pageName}加载失败`}
            subTitle={this.state.error?.message || '请稍后重试，或返回首页'}
            extra={[
              <Button key="retry" onClick={this.handleReset}>
                重试
              </Button>,
              <Button key="home" type="primary" onClick={() => { window.location.href = '/'; }}>
                返回首页
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================
// 组件级错误边界 — 用于包裹独立功能区块（如 AI 生成区）
// 崩溃时只显示占位，不影响页面其他内容
// ============================================================

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  /** 区块名称 */
  blockName?: string;
  /** 自定义占位内容 */
  placeholder?: ReactNode;
  /** 错误回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ComponentErrorBoundaryState {
  hasError: boolean;
}

export class ComponentErrorBoundary extends Component<ComponentErrorBoundaryProps, ComponentErrorBoundaryState> {
  state: ComponentErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): Partial<ComponentErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ComponentErrorBoundary] ${this.props.blockName || '组件'} 错误:`, error);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.placeholder) {
        return <>{this.props.placeholder}</>;
      }

      return (
        <div style={{
          padding: '32px 16px',
          textAlign: 'center',
          background: '#fff',
          border: '1px dashed #d9d9d9',
          borderRadius: 8,
        }}>
          <Text type="secondary">
            {this.props.blockName || '组件'}加载失败，
            <a onClick={() => this.setState({ hasError: false })} style={{ cursor: 'pointer' }}>
              点击重试
            </a>
          </Text>
        </div>
      );
    }

    return this.props.children;
  }
}
