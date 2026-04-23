import { describe, expect, it } from 'vitest'
import { createAccessEngine, prepareAccessEngineContext } from '@/lib/access-engine'
import { DEFAULT_GRANTS, DEFAULT_ROLE_GROUPS, PROJECT_RESOURCE, RELEASE_DOMAINS } from '@/lib/grants'
import type { Grant, Permission, ResourceRef } from '@/lib/grants'
import { TEAMS } from '@/lib/teams'
import type { Team } from '@/lib/teams'
import { PERSONAS } from '@/lib/personas'
import type { User } from '@/lib/personas'
import type { ReleaseDomain } from '@/lib/scenario'
import { buildSeedCollections } from '@/lib/scenario'
import { getFinderWorkspaceTree } from '@/lib/workspace-data'
import type { UnifiedFileNode } from '@/lib/workspace-data'

const viewerPermissions = DEFAULT_ROLE_GROUPS.find((group) => group.id === 'viewer')!.permissions
const editorPermissions = DEFAULT_ROLE_GROUPS.find((group) => group.id === 'editor')!.permissions
const managerPermissions = DEFAULT_ROLE_GROUPS.find((group) => group.id === 'manager')!.permissions

const recipient: User = {
  id: 'recipient',
  name: 'Recipient',
  email: 'recipient@example.com',
  role: 'artist',
  title: 'Artist',
  teamIds: ['team-a'],
}

const sharer: User = {
  id: 'sharer',
  name: 'Sharer',
  email: 'sharer@example.com',
  role: 'manager',
  title: 'Manager',
  teamIds: ['team-owner'],
}

const teamA: Team = {
  id: 'team-a',
  name: 'Team A',
  kind: 'group',
  memberUserIds: ['recipient'],
  managerUserIds: [],
}

const releaseDomain: ReleaseDomain = {
  id: 'studio-review',
  name: 'Studio Review',
  group: 'Studio',
  assetTypes: ['asset'],
  granteeTeamIds: ['team-a'],
  defaultProfile: 'viewer',
}

const tree: UnifiedFileNode[] = [{
  id: 'folder-root',
  name: 'Folder Root',
  type: 'folder',
  children: [
    { id: 'asset-a', name: 'asset-a.mov', type: 'file' },
    { id: 'asset-b', name: 'asset-b.mov', type: 'file' },
  ],
}]

function grant(
  id: string,
  resource: ResourceRef,
  principal: Grant['principal'],
  permissions: Permission[],
  grantedByUserId: string,
): Grant {
  return {
    id,
    resource,
    principal,
    permissions,
    grantedByUserId,
    grantedAt: '2026-01-01',
  }
}

function engineFor(
  user: User,
  grants: Grant[],
  options?: Partial<Parameters<typeof prepareAccessEngineContext>[0]>,
) {
  const preparedContext = prepareAccessEngineContext({
    users: [recipient, sharer],
    roleGroups: DEFAULT_ROLE_GROUPS,
    blocks: [],
    teams: [teamA],
    releaseDomains: [releaseDomain],
    fileTree: tree,
    collections: [],
    currentDate: '2026-04-01',
    ...options,
  })
  return createAccessEngine(preparedContext, { user, grants })
}

function defaultEngineFor(userId: string) {
  const user = PERSONAS.find((persona) => persona.id === userId)
  if (!user) throw new Error(`Missing test persona: ${userId}`)

  const preparedContext = prepareAccessEngineContext({
    users: PERSONAS,
    roleGroups: DEFAULT_ROLE_GROUPS,
    blocks: [],
    teams: TEAMS,
    releaseDomains: RELEASE_DOMAINS,
    fileTree: getFinderWorkspaceTree(),
    collections: buildSeedCollections(),
    currentDate: '2026-04-01',
  })
  return createAccessEngine(preparedContext, { user, grants: DEFAULT_GRANTS })
}

