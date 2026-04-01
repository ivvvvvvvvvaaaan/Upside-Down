// src/lib/scenario.ts — Single source of truth for the prototype permissions scenario

import type { DepartmentId } from '@/components/department/types'
import type { User, UserRole } from '@/lib/personas'
import type { Team } from '@/lib/teams'
import type {
  Grant,
  RoleGroup,
  AccessProfileId,
  Permission,
  ResourceType,
} from '@/lib/grants'
import type { UserCollection } from '@/hooks/useUserCollections'

// --- Scenario shape types ---

type ScenarioPerson = {
  id: string
  name: string
  email: string
  role: UserRole
  title: string
  dept?: DepartmentId
  teams: string[]
}

type ScenarioTeam = {
  id: string
  name: string
  members: string[]
  dept?: DepartmentId
}

type ScenarioRoleGroup = {
  id: AccessProfileId
  name: string
  permissions: Permission[]
}

type ScenarioShareGrant = { to: string; as: AccessProfileId } | { toTeam: string; as: AccessProfileId }

type ScenarioShare = {
  resource: { id: string; type: ResourceType; dept?: DepartmentId }
  label: string
  by: string
  date: string
  grants: ScenarioShareGrant[]
  revoked?: boolean
}

type ScenarioCollection = {
  id: string
  name: string
  createdBy: string
  assetIds: string[]
}

type Scenario = {
  projectName: string
  roleGroups: ScenarioRoleGroup[]
  people: ScenarioPerson[]
  teams: ScenarioTeam[]
  projectRoles: {
    people: Record<string, AccessProfileId>
    teams: Record<string, AccessProfileId>
  }
  shares: ScenarioShare[]
  collections: ScenarioCollection[]
}

// --- The scenario ---

