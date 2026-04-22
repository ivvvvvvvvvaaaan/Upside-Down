import type { DomainId } from '@/components/department/types'
import { PERSONAS } from '@/lib/personas'
import { isUserInTeam, getTeamById } from '@/lib/teams'
import { DOMAIN_FOLDER_MAP, getFinderWorkspaceTree } from '@/lib/workspace-data'
import type { UnifiedFileNode } from '@/lib/workspace-data'
import {
  buildGrants,
  buildLabels,
  buildRoleGroups,
  buildReleaseDomains,
} from '@/lib/scenario'
import type { ReleaseDomain } from '@/lib/scenario'

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
  | { type: 'domain'; domainId: string }

export type AccessProfileId =
  | 'viewer'
  | 'editor'
  | 'manager'
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
  /** Recipient can download source files */
  allowDownload?: boolean
  /** Recipient can leave feedback, annotations, timecoded notes */
  allowComment?: boolean
  /** Review link ID — when set, this grant is accessible via /nextgen/review/[linkId] */
  reviewLinkId?: string
  /** Version number for snapshot re-shares (1, 2, 3...) */
  version?: number
  /** Note attached to this version (e.g., "re-turnover: 3 new shots from locked cut 2") */
  versionNote?: string
  /** Grant ID of the previous version */
  previousVersionId?: string
  /** For cut grants: lock recipient to versions up to this number. Null = follow all versions. */
  lockedToVersion?: number
  /** Optional note from the sharer (e.g., "smoke reference still coming, turnover 1 of 3") */
  note?: string
}

export type Block = {
  id: string
  userId: string
  resourceId: string
  blockedByUserId: string
  blockedAt: string
  reason?: string
}

export const DEFAULT_BLOCKS: Block[] = []


/** Check if a grant is active (not revoked, not expired) */
export function isGrantActive(grant: Grant): boolean {
  if (grant.revokedAt) return false
  if (grant.expiresAt && grant.expiresAt < new Date().toISOString().slice(0, 10)) return false
  return true
}

export const DEFAULT_ROLE_GROUPS: RoleGroup[] = buildRoleGroups()
export const DEFAULT_GRANTS: Grant[] = buildGrants()
export const PHASE_MODE_GRANTS: Grant[] = buildGrants({ skipShares: true })
export const RELEASE_DOMAINS: ReleaseDomain[] = buildReleaseDomains()

const SEED_LABELS = buildLabels()

export const TEMPLATE_RANK: Record<AccessProfileId, number> = {
  manager: 4,
  editor: 3,
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
  'upload',
]

const POLICY_RESOURCE_IDS = new Set(
  Object.values(DOMAIN_FOLDER_MAP).map((folder) => folder.id),
)

function buildParentLookup(nodes: UnifiedFileNode[], parentId?: string): Map<string, string> {
  const lookup = new Map<string, string>()

  const walk = (children: UnifiedFileNode[], currentParentId?: string) => {
    for (const node of children) {
      if (currentParentId) lookup.set(node.id, currentParentId)
      if (node.children) walk(node.children, node.id)
    }
  }

  walk(nodes, parentId)
  return lookup
}

const WORKSPACE_PARENT_BY_ID = buildParentLookup(getFinderWorkspaceTree())

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

