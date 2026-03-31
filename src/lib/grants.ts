import type { DepartmentId } from '@/components/department/types'
import { PERSONAS, isDepartmentRole } from '@/lib/personas'
import { isUserInTeam, getTeamById } from '@/lib/teams'
import {
  buildGrants,
  buildLabels,
  buildRoleGroups,
} from '@/lib/scenario'

export type ResourceType = 'asset' | 'folder' | 'collection' | 'smart-collection' | 'review-set' | 'project'

export type ResourceRef = {
  id: string
  type: ResourceType
  departmentId?: DepartmentId
}

export const PROJECT_RESOURCE: ResourceRef = { id: 'project', type: 'project' }

export type PrincipalRef =
  | { type: 'user'; userId: string }
  | { type: 'team'; teamId: string }

export type AccessProfileId =
  | 'owner'
  | 'manager'
  | 'editor'
  | 'contributor'
  | 'commenter'
  | 'viewer'
  | 'link-viewer'

export type Permission =
  | 'discover'
  | 'open'
  | 'download'
  | 'write'
  | 'delete'
  | 'comment'
  | 'share'
  | 'edit-acl'

export type RoleGroup = {
  id: AccessProfileId
  name: string
  permissions: Permission[]
  builtIn: boolean
}

export type RipplePolicy = 'view-only' | 'match-grant' | 'custom'

export type Grant = {
  id: string
  resource: ResourceRef
  principal: PrincipalRef
  permissions: Permission[]
  templateId?: AccessProfileId
  grantedByUserId: string
  grantedAt: string
  revokedAt?: string
  ripplePolicy?: RipplePolicy
  ripplePermissions?: Permission[]
}

export const DEFAULT_ROLE_GROUPS: RoleGroup[] = buildRoleGroups()
export const DEFAULT_GRANTS: Grant[] = buildGrants()

const SEED_LABELS = buildLabels()

const TEMPLATE_RANK: Record<AccessProfileId, number> = {
  owner: 7,
  manager: 6,
  editor: 5,
  contributor: 4,
  commenter: 3,
  viewer: 2,
  'link-viewer': 1,
}

const ALL_PERMISSIONS: Permission[] = [
  'open',
  'download',
  'write',
  'delete',
  'comment',
  'share',
  'edit-acl',
]

export function getRoleGroup(roleGroups: RoleGroup[], templateId?: AccessProfileId | null): RoleGroup | undefined {
  if (!templateId) return undefined
  return roleGroups.find((rg) => rg.id === templateId)
}

export function getPermissionsForProfile(
  templateId?: AccessProfileId | null,
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): Permission[] {
  const group = getRoleGroup(roleGroups, templateId)
  return group ? [...group.permissions] : []
}

export function roleGroupHasPermission(
  roleGroups: RoleGroup[],
  templateId: AccessProfileId,
  perm: Permission,
): boolean {
  return getPermissionsForProfile(templateId, roleGroups).includes(perm)
}

export function profileCanEdit(
  templateId?: AccessProfileId | null,
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): boolean {
  return getPermissionsForProfile(templateId, roleGroups).includes('write')
}

export function profileLabel(
  templateId?: AccessProfileId | null,
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): string {
  if (!templateId) return 'Custom'
  const group = getRoleGroup(roleGroups, templateId)
  return group?.name ?? templateId
}

export function getGrantPermissions(
  grant: Pick<Grant, 'permissions' | 'templateId'>,
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): Permission[] {
  if (grant.permissions.length > 0) return [...grant.permissions]
  return getPermissionsForProfile(grant.templateId, roleGroups)
}

function uniquePermissions(permissions: Permission[]): Permission[] {
  return Array.from(new Set(permissions))
}

function mergeGrantPermissions(grants: Grant[], roleGroups: RoleGroup[]): Permission[] {
  return uniquePermissions(
    grants.flatMap((grant) => getGrantPermissions(grant, roleGroups)),
  )
}

function mostPermissiveTemplate(
  a: AccessProfileId | null,
  b: AccessProfileId | null | undefined,
): AccessProfileId | null {
  if (!b) return a
  if (!a) return b
  return TEMPLATE_RANK[a] >= TEMPLATE_RANK[b] ? a : b
}

