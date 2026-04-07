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
    expect(result.effectiveProfile).toBe('manage')
  })

  it('uses department team defaults consistently for all department members', () => {
    const lisa = resolveAccess('editorial-coordinator', 'ws-editorial', DEFAULT_GRANTS)
    const maria = resolveAccess('editorial-artist', 'ws-editorial', DEFAULT_GRANTS)

    expect(lisa.hasAccess).toBe(true)
    expect(lisa.source).toBe('team')
    expect(lisa.effectiveProfile).toBe('manage')

    expect(maria.hasAccess).toBe(true)
    expect(maria.source).toBe('team')
    expect(maria.effectiveProfile).toBe('manage')
  })

  it('lets a direct person override outrank the department default', () => {
    const customOverride: Grant = {
      id: 'editorial-override',
      resource: { id: 'ws-editorial', type: 'folder', departmentId: 'editorial' },
      principal: { type: 'user', userId: 'editorial-coordinator' },
      templateId: 'manage',
      permissions: DEFAULT_ROLE_GROUPS.find((group) => group.id === 'manage')!.permissions,
      grantedByUserId: 'studio-alex',
      grantedAt: '2026-04-02',
    }

    const lisa = resolveAccess('editorial-coordinator', 'ws-editorial', [...DEFAULT_GRANTS, customOverride])

    expect(lisa.hasAccess).toBe(true)
    expect(lisa.source).toBe('direct')
    expect(lisa.effectiveProfile).toBe('manage')
  })

  it('keeps studio and creative users explicit-share only for resource access', () => {
    expect(userHasAccess('studio-alex', 'vfx', DEFAULT_GRANTS)).toBe(false)
    expect(userHasAccess('creative-david', 'vfx', DEFAULT_GRANTS)).toBe(false)

    expect(userHasAccess('studio-alex', 'cut-ep301-lc-2', DEFAULT_GRANTS)).toBe(true)
    expect(userHasAccess('creative-david', 'cut-ep301-lc-1', DEFAULT_GRANTS)).toBe(true)
  })

  it('keeps vendor access explicit-share only', () => {
    expect(userHasAccess('vendor-framestore', 'vfx', DEFAULT_GRANTS)).toBe(false)
    expect(userHasAccess('vendor-framestore', 'ws-vfx-coll-for-vendor', DEFAULT_GRANTS)).toBe(true)
  })

  it('resolves direct resource shares correctly', () => {
    expect(userHasAccess('vfx-supervisor', 'coll-cam-lens-data', DEFAULT_GRANTS)).toBe(true)
    expect(userHasAccess('vendor-framestore', 'coll-cam-lens-data', DEFAULT_GRANTS)).toBe(false)
  })

  it('lets resource shares target access groups as real ACL principals', () => {
    const reviewFolder: ResourceRef = { id: 'studio-review-drop', type: 'folder' }
    const accessGroupGrant: Grant = {
      id: 'access-group-grant',
      resource: reviewFolder,
      principal: { type: 'team', teamId: 'studio-leadership' },
      templateId: 'view',
      permissions: DEFAULT_ROLE_GROUPS.find((group) => group.id === 'view')!.permissions,
      grantedByUserId: 'editorial-coordinator',
      grantedAt: '2026-04-02',
    }

    const alex = resolveAccess('studio-alex', reviewFolder.id, [...DEFAULT_GRANTS, accessGroupGrant])
    const david = resolveAccess('creative-david', reviewFolder.id, [...DEFAULT_GRANTS, accessGroupGrant])
    const james = resolveAccess('vendor-framestore', reviewFolder.id, [...DEFAULT_GRANTS, accessGroupGrant])

    expect(alex.hasAccess).toBe(true)
    expect(alex.source).toBe('team')
    expect(alex.effectiveProfile).toBe('view')

    expect(david.hasAccess).toBe(true)
    expect(david.source).toBe('team')
    expect(david.effectiveProfile).toBe('view')

    expect(james.hasAccess).toBe(false)
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
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'edit', 'edit-acl')).toBe(false)
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'view', 'open')).toBe(true)
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'view', 'write')).toBe(false)
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'comment', 'comment')).toBe(true)
    expect(roleGroupHasPermission(DEFAULT_ROLE_GROUPS, 'comment', 'delete')).toBe(false)
  })

  it('getRoleGroup returns the correct group', () => {
    const editor = getRoleGroup(DEFAULT_ROLE_GROUPS, 'edit')
    expect(editor).toBeDefined()
    expect(editor!.name).toBe('Can edit')
    expect(editor!.permissions).toContain('write')
    expect(editor!.permissions).not.toContain('edit-acl')
  })

  it('profileCanEdit uses template write permission', () => {
    expect(profileCanEdit('edit')).toBe(true)
    expect(profileCanEdit('view')).toBe(false)
    expect(profileCanEdit('contribute')).toBe(true)
    expect(profileCanEdit('comment')).toBe(false)
  })

  it('custom role groups can change template permissions', () => {
    const customGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS.map((group) =>
      group.id === 'edit'
        ? { ...group, permissions: ['open', 'comment'] as Permission[] }
        : group,
    )

    expect(profileCanEdit('edit', customGroups)).toBe(false)
    expect(roleGroupHasPermission(customGroups, 'edit', 'write')).toBe(false)
    expect(profileCanEdit('contribute', customGroups)).toBe(true)
  })

  it('resolveAccess includes explicit grant permissions in the result', () => {
    const result = resolveAccess('vendor-framestore', 'ws-vfx-coll-for-vendor', DEFAULT_GRANTS)
    expect(result.hasAccess).toBe(true)
    expect(result.effectiveProfile).toBe('view')
    expect(result.permissions).toEqual(['open', 'download'])
    expect(result.canEdit).toBe(false)
  })

  it('resolveAccess respects custom role groups for explicit department-root access', () => {
    const customGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS.map((group) =>
      group.id === 'manage'
        ? { ...group, permissions: ['open'] as Permission[] }
        : group,
    )

    const result = resolveAccess('vfx-supervisor', 'ws-vfx', DEFAULT_GRANTS, customGroups)
    expect(result.hasAccess).toBe(true)
    expect(result.effectiveProfile).toBe('manage')
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
    const editorPermissions = DEFAULT_ROLE_GROUPS.find((group) => group.id === 'edit')!.permissions

    expect(canAssignProfile(editorPermissions, 'view', DEFAULT_ROLE_GROUPS)).toBe(true)
    expect(canAssignProfile(editorPermissions, 'contribute', DEFAULT_ROLE_GROUPS)).toBe(true)
    expect(canAssignProfile(editorPermissions, 'manage', DEFAULT_ROLE_GROUPS)).toBe(false)
  })
})

describe('project-level roles', () => {
  it('project roles apply to the project settings resource only', () => {
    const projectAccess = resolveAccess('studio-alex', PROJECT_RESOURCE.id, DEFAULT_GRANTS)
    expect(projectAccess.hasAccess).toBe(true)
    expect(projectAccess.effectiveProfile).toBe('view')
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
