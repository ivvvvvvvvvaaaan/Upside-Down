import type { DomainId } from '@/components/department/types'
import { PERSONAS } from '@/lib/personas'
import { isUserInTeam, getTeamById } from '@/lib/teams'
import { DOMAIN_FOLDER_MAP } from '@/lib/workspace-data'
import {
  buildGrants,
  buildLabels,
  buildRoleGroups,
} from '@/lib/scenario'

export type ResourceType = 'asset' | 'cut' | 'folder' | 'collection' | 'smart-collection' | 'review-set' | 'project'

export type ResourceRef = {
  id: string
  type: ResourceType
  domainId?: DomainId
}

export const PROJECT_RESOURCE: ResourceRef = { id: 'project', type: 'project' }

export type PrincipalRef =
  | { type: 'user'; userId: string }
  | { type: 'team'; teamId: string }

export type AccessProfileId =
  | 'owner'
  | 'manage'
  | 'edit'
  | 'add'
  | 'comment'
  | 'view'
  | 'link-viewer'

export type Permission =
  | 'open'
  | 'download'
  | 'write'
  | 'delete'
  | 'comment'
  | 'share'
  | 'edit-acl'
  | 'upload'

export type RoleGroup = {
  id: AccessProfileId
  name: string
  permissions: Permission[]
  builtIn: boolean
}

export type ShareMode = 'live' | 'snapshot'

export type Grant = {
  id: string
  resource: ResourceRef
  principal: PrincipalRef
  permissions: Permission[]
  templateId?: AccessProfileId
  grantedByUserId: string
  grantedAt: string
  revokedAt?: string
  expiresAt?: string
  /** Live = recipient sees evolving contents. Snapshot = frozen at share time. */
  shareMode?: ShareMode
  /** Frozen asset IDs for snapshot mode — overrides collection.assetIds for this recipient */
  snapshotAssetIds?: string[]
  /** Dropbox mode — recipient can upload deliveries into this collection */
  allowUpload?: boolean
  /** Review link ID — when set, this grant is accessible via /nextgen/review/[linkId] */
  reviewLinkId?: string
}


/** Check if a grant is active (not revoked, not expired) */
export function isGrantActive(grant: Grant): boolean {
  if (grant.revokedAt) return false
  if (grant.expiresAt && grant.expiresAt < new Date().toISOString().slice(0, 10)) return false
  return true
}

export const DEFAULT_ROLE_GROUPS: RoleGroup[] = buildRoleGroups()
export const DEFAULT_GRANTS: Grant[] = buildGrants()

const SEED_LABELS = buildLabels()

const TEMPLATE_RANK: Record<AccessProfileId, number> = {
  owner: 7,
  manage: 6,
  edit: 5,
  add: 4,
  comment: 3,
  view: 2,
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
  'upload',
]

const POLICY_RESOURCE_IDS = new Set(
  Object.values(DOMAIN_FOLDER_MAP).map((folder) => folder.id),
)

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

function getGrantPermissions(
  grant: Pick<Grant, 'permissions' | 'templateId'>,
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): Permission[] {
  if (grant.permissions.length > 0) return [...grant.permissions]
  if (grant.templateId) return getPermissionsForProfile(grant.templateId, roleGroups)
  return [...grant.permissions]
}

export function canAssignProfile(
  granterPermissions: Permission[],
  profileId: AccessProfileId,
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): boolean {
  const targetPermissions = getPermissionsForProfile(profileId, roleGroups)
  if (targetPermissions.length === 0) return false

  return targetPermissions.every((permission) => granterPermissions.includes(permission))
}

function uniquePermissions(permissions: Permission[]): Permission[] {
  return Array.from(new Set(permissions))
}

function mergeGrantPermissions(grants: Grant[], roleGroups: RoleGroup[]): Permission[] {
  return uniquePermissions(
    grants.flatMap((grant) => getGrantPermissions(grant, roleGroups)),
  )
}

export function mostPermissiveProfile(
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
    best = mostPermissiveProfile(best, grant.templateId)
  }
  return best
}

