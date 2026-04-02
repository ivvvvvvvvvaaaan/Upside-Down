import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GRANTS,
  DEFAULT_ROLE_GROUPS,
  userHasAccess,
  resolveAccess,
  canCreateGrantForResource,
  canEditAclForResource,
  canAssignProfile,
  buildSharesReceivedByMe,
  buildSharesCreatedByMe,
  buildAllProjectShares,
  roleGroupHasPermission,
  getRoleGroup,
  profileCanEdit,
  PROJECT_RESOURCE,
} from '@/lib/grants'
import type { Grant, ResourceRef, RoleGroup, Permission } from '@/lib/grants'

describe('grant-based access model', () => {
  it('uses explicit department-root grants for default department access', () => {
    const result = resolveAccess('vfx-coordinator', 'ws-vfx', DEFAULT_GRANTS)
    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe('team')
    expect(result.effectiveProfile).toBe('manager')
  })

  it('keeps per-person department overrides explicit', () => {
    const lisa = resolveAccess('editorial-coordinator', 'ws-editorial', DEFAULT_GRANTS)
    const maria = resolveAccess('editorial-artist', 'ws-editorial', DEFAULT_GRANTS)

    expect(lisa.hasAccess).toBe(true)
    expect(lisa.source).toBe('direct')
    expect(lisa.effectiveProfile).toBe('manager')

    expect(maria.hasAccess).toBe(true)
    expect(maria.source).toBe('team')
    expect(maria.effectiveProfile).toBe('editor')
  })

  it('keeps studio and creative users explicit-share only for resource access', () => {
    expect(userHasAccess('studio-alex', 'vfx', DEFAULT_GRANTS)).toBe(false)
    expect(userHasAccess('creative-david', 'vfx', DEFAULT_GRANTS)).toBe(false)

    expect(userHasAccess('studio-alex', 'ws-edit-cut-1', DEFAULT_GRANTS)).toBe(true)
    expect(userHasAccess('creative-david', 'ws-art-concept-1', DEFAULT_GRANTS)).toBe(true)
  })

  it('keeps vendor access explicit-share only', () => {
    expect(userHasAccess('vendor-framestore', 'vfx', DEFAULT_GRANTS)).toBe(false)
    expect(userHasAccess('vendor-framestore', 'ws-vfx-coll-for-vendor', DEFAULT_GRANTS)).toBe(true)
  })

  it('resolves team grants correctly', () => {
    expect(userHasAccess('vfx-supervisor', 'ws-edit-coll-for-vfx', DEFAULT_GRANTS)).toBe(true)
    expect(userHasAccess('vendor-framestore', 'ws-edit-coll-for-vfx', DEFAULT_GRANTS)).toBe(false)
  })

  it('tracks received shares for inbox', () => {
    const received = buildSharesReceivedByMe('editorial-coordinator', DEFAULT_GRANTS)
    const resourceIds = received.map((view) => view.resourceId)

    expect(resourceIds).toContain('ws-vfx-coll-for-editorial')
    expect(resourceIds).not.toContain('ws-editorial')
  })
})