describe('access engine', () => {
  it('keeps user and team grants additive', () => {
    const directViewer = grant(
      'direct-viewer',
      { id: 'asset-a', type: 'asset' },
      { type: 'user', userId: 'recipient' },
      viewerPermissions,
      'sharer',
    )
    const teamEditor = grant(
      'team-editor',
      { id: 'asset-a', type: 'asset' },
      { type: 'team', teamId: 'team-a' },
      editorPermissions,
      'sharer',
    )

    const decision = engineFor(recipient, [directViewer, teamEditor]).resolve({ id: 'asset-a', type: 'asset' })

    expect(decision.allowed).toBe(true)
    expect(decision.permissions).toContain('open')
    expect(decision.permissions).toContain('write')
    expect(decision.paths.map((path) => path.kind)).toEqual(['direct', 'team'])
  })

  it('treats blocks as absolute across direct, folder, release, and collection paths', () => {
    const grants: Grant[] = [
      grant('direct', { id: 'asset-a', type: 'asset' }, { type: 'user', userId: 'recipient' }, viewerPermissions, 'sharer'),
      grant('folder', { id: 'folder-root', type: 'folder' }, { type: 'team', teamId: 'team-a' }, viewerPermissions, 'sharer'),
      grant('release', { id: 'asset-a', type: 'asset' }, { type: 'domain', domainId: 'studio-review' }, viewerPermissions, 'sharer'),
      grant('sharer-asset', { id: 'asset-a', type: 'asset' }, { type: 'user', userId: 'sharer' }, managerPermissions, 'sharer'),
      {
        ...grant('collection', { id: 'collection-a', type: 'collection' }, { type: 'user', userId: 'recipient' }, viewerPermissions, 'sharer'),
        shareMode: 'live',
      },
    ]

    const decision = engineFor(recipient, grants, {
      collections: [{ id: 'collection-a', name: 'Collection A', assetIds: ['asset-a'], createdBy: 'sharer@example.com' }],
      blocks: [{ id: 'block-1', userId: 'recipient', resourceId: 'asset-a', blockedByUserId: 'sharer', blockedAt: '2026-01-02' }],
    }).resolve({ id: 'asset-a', type: 'asset' })

    expect(decision.allowed).toBe(false)
    expect(decision.deniedBy).toBe('block')
    expect(decision.paths).toEqual([])
  })

  it('resolves release grants through release-domain audiences', () => {
    const releaseGrant = grant(
      'release',
      { id: 'asset-a', type: 'asset' },
      { type: 'domain', domainId: 'studio-review' },
      viewerPermissions,
      'sharer',
    )

    const decision = engineFor(recipient, [releaseGrant]).resolve({ id: 'asset-a', type: 'asset' })

    expect(decision.allowed).toBe(true)
    expect(decision.paths).toHaveLength(1)
    expect(decision.paths[0].kind).toBe('release')
  })

  it('honors snapshot collection scope separately from live collection scope', () => {
    const sharerAccessA = grant('sharer-a', { id: 'asset-a', type: 'asset' }, { type: 'user', userId: 'sharer' }, managerPermissions, 'sharer')
    const sharerAccessB = grant('sharer-b', { id: 'asset-b', type: 'asset' }, { type: 'user', userId: 'sharer' }, managerPermissions, 'sharer')
    const snapshotGrant: Grant = {
      ...grant('snapshot', { id: 'collection-a', type: 'collection' }, { type: 'user', userId: 'recipient' }, viewerPermissions, 'sharer'),
      shareMode: 'snapshot',
      snapshotAssetIds: ['asset-a'],
    }

    const snapshotEngine = engineFor(recipient, [sharerAccessA, sharerAccessB, snapshotGrant], {
      collections: [{ id: 'collection-a', assetIds: ['asset-a', 'asset-b'] }],
    })

    expect(snapshotEngine.resolve({ id: 'asset-a', type: 'asset' }).allowed).toBe(true)
    expect(snapshotEngine.resolve({ id: 'asset-b', type: 'asset' }).allowed).toBe(false)

    const liveGrant: Grant = {
      ...snapshotGrant,
      id: 'live',
      shareMode: 'live',
      snapshotAssetIds: undefined,
    }
    const liveEngine = engineFor(recipient, [sharerAccessA, sharerAccessB, liveGrant], {
      collections: [{ id: 'collection-a', assetIds: ['asset-a', 'asset-b'] }],
    })

    expect(liveEngine.resolve({ id: 'asset-b', type: 'asset' }).allowed).toBe(true)
  })

  it('caps collection permissions by the sharer permission on each asset', () => {
    const sharerViewer = grant(
      'sharer-viewer',
      { id: 'asset-a', type: 'asset' },
      { type: 'user', userId: 'sharer' },
      viewerPermissions,
      'sharer',
    )
    const editorCollectionGrant: Grant = {
      ...grant('collection-editor', { id: 'collection-a', type: 'collection' }, { type: 'user', userId: 'recipient' }, editorPermissions, 'sharer'),
      shareMode: 'live',
    }

    const decision = engineFor(recipient, [sharerViewer, editorCollectionGrant], {
      collections: [{ id: 'collection-a', assetIds: ['asset-a'] }],
    }).resolve({ id: 'asset-a', type: 'asset' })

    expect(decision.allowed).toBe(true)
    expect(decision.permissions).toEqual(['open'])
  })

  it('does not turn cut playback access into constituent source access', () => {
    const cutGrant = grant(
      'cut-viewer',
      { id: 'cut-1', type: 'cut' },
      { type: 'user', userId: 'recipient' },
      viewerPermissions,
      'sharer',
    )

    const engine = engineFor(recipient, [cutGrant])

    expect(engine.resolve({ id: 'cut-1', type: 'cut' }).allowed).toBe(true)
    expect(engine.resolve({ id: 'source-file-1', type: 'asset' }).allowed).toBe(false)
  })

  it('uses explicit domain-root grants for default production-domain access', () => {
    const decision = defaultEngineFor('vfx-coordinator').resolve({ id: 'ws-vfx', type: 'folder', domainId: 'vfx' })

    expect(decision.allowed).toBe(true)
    expect(decision.effectiveProfile).toBe('manager')
    expect(decision.paths.map((path) => path.kind)).toContain('team')
  })

  it('keeps studio users explicit-share only for resource access', () => {
    const engine = defaultEngineFor('studio-alex')

    expect(engine.resolve({ id: 'vfx', type: 'asset', domainId: 'vfx' }).allowed).toBe(false)
    expect(engine.resolve({ id: 'cut-ep301-lc-2', type: 'cut', domainId: 'editorial' }).allowed).toBe(true)
  })

  it('applies project roles to the project settings resource only', () => {
    const engine = defaultEngineFor('studio-alex')
    const projectAccess = engine.resolve(PROJECT_RESOURCE)

    expect(projectAccess.allowed).toBe(true)
    expect(projectAccess.effectiveProfile).toBe('viewer')
    expect(engine.resolve({ id: 'some-random-resource', type: 'asset' }).allowed).toBe(false)
  })
})
