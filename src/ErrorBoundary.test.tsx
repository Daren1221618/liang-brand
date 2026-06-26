import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useState } from 'react'
import ErrorBoundary, {
  PageErrorBoundary,
  ComponentErrorBoundary,
} from './ErrorBoundary'

// ============================================================
// ErrorBoundary 组件测试
// ============================================================

describe('ErrorBoundary - 正常渲染', () => {
  it('应正常渲染子组件', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">正常内容</div>
      </ErrorBoundary>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('正常内容')).toBeInTheDocument()
  })
})

describe('ErrorBoundary - 错误捕获', () => {
  // 抛出错误的组件，用于测试
  function Bomb({ shouldThrow }: { shouldThrow?: boolean }) {
    if (shouldThrow) throw new Error('测试爆炸')
    return <div>安全</div>
  }

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    ;(console.error as any).mockRestore()
  })

  it('捕获错误后显示默认 fallback UI', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )

    expect(screen.getByText('页面出现了问题')).toBeInTheDocument()
  })

  it('显示错误的 message', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('测试爆炸')).toBeInTheDocument()
  })

  it('显示重试和刷新页面按钮', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getAllByText('重试').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('刷新页面')).toBeInTheDocument()
  })

  it('showHomeButton=false 时隐藏返回首页按钮', () => {
    render(
      <ErrorBoundary showHomeButton={false}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.queryByText('返回首页')).not.toBeInTheDocument()
  })

  it('使用自定义 fallback', () => {
    render(
      <ErrorBoundary fallback={(error, reset) => (
        <div data-testid="custom-fallback">
          自定义错误: {error.message}
          <button onClick={reset}>自定义重试</button>
        </div>
      )}
      >
        <Bomb shouldThrow />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.getByText(/自定义错误/).textContent).toContain('测试爆炸')
  })

  it('onError 回调应在捕获错误时被调用', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
  })
})

describe('ErrorBoundary - 重置功能', () => {
  function ToggleableError() {
    const [throwErr, setThrowErr] = useState(false)
    return (
      <ErrorBoundary>
        {throwErr ? (
          <div data-testid="error-child" onClick={() => setThrowErr(false)}>
            抛错
            {(() => { throw new Error('可恢复错误') })()}
          </div>
        ) : (
          <div data-testid="safe-child" onClick={() => setThrowErr(true)}>点击抛错</div>
        )}
      </ErrorBoundary>
    )
  }

  it('初始状态渲染安全内容', () => {
    render(<ToggleableError />)
    expect(screen.getByTestId('safe-child')).toBeInTheDocument()
  })
})

// ============================================================
// PageErrorBoundary 测试
// ============================================================

describe('PageErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    ;(console.error as any).mockRestore()
  })

  it('正常时渲染 children', () => {
    render(
      <PageErrorBoundary pageName="项目详情">
        <span>项目内容</span>
      </PageErrorBoundary>
    )
    expect(screen.getByText('项目内容')).toBeInTheDocument()
  })

  it('错误时显示页面名', () => {
    function BadPage() {
      throw new Error('页面崩溃')
    }
    render(
      <PageErrorBoundary pageName="项目详情">
        <BadPage />
      </PageErrorBoundary>
    )
    expect(screen.getByText('项目详情加载失败')).toBeInTheDocument()
  })
})

// ============================================================
// ComponentErrorBoundary 测试
// ============================================================

describe('ComponentErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    ;(console.error as any).mockRestore()
  })

  it('正常时渲染 children', () => {
    render(
      <ComponentErrorBoundary blockName="AI 生成器">
        <span>AI 面板</span>
      </ComponentErrorBoundary>
    )
    expect(screen.getByText('AI 面板')).toBeInTheDocument()
  })

  it('错误时显示区块名称和重试链接', () => {
    function BadComponent() {
      throw new Error('组件崩溃')
    }
    render(
      <ComponentErrorBoundary blockName="AI 生成器">
        <BadComponent />
      </ComponentErrorBoundary>
    )
    expect(screen.getByText(/AI 生成器加载失败/)).toBeInTheDocument()
  })

  it('提供 placeholder 时显示自定义占位', () => {
    function BadComponent() {
      throw new Error('崩溃')
    }
    render(
      <ComponentErrorBoundary blockName="图表" placeholder={<div>加载中...</div>}
    >
      <BadComponent />
    </ComponentErrorBoundary>
    )
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })
})
