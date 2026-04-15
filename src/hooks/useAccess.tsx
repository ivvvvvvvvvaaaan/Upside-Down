'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { usePersona } from './usePersona'
import { useUserCollections } from './useUserCollections'
import type { UserCollection } from './useUserCollections'
import type { Asset } from '@/lib/data'
import { getAssetIdVariants } from '@/lib/data'
import type { DomainId, ProductionDomainId } from '@/components/department/types'
import {
  DEFAULT_GRANTS,
  DEFAULT_ROLE_GROUPS,
  PROJECT_RESOURCE,
  getResourceGrants as getResourceGrantsFromList,
  buildSharesCreatedByMe,
  buildSharesReceivedByMe,
  buildAllProjectShares,
  resolveAccess,
  mostPermissiveProfile,
  getPermissionsForProfile,
  canAssignProfile,
  isGrantActive,
  TEMPLATE_RANK,
  RELEASE_DOMAINS,
  getResourceLabel,
  profileLabel,
} from '@/lib/grants'
import type {
  Block,
  Grant,
  GrantView,
  ResourceRef,
  ResourceType,
  PrincipalRef,
  AccessProfileId,
  RoleGroup,
  Permission,
  ShareMode,
} from '@/lib/grants'
import { PERSONAS } from '@/lib/personas'
import { useFileTree } from './useFileTree'
import { isUserInTeam, getTeamById } from '@/lib/teams'
import {
  findNodeInTree,
  DOMAIN_FOLDER_MAP,
  isReferenceFolder,
  type UnifiedFileNode,
} from '@/lib/workspace-data'
import { getAssetIdsForFolder } from '@/lib/data-client'
import { resolveCollectionAssetIds } from '@/lib/data'
import { getStoredSmartCollectionById } from '@/lib/smart-collection-store'
import { SCENARIO, SENSITIVE_ASSET_IDS } from '@/lib/scenario'
import type { GuestLinkSeed } from '@/lib/scenario'
import { domainConfigs } from '@/lib/domain-configs'
import { logAuditEvent, getAuditLog, type AuditEventType, type AuditEvent } from '@/lib/audit-log'
import { resolveCollectionAssets } from '@/lib/data'
import { useBlocks } from './useBlocks'
import { useProjectLock } from './useProjectLock'
import type { ProjectLockInfo } from './useProjectLock'
import { useGuestLinks } from './useGuestLinks'

export type AccessRequest = {
  id: string
  resourceId: string
  resourceRef: ResourceRef
  requestedByUserId: string
  requestedAt: string
}

// Re-export types consumers may need
export type { Block, Grant, GrantView, ResourceRef, ResourceType, PrincipalRef, AccessProfileId, RoleGroup, Permission }

export type AccessPathSource =
  | 'domain'               // user is in the same domain
  | 'direct-grant'         // explicit grant on this resource
  | 'folder-inheritance'   // inherited from a parent folder grant
  | 'collection-ripple'    // accessible via a shared collection
  | 'admin'                // admin bypass

export type RemainingAccessPath = {
  path: 'department' | 'collection' | 'direct' | 'domain' | 'folder' | 'team'
  source: string
}

export type AccessPath = {
  source: AccessPathSource
  /** The resource that provided access (collection id, folder id, etc.) */
  viaResourceId?: string
  /** Human-readable name of the resource that provided access */
  viaResourceName?: string
  /** Who shared it (user id of the grant creator) */
  sharedByUserId?: string
  /** Can the user browse the workspace folder where this asset lives */
  canBrowseWorkspace: boolean
}

export type UserAccessSummary = {
  departmentAssets: { domainId: string; domainName: string; count: number }[]
  directShares: { resourceId: string; label: string; profile: string }[]
  collectionShares: { collectionId: string; collectionName: string; assetCount: number }[]
  domainReleases: { domainId: string; domainName: string; assetCount: number }[]
  totalUniqueAssets: number
}

export type { ProjectLockInfo } from './useProjectLock'

export type VisibilityState = 'accessible' | 'discoverable' | 'hidden'
export type DiscoveryResourceType = 'asset' | 'cut'

export type DiscoverySettings = {
  enabled: boolean
  disabledDomains: Set<DomainId>
}

interface AccessContextValue {
  // Access resolution
  canAccess: (id: string) => boolean
  filterByAccess: (assets: Asset[], additionalIds?: Set<string>) => Asset[]

  // Share views (reimplemented from grants)
  sharesCreatedByMe: GrantView[]
  sharesReceivedByMe: GrantView[]
  allProjectShares: GrantView[]
  visibleShares: GrantView[]

  // New grant-based API
  getPermission: (id: string) => AccessProfileId | null
  canEdit: (id: string) => boolean
  getResourceGrants: (id: string) => Grant[]
  visibleCollections: UserCollection[]
  getVisibleCollection: (id: string) => UserCollection | undefined
  getCollectionAssetCount: (id: string) => { total: number; accessible: number }
  getCollectionShareCeiling: (collectionId: string, intendedProfile: AccessProfileId) => { total: number; atLevel: number; capped: number; cappedAssetIds: string[] }
  getCurrentUserGrant: (resourceId: string) => Grant | undefined
  createGrant: (resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId, options?: { permissions?: Permission[]; shareMode?: ShareMode; snapshotAssetIds?: string[]; allowDownload?: boolean; allowComment?: boolean; allowUpload?: boolean; expiresInDays?: number; expiresAt?: string; versionNote?: string; note?: string }) => void
  getGrantableProfiles: (resource: ResourceRef) => AccessProfileId[]
  revokeGrant: (grantId: string) => void
  revokeUserAccess: (userId: string) => void
  canManageGrant: (grant: Grant) => boolean
  grants: Grant[]
  updateGrantProfile: (grantId: string, profileId: AccessProfileId) => void
  updateGrantShareMode: (grantId: string, mode: ShareMode) => void
  // Role group management
  roleGroups: RoleGroup[]
  updateRoleGroup: (id: string, permissions: Permission[]) => void
  renameRoleGroup: (id: string, name: string) => void
  addRoleGroup: (name: string, permissions: Permission[]) => void
  removeRoleGroup: (id: string) => void
  resetRoleGroups: () => void

  // Inheritance display
  getInheritedGrants: (resourceId: string) => { grant: Grant; fromResourceId: string; fromResourceName: string }[]
  getCollectionRippleGrants: (assetId: string) => { grant: Grant; fromResourceId: string; fromResourceName: string }[]

  // Resource-scoped ACL authority
  canShare: (resource: ResourceRef) => boolean
  canEditAcl: (resource: ResourceRef) => boolean
  canDownload: (resource: ResourceRef) => boolean

  // Discovery
  getDiscoverySettings: (resourceType: DiscoveryResourceType) => DiscoverySettings
  setDiscoveryEnabledForType: (resourceType: DiscoveryResourceType, enabled: boolean) => void
  toggleDomainDiscoveryForType: (resourceType: DiscoveryResourceType, domainId: DomainId) => void
  getVisibilityState: (resource: ResourceRef) => VisibilityState
  requestAccess: (resourceId: string, resourceRef: ResourceRef) => void
  accessRequests: AccessRequest[]

  // Guest links
  guestLinks: GuestLinkSeed[]
  getResourceGuestLinks: (resourceId: string) => GuestLinkSeed[]
  canManageGuestLink: (link: GuestLinkSeed) => boolean
  createGuestLink: (resource: ResourceRef, options: { allowDownload: boolean; passcode: boolean; expiresInDays: number }) => GuestLinkSeed | undefined
  updateGuestLink: (linkId: string, updates: Partial<Pick<GuestLinkSeed, 'allowDownload' | 'passcode' | 'expiresAt'>>) => void
  revokeGuestLink: (linkId: string) => void

  // Read state tracking
  readShareIds: Set<string>
  markShareRead: (id: string) => void
  unreadInboxCount: number

  // Add shared content to workspace as a synced reference folder


  // Dropbox mode — check if current user can upload to a collection
  canUploadToCollection: (collectionId: string) => boolean

  // Review links — authenticated direct links with expiration
  createReviewLink: (resource: ResourceRef, principal: PrincipalRef, expiresInDays?: number) => string | undefined
  getGrantByReviewLinkId: (linkId: string) => Grant | undefined

  // Version history for turnover tracking
  getVersionHistory: (resourceId: string, principalKey?: string) => { version: number; note: string; date: string; grantId: string }[]

  // Restore grants for a resource to a previous snapshot (for cancel flows)
  restoreResourceGrants: (resourceId: string, snapshot: Grant[]) => void
  restoreResourceGuestLinks: (resourceId: string, snapshot: GuestLinkSeed[]) => void

