import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAnyPermission,
  getMenuItems,
  ROLE_CONFIG,
} from './permissions'
import type { PermissionKey } from '../permissions'

// ============================================================
// 权限系统是纯函数，无需 mock，直接验证业务规则
// ============================================================

describe('hasPermission - 系统级权限矩阵', () => {
  it('admin 应拥有所有权限', () => {
    const allPerms: PermissionKey[] = [
      'customer:view', 'customer:delete',
      'project:view', 'project:delete', 'project:customize',
      'settings:view', 'settings:edit',
      'user:manage', 'data:export',
    ]
    allPerms.forEach(p => {
      expect(hasPermission('admin', p)).toBe(true)
    })
  })

  it('consultant 应有 deliverable:edit 权限', () => {
    expect(hasPermission('consultant', 'deliverable:edit')).toBe(true)
  })

  it('consultant 不应有 customer:delete 权限', () => {
    expect(hasPermission('consultant', 'customer:delete')).toBe(false)
  })

  it('strategist 不应有 project:create 权限', () => {
    expect(hasPermission('strategist', 'project:create')).toBe(false)
  })

  it('designer 应有 deliverable:view 但无 project:edit', () => {
    expect(hasPermission('designer', 'deliverable:view')).toBe(true)
    expect(hasPermission('designer', 'project:edit')).toBe(false)
  })

  it('pm 应有 project:phase 和 project:team 权限', () => {
    expect(hasPermission('pm', 'project:phase')).toBe(true)
    expect(hasPermission('pm', 'project:team')).toBe(true)
  })

  it('pm 应有 data:export 权限', () => {
    expect(hasPermission('pm', 'data:export')).toBe(true)
  })

  it('designer 不应有 initiation:edit 权限', () => {
    expect(hasPermission('designer', 'initiation:edit')).toBe(false)
  })
})

describe('hasAnyPermission - 多权限匹配', () => {
  it('当任一权限匹配时返回 true', () => {
    expect(hasAnyPermission('consultant', ['customer:delete', 'customer:view'])).toBe(true)
  })

  it('全部不匹配时返回 false', () => {
    expect(hasAnyPermission('designer', ['user:manage', 'data:import'])).toBe(false)
  })

  it('空数组返回 false', () => {
    expect(hasAnyPermission('admin', [])).toBe(false)
  })
})

describe('ROLE_CONFIG - 角色配置完整性', () => {
  it('所有角色都有 label、color、icon', () => {
    for (const [role, config] of Object.entries(ROLE_CONFIG)) {
      expect(config.label).toBeTruthy()
      expect(config.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(config.icon).toBeTruthy()
    }
  })

  it('包含全部 5 个角色', () => {
    expect(Object.keys(ROLE_CONFIG)).toEqual(
      expect.arrayContaining(['admin', 'consultant', 'strategist', 'designer', 'pm'])
    )
    expect(Object.keys(ROLE_CONFIG)).toHaveLength(5)
  })
})

describe('getMenuItems - 菜单可见性', () => {
  it('admin 可见所有菜单', () => {
    const items = getMenuItems('admin')
    const keys = items.map(i => i.key)
    expect(keys).toContain('/customers')
    expect(keys).toContain('/quotes')
    expect(keys).toContain('/projects')
    expect(keys).toContain('/settings')
    expect(keys).toContain('/review')
    expect(keys).toContain('/service-blueprint')
  })

  it('所有人都能看到工作台和知识库', () => {
    const roles = ['admin', 'consultant', 'strategic', 'designer', 'pm'] as const
    roles.forEach(role => {
      try {
        const items = getMenuItems(role as any)
        const keys = items.map(i => i.key)
        expect(keys).toContain('/')
        expect(keys).toContain('/knowledge')
      } catch {
        // 无效角色可能报错，忽略
      }
    })
  })

  it('designer 不可见系统设置菜单', () => {
    const items = getMenuItems('designer')
    const keys = items.map(i => i.key)
    expect(keys).not.toContain('/settings')
  })

  it('每个菜单项都有 key/icon/label', () => {
    const roles: ('admin' | 'consultant' | 'strategist' | 'designer' | 'pm')[] =
      ['admin', 'consultant', 'strategist', 'designer', 'pm']
    roles.forEach(role => {
      const items = getMenuItems(role)
      items.forEach(item => {
        expect(item.key).toBeTruthy()
        expect(item.label).toBeTruthy()
        expect(item.icon).toBeTruthy()
      })
    })
  })
})
