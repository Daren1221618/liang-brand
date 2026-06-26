import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api } from './api'

describe('ApiClient - Token 管理', () => {
  beforeEach(() => {
    sessionStorage.clear()
    // 重置 token
    ;(api as any).token = null
    sessionStorage.removeItem('lb_token')
  })

  it('构造时应从 sessionStorage 读取已有 token', () => {
    sessionStorage.setItem('lb_token', 'existing-token-123')
    const client = new (Object.getPrototypeOf(api).constructor)()
    expect(client.getToken()).toBe('existing-token-123')
  })

  it('setToken 应将 token 存入 sessionStorage 和内存', () => {
    api.setToken('new-jwt-token')
    expect(api.getToken()).toBe('new-jwt-token')
    expect(sessionStorage.getItem('lb_token')).toBe('new-jwt-token')
  })

  it('setToken(null) 应清除 token', () => {
    api.setToken('some-token')
    api.setToken(null)
    expect(api.getToken()).toBeNull()
    expect(sessionStorage.getItem('lb_token')).toBeNull()
  })

  it('setToken(undefined) 应清除 token（兼容空值场景）', () => {
    api.setToken('some-token')
    api.setToken(null as any)
    expect(api.getToken()).toBeNull()
  })
})

describe('ApiClient - HTTP 方法注册', () => {
  it('应暴露 get/post/put/delete/download 方法', () => {
    expect(typeof api.get).toBe('function')
    expect(typeof api.post).toBe('function')
    expect(typeof api.put).toBe('function')
    expect(typeof api.delete).toBe('function')
    expect(typeof api.download).toBe('function')
  })
})