function bestTemplateId(grants: Grant[]): AccessProfileId | null {
  let best: AccessProfileId | null = null
  for (const grant of grants) {
    best = mostPermissiveTemplate(best, grant.templateId)
  }
  return best
}

function resolveMatchingGrants(
  grants: Grant[],
  userId: string,
  resourceId: string,
): { direct: Grant[]; team: Grant[] } {
  const activeGrants = grants.filter(
    (grant) => grant.resource.id === resourceId && !grant.revokedAt,
  )

  return {
    direct: activeGrants.filter(
      (grant) => grant.principal.type === 'user' && grant.principal.userId === userId,
    ),
    team: activeGrants.filter(
      (grant) => grant.principal.type === 'team' && isUserInTeam(userId, grant.principal.teamId),
    ),
  }
}

function buildResolvedAccess(
  direct: Grant[],
  team: Grant[],
  roleGroups: RoleGroup[],
  source: 'direct' | 'team' | 'project-direct' | 'project-team',
): ResolvedAccess | null {
  const matching = [...direct, ...team]
  if (matching.length === 0) return null

  const permissions = mergeGrantPermissions(matching, roleGroups)
  if (permissions.length === 0) return null

  const effectiveProfile = bestTemplateId(matching)

  return {
    hasAccess: permissions.includes('open'),
    effectiveProfile,
    canEdit: permissions.includes('write'),
    permissions,
    source: direct.length > 0 ? (source === 'team' ? 'direct' : 'project-direct') : source,
  }
}

export function getResourceLabel(resourceId: string): string {
  return SEED_LABELS[resourceId] ?? resourceId
}

export function getProjectLevelGrants(grants: Grant[]): Grant[] {
  return grants.filter((grant) => grant.resource.type === 'project' && !grant.revokedAt)
}

export function getProjectUserGrants(grants: Grant[]): Grant[] {
  return getProjectLevelGrants(grants).filter((grant) => grant.principal.type === 'user')
}

export function getProjectTeamGrants(grants: Grant[]): Grant[] {
  return getProjectLevelGrants(grants).filter((grant) => grant.principal.type === 'team')
}

export type ResolvedAccess = {
  hasAccess: boolean
  effectiveProfile: AccessProfileId | null
  canEdit: boolean
  permissions: Permission[]
  source: 'direct' | 'team' | 'project-direct' | 'project-team' | 'department-role' | 'admin' | null
}

const NO_ACCESS: ResolvedAccess = {
  hasAccess: false,
  effectiveProfile: null,
  canEdit: false,
  permissions: [],
  source: null,
}

export function resolveAccess(
  userId: string,
  resourceId: string,
  grants: Grant[],
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
  resourceDepartmentId?: DepartmentId,
): ResolvedAccess {
  const user = PERSONAS.find((persona) => persona.id === userId)
  if (!user) return NO_ACCESS

  if (user.isAdmin) {
    return {
      hasAccess: true,
      effectiveProfile: 'owner',
      canEdit: true,
      permissions: [...ALL_PERMISSIONS],
      source: 'admin',
    }
  }

  if (resourceId === PROJECT_RESOURCE.id) {
    const projectMatches = resolveMatchingGrants(grants, userId, PROJECT_RESOURCE.id)
    return buildResolvedAccess(projectMatches.direct, projectMatches.team, roleGroups, 'project-team') ?? NO_ACCESS
  }

  const resourceMatches = resolveMatchingGrants(grants, userId, resourceId)
  const resourceAccess = buildResolvedAccess(resourceMatches.direct, resourceMatches.team, roleGroups, 'team')
  if (resourceAccess) return resourceAccess

  if (user.departmentId && isDepartmentRole(user.role)) {
    if (resourceDepartmentId === user.departmentId || resourceId === user.departmentId) {
      const implicitProfile: AccessProfileId = user.role === 'manager' ? 'manager' : 'editor'
      const permissions = getPermissionsForProfile(implicitProfile, roleGroups)
      return {
        hasAccess: true,
        effectiveProfile: implicitProfile,
        canEdit: permissions.includes('write'),
        permissions,
        source: 'department-role',
      }
    }
  }

  return NO_ACCESS
}

