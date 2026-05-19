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
  PHASE_MODE_GRANTS,
  DEFAULT_ROLE_GROUPS,
  PROJECT_RESOURCE,
  getResourceGrants as getResourceGrantsFromList,
  buildSharesCreatedByMe,
  buildSharesReceivedByMe,
  buildAllProjectShares,
  getPermissionsForProfile,
  canAssignProfile,
  isGrantActive,
  matchPrincipalToUser,
  TEMPLATE_RANK,
  RELEASE_DOMAINS,
  getResourceLabel,
  profileLabel,
  isGrantProfileAllowedForResource,
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
import { TEAMS, isUserInTeam, getTeamById } from '@/lib/teams'
import { getAssetIdsForFolderRecursive } from '@/lib/data-client'
import {
  findNodeInTree,
  DOMAIN_FOLDER_MAP,
  isReferenceFolder,
  type UnifiedFileNode,
} from '@/lib/workspace-data'
import { getStoredSmartCollectionById } from '@/lib/smart-collection-store'
import { SCENARIO, SENSITIVE_ASSET_IDS } from '@/lib/scenario'
import type { GuestLinkSeed } from '@/lib/scenario'
import { domainConfigs } from '@/lib/domain-configs'
import { logAuditEvent, getAuditLog, type AuditEventType, type AuditEvent } from '@/lib/audit-log'
import { useBlocks } from './useBlocks'
import { useProjectLock } from './useProjectLock'
import type { ProjectLockInfo } from './useProjectLock'
import { useGuestLinks } from './useGuestLinks'
import type { AccessDecision } from '@/lib/access-engine'
import { createAccessEngine, prepareAccessEngineContext } from '@/lib/access-engine'

export type AccessRequest = {
  id: string
  resourceId: string
  resourceRef: ResourceRef
  requestedByUserId: string
  requestedAt: string
}

// Re-export types consumers may need
export type { Block, Grant, GrantView, ResourceRef, ResourceType, PrincipalRef, AccessProfileId, RoleGroup, Permission }

export type RemainingAccessPath = {
  path: 'department' | 'collection' | 'direct' | 'domain' | 'folder' | 'team'
  source: string
}

export type UserAccessSummary = {
  workspaceRoots: { folderId: string; folderName: string; count: number }[]
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
  filterByAccess: (assets: Asset[]) => Asset[]

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
  createGrant: (resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId, options?: { permissions?: Permission[]; shareMode?: ShareMode; snapshotAssetIds?: string[]; allowDownload?: boolean; allowComment?: boolean; expiresInDays?: number; expiresAt?: string; note?: string }) => void
  getGrantableProfiles: (resource: ResourceRef) => AccessProfileId[]
  revokeGrant: (grantId: string) => void
  revokeUserAccess: (userId: string) => void
  canManageGrant: (grant: Grant) => boolean
  grants: Grant[]
  updateGrantProfile: (grantId: string, profileId: AccessProfileId) => void
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
  createGuestLink: (resource: ResourceRef, options: { allowDownload: boolean; passcode: boolean; expiresInDays: number; label?: string }) => GuestLinkSeed | undefined
  updateGuestLink: (linkId: string, updates: Partial<Pick<GuestLinkSeed, 'allowDownload' | 'passcode' | 'expiresAt'>>) => void
  revokeGuestLink: (linkId: string) => void

  // Read state tracking
  readShareIds: Set<string>
  markShareRead: (id: string) => void
  unreadInboxCount: number

  // Add shared content to workspace as a synced reference folder


  // Review links — authenticated direct links with expiration
  createReviewLink: (resource: ResourceRef, principal: PrincipalRef, expiresInDays?: number) => string | undefined
  getGrantByReviewLinkId: (linkId: string) => Grant | undefined

  // Restore grants for a resource to a previous snapshot (for cancel flows)
  restoreResourceGrants: (resourceId: string, snapshot: Grant[]) => void
  restoreResourceGuestLinks: (resourceId: string, snapshot: GuestLinkSeed[]) => void

  // Sensitive media
  isSensitiveAsset: (assetId: string) => boolean

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

  // Audit log (Phase 6)
  getAuditLog: (filters?: { resourceId?: string; userId?: string; type?: AuditEventType }) => AuditEvent[]
}

const AccessContext = createContext<AccessContextValue | null>(null)

