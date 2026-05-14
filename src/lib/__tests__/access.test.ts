import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GRANTS,
  DEFAULT_ROLE_GROUPS,
  canAssignProfile,
  buildSharesReceivedByMe,
  buildSharesCreatedByMe,
  buildAllProjectShares,
  getPermissionsForProfile,
  getRoleGroup,
  grantProfilesForResourceType,
  isGrantProfileAllowedForResource,
  roleOptionsForResource,
} from '@/lib/grants'
import type { Grant, RoleGroup, Permission } from '@/lib/grants'

describe('grant share views', () => {
  it('tracks received shares for inbox', () => {
    const received = buildSharesReceivedByMe('editorial-coordinator', DEFAULT_GRANTS)
    const resourceIds = received.map((view) => view.resourceId)

    expect(resourceIds).toContain('ws-vfx-coll-for-editorial')
    expect(resourceIds).not.toContain('ws-editorial')
  })

  it('tracks release-domain grants as received shares for domain members', () => {
    const releaseGrant: Grant = {
      id: 'domain-release-share',
      resource: { id: 'cut-domain-release', type: 'cut', domainId: 'editorial' },
      principal: { type: 'domain', domainId: 'studio-vfx' },
      templateId: 'viewer',
      permissions: DEFAULT_ROLE_GROUPS.find((group) => group.id === 'viewer')!.permissions,
      grantedByUserId: 'editorial-coordinator',
      grantedAt: '2026-04-02',
    }

    const received = buildSharesReceivedByMe('vfx-supervisor', [releaseGrant])

    expect(received.map((view) => view.resourceId)).toContain('cut-domain-release')
  })

  it('project grants are excluded from share views', () => {
    const created = buildSharesCreatedByMe('studio-alex', DEFAULT_GRANTS)
    expect(created.map((view) => view.resourceType)).not.toContain('project')

    const received = buildSharesReceivedByMe('editorial-coordinator', DEFAULT_GRANTS)
    expect(received.map((view) => view.resourceType)).not.toContain('project')

    const allShares = buildAllProjectShares(DEFAULT_GRANTS)
    expect(allShares.map((view) => view.resourceType)).not.toContain('project')
  })

  it('domain-root policy grants are excluded from share views', () => {
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

describe('capability decomposition', () => {
  it('reads role permissions from role groups', () => {
    expect(getPermissionsForProfile('manager')).toContain('edit-acl')
    expect(getPermissionsForProfile('editor')).not.toContain('edit-acl')
    expect(getPermissionsForProfile('viewer')).toEqual(['open'])
  })

  it('getRoleGroup returns the correct group', () => {
    const editor = getRoleGroup(DEFAULT_ROLE_GROUPS, 'editor')
    expect(editor).toBeDefined()
    expect(editor!.name).toBe('Edit')
    expect(editor!.permissions).toContain('write')
    expect(editor!.permissions).not.toContain('edit-acl')
  })

  it('custom role groups can change template permissions', () => {
    const customGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS.map((group) =>
      group.id === 'editor'
        ? { ...group, permissions: ['open', 'comment'] as Permission[] }
        : group,
    )

    expect(getPermissionsForProfile('editor', customGroups)).not.toContain('write')
    expect(getPermissionsForProfile('manager', customGroups)).toContain('write')
  })

  it('prevents editors from delegating profiles with permissions they do not have', () => {
    const editorPermissions = DEFAULT_ROLE_GROUPS.find((group) => group.id === 'editor')!.permissions

    expect(canAssignProfile(editorPermissions, 'viewer', DEFAULT_ROLE_GROUPS)).toBe(true)
    expect(canAssignProfile(editorPermissions, 'editor', DEFAULT_ROLE_GROUPS)).toBe(true)
    expect(canAssignProfile(editorPermissions, 'manager', DEFAULT_ROLE_GROUPS)).toBe(false)
  })
})

describe('resource grant principles', () => {
  it('keeps folder grants to full access or view only', () => {
    expect(grantProfilesForResourceType('folder')).toEqual(['manager', 'viewer'])
    expect(roleOptionsForResource(DEFAULT_ROLE_GROUPS, 'folder').map((option) => option.value)).toEqual([
      'manager',
      'viewer',
    ])
  })

  it('uses asset-style direct access profiles for collections', () => {
    expect(grantProfilesForResourceType('collection')).toEqual(['manager', 'downloader', 'viewer'])
    expect(roleOptionsForResource(DEFAULT_ROLE_GROUPS, 'collection').map((option) => option.value)).toEqual([
      'manager',
      'downloader',
      'viewer',
    ])
    expect(isGrantProfileAllowedForResource({ type: 'collection' }, 'editor')).toBe(false)
    expect(isGrantProfileAllowedForResource({ type: 'collection' }, 'uploader')).toBe(false)
  })

  it('uses direct media profiles for assets and cuts', () => {
    expect(grantProfilesForResourceType('asset')).toEqual(['manager', 'downloader', 'viewer'])
    expect(grantProfilesForResourceType('cut')).toEqual(['manager', 'downloader', 'viewer'])
    expect(isGrantProfileAllowedForResource({ type: 'asset' }, 'uploader')).toBe(false)
  })
})