export function userHasAccess(
  userId: string,
  resourceId: string,
  grants: Grant[],
  resourceDepartmentId?: DepartmentId,
): boolean {
  const user = PERSONAS.find((persona) => persona.id === userId)
  if (!user) return false
  if (user.isAdmin) return true

  const resourceMatches = resolveMatchingGrants(grants, userId, resourceId)
  if (resourceMatches.direct.length > 0 || resourceMatches.team.length > 0) {
    return true
  }

  if (resourceId === PROJECT_RESOURCE.id) {
    const projectMatches = resolveMatchingGrants(grants, userId, PROJECT_RESOURCE.id)
    return projectMatches.direct.length > 0 || projectMatches.team.length > 0
  }

  if (user.departmentId && isDepartmentRole(user.role)) {
    return resourceDepartmentId === user.departmentId || resourceId === user.departmentId
  }

  return false
}

export type GrantView = {
  id: string
  resourceId: string
  resourceType: ResourceType
  label: string
  departmentId?: DepartmentId
  templateId?: AccessProfileId
  permissions: Permission[]
  grantedByUserId: string
  grantedAt: string
  principalLabel: string
}

function principalLabel(principal: PrincipalRef): string {
  if (principal.type === 'user') {
    const user = PERSONAS.find((persona) => persona.id === principal.userId)
    return user?.name ?? principal.userId
  }

  const team = getTeamById(principal.teamId)
  return team ? `${team.name} (team)` : principal.teamId
}

function grantToView(grant: Grant): GrantView {
  return {
    id: grant.id,
    resourceId: grant.resource.id,
    resourceType: grant.resource.type,
    label: getResourceLabel(grant.resource.id),
    departmentId: grant.resource.departmentId,
    templateId: grant.templateId,
    permissions: [...grant.permissions],
    grantedByUserId: grant.grantedByUserId,
    grantedAt: grant.grantedAt,
    principalLabel: principalLabel(grant.principal),
  }
}

export function getResourceGrants(resourceId: string, grants: Grant[]): Grant[] {
  return grants.filter((grant) => grant.resource.id === resourceId && !grant.revokedAt)
}

export function getGrantsByGrantor(userId: string, grants: Grant[]): Grant[] {
  return grants.filter((grant) => grant.grantedByUserId === userId && !grant.revokedAt)
}

export function getGrantsForUser(userId: string, grants: Grant[]): Grant[] {
  return grants.filter((grant) => {
    if (grant.revokedAt) return false
    if (grant.principal.type === 'user' && grant.principal.userId === userId) return true
    if (grant.principal.type === 'team' && isUserInTeam(userId, grant.principal.teamId)) return true
    return false
  })
}

export function getAllActiveGrants(grants: Grant[]): Grant[] {
  return grants.filter((grant) => !grant.revokedAt)
}

export function buildSharesCreatedByMe(userId: string, grants: Grant[]): GrantView[] {
  const myGrants = getGrantsByGrantor(userId, grants).filter((grant) => grant.resource.type !== 'project')
  const seen = new Set<string>()
  const views: GrantView[] = []

  for (const grant of myGrants) {
    if (seen.has(grant.resource.id)) continue
    seen.add(grant.resource.id)
    views.push(grantToView(grant))
  }

  return views
}

export function buildSharesReceivedByMe(userId: string, grants: Grant[]): GrantView[] {
  const received = getGrantsForUser(userId, grants).filter((grant) => grant.resource.type !== 'project')
  const seen = new Set<string>()
  const views: GrantView[] = []

  for (const grant of received) {
    if (seen.has(grant.resource.id)) continue
    seen.add(grant.resource.id)
    views.push(grantToView(grant))
  }

  return views
}

export function buildAllProjectShares(grants: Grant[]): GrantView[] {
  const active = getAllActiveGrants(grants).filter((grant) => grant.resource.type !== 'project')
  const seen = new Set<string>()
  const views: GrantView[] = []

  for (const grant of active) {
    if (seen.has(grant.resource.id)) continue
    seen.add(grant.resource.id)
    views.push(grantToView(grant))
  }

  return views
}
