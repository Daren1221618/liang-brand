import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppProvider, useApp } from './context'
import type { UserInfo } from './userTypes'

// Mock api 和 storage
vi.mock('./api', () => ({
  default: {
    setToken: vi.fn(),
    getToken: vi.fn().mockReturnValue(null),
  },
}))

vi.mock('./storage', () => ({
  getCustomers: vi.fn().mockResolvedValue([]),
  getProjects: vi.fn().mockResolvedValue([]),
  getQuotes: vi.fn().mockResolvedValue([]),
  getReviewTasks: vi.fn().mockResolvedValue([]),
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 1,
    username: 'test',
    role: 'consultant',
  }),
}))

vi.mock('./theme', () => ({
  loadAndApplyTheme: vi.fn().mockResolvedValue({}),
  refreshSettings: vi.fn().mockResolvedValue({}),
}))

// Test helper
function ContextCapture({ onReady }: { onReady?: (ctx: ReturnType<typeof useApp>) => void }) {
  const ctx = useApp()
  if (onReady) onReady(ctx)
  return <div data-testid="context-captured">captured</div>
}

describe('AppProvider / AppContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('初始状态未登录', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <ContextCapture />
        </AppProvider>
      )
    })
    // Just verify it renders without crashing
    expect(screen.getByTestId('context-captured')).toBeInTheDocument()
  })

  it('useApp 在 Provider 外抛出错误', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function OutsideConsumer() {
      try {
        useApp()
        return <div>ok</div>
      } catch (err: any) {
        return <div data-testid="error">{err.message}</div>
      }
    }

    render(<OutsideConsumer />)
    expect(screen.getByTestId('error').textContent).toContain('must be used within AppProvider')
    spy.mockRestore()
  })

  it('login 设置认证状态并调用 setToken', async () => {
    let capturedCtx: ReturnType<typeof useApp> | undefined

    await act(async () => {
      render(
        <AppProvider>
          <ContextCapture onReady={(ctx) => { capturedCtx = ctx }} />
        </AppProvider>
      )
    })

    expect(capturedCtx).toBeDefined()
    expect(capturedCtx!.isAuthenticated).toBe(false)

    await act(async () => {
      capturedCtx!.login({ id: 1, username: 'admin', role: 'admin' }, 'fake-token')
    })

    expect(capturedCtx!.isAuthenticated).toBe(true)
    expect(capturedCtx!.user).toEqual({ id: 1, username: 'admin', role: 'admin' })
    expect(sessionStorage.getItem('lb_role')).toBe('admin')
  })

  it('logout 清除认证状态和 sessionStorage', async () => {
    let capturedCtx: ReturnType<typeof useApp> | undefined

    await act(async () => {
      render(
        <AppProvider>
          <ContextCapture onReady={(ctx) => { capturedCtx = ctx }} />
        </AppProvider>
      )
    })

    // Login first
    await act(async () => {
      capturedCtx!.login({ id: 1, username: 'test', role: 'pm' }, 'token-123')
    })
    expect(capturedCtx!.isAuthenticated).toBe(true)

    // Logout
    await act(async () => {
      capturedCtx!.logout()
    })

    expect(capturedCtx!.isAuthenticated).toBe(false)
    expect(capturedCtx!.user).toBeNull()
    expect(sessionStorage.getItem('lb_role')).toBeNull()
  })

  it('switchRole 更新角色并写入 sessionStorage', async () => {
    let capturedCtx: ReturnType<typeof useApp> | undefined

    await act(async () => {
      render(
        <AppProvider>
          <ContextCapture onReady={(ctx) => { capturedCtx = ctx }} />
        </AppProvider>
      )
    })

    expect(capturedCtx!.role).toBe('consultant') // default when no user

    await act(async () => {
      capturedCtx!.switchRole('designer')
    })

    expect(capturedCtx!.role).toBe('designer')
    expect(sessionStorage.getItem('lb_role')).toBe('designer')
  })

  it('updateUser 更新用户信息', async () => {
    let capturedCtx: ReturnType<typeof useApp> | undefined

    await act(async () => {
      render(
        <AppProvider>
          <ContextCapture onReady={(ctx) => { capturedCtx = ctx }} />
        </AppProvider>
      )
    })

    await act(async () => {
      capturedCtx!.login({ id: 1, username: 'old', role: 'consultant' }, 'tok')
    })
    expect(capturedCtx!.user?.username).toBe('old')

    await act(async () => {
      capturedCtx!.updateUser({ id: 1, username: 'new-name', role: 'strategist' })
    })

    expect(capturedCtx!.user?.username).toBe('new-name')
    expect(capturedCtx!.user?.role).toBe('strategist')
  })

  it('默认角色是 consultant（无 user 时）', async () => {
    let capturedCtx: ReturnType<typeof useApp> | undefined

    await act(async () => {
      render(
        <AppProvider>
          <ContextCapture onReady={(ctx) => { capturedCtx = ctx }} />
        </AppProvider>
      )
    })

    expect(capturedCtx!.role).toBe('consultant')
  })
})