export const SCENARIO: Scenario = {
  projectName: 'Apex S1',

  roleGroups: [
    { id: 'owner',       name: 'Owner',       permissions: ['open', 'download', 'write', 'delete', 'comment', 'share', 'edit-acl'] },
    { id: 'manager',     name: 'Manager',     permissions: ['open', 'download', 'write', 'delete', 'comment', 'share', 'edit-acl'] },
    { id: 'editor',      name: 'Can edit & share', permissions: ['open', 'download', 'write', 'comment', 'share'] },
    { id: 'contributor', name: 'Can edit',         permissions: ['open', 'write'] },
    { id: 'commenter',   name: 'Can comment', permissions: ['open', 'comment'] },
    { id: 'viewer',      name: 'View only',   permissions: ['open', 'download'] },
    { id: 'link-viewer', name: 'View only',   permissions: ['open', 'download'] },
  ],

  people: [
    { id: 'studio-alex',           name: 'Alex Rivera',   email: 'arivera@netflix.com',  role: 'studio-exec', title: 'VP Content',             dept: undefined,    teams: ['studio'] },
    { id: 'creative-david',        name: 'David Park',    email: 'dpark@netflix.com',    role: 'creative',    title: 'Director',               dept: undefined,    teams: ['dailies-review', 'show-creative'] },
    { id: 'vfx-supervisor',        name: 'Mike Torres',   email: 'mtorres@netflix.com',  role: 'manager',     title: 'VFX Supervisor',         dept: 'vfx',        teams: ['vfx-core'] },
    { id: 'vfx-coordinator',       name: 'Sarah Chen',    email: 'schen@netflix.com',    role: 'manager',     title: 'VFX Coordinator',        dept: 'vfx',        teams: ['vfx-core', 'dailies-review'] },
    { id: 'editorial-coordinator', name: 'Lisa Kim',      email: 'lkim@netflix.com',     role: 'manager',     title: 'Editorial Coordinator',  dept: 'editorial',  teams: ['editorial', 'dailies-review'] },
    { id: 'editorial-artist',      name: 'Maria Santos',  email: 'msantos@netflix.com',  role: 'artist',      title: 'Editor',                 dept: 'editorial',  teams: ['editorial'] },
    { id: 'art-artist',            name: 'Priya Sharma',  email: 'psharma@netflix.com',  role: 'artist',      title: 'Concept Artist',         dept: 'art-design', teams: ['art-design'] },
    { id: 'vendor-framestore',     name: 'James Liu',     email: 'jliu@framestore.com',  role: 'vendor',      title: 'Lead Compositor',        dept: undefined,    teams: ['framestore-la'] },
  ],

  teams: [
    { id: 'vfx-core',       name: 'VFX Core',       members: ['vfx-supervisor', 'vfx-coordinator'],                        dept: 'vfx' },
    { id: 'editorial',      name: 'Editorial',      members: ['editorial-coordinator', 'editorial-artist'],                 dept: 'editorial' },
    { id: 'art-design',     name: 'Art & Design',   members: ['art-artist'],                                               dept: 'art-design' },
    { id: 'framestore-la',  name: 'Framestore LA',  members: ['vendor-framestore'] },
    { id: 'dailies-review', name: 'Dailies Review', members: ['creative-david', 'vfx-coordinator', 'editorial-coordinator'] },
  ],

  projectRoles: {
    people: {
      'studio-alex':           'owner',
      'creative-david':        'manager',
      'vfx-supervisor':        'editor',
      'vfx-coordinator':       'editor',
      'editorial-coordinator': 'contributor',
      'editorial-artist':      'contributor',
      'art-artist':            'contributor',
      'vendor-framestore':     'viewer',
    },
    teams: {
      'vfx-core':       'editor',
      'editorial':      'contributor',
      'dailies-review': 'commenter',
    },
  },

  shares: [
    {
      resource: { id: 'ws-vfx-coll-for-editorial', type: 'collection', dept: 'vfx' },
      label: 'VFX shots for edit review',
      by: 'vfx-coordinator',
      date: '2026-01-28',
      grants: [
        { to: 'editorial-coordinator', as: 'viewer' },
        { to: 'editorial-artist',      as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-vfx-coll-for-vendor', type: 'collection', dept: 'vfx' },
      label: 'EP301 comp package',
      by: 'vfx-coordinator',
      date: '2026-01-20',
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-edit-coll-for-vfx', type: 'collection', dept: 'editorial' },
      label: 'Cut ref for VFX timing',
      by: 'editorial-artist',
      date: '2026-02-03',
      grants: [
        { toTeam: 'vfx-core', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'inst-ws-edit-cut-1', type: 'asset', dept: 'editorial' },
      label: 'EP301 Director Cut v4',
      by: 'creative-david',
      date: '2026-02-13',
      grants: [
        { to: 'studio-alex', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'inst-ws-art-concept-1', type: 'asset', dept: 'art-design' },
      label: 'Hero Pose v3',
      by: 'art-artist',
      date: '2026-02-08',
      grants: [
        { to: 'studio-alex',    as: 'viewer' },
        { to: 'creative-david', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'inst-ws-cam-sel-1', type: 'asset', dept: 'camera' },
      label: 'Scene 12 Take B Selected',
      by: 'editorial-artist',
      date: '2026-02-10',
      grants: [
        { to: 'studio-alex',    as: 'viewer' },
        { to: 'creative-david', as: 'viewer' },
      ],
    },
    // Smart collection share: Sarah Chen shares "Finals" with editorial team
    {
      resource: { id: 'smart-finals', type: 'smart-collection' },
      label: 'Finals',
      by: 'vfx-coordinator',
      date: '2026-02-12',
      grants: [
        { to: 'editorial-artist', as: 'viewer' },
      ],
    },
    // Revoked: vendor had an earlier comp share that was superseded
    {
      resource: { id: 'inst-ws-vfx-010-030', type: 'asset', dept: 'vfx' },
      label: 'SEQ010 SH030 Comp v5 (superseded)',
      by: 'vfx-coordinator',
      date: '2026-02-06',
      revoked: true,
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },
    // Folder-level grants (for demonstrating inheritance)
    {
      resource: { id: 'ws-vfx-shots', type: 'folder', dept: 'vfx' },
      label: 'VFX Shots',
      by: 'vfx-coordinator',
      date: '2026-01-15',
      grants: [
        { toTeam: 'editorial', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-editorial-cuts', type: 'folder', dept: 'editorial' },
      label: 'Editorial Cuts',
      by: 'editorial-coordinator',
      date: '2026-01-20',
      grants: [
        { toTeam: 'dailies-review', as: 'commenter' },
      ],
    },
    // Revoked: editorial shared an early rough cut that was replaced
    {
      resource: { id: 'inst-ws-edit-cut-2', type: 'asset', dept: 'editorial' },
      label: 'EP301 Assembly v2 (replaced by Director Cut)',
      by: 'editorial-artist',
      date: '2026-02-01',
      revoked: true,
      grants: [
        { toTeam: 'vfx-core', as: 'viewer' },
      ],
    },
  ],

  collections: [
    // Shared collections (referenced by grants)
    { id: 'ws-vfx-coll-for-editorial', name: 'EP301 VFX Pulls - Edit Review',  createdBy: 'schen@netflix.com',   assetIds: ['inst-ws-vfx-010-010', 'inst-ws-vfx-010-020', 'inst-ws-vfx-020-010'] },
    { id: 'ws-vfx-coll-for-vendor',    name: 'Framestore Handoff - EP301',     createdBy: 'schen@netflix.com',   assetIds: ['inst-ws-vfx-010-030', 'inst-ws-vfx-020-020', 'inst-ws-vfx-ref-brief'] },
    { id: 'ws-edit-coll-for-vfx',      name: 'Offline Ref + Temp VFX',         createdBy: 'msantos@netflix.com', assetIds: ['inst-ws-edit-vfx-2', 'inst-ws-edit-exp-2'] },
    // Everyday organising collections
    { id: 'coll-creature-designs',  name: 'Car Designs', createdBy: 'psharma@netflix.com', assetIds: ['inst-ws-art-concept-demogorgon', 'inst-ws-art-concept-creature', 'inst-ws-art-char-eleven'] },
    { id: 'coll-key-locations',     name: 'Key Circuits',    createdBy: 'psharma@netflix.com', assetIds: ['inst-ws-art-concept-ud-env', 'inst-ws-art-concept-lab', 'inst-ws-art-env-byers', 'inst-ws-art-env-starcourt'] },
    { id: 'coll-hero-shots',        name: 'Hero Shots',       createdBy: 'schen@netflix.com',   assetIds: ['inst-ws-vfx-010-010', 'inst-ws-vfx-020-010', 'inst-ws-vfx-comp-eleven'] },
  ],
}

// --- Builder functions ---

export function buildPersonas(): User[] {
  return SCENARIO.people.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    title: p.title,
    departmentId: p.dept,
    teamIds: p.teams,
  }))
}

export function buildTeams(): Team[] {
  return SCENARIO.teams.map((t) => ({
    id: t.id,
    name: t.name,
    memberUserIds: t.members,
    departmentId: t.dept,
  }))
}

export function buildRoleGroups(): RoleGroup[] {
  return SCENARIO.roleGroups.map((rg) => ({
    id: rg.id,
    name: rg.name,
    permissions: [...rg.permissions],
    builtIn: true,
  }))
}

export function buildLabels(): Record<string, string> {
  const labels: Record<string, string> = {
    project: SCENARIO.projectName,
  }
  // Start with share labels (used for assets)
  for (const share of SCENARIO.shares) {
    labels[share.resource.id] = share.label
  }
  // Override with collection names so shared/inbox views match nav names
  for (const coll of SCENARIO.collections) {
    labels[coll.id] = coll.name
  }
  return labels
}

export function buildGrants(): Grant[] {
  let counter = 0
  function grantId(): string {
    return `grant-${++counter}`
  }

  function permissionsForTemplate(templateId: AccessProfileId): Permission[] {
    const group = SCENARIO.roleGroups.find((roleGroup) => roleGroup.id === templateId)
    return group ? [...group.permissions] : []
  }

  const grants: Grant[] = []

  // Resource-level shares
  for (const share of SCENARIO.shares) {
    const resource = {
      id: share.resource.id,
      type: share.resource.type,
      departmentId: share.resource.dept,
    }
    for (const g of share.grants) {
      const grant: Grant = {
        id: grantId(),
        resource,
        principal: 'to' in g
          ? { type: 'user', userId: g.to }
          : { type: 'team', teamId: g.toTeam },
        templateId: g.as,
        permissions: permissionsForTemplate(g.as),
        grantedByUserId: share.by,
        grantedAt: share.date,
      }
      if (share.revoked) {
        grant.revokedAt = share.date
      }
      grants.push(grant)
    }
  }

  // Project-level grants — people
  const projectResource = { id: 'project', type: 'project' as const }
  for (const [userId, profileId] of Object.entries(SCENARIO.projectRoles.people)) {
    grants.push({
      id: grantId(),
      resource: projectResource,
      principal: { type: 'user', userId },
      templateId: profileId,
      permissions: permissionsForTemplate(profileId),
      grantedByUserId: 'studio-alex',
      grantedAt: '2026-01-01',
    })
  }

  // Project-level grants — teams
  for (const [teamId, profileId] of Object.entries(SCENARIO.projectRoles.teams)) {
    grants.push({
      id: grantId(),
      resource: projectResource,
      principal: { type: 'team', teamId },
      templateId: profileId,
      permissions: permissionsForTemplate(profileId),
      grantedByUserId: 'studio-alex',
      grantedAt: '2026-01-01',
    })
  }

  // Department root folder grants — each department team gets access on the dept wrapper folder
  // This models "onboarding" where an admin assigns teams to department workspaces
  const DEPT_FOLDER_IDS: Record<string, string> = {
    'art-design': 'ws-art',
    'vfx': 'ws-vfx',
    'camera': 'ws-camera',
    'editorial': 'ws-editorial',
    'audio-sound': 'ws-audio',
  }

  for (const team of SCENARIO.teams) {
    if (!team.dept) continue
    const folderId = DEPT_FOLDER_IDS[team.dept]
    if (!folderId) continue
    // Team gets editor access on their department root folder
    grants.push({
      id: grantId(),
      resource: { id: folderId, type: 'folder' as const, departmentId: team.dept },
      principal: { type: 'team', teamId: team.id },
      templateId: 'editor' as AccessProfileId,
      permissions: permissionsForTemplate('editor' as AccessProfileId),
      grantedByUserId: 'studio-alex',
      grantedAt: '2026-01-01',
    })
  }

  // Department people — each person with a dept gets an implicit grant on their dept root folder
  for (const person of SCENARIO.people) {
    if (!person.dept) continue
    const folderId = DEPT_FOLDER_IDS[person.dept]
    if (!folderId) continue
    const profileId: AccessProfileId = person.role === 'manager' ? 'manager' : 'editor'
    grants.push({
      id: grantId(),
      resource: { id: folderId, type: 'folder' as const, departmentId: person.dept },
      principal: { type: 'user', userId: person.id },
      templateId: profileId,
      permissions: permissionsForTemplate(profileId),
      grantedByUserId: 'studio-alex',
      grantedAt: '2026-01-01',
    })
  }

  return grants
}

export function buildSeedCollections(): UserCollection[] {
  return SCENARIO.collections.map((c) => ({
    id: c.id,
    name: c.name,
    assetIds: c.assetIds,
    createdAt: new Date('2026-02-14'),
    createdBy: c.createdBy,
  }))
}