describe('capability decomposition', () => {
  it('roleGroupHasPermission checks capabilities correctly', () => {
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'owner', 'edit-acl')).toBe(true)
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'editor', 'edit-acl')).toBe(false)
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'viewer', 'open')).toBe(true)
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'viewer', 'write')).toBe(false)
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'commenter', 'comment')).toBe(true)
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'commenter', 'delete')).toBe(false)
  })

  it('getRoleGroup returns the correct group', () => {
    const editor = getRoleGroup(DEFAULT_ROLE_GROUPS, 'editor')
    expect(editor).toBeDefined()
    expect(editor!.name).toBe('Can edit & share')
    expect(editor!.permissions).toContain('write')
    expect(editor!.permissions).not.toContain('edit-acl')
  })

  it('profileCanEdit uses template write permission', () => {
    expect(profileCanEdit('editor')).toBe(true)
    expect(profileCanEdit('viewer')).toBe(false)
    expect(profileCanEdit('contributor')).toBe(true)
    expect(profileCanEdit('commenter')).toBe(false)
  })

  it('custom role groups can change template permissions', () => {
    const customGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS.map((group) =>
      group.id === 'editor'
        ? { ...group, permissions: ['open', 'comment'] as Permission[] }
        : group,
    )

    expect(profileCanEdit('editor', customGroups)).toBe(false)
    expect(roleGroupHasPermission(customGroups, 'editor', 'write')).toBe(false)
    expect(profileCanEdit('contributor', customGroups)).toBe(true)
  })

  it('resolveAccess includes explicit grant permissions in the result', () => {
    const result = resolveAccess('vendor-framestore', 'ws-vfx-coll-for-vendor', DEFAULT_GRANTS)
    expect(result.hasAccess).toBe(true)
    expect(result.effectiveProfile).toBe('viewer')
    expect(result.permissions).toEqual(['discover', 'open', 'download'])
    expect(result.canEdit).toBe(false)
  })

  it('resolveAccess respects custom role groups for explicit department-root access', () => {
    const customGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS.map((group) =>
      group.id === 'manager'
        ? { ...group, permissions: ['open'] as Permission[] }
        : group,
    )

    const result = resolveAccess('vfx-supervisor', 'ws-vfx', DEFAULT_GRANTS, customGroups)
    expect(result.hasAccess).toBe(true)
    expect(result.effectiveProfile).toBe('manager')
    expect(result.canEdit).toBe(false)
    expect(result.permissions).toEqual(['open'])
  })

  it('userHasAccess requires open permission on matching grants', () => {
    const customGrant: Grant = {
      id: 'custom-grant',
      resource: { id: 'custom-asset', type: 'asset' },
      principal: { type: 'user', userId: 'vendor-framestore' },
      permissions: ['download'],
      grantedByUserId: 'studio-alex',
      grantedAt: '2026-03-31',
    }

    const result = resolveAccess('vendor-framestore', 'custom-asset', [customGrant])
    expect(result.permissions).toEqual(['download'])
    expect(result.hasAccess).toBe(false)
    expect(userHasAccess('vendor-framestore', 'custom-asset', [customGrant])).toBe(false)
  })

  it('resource-level ACL helpers distinguish sharing from admin rights', () => {
    const vfxFolder: ResourceRef = { id: 'ws-vfx-shots', type: 'folder', departmentId: 'vfx' }

    expect(canCreateGrantForResource('vfx-coordinator', vfxFolder, DEFAULT_GRANTS)).toBe(true)
    expect(canEditAclForResource('vfx-coordinator', vfxFolder, DEFAULT_GRANTS)).toBe(true)

    expect(canCreateGrantForResource('vfx-supervisor', PROJECT_RESOURCE, DEFAULT_GRANTS)).toBe(true)
    expect(canEditAclForResource('vfx-supervisor', PROJECT_RESOURCE, DEFAULT_GRANTS)).toBe(false)

    expect(canCreateGrantForResource('vendor-framestore', PROJECT_RESOURCE, DEFAULT_GRANTS)).toBe(false)
    expect(canEditAclForResource('vendor-framestore', PROJECT_RESOURCE, DEFAULT_GRANTS)).toBe(false)
  })

  it('prevents editors from delegating profiles with permissions they do not have', () => {
    const editorPermissions = DEFAULT_ROLE_GROUPS.find((group) => group.id === 'editor')!.permissions

    expect(canAssignProfile(editorPermissions, 'viewer', DEFAULT_ROLE_GROUPS)).toBe(true)
    expect(canAssignProfile(editorPermissions, 'contributor', DEFAULT_ROLE_GROUPS)).toBe(true)
    expect(canAssignProfile(editorPermissions, 'manager', DEFAULT_ROLE_GROUPS)).toBe(false)
  })
})

describe('project-level roles', () => {
  it('project roles apply to the project settings resource only', () => {
    const projectAccess = resolveAccess('studio-alex', PROJECT_RESOURCE.id, DEFAULT_GRANTS)
    expect(projectAccess.hasAccess).toBe(true)
    expect(projectAccess.effectiveProfile).toBe('manager')
    expect(projectAccess.source).toBe('project-direct')

    const unrelatedAccess = resolveAccess('studio-alex', 'some-random-resource', DEFAULT_GRANTS)
    expect(unrelatedAccess.hasAccess).toBe(false)
  })

  it('project grants are excluded from share views', () => {
    const created = buildSharesCreatedByMe('studio-alex', DEFAULT_GRANTS)
    expect(created.map((view) => view.resourceType)).not.toContain('project')

    const received = buildSharesReceivedByMe('editorial-coordinator', DEFAULT_GRANTS)
    expect(received.map((view) => view.resourceType)).not.toContain('project')

    const allShares = buildAllProjectShares(DEFAULT_GRANTS)
    expect(allShares.map((view) => view.resourceType)).not.toContain('project')
  })

  it('department-root policy grants are excluded from share views', () => {
    const created = buildSharesCreatedByMe('studio-alex', DEFAULT_GRANTS)
    const received = buildSharesReceivedByMe('editorial-coordinator', DEFAULT_GRANTS)
    const allShares = buildAllProjectShares(DEFAULT_GRANTS)

    expect(created.map((view) => view.resourceId)).not.toContain('ws-vfx')
    expect(created.map((view) => view.resourceId)).not.toContain('ws-editorial')
    expect(received.map((view) => view.resourceId)).not.toContain('ws-editorial')
    expect(allShares.map((view) => view.resourceId)).not.toContain('ws-vfx')
    expect(allShares.map((view) => view.resourceId)).not.toContain('ws-editorial')
    expect(allShares.map((view) => view.resourceId)).not.toContain('ws-art-design')
  })
})