  // Sensitive media
  isSensitiveAsset: (assetId: string) => boolean
  canViewSensitiveMedia: () => boolean

  // Revocation feedback — remaining access paths after removing specific grants
  getRemainingAccessPaths: (userId: string, resourceId: string, excludeGrantIds?: string[]) => RemainingAccessPath[]

  // Blocks — per-user, per-asset overrides that prevent access regardless of grants
  blockUser: (userId: string, resourceId: string, reason?: string) => void
  unblockUser: (userId: string, resourceId: string) => void
  isBlocked: (userId: string, resourceId: string) => boolean
  getBlocksForResource: (resourceId: string) => Block[]

  // Per-user access summary (Phase 3)
  getUserAccessSummary: (userId: string) => UserAccessSummary

  // Project lockdown (Phase 4)
  projectLocked: boolean
  projectLockInfo: ProjectLockInfo
  lockProject: () => void
  unlockProject: () => void

  // Collection governance (Phase 5)
  getCollectionsContainingDepartmentAssets: (domainId: DomainId) => DepartmentCollectionInfo[]

  // Audit log (Phase 6)
  getAuditLog: (filters?: { resourceId?: string; userId?: string; type?: AuditEventType }) => AuditEvent[]
}

export type DepartmentCollectionInfo = {
  collectionId: string
  collectionName: string
  createdBy: string
  sharedWithCount: number
  departmentAssetCount: number
}

const AccessContext = createContext<AccessContextValue | null>(null)

const ALL_PRODUCTION_DOMAINS: ProductionDomainId[] = Object.keys(DOMAIN_FOLDER_MAP) as ProductionDomainId[]
const DOMAIN_WRAPPER_IDS: Record<ProductionDomainId, string> = Object.fromEntries(
  ALL_PRODUCTION_DOMAINS.map(d => [d, DOMAIN_FOLDER_MAP[d].id])
) as Record<ProductionDomainId, string>
const ROOT_ID_TO_DOMAIN: Record<string, DomainId> = Object.fromEntries(
  ALL_PRODUCTION_DOMAINS.map((domainId) => [DOMAIN_WRAPPER_IDS[domainId], domainId]),
) as Record<string, DomainId>

function mergePermissions(...permissionSets: Permission[][]): Permission[] {
  return Array.from(new Set(permissionSets.flat()))
}

type EffectivePermissionSet = {
  templateId: AccessProfileId | null
  permissions: Permission[]
  canEdit: boolean
}

type DiscoveryState = Record<DiscoveryResourceType, DiscoverySettings>

const EMPTY_PERMISSION_SET: EffectivePermissionSet = {
  templateId: null,
  permissions: [],
  canEdit: false,
}

function mergePermissionSets(...sets: EffectivePermissionSet[]): EffectivePermissionSet {
  const permissions = mergePermissions(...sets.map((set) => set.permissions))
  return {
    templateId: sets.reduce<AccessProfileId | null>(
      (current, set) => mostPermissiveProfile(current, set.templateId),
      null,
    ),
    permissions,
    canEdit: permissions.includes('write'),
  }
}

/**
 * Pure function: resolve a user's access to a resource by checking direct grants
 * AND walking up the folder parent chain. This is the single access resolution path.
 */
function resolveAccessWithInheritance(
  userId: string,
  resourceId: string,
  currentGrants: Grant[],
  roleGroups: RoleGroup[],
  nodeToParent: Map<string, string>,
  nodeToDomain: Map<string, DomainId>,
  blocks: Block[],
  getResourceDomainIdFn: (id: string) => DomainId | undefined,
): Permission[] {
  const direct = resolveAccess(userId, resourceId, currentGrants, roleGroups, getResourceDomainIdFn(resourceId), blocks)
  const allPermissions = [...direct.permissions]

  let parentId = nodeToParent.get(resourceId)
  while (parentId) {
    const parentAccess = resolveAccess(userId, parentId, currentGrants, roleGroups, nodeToDomain.get(parentId), blocks)
    for (const perm of parentAccess.permissions) {
      if (!allPermissions.includes(perm)) allPermissions.push(perm)
    }
    parentId = nodeToParent.get(parentId)
  }

  return allPermissions
}

function getPrincipalKey(principal: PrincipalRef): string {
  if (principal.type === 'user') return `user:${principal.userId}`
  if (principal.type === 'team') return `team:${principal.teamId}`
  return `domain:${principal.domainId}`
}

function principalMatchesUser(principal: PrincipalRef, userId: string): boolean {
  if (principal.type === 'user') return principal.userId === userId
  if (principal.type === 'team') return isUserInTeam(userId, principal.teamId)
  if (principal.type === 'domain') {
    const domain = RELEASE_DOMAINS.find(d => d.id === principal.domainId)
    if (!domain) return false
    if (domain.granteeUserIds?.includes(userId)) return true
    return domain.granteeTeamIds.some(teamId => isUserInTeam(userId, teamId))
  }
  return false
}

function buildSnapshotVersionNote(previousAssetIds?: string[], nextAssetIds?: string[]): string | undefined {
  const previous = new Set(previousAssetIds ?? [])
  const next = new Set(nextAssetIds ?? [])

  const added = Array.from(next).filter((assetId) => !previous.has(assetId)).length
  const removed = Array.from(previous).filter((assetId) => !next.has(assetId)).length

  if (added === 0 && removed === 0) {
    return previous.size > 0 || next.size > 0
      ? 'Snapshot refreshed with no asset changes'
      : undefined
  }

  const parts: string[] = []
  if (added > 0) parts.push(`+${added} asset${added === 1 ? '' : 's'}`)
  if (removed > 0) parts.push(`-${removed} asset${removed === 1 ? '' : 's'}`)
  return parts.join(', ')
}


import { SEED_VERSION } from '@/lib/constants'

function loadStoredGrants(): Grant[] {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_GRANTS)
  try {
    const storedVersion = localStorage.getItem('access-grants-version')
    if (storedVersion === String(SEED_VERSION)) {
      const stored = localStorage.getItem('access-grants')
      if (stored) return JSON.parse(stored) as Grant[]
    } else {
      localStorage.removeItem('access-grants')
      localStorage.removeItem('access-role-groups')
      localStorage.removeItem('access-groups')
      localStorage.setItem('access-grants-version', String(SEED_VERSION))
    }
  } catch { /* fall through */ }
  return structuredClone(DEFAULT_GRANTS)
}