export function roleGroupOptions(roleGroups: RoleGroup[]) {
  return roleGroups
    .filter((rg) => rg.id !== 'link-viewer')
    .map((rg) => ({ value: rg.id, label: rg.name }))
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

function isUserInReleaseDomain(userId: string, domainId: string): boolean {
  const domain = RELEASE_DOMAINS.find(d => d.id === domainId)
  if (!domain) return false
  if (domain.granteeUserIds?.includes(userId)) return true
  return domain.granteeTeamIds.some(teamId => isUserInTeam(userId, teamId))
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
      (grant) =>
        (grant.principal.type === 'team' && isUserInTeam(userId, grant.principal.teamId)) ||
        (grant.principal.type === 'domain' && isUserInReleaseDomain(userId, grant.principal.domainId)),
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

function resolveDirectUserOverride(
  userId: string,
  resourceId: string,
  grants: Grant[],
  roleGroups: RoleGroup[],
): ResolvedAccess | null {
  const directUserGrants = grants.filter(
    (grant) =>
      grant.resource.id === resourceId &&
      isGrantActive(grant) &&
      grant.principal.type === 'user' &&
      grant.principal.userId === userId,
  )

  return buildResolvedAccess(directUserGrants, [], roleGroups, 'direct')
}

export function getResourceLabel(resourceId: string): string {
  return SEED_LABELS[resourceId] ?? resourceId
}

function isPolicyResource(resource: Pick<ResourceRef, 'id' | 'type'>): boolean {
  return resource.type === 'project' || POLICY_RESOURCE_IDS.has(resource.id)
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
  blocks?: Block[],
): ResolvedAccess {
  // Blocks take absolute priority — check before anything else
  if (blocks && blocks.some(b => b.userId === userId && b.resourceId === resourceId)) {
    return NO_ACCESS
  }

  const user = PERSONAS.find((persona) => persona.id === userId)
  if (!user) return NO_ACCESS

  if (user.isAdmin) {
    return {
      hasAccess: true,
      effectiveProfile: 'manager',
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
  return buildResolvedAccess(resourceMatches.direct, resourceMatches.team, roleGroups, 'team') ?? NO_ACCESS
}

function resolveAccessForResource(
  userId: string,
  resource: ResourceRef,
  grants: Grant[],
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): ResolvedAccess {
  const directAccess = resolveAccess(userId, resource.id, grants, roleGroups, resource.domainId)
  if (directAccess.source === 'admin' || resource.type === 'project') return directAccess

  const directUserOverride = resolveDirectUserOverride(userId, resource.id, grants, roleGroups)
  if (directUserOverride) return directUserOverride

  let inheritedProfile = directAccess.effectiveProfile
  const inheritedPermissions = [...directAccess.permissions]
  let inheritedSource: ResolvedAccess['source'] = directAccess.source
  let parentId = WORKSPACE_PARENT_BY_ID.get(resource.id)

  while (parentId) {
    const parentUserOverride = resolveDirectUserOverride(userId, parentId, grants, roleGroups)
    if (parentUserOverride) {
      inheritedProfile = mostPermissiveProfile(inheritedProfile, parentUserOverride.effectiveProfile)
      inheritedPermissions.push(...parentUserOverride.permissions)
      inheritedSource ??= parentUserOverride.source
      break
    }

    const parentAccess = resolveAccess(userId, parentId, grants, roleGroups, resource.domainId)
    inheritedProfile = mostPermissiveProfile(inheritedProfile, parentAccess.effectiveProfile)
    inheritedPermissions.push(...parentAccess.permissions)
    inheritedSource ??= parentAccess.source
    parentId = WORKSPACE_PARENT_BY_ID.get(parentId)
  }

  const permissions = uniquePermissions(inheritedPermissions)
  if (permissions.length === 0) return NO_ACCESS

  return {
    hasAccess: permissions.includes('open'),
    effectiveProfile: inheritedProfile,
    canEdit: permissions.includes('write'),
    permissions,
    source: inheritedSource,
  }
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
  note?: string
}

export function principalLabel(principal: PrincipalRef): string {
  if (principal.type === 'user') {
    const user = PERSONAS.find((persona) => persona.id === principal.userId)
    return user?.name ?? principal.userId
  }

  if (principal.type === 'domain') {
    const domain = RELEASE_DOMAINS.find(d => d.id === principal.domainId)
    return domain ? `${domain.name} (${domain.group})` : principal.domainId
  }

  const team = getTeamById(principal.teamId)
  if (!team) return principal.teamId
  return team.kind === 'domain' ? `${team.name} (domain)` : `${team.name} (group)`
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
    note: grant.note,
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
