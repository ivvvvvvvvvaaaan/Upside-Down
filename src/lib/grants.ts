import type { DomainId } from '@/components/department/types'
import { PERSONAS } from '@/lib/personas'
import type { Team } from '@/lib/teams'
import { isUserInTeam, getTeamById } from '@/lib/teams'
import { DOMAIN_FOLDER_MAP } from '@/lib/workspace-data'
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
  | 'uploader'
  | 'downloader'
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
  manager: 6,
  editor: 5,
  downloader: 4,
  uploader: 3,
  viewer: 2,
  'link-viewer': 1,
}

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

export function roleGroupOptions(roleGroups: RoleGroup[]) {
  return roleGroups
    .filter((rg) => rg.id !== 'link-viewer')
    .map((rg) => ({ value: rg.id, label: rg.name }))
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
  grant: Pick<Grant, 'permissions' | 'templateId' | 'allowDownload' | 'allowComment'>,
  roleGroups: RoleGroup[] = DEFAULT_ROLE_GROUPS,
): Permission[] {
  const base = grant.permissions.length > 0
    ? grant.permissions
    : grant.templateId
      ? getPermissionsForProfile(grant.templateId, roleGroups)
      : grant.permissions

  const permissions = [...base]
  if (grant.allowDownload && !permissions.includes('download')) permissions.push('download')
  if (grant.allowComment && !permissions.includes('comment')) permissions.push('comment')
  return permissions
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

export function mostPermissiveProfile(
  a: AccessProfileId | null,
  b: AccessProfileId | null | undefined,
): AccessProfileId | null {
  if (!b) return a
  if (!a) return b
  return TEMPLATE_RANK[a] >= TEMPLATE_RANK[b] ? a : b
}

function isUserInReleaseDomain(userId: string, domainId: string): boolean {
  const domain = RELEASE_DOMAINS.find(d => d.id === domainId)
  if (!domain) return false
  if (domain.granteeUserIds?.includes(userId)) return true
  return domain.granteeTeamIds.some(teamId => isUserInTeam(userId, teamId))
}

export type PrincipalMatchKind = 'direct' | 'team' | 'release'

export function matchPrincipalToUser(
  principal: PrincipalRef,
  userId: string,
  teams: Team[] = [],
  releaseDomains: ReleaseDomain[] = RELEASE_DOMAINS,
): PrincipalMatchKind | null {
  if (principal.type === 'user') {
    return principal.userId === userId ? 'direct' : null
  }

  const resolveTeam = (teamId: string) => teams.find((team) => team.id === teamId) ?? getTeamById(teamId)

  if (principal.type === 'team') {
    const team = resolveTeam(principal.teamId)
    return team?.memberUserIds.includes(userId) ? 'team' : null
  }

  const releaseDomain = releaseDomains.find((domain) => domain.id === principal.domainId)
  if (!releaseDomain) return null
  if (releaseDomain.granteeUserIds?.includes(userId)) return 'release'

  return releaseDomain.granteeTeamIds.some((teamId) => resolveTeam(teamId)?.memberUserIds.includes(userId))
    ? 'release'
    : null
}

export function getResourceLabel(resourceId: string): string {
  return SEED_LABELS[resourceId] ?? resourceId
}

function isPolicyResource(resource: Pick<ResourceRef, 'id' | 'type'>): boolean {
  return resource.type === 'project' || POLICY_RESOURCE_IDS.has(resource.id)
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
    if (!isGrantActive(grant)) return false
    if (grant.principal.type === 'user' && grant.principal.userId === userId) return true
    if (grant.principal.type === 'team' && isUserInTeam(userId, grant.principal.teamId)) return true
    if (grant.principal.type === 'domain' && isUserInReleaseDomain(userId, grant.principal.domainId)) return true
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