function loadStoredRoleGroups(): RoleGroup[] {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_ROLE_GROUPS)
  try {
    const stored = localStorage.getItem('access-role-groups')
    if (stored) return JSON.parse(stored) as RoleGroup[]
  } catch { /* fall through */ }
  return structuredClone(DEFAULT_ROLE_GROUPS)
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const { activePersona } = usePersona()
  const { collections } = useUserCollections()
  const { tree: fileTree } = useFileTree()
  const [grants, setGrantsState] = useState<Grant[]>(() => structuredClone(DEFAULT_GRANTS))
  const setGrants: typeof setGrantsState = useCallback((action) => {
    setGrantsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      try {
        localStorage.setItem('access-grants', JSON.stringify(next))
        localStorage.setItem('access-grants-version', String(SEED_VERSION))
      } catch { /* ignore */ }
      return next
    })
  }, [])
  const [roleGroups, setRoleGroupsState] = useState<RoleGroup[]>(() => structuredClone(DEFAULT_ROLE_GROUPS))
  const setRoleGroups: typeof setRoleGroupsState = useCallback((action) => {
    setRoleGroupsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      try { localStorage.setItem('access-role-groups', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])
  const [readShareIds, setReadShareIds] = useState<Set<string>>(() => new Set())
  const [discoverySettings, setDiscoverySettings] = useState<DiscoveryState>(() => ({
    asset: {
      enabled: SCENARIO.discovery.asset.enabled,
      disabledDomains: new Set(SCENARIO.discovery.asset.disabledDomains),
    },
    cut: {
      enabled: SCENARIO.discovery.cut.enabled,
      disabledDomains: new Set(SCENARIO.discovery.cut.disabledDomains),
    },
  }))
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])

  // Extracted hooks
  const { blocks, blockUser, unblockUser, isBlocked: isBlockedFn, getBlocksForResource } = useBlocks(activePersona)
  const { projectLocked, projectLockInfo, lockProject: lockProjectBase, unlockProject } = useProjectLock(activePersona)

  useEffect(() => {
    setGrantsState(loadStoredGrants())
    setRoleGroupsState(loadStoredRoleGroups())
  }, [])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'access-grants' || event.key === 'access-grants-version') {
        setGrantsState(loadStoredGrants())
      }
      if (event.key === 'access-role-groups') {
        setRoleGroupsState(loadStoredRoleGroups())
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Reactive maps derived from the live file tree (handles user-created folders)
  const { nodeToDomain, nodeToParent, nodeById } = useMemo(() => {
    const domainMap = new Map<string, DomainId>()
    const parentMap = new Map<string, string>()
    const nodeMap = new Map<string, UnifiedFileNode>()
    const walk = (nodes: UnifiedFileNode[], domain?: DomainId, parentId?: string) => {
      for (const node of nodes) {
        nodeMap.set(node.id, node)
        if (domain) domainMap.set(node.id, domain)
        if (parentId) parentMap.set(node.id, parentId)
        if (node.children) walk(node.children, domain, node.id)
      }
    }
    for (const domain of ALL_PRODUCTION_DOMAINS) {
      // Map the domain root itself
      domainMap.set(DOMAIN_WRAPPER_IDS[domain], domain)
    }
    for (const rootNode of fileTree) {
      nodeMap.set(rootNode.id, rootNode)
      const domain = ROOT_ID_TO_DOMAIN[rootNode.id]
      if (rootNode.children) {
        walk(rootNode.children, domain, rootNode.id)
      }
    }
    return { nodeToDomain: domainMap, nodeToParent: parentMap, nodeById: nodeMap }
  }, [fileTree])

  const markShareRead = useCallback((id: string) => {
    setReadShareIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])


  const getDiscoverySettings = useCallback((resourceType: DiscoveryResourceType): DiscoverySettings => {
    return discoverySettings[resourceType]
  }, [discoverySettings])

  const setDiscoveryEnabledForType = useCallback((resourceType: DiscoveryResourceType, enabled: boolean) => {
    setDiscoverySettings((prev) => ({
      ...prev,
      [resourceType]: {
        ...prev[resourceType],
        enabled,
      },
    }))
  }, [])

  const toggleDomainDiscoveryForType = useCallback((resourceType: DiscoveryResourceType, domainId: DomainId) => {
    setDiscoverySettings((prev) => {
      const next = new Set(prev[resourceType].disabledDomains)
      if (next.has(domainId)) next.delete(domainId)
      else next.add(domainId)
      return {
        ...prev,
        [resourceType]: {
          ...prev[resourceType],
          disabledDomains: next,
        },
      }
    })
  }, [])

  // Resolve user for grant operations
  const userId = activePersona?.id ?? null
  const grantorUserId = activePersona?.id ?? 'system-admin'

  function resolveAuditTarget(principal: PrincipalRef): { name: string; userId?: string } {
    if (principal.type === 'user') {
      const persona = PERSONAS.find(p => p.id === principal.userId)
      return { name: persona?.name ?? principal.userId, userId: principal.userId }
    }
    if (principal.type === 'team') {
      return { name: getTeamById(principal.teamId)?.name ?? principal.teamId }
    }
    return { name: principal.domainId }
  }

  const getResourceDomainId = useCallback((resourceId: string): DomainId | undefined => {
    return nodeToDomain.get(resourceId) ?? ROOT_ID_TO_DOMAIN[resourceId]
  }, [nodeToDomain])

  const ownerPermissionSet = useMemo<EffectivePermissionSet>(() => ({
    templateId: 'manager',
    permissions: getPermissionsForProfile('manager', roleGroups),
    canEdit: true,
  }), [roleGroups])

  const collectionById = useMemo(() => new Map(collections.map((collection) => [collection.id, collection])), [collections])

  const activeGrants = useMemo(() => grants.filter(isGrantActive), [grants])

  const toPermissionSet = useCallback((
    permissions: Permission[],
    templateId: AccessProfileId | null = null,
  ): EffectivePermissionSet => ({
    templateId,
    permissions,
    canEdit: permissions.includes('write'),
  }), [])

  const fromResolvedAccess = useCallback((access: ReturnType<typeof resolveAccess>): EffectivePermissionSet => ({
    templateId: access.effectiveProfile,
    permissions: access.permissions,
    canEdit: access.permissions.includes('write'),
  }), [])

  const getDirectCollectionPermissionSet = useCallback((
    collectionId: string,
    currentGrants: Grant[] = grants,
  ): EffectivePermissionSet => {
    const collection = collectionById.get(collectionId)
    if (!collection) return EMPTY_PERMISSION_SET
    if (!activePersona) return ownerPermissionSet
    if (!userId) return EMPTY_PERMISSION_SET

    const layers: EffectivePermissionSet[] = []

    if (collection.createdBy === activePersona.email) {
      layers.push(ownerPermissionSet)
    }

    layers.push(
      fromResolvedAccess(
        resolveAccess(
          userId,
          collection.id,
          currentGrants,
          roleGroups,
          collection.boundDomainId as DomainId | undefined,
          blocks,
        ),
      ),
    )

    if (collection.boundDomainId) {
      const domainRootId = DOMAIN_FOLDER_MAP[collection.boundDomainId as DomainId]?.id
      if (domainRootId) {
        layers.push(
          fromResolvedAccess(
            resolveAccess(
              userId,
              domainRootId,
              currentGrants,
              roleGroups,
              collection.boundDomainId as DomainId,
              blocks,
            ),
          ),
        )
      }
    }

    return mergePermissionSets(...layers)
  }, [activePersona, userId, grants, roleGroups, collectionById, ownerPermissionSet, fromResolvedAccess, blocks])

  const getDirectSmartCollectionPermissionSet = useCallback((
    collectionId: string,
    currentGrants: Grant[] = grants,
  ): EffectivePermissionSet => {
    if (!activePersona) return ownerPermissionSet
    if (!userId) return EMPTY_PERMISSION_SET

    const layers: EffectivePermissionSet[] = []
    const collection = getStoredSmartCollectionById(collectionId)

    if (collection?.createdBy === activePersona.email) {
      layers.push(ownerPermissionSet)
    }

    layers.push(
      fromResolvedAccess(
        resolveAccess(
          userId,
          collectionId,
          currentGrants,
          roleGroups,
          undefined,
          blocks,
        ),
      ),
    )

    return mergePermissionSets(...layers)
  }, [activePersona, userId, grants, roleGroups, ownerPermissionSet, fromResolvedAccess, blocks])

  const collectionAccessById = useMemo(() => {
    const accessById = new Map<string, EffectivePermissionSet>()
    for (const collection of collections) {
      const permissionSet = getDirectCollectionPermissionSet(collection.id)
      if (permissionSet.permissions.includes('open')) {
        accessById.set(collection.id, permissionSet)
      }
    }
    return accessById
  }, [collections, getDirectCollectionPermissionSet])

  // Resolve collection asset IDs from the live file tree for folder-bound
  // collections, so newly added files are picked up immediately.
  const resolveCollectionAssetIdsLive = useCallback((collection: UserCollection): string[] => {
    if (collection.boundFolderId) {
      const node = nodeById.get(collection.boundFolderId)
      if (node?.children) {
        const collectFiles = (nodes: UnifiedFileNode[]): string[] => {
          const ids: string[] = []
          for (const n of nodes) {
            if (n.type === 'file') ids.push(n.id)
            if (n.children) ids.push(...collectFiles(n.children))
          }
          return ids
        }
        return collectFiles(node.children)
      }
    }
    return resolveCollectionAssetIds(collection)
  }, [nodeById])

  const collectionAssetAccessById = useMemo(() => {
    const accessById = new Map<string, EffectivePermissionSet>()

    if (!activePersona || !userId) return accessById

    const matchingCollectionGrants = activeGrants.filter((grant) =>
      grant.resource.type === 'collection' &&
      (
        (grant.principal.type === 'user' && grant.principal.userId === userId) ||
        (grant.principal.type === 'team' && isUserInTeam(userId, grant.principal.teamId))
      )
    )

    for (const grant of matchingCollectionGrants) {
      const collection = collectionById.get(grant.resource.id)
      if (!collection) continue

      // Full grant permissions flow through to assets — no cap.
      // The sharer's own access on each asset is the ceiling.
      const grantedPermissions = grant.permissions.length > 0
        ? grant.permissions
        : getPermissionsForProfile(grant.templateId, roleGroups)

      if (grantedPermissions.length === 0) continue

      const assetIds = (grant.shareMode === 'snapshot' && grant.snapshotAssetIds)
        ? grant.snapshotAssetIds
        : resolveCollectionAssetIdsLive(collection)

      for (const assetId of assetIds) {
        const sharerPermissions = resolveAccessWithInheritance(
          grant.grantedByUserId,
          assetId,
          grants,
          roleGroups,
          nodeToParent,
          nodeToDomain,
          blocks,
          getResourceDomainId,
        )
        if (!sharerPermissions.includes('open')) continue

        const cappedPermissions = grantedPermissions.filter((permission) =>
          sharerPermissions.includes(permission),
        )
        if (cappedPermissions.length === 0) continue

        for (const variantId of getAssetIdVariants(assetId)) {
          const current = accessById.get(variantId) ?? EMPTY_PERMISSION_SET
          accessById.set(
            variantId,
            mergePermissionSets(
              current,
              toPermissionSet(cappedPermissions, grant.templateId ?? 'viewer'),
            ),
          )
        }
      }
    }

    return accessById
  }, [activePersona, userId, activeGrants, grants, roleGroups, collectionById, getResourceDomainId, toPermissionSet, blocks, nodeToParent, nodeToDomain, resolveCollectionAssetIdsLive])

  const visibleCollections = useMemo(() => {
    return collections.filter((collection) => collectionAccessById.has(collection.id))
  }, [collections, collectionAccessById])

  const getVisibleCollection = useCallback((id: string): UserCollection | undefined => {
    return visibleCollections.find((collection) => collection.id === id)
  }, [visibleCollections])

  const getCurrentUserGrant = useCallback((resourceId: string): Grant | undefined => {
    if (!userId) return undefined

    return grants.find((grant) => {
      if (grant.resource.id !== resourceId || !isGrantActive(grant)) return false
      if (grant.grantedByUserId === userId) return false

      return (
        (grant.principal.type === 'user' && grant.principal.userId === userId)
        || (grant.principal.type === 'team' && isUserInTeam(userId, grant.principal.teamId))
      )
    })
  }, [userId, grants])

  const getEffectivePermissionSet = useCallback((
    resource: ResourceRef,
    currentGrants: Grant[] = grants,
  ): EffectivePermissionSet => {
    if (!activePersona) return ownerPermissionSet
    if (!userId) return EMPTY_PERMISSION_SET

    const resourceDomainId = resource.domainId ?? getResourceDomainId(resource.id)
    const layers: EffectivePermissionSet[] = []

    if (resource.type === 'collection') {
      layers.push(getDirectCollectionPermissionSet(resource.id, currentGrants))
    } else if (resource.type === 'smart-collection') {
      layers.push(getDirectSmartCollectionPermissionSet(resource.id, currentGrants))
    } else {
      layers.push(
        fromResolvedAccess(
          resolveAccess(
            userId,
            resource.id,
            currentGrants,
            roleGroups,
            resourceDomainId,
            blocks,
          ),
        ),
      )
    }

    let parentId = nodeToParent.get(resource.id)
    while (parentId) {
      layers.push(
        fromResolvedAccess(
          resolveAccess(
            userId,
            parentId,
            currentGrants,
            roleGroups,
            nodeToDomain.get(parentId),
            blocks,
          ),
        ),
      )
      parentId = nodeToParent.get(parentId)
    }

    if (currentGrants === grants) {
      const collectionRipple = collectionAssetAccessById.get(resource.id)
      if (collectionRipple) layers.push(collectionRipple)
    }

    return mergePermissionSets(...layers)
  }, [
    activePersona,
    userId,
    grants,
    roleGroups,
    ownerPermissionSet,
    getResourceDomainId,
    getDirectCollectionPermissionSet,
    getDirectSmartCollectionPermissionSet,
    fromResolvedAccess,
    nodeToParent,
    nodeToDomain,
    collectionAssetAccessById,
    blocks,
  ])

  const currentUserPermissionsForResource = useCallback((
    resource: ResourceRef,
    currentGrants: Grant[] = grants,
  ): Permission[] => {
    return getEffectivePermissionSet(resource, currentGrants).permissions
  }, [grants, getEffectivePermissionSet])

  const canShareFn = useCallback((resource: ResourceRef, currentGrants: Grant[] = grants): boolean => {
    if (!activePersona) return true
    if (!userId) return false

    if (resource.type === 'folder' && !resource.domainId && !nodeToDomain.has(resource.id)) return true

    const permissions = getEffectivePermissionSet(resource, currentGrants).permissions
    return permissions.includes('share') || permissions.includes('edit-acl')
  }, [activePersona, userId, grants, nodeToDomain, getEffectivePermissionSet])

  const canGrantProfileForResourceFn = useCallback((
    resource: ResourceRef,
    profileId: AccessProfileId,
    currentGrants: Grant[] = grants,
  ): boolean => {
    if (profileId === 'link-viewer') return false

    if (!activePersona) return true
    if (!userId) return false

    const currentPermissions = getEffectivePermissionSet(resource, currentGrants).permissions
    return canAssignProfile(currentPermissions, profileId, roleGroups)
  }, [activePersona, userId, grants, roleGroups, getEffectivePermissionSet])

  const canEditAclFn = useCallback((resource: ResourceRef, currentGrants: Grant[] = grants): boolean => {
    if (!activePersona) return true
    if (!userId) return false

    return getEffectivePermissionSet(resource, currentGrants).permissions.includes('edit-acl')
  }, [activePersona, userId, grants, getEffectivePermissionSet])

  // Guest links hook (depends on canShareFn and canEditAclFn)
  const {
    guestLinks,
    getResourceGuestLinks,
    canManageGuestLink,
    createGuestLink,
    updateGuestLink,
    revokeGuestLink,
    restoreResourceGuestLinks,
    expireAllGuestLinks,
  } = useGuestLinks(grants, canShareFn, canEditAclFn, activePersona)

  // Wrap lockProject to also expire all guest links (cross-hook side effect)
  const lockProject = useCallback(() => {
    lockProjectBase()
    expireAllGuestLinks()
  }, [lockProjectBase, expireAllGuestLinks])

  const requestAccess = useCallback((resourceId: string, resourceRef: ResourceRef) => {
    if (!userId) return
    setAccessRequests((prev) => {
      if (prev.some((r) => r.resourceId === resourceId && r.requestedByUserId === userId)) return prev
      return [...prev, {
        id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        resourceId,
        resourceRef,
        requestedByUserId: userId,
        requestedAt: new Date().toISOString(),
      }]
    })
  }, [userId])

  const updateRoleGroup = useCallback((id: string, permissions: Permission[]) => {
    if (!canEditAclFn(PROJECT_RESOURCE)) return
    setRoleGroups((prev) =>
      prev.map((rg) => (rg.id === id ? { ...rg, permissions } : rg)),
    )
  }, [canEditAclFn, setRoleGroups])

  const renameRoleGroup = useCallback((id: string, name: string) => {
    if (!canEditAclFn(PROJECT_RESOURCE)) return
    setRoleGroups((prev) =>
      prev.map((rg) => (rg.id === id ? { ...rg, name } : rg)),
    )
  }, [canEditAclFn, setRoleGroups])

  const addRoleGroup = useCallback((name: string, permissions: Permission[]) => {
    if (!canEditAclFn(PROJECT_RESOURCE)) return
    const id = `custom-${name.toLowerCase().replace(/\s+/g, '-')}` as AccessProfileId
    setRoleGroups((prev) => [...prev, { id, name, permissions, builtIn: false }])
  }, [canEditAclFn, setRoleGroups])

  const removeRoleGroup = useCallback((id: string) => {
    if (!canEditAclFn(PROJECT_RESOURCE)) return
    setRoleGroups((prev) => prev.filter((rg) => rg.id !== id))
  }, [canEditAclFn, setRoleGroups])

  const resetRoleGroups = useCallback(() => {
    if (!canEditAclFn(PROJECT_RESOURCE)) return
    setRoleGroups(structuredClone(DEFAULT_ROLE_GROUPS))
  }, [canEditAclFn, setRoleGroups])

  // canAccess: explicit grants plus collection/folder inheritance
  // When projectLocked is true, deny access for non-production domain users
  const canAccess = useCallback((id: string): boolean => {
    if (!activePersona) return true
    if (!userId) return false

    // Project lockdown: deny access for non-production users
    if (projectLocked) {
      const personaDomainId = activePersona.domainId
      if (!personaDomainId) return false
      const domainConfig = domainConfigs[personaDomainId]
      if (!domainConfig || domainConfig.kind !== 'production') return false
    }

    const referenceNode = nodeById.get(id)
    if (isReferenceFolder(referenceNode)) {
      return getEffectivePermissionSet({
        id: referenceNode.reference.resourceId,
        type: referenceNode.reference.resourceType,
        domainId: referenceNode.reference.domainId,
      }).permissions.includes('open')
    }

    // Personal workspace folders (in tree but no domain) are accessible to all project members
    if (nodeById.has(id) && !nodeToDomain.has(id) && !nodeToParent.has(id)) return true
    return getEffectivePermissionSet({
      id,
      type: collectionById.has(id) ? 'collection' : 'asset',
      domainId: getResourceDomainId(id),
    }).permissions.includes('open')
  }, [
    activePersona,
    userId,
    projectLocked,
    nodeById,
    nodeToDomain,
    nodeToParent,
    collectionById,
    getEffectivePermissionSet,
    getResourceDomainId,
  ])

  const getVisibilityState = useCallback((resource: ResourceRef): VisibilityState => {
    if (canAccess(resource.id)) return 'accessible'
    if (!activePersona) return 'accessible'
    if (resource.type !== 'asset' && resource.type !== 'cut') return 'hidden'

    const rule = SCENARIO.discovery[resource.type]
    const settings = discoverySettings[resource.type]
    if (!settings.enabled) return 'hidden'
    if (!rule.allowedRoles.includes(activePersona.role)) return 'hidden'

    const domainId = resource.domainId
      ?? (resource.type === 'cut' ? 'editorial' : getResourceDomainId(resource.id))

    if (domainId && settings.disabledDomains.has(domainId)) return 'hidden'

    return 'discoverable'
  }, [activePersona, canAccess, discoverySettings, getResourceDomainId])

  // Sensitive media helpers
  const isSensitiveAsset = useCallback((assetId: string): boolean => {
    return SENSITIVE_ASSET_IDS.has(assetId)
  }, [])

  const canViewSensitiveMedia = useCallback((): boolean => {
    return activePersona?.sensitiveMediaCapability === true
  }, [activePersona])

  // filterByAccess: filter assets by persona access
  // Accepts optional additionalIds for domain-specific cascade rules (e.g., cut constituents)
  const filterByAccess = useCallback((assets: Asset[], additionalIds?: Set<string>): Asset[] => {
    if (!activePersona) return assets
    const hasSensitiveCap = activePersona.sensitiveMediaCapability === true
    return assets.filter((asset) => {
      // Sensitive media gate: exclude if user lacks the capability
      if (!hasSensitiveCap && SENSITIVE_ASSET_IDS.has(asset.id)) return false
      if (canAccess(asset.id)) return true
      if (asset.sourceFolderIds?.some((fid) => canAccess(fid))) return true
      if (asset.department && canAccess(DOMAIN_FOLDER_MAP[asset.department].id)) return true
      if (additionalIds?.has(asset.id)) return true
      return false
    })
  }, [activePersona, canAccess])

  // Collection asset counts — uses live file tree for folder-bound collections
  // Tracks both total (before access filtering) and accessible (after filtering) counts
  const collectionAssetCounts = useMemo(() => {
    const accessibleCounts = new Map<string, number>()
    const totalCounts = new Map<string, number>()
    for (const collection of collections) {
      if (!collectionAccessById.has(collection.id)) continue
      const assetIds = resolveCollectionAssetIdsLive(collection)
      totalCounts.set(collection.id, assetIds.length)
      let count = 0
      for (const assetId of assetIds) {
        if (canAccess(assetId)) count++
      }
      accessibleCounts.set(collection.id, count)
    }
    return { accessible: accessibleCounts, total: totalCounts }
  }, [collections, collectionAccessById, canAccess, resolveCollectionAssetIdsLive])

  const getCollectionAssetCount = useCallback((id: string): { total: number; accessible: number } => {
    return {
      total: collectionAssetCounts.total.get(id) ?? 0,
      accessible: collectionAssetCounts.accessible.get(id) ?? 0,
    }
  }, [collectionAssetCounts])

  /** For a collection share: how many assets can the sharer grant at the chosen level vs how many are capped below it */
  const getCollectionShareCeiling = useCallback((collectionId: string, intendedProfile: AccessProfileId): { total: number; atLevel: number; capped: number; cappedAssetIds: string[] } => {
    const collection = collections.find(c => c.id === collectionId)
    if (!collection || !userId) return { total: 0, atLevel: 0, capped: 0, cappedAssetIds: [] }
    const assetIds = resolveCollectionAssetIdsLive(collection)
    const intendedRank = TEMPLATE_RANK[intendedProfile] ?? 0
    let atLevel = 0
    let capped = 0
    const cappedAssetIds: string[] = []
    for (const assetId of assetIds) {
      const access = resolveAccess(userId, assetId, grants, roleGroups, undefined, blocks)
      const sharerRank = access.effectiveProfile ? (TEMPLATE_RANK[access.effectiveProfile] ?? 0) : 0
      if (sharerRank >= intendedRank) {
        atLevel++
      } else if (access.hasAccess) {
        capped++
        cappedAssetIds.push(assetId)
      }
    }
    return { total: assetIds.length, atLevel, capped, cappedAssetIds }
  }, [collections, userId, grants, roleGroups, blocks, resolveCollectionAssetIdsLive])

  // Resolve share labels: collection IDs → real collection names
  const collectionNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of collections) map.set(c.id, c.name)
    return map
  }, [collections])

  const resolveShareLabels = useCallback((shares: GrantView[]): GrantView[] => {
    return shares.map(s => {
      const name = collectionNameById.get(s.resourceId)
      return name && name !== s.label ? { ...s, label: name } : s
    })
  }, [collectionNameById])

  // Share views
  const sharesCreatedByMe = useMemo(() => {
    if (!userId) return []
    return resolveShareLabels(buildSharesCreatedByMe(userId, grants))
  }, [userId, grants, resolveShareLabels])

  const sharesReceivedByMe = useMemo(() => {
    if (!userId) return []
    return resolveShareLabels(buildSharesReceivedByMe(userId, grants))
  }, [userId, grants, resolveShareLabels])

  const unreadInboxCount = useMemo(() => {
    return sharesReceivedByMe.filter((s) => !readShareIds.has(s.id)).length
  }, [sharesReceivedByMe, readShareIds])

  const allProjectShares = useMemo(() => {
    return resolveShareLabels(buildAllProjectShares(grants))
  }, [grants, resolveShareLabels])

  // Dropbox mode — check if current user can upload to a collection
  const canUploadToCollection = useCallback((collectionId: string): boolean => {
    if (!userId) return false
    return grants.some(g =>
      g.resource.id === collectionId &&
      isGrantActive(g) &&
      g.allowUpload &&
      (
        (g.principal.type === 'user' && g.principal.userId === userId) ||
        (g.principal.type === 'team' && isUserInTeam(userId, g.principal.teamId))
      )
    )
  }, [userId, grants])

  // Review links — create an authenticated, expiring review grant
  const createReviewLink = useCallback((resource: ResourceRef, principal: PrincipalRef, expiresInDays: number = 7): string | undefined => {
    if (!activePersona) return undefined
    if (!canShareFn(resource, grants)) return undefined

    const linkId = `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + expiresInDays)

    const newGrant: Grant = {
      id: `grant-review-${Date.now()}`,
      resource,
      principal,
      templateId: 'viewer',
      permissions: getPermissionsForProfile('viewer', roleGroups),
      allowComment: true,
      grantedByUserId: activePersona.id,
      grantedAt: now.toISOString().slice(0, 10),
      expiresAt: expires.toISOString().slice(0, 10),
      reviewLinkId: linkId,
    }

    setGrants(prev => [...prev, newGrant])
    return linkId
  }, [activePersona, grants, roleGroups, setGrants, canShareFn])

  const getGrantByReviewLinkId = useCallback((linkId: string): Grant | undefined => {
    return grants.find(g => g.reviewLinkId === linkId && isGrantActive(g))
  }, [grants])

  // Shares visible to the current user — grants on resources they can access
  const visibleShares = useMemo(() => {
    if (!activePersona) return allProjectShares // admin sees all
    return allProjectShares.filter(s => canAccess(s.resourceId))
  }, [activePersona, allProjectShares, canAccess])

  // New API
  const getPermission = useCallback((id: string): AccessProfileId | null => {
    if (!activePersona) return 'manager'
    return getEffectivePermissionSet({
      id,
      type: collectionById.has(id) ? 'collection' : 'asset',
      domainId: getResourceDomainId(id),
    }).templateId
  }, [activePersona, collectionById, getEffectivePermissionSet, getResourceDomainId])

  const canEditFn = useCallback((id: string): boolean => {
    if (!activePersona) return true
    return getEffectivePermissionSet({
      id,
      type: collectionById.has(id) ? 'collection' : 'asset',
      domainId: getResourceDomainId(id),
    }).canEdit
  }, [activePersona, collectionById, getEffectivePermissionSet, getResourceDomainId])

  const canDownloadFn = useCallback((resource: ResourceRef): boolean => {
    if (!activePersona) return true

    const permissions = getEffectivePermissionSet(resource).permissions
    if (permissions.includes('download')) return true
    if (!userId) return false

    return activeGrants.some((grant) =>
      grant.resource.id === resource.id
      && principalMatchesUser(grant.principal, userId)
      && (grant.allowDownload || grant.allowUpload)
    )
  }, [activePersona, userId, activeGrants, getEffectivePermissionSet])

  const getResourceGrants = useCallback((id: string): Grant[] => {
    return getResourceGrantsFromList(id, grants)
  }, [grants])

  const getGrantableProfiles = useCallback((resource: ResourceRef): AccessProfileId[] => {
    return roleGroups
      .filter((roleGroup) => roleGroup.id !== 'link-viewer')
      .map((roleGroup) => roleGroup.id)
      .filter((profileId) => canGrantProfileForResourceFn(resource, profileId))
  }, [roleGroups, canGrantProfileForResourceFn])

  const createGrant = useCallback((
    resource: ResourceRef,
    principal: PrincipalRef,
    profileId: AccessProfileId,
    options?: {
      permissions?: Permission[]
      shareMode?: ShareMode
      snapshotAssetIds?: string[]
      allowDownload?: boolean
      allowComment?: boolean
      allowUpload?: boolean
      expiresInDays?: number
      expiresAt?: string
      versionNote?: string
      note?: string
    },
  ) => {
    if (activePersona && !userId) return

    setGrants((prev) => {
      if (!canShareFn(resource, prev)) return prev

      const principalKey = getPrincipalKey(principal)
      const matchingActiveGrants = prev.filter(g =>
        g.resource.id === resource.id &&
        isGrantActive(g) &&
        getPrincipalKey(g.principal) === principalKey
      )
      const latestExistingGrant = matchingActiveGrants.reduce<Grant | undefined>((latest, current) => {
        if (!latest) return current
        const latestVersion = latest.version ?? 0
        const currentVersion = current.version ?? 0
        if (currentVersion !== latestVersion) {
          return currentVersion > latestVersion ? current : latest
        }
        return current.grantedAt > latest.grantedAt ? current : latest
      }, undefined)

      const isVersionedSnapshot = resource.type === 'collection' && options?.shareMode === 'snapshot'

      // Snapshot collection re-shares create a new version and revoke the prior
      // active grant so access resolves to the latest frozen asset list.
      if (isVersionedSnapshot) {
        const grantPermissions = options?.permissions ?? getPermissionsForProfile(profileId, roleGroups)
        const now = new Date()
        const expiresAt = options?.expiresAt ?? (
          options?.expiresInDays
            ? new Date(now.getTime() + options.expiresInDays * 86400000).toISOString().slice(0, 10)
            : undefined
        )
        const version = (latestExistingGrant?.version ?? 0) + 1
        const versionNote = options?.versionNote ?? buildSnapshotVersionNote(
          latestExistingGrant?.snapshotAssetIds,
          options?.snapshotAssetIds,
        )

        const next = prev.map((grant) => (
          matchingActiveGrants.some((activeGrant) => activeGrant.id === grant.id)
            ? { ...grant, revokedAt: now.toISOString() }
            : grant
        ))

        const newGrant: Grant = {
          id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          resource,
          principal,
          templateId: options?.permissions ? undefined : profileId,
          permissions: grantPermissions,
          grantedByUserId: grantorUserId,
          grantedAt: now.toISOString().slice(0, 10),
          expiresAt,
          shareMode: options?.shareMode,
          snapshotAssetIds: options?.snapshotAssetIds,
          allowDownload: options?.allowDownload,
          allowComment: options?.allowComment,
          allowUpload: options?.allowUpload,
          version,
          versionNote,
          previousVersionId: latestExistingGrant?.id,
          note: options?.note,
        }

        const auditTarget = resolveAuditTarget(principal)
        logAuditEvent({
          type: 'grant',
          actorId: grantorUserId,
          actorName: activePersona?.name ?? 'System',
          targetUserId: auditTarget.userId,
          targetUserName: auditTarget.name,
          resourceId: resource.id,
          resourceLabel: getResourceLabel(resource.id),
          details: `Re-shared snapshot v${version} with ${auditTarget.name} on ${getResourceLabel(resource.id)}`,
        })

        return [...next, newGrant]
      }

      if (latestExistingGrant) {
        const existingRank = latestExistingGrant.templateId ? (TEMPLATE_RANK[latestExistingGrant.templateId] ?? 0) : 0
        const newRank = TEMPLATE_RANK[profileId] ?? 0
        if (newRank <= existingRank) {
          // Same or lower level — absorb, no new grant needed
          return prev
        }
        // Higher level — upgrade the existing grant
        return prev.map(g => g.id === latestExistingGrant.id
          ? {
              ...g,
              templateId: profileId,
              permissions: getPermissionsForProfile(profileId, roleGroups),
              grantedByUserId: grantorUserId,
              grantedAt: new Date().toISOString().slice(0, 10),
              expiresAt: options?.expiresAt ?? g.expiresAt,
              allowDownload: options?.allowDownload ?? g.allowDownload,
              allowComment: options?.allowComment ?? g.allowComment,
              allowUpload: options?.allowUpload ?? g.allowUpload,
              note: options?.note ?? g.note,
            }
          : g
        )
      }

      // Use explicit permissions if provided (toggle-based), otherwise resolve from profile
      const grantPermissions = options?.permissions ?? getPermissionsForProfile(profileId, roleGroups)

      const now = new Date()
      const expiresAt = options?.expiresAt ?? (
        options?.expiresInDays
          ? new Date(now.getTime() + options.expiresInDays * 86400000).toISOString().slice(0, 10)
          : undefined
      )

      const newGrant: Grant = {
        id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resource,
        principal,
        templateId: options?.permissions ? undefined : profileId,
        permissions: grantPermissions,
        grantedByUserId: grantorUserId,
        grantedAt: now.toISOString().slice(0, 10),
        expiresAt,
        shareMode: options?.shareMode,
        snapshotAssetIds: options?.snapshotAssetIds,
        allowDownload: options?.allowDownload,
        allowComment: options?.allowComment,
        allowUpload: options?.allowUpload,
        note: options?.note,
      }

      // Audit log
      const auditTarget = resolveAuditTarget(principal)
      logAuditEvent({
        type: 'grant',
        actorId: grantorUserId,
        actorName: activePersona?.name ?? 'System',
        targetUserId: auditTarget.userId,
        targetUserName: auditTarget.name,
        resourceId: resource.id,
        resourceLabel: getResourceLabel(resource.id),
        details: `Granted ${profileId} access to ${auditTarget.name} on ${getResourceLabel(resource.id)}`,
      })

      return [...prev, newGrant]
    })
  }, [activePersona, userId, roleGroups, canShareFn, grantorUserId, setGrants])

  const canManageGrantForState = useCallback((grant: Grant, currentGrants: Grant[]): boolean => {
    if (canEditAclFn(grant.resource, currentGrants)) return true
    if (userId && canShareFn(grant.resource, currentGrants) && grant.grantedByUserId === userId) return true
    return false
  }, [canEditAclFn, canShareFn, userId])

  const canManageGrant = useCallback((grant: Grant): boolean => {
    return canManageGrantForState(grant, grants)
  }, [canManageGrantForState, grants])

  const revokeGrant = useCallback((grantId: string) => {
    setGrants((prev) => {
      const grant = prev.find((candidate) => candidate.id === grantId && isGrantActive(candidate))
      if (!grant || !canManageGrantForState(grant, prev)) return prev

      const auditTarget = resolveAuditTarget(grant.principal)
      logAuditEvent({
        type: 'revoke',
        actorId: grantorUserId,
        actorName: activePersona?.name ?? 'System',
        targetUserId: auditTarget.userId,
        targetUserName: auditTarget.name,
        resourceId: grant.resource.id,
        resourceLabel: getResourceLabel(grant.resource.id),
        details: `Revoked access for ${auditTarget.name} on ${getResourceLabel(grant.resource.id)}`,
      })

      return prev.map((candidate) =>
        candidate.id === grantId && isGrantActive(candidate)
          ? { ...candidate, revokedAt: new Date().toISOString() }
          : candidate,
      )
    })
  }, [canManageGrantForState, setGrants, grantorUserId, activePersona])

  const revokeUserAccess = useCallback((targetUserId: string) => {
    setGrants((prev) => {
      if (!canEditAclFn(PROJECT_RESOURCE, prev)) return prev

      const revokedAt = new Date().toISOString()
      let changed = false
      const next = prev.map((grant) => {
        if (
          grant.principal.type !== 'user'
          || grant.principal.userId !== targetUserId
          || !isGrantActive(grant)
        ) {
          return grant
        }

        changed = true
        return { ...grant, revokedAt }
      })

      return changed ? next : prev
    })

    setAccessRequests((prev) => prev.filter((request) => request.requestedByUserId !== targetUserId))
  }, [canEditAclFn, setGrants])

  const updateGrantProfile = useCallback((grantId: string, profileId: AccessProfileId) => {
    setGrants((prev) => {
      const grant = prev.find((candidate) => candidate.id === grantId)
      if (!grant || !canManageGrantForState(grant, prev)) return prev
      if (!canGrantProfileForResourceFn(grant.resource, profileId, prev)) return prev

      return prev.map((candidate) => (
        candidate.id === grantId
          ? {
              ...candidate,
              templateId: profileId,
              permissions: getPermissionsForProfile(profileId, roleGroups),
            }
          : candidate
      ))
    })
  }, [roleGroups, canManageGrantForState, canGrantProfileForResourceFn, setGrants])

  const updateGrantShareMode = useCallback((grantId: string, mode: ShareMode) => {
    setGrants(prev => prev.map(g => g.id === grantId ? { ...g, shareMode: mode } : g))
  }, [setGrants])

  const restoreResourceGrants = useCallback((resourceId: string, snapshot: Grant[]) => {
    setGrants(prev => {
      const otherGrants = prev.filter(g => g.resource.id !== resourceId)
      return [...otherGrants, ...snapshot]
    })
  }, [setGrants])

  // Inherited grants display — walks parent chain for folder inheritance
  const getInheritedGrants = useCallback((resourceId: string) => {
    const inherited: { grant: Grant; fromResourceId: string; fromResourceName: string }[] = []
    let parentId = nodeToParent.get(resourceId)
    while (parentId) {
      const parentActiveGrants = activeGrants.filter(g => g.resource.id === parentId)
      if (parentActiveGrants.length > 0) {
        const name = findNodeInTree(fileTree, parentId)?.name ?? parentId
        for (const g of parentActiveGrants) {
          inherited.push({ grant: g, fromResourceId: parentId, fromResourceName: name })
        }
      }
      parentId = nodeToParent.get(parentId)
    }
    return inherited
  }, [nodeToParent, activeGrants, fileTree])

  // Collection ripple grants display — finds grants that reach an asset through collection membership
  const getCollectionRippleGrants = useCallback((assetId: string) => {
    const rippled: { grant: Grant; fromResourceId: string; fromResourceName: string }[] = []
    for (const collection of collections) {
      // Only show grants from collections the current viewer can access
      if (!canAccess(collection.id)) continue
      const collectionAssetIds = new Set(resolveCollectionAssetIdsLive(collection).flatMap(getAssetIdVariants))
      if (!collectionAssetIds.has(assetId)) continue
      const collGrants = activeGrants.filter(g => g.resource.id === collection.id)
      for (const g of collGrants) {
        rippled.push({ grant: g, fromResourceId: collection.id, fromResourceName: collection.name })
      }
    }
    return rippled
  }, [collections, activeGrants, canAccess, resolveCollectionAssetIdsLive])

  // Compute remaining access paths for a user on a resource, excluding specific grants
  const getRemainingAccessPaths = useCallback((
    targetUserId: string,
    resourceId: string,
    excludeGrantIds?: string[],
  ): RemainingAccessPath[] => {
    const paths: RemainingAccessPath[] = []
    const excludeSet = new Set(excludeGrantIds ?? [])

    // Filter grants: active and not in the exclude list
    const remainingGrants = activeGrants.filter(g => !excludeSet.has(g.id))

    // 1. Direct user grants on this resource
    const directUserGrants = remainingGrants.filter(
      g => g.resource.id === resourceId &&
        g.principal.type === 'user' &&
        g.principal.userId === targetUserId,
    )
    for (const g of directUserGrants) {
      const grantor = PERSONAS.find(p => p.id === g.grantedByUserId)
      paths.push({
        path: 'direct',
        source: `Direct share from ${grantor?.name ?? g.grantedByUserId}`,
      })
    }

    // 2. Team grants on this resource where user is a member
    const teamGrants = remainingGrants.filter(
      g => g.resource.id === resourceId &&
        g.principal.type === 'team' &&
        isUserInTeam(targetUserId, g.principal.teamId),
    )
    for (const g of teamGrants) {
      if (g.principal.type === 'team') {
        const team = getTeamById(g.principal.teamId)
        paths.push({
          path: 'team',
          source: team?.name ?? g.principal.teamId,
        })
      }
    }

    // 3. Domain/release grants on this resource where user is in the domain
    for (const g of remainingGrants) {
      if (g.resource.id !== resourceId) continue
      const p = g.principal
      if (p.type !== 'domain') continue
      const domain = RELEASE_DOMAINS.find(d => d.id === p.domainId)
      if (!domain) continue
      const userInDomain = (domain.granteeUserIds?.includes(targetUserId)) ||
        domain.granteeTeamIds.some(teamId => isUserInTeam(targetUserId, teamId))
      if (userInDomain) {
        paths.push({
          path: 'domain',
          source: `Released to ${domain.name}`,
        })
      }
    }

    // 4. Folder inheritance — walk parent chain
    let parentId = nodeToParent.get(resourceId)
    while (parentId) {
      const currentParentId = parentId
      const parentGrants = remainingGrants.filter(g => g.resource.id === currentParentId)
      for (const g of parentGrants) {
        if (principalMatchesUser(g.principal, targetUserId)) {
          const node = findNodeInTree(fileTree, currentParentId)
          paths.push({
            path: 'folder',
            source: `Inherited from ${node?.name ?? getResourceLabel(currentParentId)}`,
          })
        }
      }
      parentId = nodeToParent.get(parentId)
    }

    // 5. Department workspace access — check if resource is in a domain the user has grants on
    const resourceDomain = nodeToDomain.get(resourceId)
    if (resourceDomain) {
      const domainRootId = DOMAIN_FOLDER_MAP[resourceDomain]?.id
      if (domainRootId && domainRootId !== resourceId) {
        const domainRootGrants = remainingGrants.filter(g => g.resource.id === domainRootId)
        for (const g of domainRootGrants) {
          if (principalMatchesUser(g.principal, targetUserId)) {
            const domainMeta = DOMAIN_FOLDER_MAP[resourceDomain]
            paths.push({
              path: 'department',
              source: `${domainMeta.name} workspace`,
            })
          }
        }
      }
    }

    // 6. Collection ripple — check if user has access via shared collections
    for (const collection of collections) {
      const collectionAssetIds = new Set(resolveCollectionAssetIdsLive(collection).flatMap(getAssetIdVariants))
      if (!collectionAssetIds.has(resourceId)) continue
      const collGrants = remainingGrants.filter(g => g.resource.id === collection.id)
      for (const g of collGrants) {
        if (principalMatchesUser(g.principal, targetUserId)) {
          paths.push({
            path: 'collection',
            source: collection.name,
          })
        }
      }
    }

    return paths
  }, [activeGrants, nodeToParent, nodeToDomain, fileTree, collections, resolveCollectionAssetIdsLive])

  const getVersionHistory = useCallback((resourceId: string, principalKey?: string): { version: number; note: string; date: string; grantId: string }[] => {
    return grants
      .filter(g => g.resource.id === resourceId && g.version !== undefined)
      .filter(g => {
        if (!principalKey) return true
        const p = g.principal
        const key = p.type === 'user'
          ? `user:${p.userId}`
          : p.type === 'team'
            ? `team:${p.teamId}`
            : `domain:${p.domainId}`
        return key === principalKey
      })
      .map(g => ({
        version: g.version!,
        note: g.versionNote ?? '',
        date: g.grantedAt,
        grantId: g.id,
      }))
      .sort((a, b) => b.version - a.version)
  }, [grants])

  // --- Per-user access summary (Phase 3) ---
  const getUserAccessSummary = useCallback((targetUserId: string): UserAccessSummary => {
    const uniqueAssetIds = new Set<string>()

    // 1. Department assets: check which domains the user belongs to
    const targetPersona = PERSONAS.find(p => p.id === targetUserId)
    const departmentAssets: UserAccessSummary['departmentAssets'] = []
    if (targetPersona?.domainId) {
      const domainId = targetPersona.domainId
      const domainMeta = DOMAIN_FOLDER_MAP[domainId]
      if (domainMeta) {
        const assetIds = getAssetIdsForFolder(domainMeta.id)
        for (const id of assetIds) uniqueAssetIds.add(id)
        departmentAssets.push({
          domainId,
          domainName: domainMeta.name,
          count: assetIds.length,
        })
      }
    }

    // 2. Direct shares: non-collection, non-project resource grants to the user
    const policyResourceIds = new Set(['project', ...Object.values(DOMAIN_FOLDER_MAP).map(f => f.id)])
    const directShares: UserAccessSummary['directShares'] = []
    for (const grant of activeGrants) {
      if (policyResourceIds.has(grant.resource.id)) continue
      if (grant.resource.type === 'collection') continue
      const isTarget =
        (grant.principal.type === 'user' && grant.principal.userId === targetUserId) ||
        (grant.principal.type === 'team' && isUserInTeam(targetUserId, grant.principal.teamId))
      if (!isTarget) continue
      uniqueAssetIds.add(grant.resource.id)
      directShares.push({
        resourceId: grant.resource.id,
        label: getResourceLabel(grant.resource.id),
        profile: grant.templateId
          ? profileLabel(grant.templateId, roleGroups)
          : grant.permissions.join(', '),
      })
    }

    // 3. Collection shares: collections the user has grants on
    const collectionShares: UserAccessSummary['collectionShares'] = []
    const seenCollections = new Set<string>()
    for (const grant of activeGrants) {
      if (grant.resource.type !== 'collection') continue
      if (seenCollections.has(grant.resource.id)) continue
      const isTarget =
        (grant.principal.type === 'user' && grant.principal.userId === targetUserId) ||
        (grant.principal.type === 'team' && isUserInTeam(targetUserId, grant.principal.teamId))
      if (!isTarget) continue
      seenCollections.add(grant.resource.id)
      const collection = collectionById.get(grant.resource.id)
      if (!collection) continue
      const assetIds = resolveCollectionAssetIdsLive(collection)
      for (const id of assetIds) uniqueAssetIds.add(id)
      collectionShares.push({
        collectionId: collection.id,
        collectionName: collection.name,
        assetCount: assetIds.length,
      })
    }

    // 4. Domain releases: check which release domains the user is in
    const domainReleases: UserAccessSummary['domainReleases'] = []
    for (const releaseDomain of RELEASE_DOMAINS) {
      const inDomain =
        (releaseDomain.granteeUserIds?.includes(targetUserId)) ||
        releaseDomain.granteeTeamIds.some(teamId => isUserInTeam(targetUserId, teamId))
      if (!inDomain) continue
      // Count assets released to this domain
      const domainGrants = activeGrants.filter(
        g => g.principal.type === 'domain' && g.principal.domainId === releaseDomain.id
      )
      const domainAssetIds = new Set<string>()
      for (const g of domainGrants) {
        domainAssetIds.add(g.resource.id)
        uniqueAssetIds.add(g.resource.id)
      }
      domainReleases.push({
        domainId: releaseDomain.id,
        domainName: releaseDomain.name,
        assetCount: domainAssetIds.size,
      })
    }

    return {
      departmentAssets,
      directShares,
      collectionShares,
      domainReleases,
      totalUniqueAssets: uniqueAssetIds.size,
    }
  }, [activeGrants, roleGroups, collectionById, resolveCollectionAssetIdsLive])

  // --- Collection governance (Phase 5) ---
  const getCollectionsContainingDepartmentAssets = useCallback((domainId: DomainId): DepartmentCollectionInfo[] => {
    const results: DepartmentCollectionInfo[] = []
    // Find personas in this department to determine "same department" creators
    const departmentEmails = new Set(
      PERSONAS.filter(p => p.domainId === domainId).map(p => p.email.toLowerCase())
    )

    for (const collection of collections) {
      // Skip collections created by someone IN the department
      if (collection.createdBy && departmentEmails.has(collection.createdBy.toLowerCase())) continue

      // Resolve assets and check if any belong to this department
      const assets = resolveCollectionAssets(collection)
      const deptAssets = assets.filter(a => a.department === domainId)
      if (deptAssets.length === 0) continue

      // Count shares on this collection
      const sharedWithCount = activeGrants.filter(
        g => g.resource.id === collection.id
      ).length

      results.push({
        collectionId: collection.id,
        collectionName: collection.name,
        createdBy: collection.createdBy ?? 'Unknown',
        sharedWithCount,
        departmentAssetCount: deptAssets.length,
      })
    }

    return results
  }, [collections, activeGrants])

  // --- Audit log accessor (Phase 6) ---
  const getAuditLogFn = useCallback((filters?: { resourceId?: string; userId?: string; type?: AuditEventType }) => {
    return getAuditLog(filters)
  }, [])

  const contextValue = useMemo(() => ({
    canAccess,
    filterByAccess,
    sharesCreatedByMe,
    sharesReceivedByMe,
    allProjectShares,
    visibleShares,
    getPermission,
    canEdit: canEditFn,
    getResourceGrants,
    visibleCollections,
    getVisibleCollection,
    getCollectionAssetCount,
    getCollectionShareCeiling,
    getCurrentUserGrant,
    createGrant,
    getGrantableProfiles,
    revokeGrant,
    revokeUserAccess,
    canManageGrant,
    grants,
    updateGrantProfile,
    updateGrantShareMode,
    roleGroups,
    updateRoleGroup,
    renameRoleGroup,
    addRoleGroup,
    removeRoleGroup,
    resetRoleGroups,
    getInheritedGrants,
    getCollectionRippleGrants,
    getVersionHistory,
    canShare: canShareFn,
    canEditAcl: canEditAclFn,
    canDownload: canDownloadFn,
    getDiscoverySettings,
    setDiscoveryEnabledForType,
    toggleDomainDiscoveryForType,
    getVisibilityState,
    requestAccess,
    accessRequests,
    guestLinks,
    getResourceGuestLinks,
    canManageGuestLink,
    createGuestLink,
    updateGuestLink,
    revokeGuestLink,
    readShareIds,
    markShareRead,
    unreadInboxCount,
    canUploadToCollection,
    createReviewLink,
    getGrantByReviewLinkId,
    restoreResourceGrants,
    restoreResourceGuestLinks,
    isSensitiveAsset,
    canViewSensitiveMedia,
    getRemainingAccessPaths,
    blockUser,
    unblockUser,
    isBlocked: isBlockedFn,
    getBlocksForResource,
    getUserAccessSummary,
    projectLocked,
    projectLockInfo,
    lockProject,
    unlockProject,
    getCollectionsContainingDepartmentAssets,
    getAuditLog: getAuditLogFn,
  }), [
    canAccess,
    filterByAccess,
    sharesCreatedByMe,
    sharesReceivedByMe,
    allProjectShares,
    visibleShares,
    getPermission,
    canEditFn,
    getResourceGrants,
    visibleCollections,
    getVisibleCollection,
    getCollectionAssetCount,
    getCollectionShareCeiling,
    getCurrentUserGrant,
    createGrant,
    getGrantableProfiles,
    revokeGrant,
    revokeUserAccess,
    canManageGrant,
    grants,
    updateGrantProfile,
    updateGrantShareMode,
    roleGroups,
    updateRoleGroup,
    renameRoleGroup,
    addRoleGroup,
    removeRoleGroup,
    resetRoleGroups,
    getInheritedGrants,
    getCollectionRippleGrants,
    getVersionHistory,
    canShareFn,
    canEditAclFn,
    canDownloadFn,
    getDiscoverySettings,
    setDiscoveryEnabledForType,
    toggleDomainDiscoveryForType,
    getVisibilityState,
    requestAccess,
    accessRequests,
    guestLinks,
    getResourceGuestLinks,
    canManageGuestLink,
    createGuestLink,
    updateGuestLink,
    revokeGuestLink,
    readShareIds,
    markShareRead,
    unreadInboxCount,
    canUploadToCollection,
    createReviewLink,
    getGrantByReviewLinkId,
    restoreResourceGrants,
    restoreResourceGuestLinks,
    isSensitiveAsset,
    canViewSensitiveMedia,
    getRemainingAccessPaths,
    blockUser,
    unblockUser,
    isBlockedFn,
    getBlocksForResource,
    getUserAccessSummary,
    projectLocked,
    projectLockInfo,
    lockProject,
    unlockProject,
    getCollectionsContainingDepartmentAssets,
    getAuditLogFn,
  ])

  return (
    <AccessContext.Provider value={contextValue}>
      {children}
    </AccessContext.Provider>
  )
}

export function useAccess(): AccessContextValue {
  const context = useContext(AccessContext)
  if (!context) {
    throw new Error('useAccess must be used within an AccessProvider')
  }
  return context
}