const ALL_PRODUCTION_DOMAINS: ProductionDomainId[] = Object.keys(DOMAIN_FOLDER_MAP) as ProductionDomainId[]
const DOMAIN_WRAPPER_IDS: Record<ProductionDomainId, string> = Object.fromEntries(
  ALL_PRODUCTION_DOMAINS.map(d => [d, DOMAIN_FOLDER_MAP[d].id])
) as Record<ProductionDomainId, string>
const ROOT_ID_TO_DOMAIN: Record<string, DomainId> = Object.fromEntries(
  ALL_PRODUCTION_DOMAINS.map((domainId) => [DOMAIN_WRAPPER_IDS[domainId], domainId]),
) as Record<string, DomainId>

type DiscoveryState = Record<DiscoveryResourceType, DiscoverySettings>

function getPrincipalKey(principal: PrincipalRef): string {
  if (principal.type === 'user') return `user:${principal.userId}`
  if (principal.type === 'team') return `team:${principal.teamId}`
  return `domain:${principal.domainId}`
}

import { SEED_VERSION } from '@/lib/constants'

const ACCESS_GRANTS_MODE_KEY = 'access-grants-mode'

function isPhaseMode(): boolean {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem('scenario-phase-mode') === 'true' } catch { return false }
}

function getGrantStorageMode(): 'default' | 'phase' {
  return isPhaseMode() ? 'phase' : 'default'
}

function getBaseGrants(): Grant[] {
  return isPhaseMode() ? PHASE_MODE_GRANTS : DEFAULT_GRANTS
}

