// src/lib/scenario.ts — Single source of truth for the prototype permissions scenario

import type { DepartmentId } from '@/components/department/types'
import { DEPARTMENT_FOLDER_MAP, getDepartmentWorkspaceFiles, findNodeInTree } from '@/lib/workspace-data'
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
  context?: string
  grants: ScenarioShareGrant[]
  revoked?: boolean
}

type ScenarioCollection = {
  id: string
  name: string
  createdBy: string
  assetIds: string[]
}

type ScenarioDepartmentAccess = {
  dept: DepartmentId
  defaultTeamId: string
  defaultProfile: AccessProfileId
  overrides?: {
    userId: string
    profile: AccessProfileId
  }[]
}

type Scenario = {
  projectName: string
  /** Project-level: allow users to see restricted assets as blurred tiles */
  discoveryEnabled: boolean
  /** Departments that opt out of discovery even when project has it enabled */
  discoveryDisabledDepartments: DepartmentId[]
  roleGroups: ScenarioRoleGroup[]
  people: ScenarioPerson[]
  teams: ScenarioTeam[]
  departmentAccess: ScenarioDepartmentAccess[]
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
  discoveryEnabled: true,
  discoveryDisabledDepartments: ['audio-sound'],

  roleGroups: [
    { id: 'owner',       name: 'Owner',       permissions: ['discover', 'open', 'download', 'write', 'delete', 'comment', 'share', 'edit-acl'] },
    { id: 'manager',     name: 'Full access',  permissions: ['discover', 'open', 'download', 'write', 'delete', 'comment', 'share', 'edit-acl'] },
    { id: 'editor',      name: 'Can edit & share', permissions: ['discover', 'open', 'download', 'write', 'comment', 'share'] },
    { id: 'contributor', name: 'Can edit',         permissions: ['discover', 'open', 'write'] },
    { id: 'commenter',   name: 'Can comment', permissions: ['discover', 'open', 'comment'] },
    { id: 'viewer',      name: 'View only',   permissions: ['discover', 'open', 'download'] },
    { id: 'link-viewer', name: 'View only',   permissions: ['discover', 'open', 'download'] },
  ],

  people: [
    { id: 'studio-alex',           name: 'Alex Rivera',   email: 'arivera@netflix.com',  role: 'studio-exec', title: 'VP Content',             dept: undefined,    teams: ['studio-leadership'] },
    { id: 'creative-david',        name: 'David Park',    email: 'dpark@netflix.com',    role: 'creative',    title: 'Director',               dept: undefined,    teams: ['studio-leadership', 'dailies-review'] },
    { id: 'vfx-supervisor',        name: 'Mike Torres',   email: 'mtorres@netflix.com',  role: 'manager',     title: 'VFX Supervisor',         dept: 'vfx',        teams: ['vfx-core'] },
    { id: 'vfx-coordinator',       name: 'Sarah Chen',    email: 'schen@netflix.com',    role: 'manager',     title: 'VFX Coordinator',        dept: 'vfx',        teams: ['vfx-core', 'dailies-review'] },
    { id: 'editorial-coordinator', name: 'Lisa Kim',      email: 'lkim@netflix.com',     role: 'manager',     title: 'Editorial Coordinator',  dept: 'editorial',  teams: ['editorial'] },
    { id: 'editorial-artist',      name: 'Maria Santos',  email: 'msantos@netflix.com',  role: 'artist',      title: 'Editor',                 dept: 'editorial',  teams: ['editorial'] },
    { id: 'art-artist',            name: 'Priya Sharma',  email: 'psharma@netflix.com',  role: 'artist',      title: 'Concept Artist',         dept: 'art-design', teams: ['art-design'] },
    { id: 'vendor-framestore',     name: 'James Liu',     email: 'jliu@framestore.com',  role: 'vendor',      title: 'Lead Compositor',        dept: undefined,    teams: ['framestore-la'] },
  ],

  teams: [
    { id: 'vfx-core',       name: 'VFX',            members: ['vfx-supervisor', 'vfx-coordinator'],                        dept: 'vfx' },
    { id: 'editorial',      name: 'Editorial',      members: ['editorial-coordinator', 'editorial-artist'],                 dept: 'editorial' },
    { id: 'art-design',     name: 'Art & Design',   members: ['art-artist'],                                               dept: 'art-design' },
    { id: 'studio-leadership', name: 'Studio Leadership', members: ['studio-alex', 'creative-david'] },
    { id: 'framestore-la',  name: 'Framestore LA',  members: ['vendor-framestore'] },
    { id: 'dailies-review', name: 'Dailies Review', members: ['creative-david', 'vfx-coordinator', 'editorial-coordinator'] },
  ],

  departmentAccess: [
    { dept: 'vfx', defaultTeamId: 'vfx-core', defaultProfile: 'manager' },
    {
      dept: 'editorial',
      defaultTeamId: 'editorial',
      defaultProfile: 'editor',
      overrides: [
        { userId: 'editorial-coordinator', profile: 'manager' },
      ],
    },
    { dept: 'art-design', defaultTeamId: 'art-design', defaultProfile: 'editor' },
  ],

  projectRoles: {
    people: {
      'studio-alex':           'viewer',
      'creative-david':        'commenter',
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
      context: 'VFX plates ready for editorial to start cutting against. Includes latest comps from SEQ010 and SEQ020.',
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
      context: 'Reference package for Framestore — shows approved comp direction and shot breakdown for EP301.',
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-edit-coll-for-vfx', type: 'collection', dept: 'editorial' },
      label: 'Cut ref for VFX timing',
      by: 'editorial-artist',
      date: '2026-02-03',
      context: 'Latest edit with timing marks so VFX can match their comp durations to the cut.',
      grants: [
        { toTeam: 'vfx-core', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-edit-cut-1', type: 'asset', dept: 'editorial' },
      label: 'EP301 Director Cut v4',
      by: 'editorial-coordinator',
      date: '2026-02-13',
      context: 'Director-approved cut ready for studio review. Fourth revision incorporating David\'s notes on pacing.',
      grants: [
        { to: 'studio-alex', as: 'viewer' },
        { to: 'creative-david', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-art-concept-1', type: 'asset', dept: 'art-design' },
      label: 'Hero Pose v3',
      by: 'art-artist',
      date: '2026-02-08',
      context: 'Updated key art with revised livery design. For creative and studio sign-off before print.',
      grants: [
        { to: 'studio-alex',    as: 'viewer' },
        { to: 'creative-david', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-cam-sel-1', type: 'asset', dept: 'camera' },
      label: 'Scene 12 Take B Selected',
      by: 'editorial-artist',
      date: '2026-02-10',
      context: 'Selected take from the grid start sequence. Shared for director and studio to confirm camera choice.',
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
      context: 'Auto-updating collection of all approved final VFX shots. Editorial can track what\'s locked.',
      grants: [
        { to: 'editorial-artist', as: 'viewer' },
      ],
    },
    // Revoked: vendor had an earlier comp share that was superseded
    {
      resource: { id: 'ws-vfx-010-030', type: 'asset', dept: 'vfx' },
      label: 'SEQ010 SH030 Comp v5 (superseded)',
      by: 'vfx-coordinator',
      date: '2026-02-06',
      context: 'Earlier comp version shared to vendor. Revoked after direction changed — replaced by v8.',
      revoked: true,
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-edit-coll-dailies', type: 'collection', dept: 'editorial' },
      label: 'Dailies Review Cuts',
      by: 'editorial-coordinator',
      date: '2026-01-20',
      context: 'Daily review cuts for the director and VFX coordinator. Updated as new edits land.',
      grants: [
        { toTeam: 'dailies-review', as: 'commenter' },
      ],
    },
    // Vendor drop folder: VFX coordinator gives Framestore a scoped upload point
    // Vendor can see and upload to this specific folder only — not the rest of VFX
    {
      resource: { id: 'ws-vfx-vendor-framestore', type: 'folder', dept: 'vfx' },
      label: 'Framestore',
      by: 'vfx-coordinator',
      date: '2026-01-15',
      context: 'Scoped upload folder for Framestore deliveries. Vendor drops comps here, VFX team reviews.',
      grants: [
        { to: 'vendor-framestore', as: 'contributor' },
      ],
    },
    // Revoked: editorial shared an early rough cut that was replaced
    {
      resource: { id: 'ws-edit-cut-2', type: 'asset', dept: 'editorial' },
      label: 'EP301 Assembly v2 (replaced by Director Cut)',
      by: 'editorial-artist',
      date: '2026-02-01',
      context: 'Early rough assembly shared for VFX reference. Revoked once the Director Cut superseded it.',
      revoked: true,
      grants: [
        { toTeam: 'vfx-core', as: 'viewer' },
      ],
    },
  ],

  collections: [
    // Shared collections (referenced by grants)
    { id: 'ws-vfx-coll-for-editorial', name: 'EP301 VFX Pulls - Edit Review',  createdBy: 'schen@netflix.com',   assetIds: ['ws-vfx-010-010', 'ws-vfx-010-020', 'ws-vfx-020-010'] },
    { id: 'ws-vfx-coll-for-vendor',    name: 'Framestore Handoff - EP301',     createdBy: 'schen@netflix.com',   assetIds: ['ws-vfx-010-030', 'ws-vfx-020-020', 'ws-vfx-ref-brief'] },
    { id: 'ws-edit-coll-for-vfx',      name: 'Offline Ref + Temp VFX',         createdBy: 'msantos@netflix.com', assetIds: ['ws-edit-vfx-2', 'ws-edit-exp-2'] },
    { id: 'ws-edit-coll-dailies',    name: 'Dailies Review Cuts',            createdBy: 'lkim@netflix.com',    assetIds: ['ws-edit-cut-1', 'ws-edit-cut-2', 'ws-edit-cut-3'] },
    // Everyday organising collections
    { id: 'coll-creature-designs',  name: 'Car Designs', createdBy: 'psharma@netflix.com', assetIds: ['ws-art-concept-demogorgon', 'ws-art-concept-creature', 'ws-art-char-eleven'] },
    { id: 'coll-key-locations',     name: 'Key Circuits',    createdBy: 'psharma@netflix.com', assetIds: ['ws-art-concept-ud-env', 'ws-art-concept-lab', 'ws-art-env-byers', 'ws-art-env-starcourt'] },
    { id: 'coll-hero-shots',        name: 'Hero Shots',       createdBy: 'schen@netflix.com',   assetIds: ['ws-vfx-010-010', 'ws-vfx-020-010', 'ws-vfx-comp-eleven'] },
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

  // Build a flat lookup of all workspace nodes across departments
  const allDeptIds: DepartmentId[] = Object.keys(DEPARTMENT_FOLDER_MAP) as DepartmentId[]
  const walk = (nodes: { id: string; name: string; children?: { id: string; name: string; children?: unknown[] }[] }[]) => {
    for (const node of nodes) {
      labels[node.id] = node.name
      if (node.children) walk(node.children as typeof nodes)
    }
  }
  for (const deptId of allDeptIds) {
    walk(getDepartmentWorkspaceFiles(deptId))
  }

  // Collection names
  for (const coll of SCENARIO.collections) {
    labels[coll.id] = coll.name
  }

  // Scenario share labels as fallback for resources not in the workspace tree
  for (const share of SCENARIO.shares) {
    if (!labels[share.resource.id]) {
      labels[share.resource.id] = share.label
    }
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
  const sharerGrantsSeen = new Set<string>()
  for (const share of SCENARIO.shares) {
    const resource = {
      id: share.resource.id,
      type: share.resource.type,
      departmentId: share.resource.dept,
    }

    // Sharer gets an explicit manager grant on the resource
    const sharerKey = `${share.by}:${share.resource.id}`
    if (!sharerGrantsSeen.has(sharerKey)) {
      sharerGrantsSeen.add(sharerKey)
      grants.push({
        id: grantId(),
        resource,
        principal: { type: 'user', userId: share.by },
        templateId: 'manager',
        permissions: permissionsForTemplate('manager'),
        grantedByUserId: share.by,
        grantedAt: share.date,
      })
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

  // Department root folder grants — each department has a team default plus explicit person overrides.
  for (const policy of SCENARIO.departmentAccess) {
    const folderId = DEPARTMENT_FOLDER_MAP[policy.dept]?.id
    if (!folderId) continue

    grants.push({
      id: grantId(),
      resource: { id: folderId, type: 'folder' as const, departmentId: policy.dept },
      principal: { type: 'team', teamId: policy.defaultTeamId },
      templateId: policy.defaultProfile,
      permissions: permissionsForTemplate(policy.defaultProfile),
      grantedByUserId: 'studio-alex',
      grantedAt: '2026-01-01',
    })

    for (const override of policy.overrides ?? []) {
      grants.push({
        id: grantId(),
        resource: { id: folderId, type: 'folder' as const, departmentId: policy.dept },
        principal: { type: 'user', userId: override.userId },
        templateId: override.profile,
        permissions: permissionsForTemplate(override.profile),
        grantedByUserId: 'studio-alex',
        grantedAt: '2026-01-01',
      })
    }
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