function resolveMatchingGrants(
  grants: Grant[],
  userId: string,
  resourceId: string,
): { direct: Grant[]; team: Grant[] } {
  const activeGrants = grants.filter(
    (grant) => grant.resource.id === resourceId && isGrantActive(grant),
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

function getProjectLevelGrants(grants: Grant[]): Grant[] {
  return grants.filter((grant) => grant.resource.type === 'project' && isGrantActive(grant))
}

function isPolicyResource(resource: Pick<ResourceRef, 'id' | 'type'>): boolean {
  return resource.type === 'project' || POLICY_RESOURCE_IDS.has(resource.id)
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
  source: 'direct' | 'team' | 'project-direct' | 'project-team' | 'admin' | null
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
  resourceDomainId?: DomainId,
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

  let domainAccess: ResolvedAccess | null = null
  if (resourceDomainId) {
    const domainRootId = DOMAIN_FOLDER_MAP[resourceDomainId]?.id
    if (domainRootId && domainRootId !== resourceId) {
      const domainRootMatches = resolveMatchingGrants(grants, userId, domainRootId)
      domainAccess = buildResolvedAccess(
        domainRootMatches.direct,
        domainRootMatches.team,
        roleGroups,
        'team',
      )
    }
  }

  // Take whichever level grants higher privilege
  if (resourceAccess && domainAccess) {
    const rRank = resourceAccess.effectiveProfile ? TEMPLATE_RANK[resourceAccess.effectiveProfile] : 0
    const dRank = domainAccess.effectiveProfile ? TEMPLATE_RANK[domainAccess.effectiveProfile] : 0
    return rRank >= dRank ? resourceAccess : domainAccess
  }

  return resourceAccess ?? domainAccess ?? NO_ACCESS
}

function resolveAccessForResource(
  userId: string,
  resource: ResourceRef,
  grants: Grant[],
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): ResolvedAccess {
  return resolveAccess(userId, resource.id, grants, roleGroups, resource.domainId)
}

function userHasPermissionOnResource(
  userId: string,
  resource: ResourceRef,
  grants: Grant[],
  permission: Permission,
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): boolean {
  return resolveAccessForResource(userId, resource, grants, roleGroups).permissions.includes(permission)
}

export function canCreateGrantForResource(
  userId: string,
  resource: ResourceRef,
  grants: Grant[],
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): boolean {
  const permissions = resolveAccessForResource(userId, resource, grants, roleGroups).permissions
  return permissions.includes('share') || permissions.includes('edit-acl')
}

export function canEditAclForResource(
  userId: string,
  resource: ResourceRef,
  grants: Grant[],
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): boolean {
  return userHasPermissionOnResource(userId, resource, grants, 'edit-acl', roleGroups)
}

export function userHasAccess(
  userId: string,
  resourceId: string,
  grants: Grant[],
  resourceDomainId?: DomainId,
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): boolean {
  return resolveAccess(userId, resourceId, grants, roleGroups, resourceDomainId).hasAccess
}

export type GrantView = {
  id: string
  resourceId: string
  resourceType: ResourceType
  label: string
  domainId?: DomainId
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
  if (!team) return principal.teamId
  return team.domainId ? `${team.name} (domain)` : `${team.name} (team)`
}

function grantToView(grant: Grant): GrantView {
  return {
    id: grant.id,
    resourceId: grant.resource.id,
    resourceType: grant.resource.type,
    label: getResourceLabel(grant.resource.id),
    domainId: grant.resource.domainId,
    templateId: grant.templateId,
    permissions: getGrantPermissions(grant),
    grantedByUserId: grant.grantedByUserId,
    grantedAt: grant.grantedAt,
    principalLabel: principalLabel(grant.principal),
  }
}

export function getResourceGrants(resourceId: string, grants: Grant[]): Grant[] {
  return grants.filter((grant) => grant.resource.id === resourceId && isGrantActive(grant))
}

function getGrantsByGrantor(userId: string, grants: Grant[]): Grant[] {
  return grants.filter((grant) => grant.grantedByUserId === userId && isGrantActive(grant))
}

function getGrantsForUser(userId: string, grants: Grant[]): Grant[] {
  return grants.filter((grant) => {
    if (grant.revokedAt) return false
    if (grant.principal.type === 'user' && grant.principal.userId === userId) return true
    if (grant.principal.type === 'team' && isUserInTeam(userId, grant.principal.teamId)) return true
    return false
  })
}

function getAllActiveGrants(grants: Grant[]): Grant[] {
  return grants.filter((grant) => isGrantActive(grant))
}

export function buildSharesCreatedByMe(userId: string, grants: Grant[]): GrantView[] {
  return getGrantsByGrantor(userId, grants)
    .filter((grant) => !isPolicyResource(grant.resource))
    .map(grantToView)
}

export function buildSharesReceivedByMe(userId: string, grants: Grant[]): GrantView[] {
  return getGrantsForUser(userId, grants).filter((grant) =>
    !isPolicyResource(grant.resource) && grant.grantedByUserId !== userId
  )
    .map(grantToView)
}

export function buildAllProjectShares(grants: Grant[]): GrantView[] {
  return getAllActiveGrants(grants)
    .filter((grant) => !isPolicyResource(grant.resource))
    .map(grantToView)
}