function loadStoredGrants(): Grant[] {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_GRANTS)
  const currentMode = getGrantStorageMode()
  try {
    const storedVersion = localStorage.getItem('access-grants-version')
    const storedMode = localStorage.getItem(ACCESS_GRANTS_MODE_KEY)
    const modeMatches = storedMode === currentMode || (!storedMode && currentMode === 'default')
    if (storedVersion === String(SEED_VERSION) && modeMatches) {
      const stored = localStorage.getItem('access-grants')
      if (stored) return JSON.parse(stored) as Grant[]
    } else {
      localStorage.removeItem('access-grants')
      localStorage.removeItem('access-role-groups')
      localStorage.removeItem('access-groups')
      localStorage.setItem('access-grants-version', String(SEED_VERSION))
      localStorage.setItem(ACCESS_GRANTS_MODE_KEY, currentMode)
    }
  } catch { /* fall through */ }
  return structuredClone(getBaseGrants())
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
  const {
    tree: fileTree,
    assetById,
    resolveCollectionAssetIds: resolveCollectionAssetIdsLive,
  } = useFileTree()
  const [grants, setGrantsState] = useState<Grant[]>(loadStoredGrants)
  const setGrants: typeof setGrantsState = useCallback((action) => {
    setGrantsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      try {
        localStorage.setItem('access-grants', JSON.stringify(next))
        localStorage.setItem('access-grants-version', String(SEED_VERSION))
        localStorage.setItem(ACCESS_GRANTS_MODE_KEY, getGrantStorageMode())
      } catch { /* ignore */ }
      return next
    })
  }, [])
  const [roleGroups, setRoleGroupsState] = useState<RoleGroup[]>(loadStoredRoleGroups)
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
  const { blocks, blockUser: blockUserBase, unblockUser: unblockUserBase, isBlocked: isBlockedFn, getBlocksForResource } = useBlocks(activePersona)
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

  const collectionById = useMemo(() => new Map(collections.map((collection) => [collection.id, collection])), [collections])

  const activeGrants = useMemo(() => grants.filter(isGrantActive), [grants])

  const getResourceDomainId = useCallback((resourceId: string): DomainId | undefined => {
    return nodeToDomain.get(resourceId) ?? ROOT_ID_TO_DOMAIN[resourceId] ?? assetById.get(resourceId)?.department
  }, [nodeToDomain, assetById])

  const preparedAccessEngineContext = useMemo(() => prepareAccessEngineContext({
    users: PERSONAS,
    blocks,
    roleGroups,
    teams: TEAMS,
    releaseDomains: RELEASE_DOMAINS,
    fileTree,
    collections,
    resolveCollectionAssetIds: (collection) => resolveCollectionAssetIdsLive(collection as UserCollection),
    sensitiveResourceIds: SENSITIVE_ASSET_IDS,
    projectLocked,
    isProductionDomain: (domainId) => domainConfigs[domainId]?.kind === 'production',
  }), [
    blocks,
    roleGroups,
    fileTree,
    collections,
    resolveCollectionAssetIdsLive,
    projectLocked,
  ])

  const accessEngine = useMemo(() => createAccessEngine(preparedAccessEngineContext, {
    user: activePersona,
    grants,
  }), [preparedAccessEngineContext, activePersona, grants])

  const managerAccessDecisionForResource = useCallback((resource: ResourceRef): AccessDecision => {
    const permissions = getPermissionsForProfile('manager', roleGroups)
    return {
      allowed: true,
      permissions,
      effectiveProfile: 'manager',
      paths: [{
        kind: 'owner',
        scope: 'owner',
        sourceResourceId: resource.id,
        profile: 'manager',
        permissions,
      }],
    }
  }, [roleGroups])

  const resolveAccessDecisionForResource = useCallback((
    resource: ResourceRef,
    currentGrants: Grant[] = grants,
    options?: Parameters<typeof accessEngine.resolve>[1],
  ) => {
    const smartCollection = resource.type === 'smart-collection'
      ? getStoredSmartCollectionById(resource.id)
      : undefined
    if (activePersona && smartCollection?.createdBy === activePersona.email) {
      return managerAccessDecisionForResource(resource)
    }

    const engine = currentGrants === grants
      ? accessEngine
      : createAccessEngine(preparedAccessEngineContext, {
          user: activePersona,
          grants: currentGrants,
        })
    return engine.resolve(resource, options)
  }, [activePersona, grants, accessEngine, preparedAccessEngineContext, managerAccessDecisionForResource])

  const visibleCollections = useMemo(() => {
    return collections.filter((collection) => accessEngine.resolve({ id: collection.id, type: 'collection' }).allowed)
  }, [collections, accessEngine])

  const visibleCollectionIds = useMemo(() => new Set(visibleCollections.map((collection) => collection.id)), [visibleCollections])

  const getVisibleCollection = useCallback((id: string): UserCollection | undefined => {
    return visibleCollections.find((collection) => collection.id === id)
  }, [visibleCollections])

  const getCurrentUserGrant = useCallback((resourceId: string): Grant | undefined => {
    if (!userId) return undefined

    return grants.find((grant) => {
      if (grant.resource.id !== resourceId || !isGrantActive(grant)) return false
      if (grant.grantedByUserId === userId) return false

      return matchPrincipalToUser(grant.principal, userId, TEAMS, RELEASE_DOMAINS) !== null
    })
  }, [userId, grants])

  const resourceRefForId = useCallback((id: string): ResourceRef => {
    const node = nodeById.get(id)

    // Reference folders delegate to their underlying resource
    if (node && isReferenceFolder(node)) {
      const refId = node.reference.resourceId
      const refAsset = assetById.get(refId)
      return {
        id: refId,
        type: refAsset?.kind === 'cut' ? 'cut' : 'folder',
        domainId: refAsset?.department ?? node.reference.domainId ?? getResourceDomainId(refId),
      }
    }

    const asset = assetById.get(id)
    const type: ResourceType = collectionById.has(id)
      ? 'collection'
      : asset?.kind === 'cut'
        ? 'cut'
        : node?.type === 'folder'
          ? 'folder'
          : 'asset'

    return {
      id,
      type,
      domainId: asset?.department ?? getResourceDomainId(id),
    }
  }, [assetById, nodeById, collectionById, getResourceDomainId])

  const canShareFn = useCallback((resource: ResourceRef, currentGrants: Grant[] = grants): boolean => {
    if (!activePersona) return true
    if (!userId) return false

    const permissions = resolveAccessDecisionForResource(resource, currentGrants).permissions
    return permissions.includes('share') || permissions.includes('edit-acl')
  }, [activePersona, userId, grants, resolveAccessDecisionForResource])

  const canGrantProfileForResourceFn = useCallback((
    resource: ResourceRef,
    profileId: AccessProfileId,
    currentGrants: Grant[] = grants,
  ): boolean => {
    if (!isGrantProfileAllowedForResource(resource, profileId)) return false

    if (!activePersona) return true
    if (!userId) return false

    const currentPermissions = resolveAccessDecisionForResource(resource, currentGrants).permissions
    return canAssignProfile(currentPermissions, profileId, roleGroups)
  }, [activePersona, userId, grants, roleGroups, resolveAccessDecisionForResource])

  const canEditAclFn = useCallback((resource: ResourceRef, currentGrants: Grant[] = grants): boolean => {
    if (!activePersona) return true
    if (!userId) return false

    return resolveAccessDecisionForResource(resource, currentGrants).permissions.includes('edit-acl')
  }, [activePersona, userId, grants, resolveAccessDecisionForResource])

  const blockUser = useCallback((targetUserId: string, resourceId: string, reason?: string) => {
    if (!canEditAclFn(resourceRefForId(resourceId))) return
    blockUserBase(targetUserId, resourceId, reason)
  }, [blockUserBase, canEditAclFn, resourceRefForId])

  const unblockUser = useCallback((targetUserId: string, resourceId: string) => {
    if (!canEditAclFn(resourceRefForId(resourceId))) return
    unblockUserBase(targetUserId, resourceId)
  }, [canEditAclFn, resourceRefForId, unblockUserBase])

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

  // canAccess: central access-engine decision.
  const canAccess = useCallback((id: string): boolean => {
    return resolveAccessDecisionForResource(resourceRefForId(id)).allowed
  }, [resolveAccessDecisionForResource, resourceRefForId])

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

  // filterByAccess: filter assets by persona access.
  const filterByAccess = useCallback((assets: Asset[]): Asset[] => {
    if (!activePersona) return assets
    const projectDecision = resolveAccessDecisionForResource(PROJECT_RESOURCE)

    return assets.filter((asset) => {
      if (
        asset.kind === 'production-shot'
        || asset.kind === 'cg-shot'
        || asset.kind === 'cg-sequence'
      ) {
        // Composite Concept projections are ontology-level entities visible at
        // project scope, but they still honor hard denials from the access
        // engine: project lock, explicit blocks, and sensitive-media policy.
        const conceptDecision = resolveAccessDecisionForResource({
          id: asset.id,
          type: 'asset',
        })
        if (
          conceptDecision.deniedBy === 'block'
          || conceptDecision.deniedBy === 'project-lock'
          || conceptDecision.deniedBy === 'sensitive-media'
        ) {
          return false
        }
        if (SENSITIVE_ASSET_IDS.has(asset.id) && activePersona.sensitiveMediaCapability !== true) {
          return false
        }
        return conceptDecision.allowed || projectDecision.allowed
      }
      if (canAccess(asset.id)) return true
      if (asset.sourceFolderIds?.some((fid) => canAccess(fid))) return true
      return false
    })
  }, [activePersona, canAccess, resolveAccessDecisionForResource])

  // Collection asset counts — uses live file tree for folder-bound collections
  // Tracks both total (before access filtering) and accessible (after filtering) counts
  const collectionAssetCounts = useMemo(() => {
    const accessibleCounts = new Map<string, number>()
    const totalCounts = new Map<string, number>()
    for (const collection of collections) {
      if (!visibleCollectionIds.has(collection.id)) continue
      const assetIds = resolveCollectionAssetIdsLive(collection)
      totalCounts.set(collection.id, assetIds.length)
      let count = 0
      for (const assetId of assetIds) {
        if (canAccess(assetId)) count++
      }
      accessibleCounts.set(collection.id, count)
    }
    return { accessible: accessibleCounts, total: totalCounts }
  }, [collections, visibleCollectionIds, canAccess, resolveCollectionAssetIdsLive])

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
      const asset = assetById.get(assetId)
      const access = resolveAccessDecisionForResource({
        id: assetId,
        type: asset?.kind === 'cut' ? 'cut' : 'asset',
        domainId: asset?.department ?? getResourceDomainId(assetId),
      }, grants, {
        includeCollectionPaths: false,
        enforceSensitiveMedia: false,
      })
      const sharerRank = access.effectiveProfile ? (TEMPLATE_RANK[access.effectiveProfile] ?? 0) : 0
      if (sharerRank >= intendedRank) {
        atLevel++
      } else if (access.allowed) {
        capped++
        cappedAssetIds.push(assetId)
      }
    }
    return { total: assetIds.length, atLevel, capped, cappedAssetIds }
  }, [collections, userId, grants, assetById, getResourceDomainId, resolveAccessDecisionForResource, resolveCollectionAssetIdsLive])

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
    return resolveAccessDecisionForResource(resourceRefForId(id)).effectiveProfile
  }, [activePersona, resolveAccessDecisionForResource, resourceRefForId])

  const canEditFn = useCallback((id: string): boolean => {
    if (!activePersona) return true
    return resolveAccessDecisionForResource(resourceRefForId(id)).permissions.includes('write')
  }, [activePersona, resolveAccessDecisionForResource, resourceRefForId])

  const canDownloadFn = useCallback((resource: ResourceRef): boolean => {
    if (!activePersona) return true
    if ((resource.type === 'asset' || resource.type === 'cut') && SENSITIVE_ASSET_IDS.has(resource.id)) return false

    return resolveAccessDecisionForResource(resource).permissions.includes('download')
  }, [activePersona, resolveAccessDecisionForResource])

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
      expiresInDays?: number
      expiresAt?: string
      note?: string
    },
  ) => {
    if (activePersona && !userId) return

    setGrants((prev) => {
      if (!canShareFn(resource, prev)) return prev
      if (!isGrantProfileAllowedForResource(resource, profileId)) return prev

      const supportsShareExtras = resource.type !== 'folder'
      const shareModeOption = supportsShareExtras ? options?.shareMode : undefined
      const snapshotAssetIdsOption = supportsShareExtras ? options?.snapshotAssetIds : undefined
      const allowDownloadOption = supportsShareExtras ? options?.allowDownload : undefined
      const allowCommentOption = supportsShareExtras ? options?.allowComment : undefined
      const grantPermissions = options?.permissions ?? getPermissionsForProfile(profileId, roleGroups)

      const principalKey = getPrincipalKey(principal)
      const matchingActiveGrants = prev.filter(g =>
        g.resource.id === resource.id &&
        isGrantActive(g) &&
        getPrincipalKey(g.principal) === principalKey
      )
      const latestExistingGrant = matchingActiveGrants.reduce<Grant | undefined>((latest, current) => {
        if (!latest) return current
        return current.grantedAt > latest.grantedAt ? current : latest
      }, undefined)

      const finalAllowDownload = supportsShareExtras ? allowDownloadOption ?? latestExistingGrant?.allowDownload : undefined
      const finalAllowComment = supportsShareExtras ? allowCommentOption ?? latestExistingGrant?.allowComment : undefined
      const requestedPermissions = new Set(grantPermissions)
      if (finalAllowDownload) requestedPermissions.add('download')
      if (finalAllowComment) requestedPermissions.add('comment')

      if (!requestedPermissions.has('open')) return prev

      const currentPermissions = activePersona
        ? resolveAccessDecisionForResource(resource, prev).permissions
        : []
      if (activePersona && !Array.from(requestedPermissions).every((permission) => currentPermissions.includes(permission))) {
        return prev
      }

      if (latestExistingGrant) {
        const now = new Date()
        const expiresAt = options?.expiresAt ?? (
          options?.expiresInDays
            ? new Date(now.getTime() + options.expiresInDays * 86400000).toISOString().slice(0, 10)
            : latestExistingGrant.expiresAt
        )
        const auditTarget = resolveAuditTarget(principal)
        logAuditEvent({
          type: 'grant',
          actorId: grantorUserId,
          actorName: activePersona?.name ?? 'System',
          targetUserId: auditTarget.userId,
          targetUserName: auditTarget.name,
          resourceId: resource.id,
          resourceLabel: getResourceLabel(resource.id),
          details: `Updated ${profileId} access for ${auditTarget.name} on ${getResourceLabel(resource.id)}`,
        })

        return prev.map(g => g.id === latestExistingGrant.id
          ? {
              ...g,
              templateId: options?.permissions ? undefined : profileId,
              permissions: grantPermissions,
              grantedByUserId: grantorUserId,
              grantedAt: now.toISOString().slice(0, 10),
              expiresAt,
              shareMode: supportsShareExtras ? shareModeOption ?? g.shareMode : undefined,
              snapshotAssetIds: supportsShareExtras ? snapshotAssetIdsOption ?? g.snapshotAssetIds : undefined,
              allowDownload: supportsShareExtras ? allowDownloadOption ?? g.allowDownload : undefined,
              allowComment: supportsShareExtras ? allowCommentOption ?? g.allowComment : undefined,
              note: options?.note ?? g.note,
            }
          : g
        )
      }

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
        shareMode: shareModeOption,
        snapshotAssetIds: snapshotAssetIdsOption,
        allowDownload: allowDownloadOption,
        allowComment: allowCommentOption,
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
  }, [activePersona, userId, roleGroups, canShareFn, resolveAccessDecisionForResource, grantorUserId, setGrants])

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
    const excludeSet = new Set(excludeGrantIds ?? [])
    const targetUser = PERSONAS.find((persona) => persona.id === targetUserId)
    if (!targetUser) return []

    const decision = createAccessEngine(preparedAccessEngineContext, {
      user: targetUser,
      grants: activeGrants.filter((grant) => !excludeSet.has(grant.id)),
    }).resolve(resourceRefForId(resourceId))

    return decision.paths.map((path): RemainingAccessPath => {
      const mappedPath: RemainingAccessPath['path'] =
        path.kind === 'release'
          ? 'domain'
          : path.kind === 'folder' || path.kind === 'reference'
            ? 'folder'
            : path.kind === 'collection'
              ? 'collection'
              : path.kind === 'team'
                ? 'team'
                : path.kind === 'owner' || path.kind === 'admin'
                  ? 'department'
                  : 'direct'

      return {
        path: mappedPath,
        source: path.sourceLabel ?? getResourceLabel(path.sourceResourceId),
      }
    })
  }, [activeGrants, preparedAccessEngineContext, resourceRefForId])

  // --- Per-user access summary (Phase 3) ---
  const getUserAccessSummary = useCallback((targetUserId: string): UserAccessSummary => {
    const uniqueAssetIds = new Set<string>()
    const getResourceAssetIds = (resource: ResourceRef): string[] => {
      if (resource.type === 'folder') {
        return getAssetIdsForFolderRecursive(resource.id, fileTree)
      }

      if (resource.type === 'collection') {
        const collection = collectionById.get(resource.id)
        return collection ? resolveCollectionAssetIdsLive(collection) : []
      }

      return [resource.id]
    }

    // 1. Workspace root access: groups with root folders the user belongs to
    const workspaceRoots: UserAccessSummary['workspaceRoots'] = []
    for (const team of TEAMS) {
      if (team.kind !== 'group' || !team.rootFolderId) continue
      if (!team.memberUserIds.includes(targetUserId)) continue

      const assetIds = getAssetIdsForFolderRecursive(team.rootFolderId, fileTree)
      for (const id of assetIds) uniqueAssetIds.add(id)
      workspaceRoots.push({
        folderId: team.rootFolderId,
        folderName: team.name,
        count: assetIds.length,
      })
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
      for (const assetId of getResourceAssetIds(grant.resource)) {
        uniqueAssetIds.add(assetId)
      }
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
        for (const assetId of getResourceAssetIds(g.resource)) {
          domainAssetIds.add(assetId)
          uniqueAssetIds.add(assetId)
        }
      }
      domainReleases.push({
        domainId: releaseDomain.id,
        domainName: releaseDomain.name,
        assetCount: domainAssetIds.size,
      })
    }

    return {
      workspaceRoots,
      directShares,
      collectionShares,
      domainReleases,
      totalUniqueAssets: uniqueAssetIds.size,
    }
  }, [activeGrants, roleGroups, fileTree, collectionById, resolveCollectionAssetIdsLive])

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
    roleGroups,
    updateRoleGroup,
    renameRoleGroup,
    addRoleGroup,
    removeRoleGroup,
    resetRoleGroups,
    getInheritedGrants,
    getCollectionRippleGrants,
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
    createReviewLink,
    getGrantByReviewLinkId,
    restoreResourceGrants,
    restoreResourceGuestLinks,
    isSensitiveAsset,
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
    roleGroups,
    updateRoleGroup,
    renameRoleGroup,
    addRoleGroup,
    removeRoleGroup,
    resetRoleGroups,
    getInheritedGrants,
    getCollectionRippleGrants,
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
    createReviewLink,
    getGrantByReviewLinkId,
    restoreResourceGrants,
    restoreResourceGuestLinks,
    isSensitiveAsset,
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
