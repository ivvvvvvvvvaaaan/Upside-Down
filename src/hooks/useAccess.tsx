'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { usePersona } from './usePersona'
import { useUserCollections } from './useUserCollections'
import type { UserCollection } from './useUserCollections'
import type { Asset } from '@/lib/data'
import { getAssetIdVariants } from '@/lib/data'
import type { DepartmentId } from '@/components/department/types'
import type { UserRole } from '@/lib/personas'
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
} from '@/lib/grants'
import type {
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
import { useFileTree } from './useFileTree'
import { isUserInTeam } from '@/lib/teams'
import {
  findNodeInTree,
  DEPARTMENT_FOLDER_MAP,
  isReferenceFolder,
  type UnifiedFileNode,
} from '@/lib/workspace-data'
import { getAssetIdsForFolder } from '@/lib/data-client'
import { resolveCollectionAssetIds } from '@/lib/data'
import { SCENARIO, buildGuestLinks } from '@/lib/scenario'
import type { GuestLinkSeed, DiscoveryResourceType } from '@/lib/scenario'

export type AccessRequest = {
  id: string
  resourceId: string
  resourceRef: ResourceRef
  requestedByUserId: string
  requestedAt: string
}

// Re-export types consumers may need
export type { Grant, GrantView, ResourceRef, ResourceType, PrincipalRef, AccessProfileId, RoleGroup, Permission }

export type VisibilityState = 'accessible' | 'discoverable' | 'hidden'

type DiscoverySettings = Record<DiscoveryResourceType, {
  enabled: boolean
  roles: UserRole[]
  disabledDepartments: Set<DepartmentId>
}>

type EffectiveAccess = {
  templateId: AccessProfileId | null
  permissions: Permission[]
  canEdit: boolean
}

export type VisibilityState = 'accessible' | 'discoverable' | 'hidden'
export type DiscoveryResourceType = 'asset' | 'cut'

export type DiscoverySettings = {
  enabled: boolean
  disabledDepartments: Set<DepartmentId>
}

interface AccessContextValue {
  // Access resolution
  canAccess: (id: string) => boolean
  filterByAccess: (assets: Asset[], additionalIds?: Set<string>) => Asset[]

  // Share views (reimplemented from grants)
  sharesCreatedByMe: GrantView[]
  sharesReceivedByMe: GrantView[]
  allProjectShares: GrantView[]
<<<<<<< HEAD
  visibleShares: GrantView[]
=======
>>>>>>> origin/main

  // New grant-based API
  getPermission: (id: string) => AccessProfileId | null
  canEdit: (id: string) => boolean
  getResourceGrants: (id: string) => Grant[]
  visibleCollections: UserCollection[]
  getVisibleCollection: (id: string) => UserCollection | undefined
  getCollectionAssetCount: (id: string) => number
  getCurrentUserGrant: (resourceId: string) => Grant | undefined
  createGrant: (resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId, options?: { permissions?: Permission[]; shareMode?: ShareMode; snapshotAssetIds?: string[]; allowUpload?: boolean; expiresInDays?: number }) => void
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
  canManageGrant: (grantId: string) => boolean

  // Discovery
<<<<<<< HEAD
  getDiscoverySettings: (resourceType: DiscoveryResourceType) => DiscoverySettings
  setDiscoveryEnabledForType: (resourceType: DiscoveryResourceType, enabled: boolean) => void
  toggleDepartmentDiscoveryForType: (resourceType: DiscoveryResourceType, deptId: DepartmentId) => void
  getVisibilityState: (resource: ResourceRef) => VisibilityState
=======
  discoverySettings: DiscoverySettings
  setDiscoveryEnabledForType: (resourceType: DiscoveryResourceType, enabled: boolean) => void
  toggleDepartmentDiscoveryForType: (resourceType: DiscoveryResourceType, deptId: DepartmentId) => void
  getVisibilityState: (resource: ResourceRef) => VisibilityState
  canDiscover: (id: string, departmentId?: DepartmentId, resourceType?: DiscoveryResourceType) => boolean
>>>>>>> origin/main
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

  // Restore grants for a resource to a previous snapshot (for cancel flows)
  restoreResourceGrants: (resourceId: string, snapshot: Grant[]) => void
  restoreResourceGuestLinks: (resourceId: string, snapshot: GuestLinkSeed[]) => void
}

const AccessContext = createContext<AccessContextValue | null>(null)

const ALL_DEPARTMENTS: DepartmentId[] = Object.keys(DEPARTMENT_FOLDER_MAP) as DepartmentId[]
const DEPARTMENT_WRAPPER_IDS: Record<DepartmentId, string> = Object.fromEntries(
  ALL_DEPARTMENTS.map(d => [d, DEPARTMENT_FOLDER_MAP[d].id])
) as Record<DepartmentId, string>
const ROOT_ID_TO_DEPARTMENT: Record<string, DepartmentId> = Object.fromEntries(
  ALL_DEPARTMENTS.map((departmentId) => [DEPARTMENT_WRAPPER_IDS[departmentId], departmentId]),
) as Record<string, DepartmentId>

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
  const [guestLinks, setGuestLinks] = useState<GuestLinkSeed[]>(() => buildGuestLinks())
  const getResourceGuestLinks = useCallback((resourceId: string) =>
    guestLinks.filter(l => l.resource.id === resourceId),
  [guestLinks])

  const [roleGroups, setRoleGroupsState] = useState<RoleGroup[]>(() => structuredClone(DEFAULT_ROLE_GROUPS))
  const setRoleGroups: typeof setRoleGroupsState = useCallback((action) => {
    setRoleGroupsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      try { localStorage.setItem('access-role-groups', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])
  const [readShareIds, setReadShareIds] = useState<Set<string>>(() => new Set())
<<<<<<< HEAD
  const [discoverySettings, setDiscoverySettings] = useState<DiscoveryState>(() => ({
    asset: {
      enabled: SCENARIO.discovery.asset.enabled,
=======
  const [discoverySettings, setDiscoverySettings] = useState<DiscoverySettings>(() => ({
    asset: {
      enabled: SCENARIO.discovery.asset.enabled,
      roles: [...SCENARIO.discovery.asset.roles],
>>>>>>> origin/main
      disabledDepartments: new Set(SCENARIO.discovery.asset.disabledDepartments),
    },
    cut: {
      enabled: SCENARIO.discovery.cut.enabled,
<<<<<<< HEAD
=======
      roles: [...SCENARIO.discovery.cut.roles],
>>>>>>> origin/main
      disabledDepartments: new Set(SCENARIO.discovery.cut.disabledDepartments),
    },
  }))
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])

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
  const { nodeToDepartment, nodeToParent, nodeById } = useMemo(() => {
    const deptMap = new Map<string, DepartmentId>()
    const parentMap = new Map<string, string>()
    const nodeMap = new Map<string, UnifiedFileNode>()
    const walk = (nodes: UnifiedFileNode[], dept?: DepartmentId, parentId?: string) => {
      for (const node of nodes) {
        nodeMap.set(node.id, node)
        if (dept) deptMap.set(node.id, dept)
        if (parentId) parentMap.set(node.id, parentId)
        if (node.children) walk(node.children, dept, node.id)
      }
    }
    for (const dept of ALL_DEPARTMENTS) {
      // Map the department root itself
      deptMap.set(DEPARTMENT_WRAPPER_IDS[dept], dept)
    }
    for (const rootNode of fileTree) {
      nodeMap.set(rootNode.id, rootNode)
      const dept = ROOT_ID_TO_DEPARTMENT[rootNode.id]
      if (rootNode.children) {
        walk(rootNode.children, dept, rootNode.id)
      }
    }
    return { nodeToDepartment: deptMap, nodeToParent: parentMap, nodeById: nodeMap }
  }, [fileTree])

  const markShareRead = useCallback((id: string) => {
    setReadShareIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

<<<<<<< HEAD

  const getDiscoverySettings = useCallback((resourceType: DiscoveryResourceType): DiscoverySettings => {
    return discoverySettings[resourceType]
  }, [discoverySettings])

=======
>>>>>>> origin/main
  const setDiscoveryEnabledForType = useCallback((resourceType: DiscoveryResourceType, enabled: boolean) => {
    setDiscoverySettings((prev) => ({
      ...prev,
      [resourceType]: {
        ...prev[resourceType],
        enabled,
      },
    }))
  }, [])

  const toggleDepartmentDiscoveryForType = useCallback((resourceType: DiscoveryResourceType, deptId: DepartmentId) => {
    setDiscoverySettings((prev) => {
<<<<<<< HEAD
      const next = new Set(prev[resourceType].disabledDepartments)
      if (next.has(deptId)) next.delete(deptId)
      else next.add(deptId)
=======
      const nextDepartments = new Set(prev[resourceType].disabledDepartments)
      if (nextDepartments.has(deptId)) nextDepartments.delete(deptId)
      else nextDepartments.add(deptId)

>>>>>>> origin/main
      return {
        ...prev,
        [resourceType]: {
          ...prev[resourceType],
<<<<<<< HEAD
          disabledDepartments: next,
=======
          disabledDepartments: nextDepartments,
>>>>>>> origin/main
        },
      }
    })
  }, [])

  // Resolve user for grant operations
  const userId = activePersona?.id ?? null
  const grantorUserId = activePersona?.id ?? 'system-admin'
  const getResourceDepartmentId = useCallback((resourceId: string): DepartmentId | undefined => {
    return nodeToDepartment.get(resourceId) ?? ROOT_ID_TO_DEPARTMENT[resourceId]
  }, [nodeToDepartment])

<<<<<<< HEAD
  const ownerPermissionSet = useMemo<EffectivePermissionSet>(() => ({
    templateId: 'owner',
    permissions: getPermissionsForProfile('owner', roleGroups),
    canEdit: true,
  }), [roleGroups])

  const collectionById = useMemo(() => new Map(collections.map((collection) => [collection.id, collection])), [collections])

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
          collection.boundDepartmentId as DepartmentId | undefined,
        ),
      ),
    )

    if (collection.boundDepartmentId) {
      const deptRootId = DEPARTMENT_FOLDER_MAP[collection.boundDepartmentId as DepartmentId]?.id
      if (deptRootId) {
        layers.push(
          fromResolvedAccess(
            resolveAccess(
              userId,
              deptRootId,
              currentGrants,
              roleGroups,
              collection.boundDepartmentId as DepartmentId,
            ),
          ),
        )
      }
    }

    return mergePermissionSets(...layers)
  }, [activePersona, userId, grants, roleGroups, collectionById, ownerPermissionSet, fromResolvedAccess])

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

  const collectionAssetAccessById = useMemo(() => {
    const VIEW_ONLY_CAP: Permission[] = ['open', 'download']
    const accessById = new Map<string, EffectivePermissionSet>()

    if (!activePersona || !userId) return accessById

    const matchingCollectionGrants = grants.filter((grant) =>
      grant.resource.type === 'collection' &&
      isGrantActive(grant) &&
      (
        (grant.principal.type === 'user' && grant.principal.userId === userId) ||
        (grant.principal.type === 'team' && isUserInTeam(userId, grant.principal.teamId))
      )
    )

    for (const grant of matchingCollectionGrants) {
      const collection = collectionById.get(grant.resource.id)
      if (!collection) continue

      const grantedPermissions = (grant.permissions.length > 0
        ? grant.permissions
        : getPermissionsForProfile(grant.templateId, roleGroups)
      ).filter((permission) => VIEW_ONLY_CAP.includes(permission))

      if (grantedPermissions.length === 0) continue

      const assetIds = (grant.shareMode === 'snapshot' && grant.snapshotAssetIds)
        ? grant.snapshotAssetIds
        : resolveCollectionAssetIds(collection)

      for (const assetId of assetIds) {
        const sharerAssetAccess = resolveAccess(
          grant.grantedByUserId,
          assetId,
          grants,
          roleGroups,
          getResourceDepartmentId(assetId),
        )
        if (!sharerAssetAccess.permissions.includes('open')) continue

        const cappedPermissions = grantedPermissions.filter((permission) =>
          sharerAssetAccess.permissions.includes(permission),
        )
        if (cappedPermissions.length === 0) continue

        for (const variantId of getAssetIdVariants(assetId)) {
          const current = accessById.get(variantId) ?? EMPTY_PERMISSION_SET
          accessById.set(
            variantId,
            mergePermissionSets(
              current,
              toPermissionSet(cappedPermissions, 'view'),
            ),
          )
        }
      }
    }

    return accessById
  }, [activePersona, userId, grants, roleGroups, collectionById, getResourceDepartmentId, toPermissionSet])

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

    const resourceDepartmentId = resource.departmentId ?? getResourceDepartmentId(resource.id)
    const layers: EffectivePermissionSet[] = []

    if (resource.type === 'collection') {
      layers.push(getDirectCollectionPermissionSet(resource.id, currentGrants))
    } else {
      layers.push(
        fromResolvedAccess(
          resolveAccess(
            userId,
            resource.id,
            currentGrants,
            roleGroups,
            resourceDepartmentId,
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
            nodeToDepartment.get(parentId),
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
    getResourceDepartmentId,
    getDirectCollectionPermissionSet,
    fromResolvedAccess,
    nodeToParent,
    nodeToDepartment,
    collectionAssetAccessById,
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

    if (resource.type === 'folder' && !resource.departmentId && !nodeToDepartment.has(resource.id)) return true

    const permissions = getEffectivePermissionSet(resource, currentGrants).permissions
    return permissions.includes('share') || permissions.includes('edit-acl')
  }, [activePersona, userId, grants, nodeToDepartment, getEffectivePermissionSet])

  const canGrantProfileForResourceFn = useCallback((
    resource: ResourceRef,
    profileId: AccessProfileId,
    currentGrants: Grant[] = grants,
  ): boolean => {
    if (profileId === 'owner' || profileId === 'link-viewer') return false

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

=======
>>>>>>> origin/main
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

<<<<<<< HEAD
=======
  const collectionAccessById = useMemo(() => {
    const accessById = new Map<string, {
      templateId: AccessProfileId | null
      permissions: Permission[]
      canEdit: boolean
    }>()

    if (!activePersona) {
      const ownerPermissions = getPermissionsForProfile('owner', roleGroups)
      for (const collection of collections) {
        accessById.set(collection.id, {
          templateId: 'owner',
          permissions: ownerPermissions,
          canEdit: true,
        })
      }
      return accessById
    }

    if (!userId) return accessById

    for (const collection of collections) {
      if (collection.createdBy === activePersona.email) {
        accessById.set(collection.id, {
          templateId: 'owner',
          permissions: getPermissionsForProfile('owner', roleGroups),
          canEdit: true,
        })
        continue
      }

      const sharedAccess = resolveAccess(userId, collection.id, grants, roleGroups)
      if (sharedAccess.hasAccess) {
        accessById.set(collection.id, {
          templateId: sharedAccess.effectiveProfile,
          permissions: sharedAccess.permissions,
          canEdit: sharedAccess.canEdit,
        })
      }
    }

    return accessById
  }, [activePersona, userId, collections, grants, roleGroups])

  const collectionAssetAccessById = useMemo(() => {
    const VIEW_ONLY_CAP: Permission[] = ['open', 'download']
    const accessById = new Map<string, {
      templateId: AccessProfileId | null
      permissions: Permission[]
      canEdit: boolean
    }>()

    for (const collection of collections) {
      const collectionAccess = collectionAccessById.get(collection.id)
      if (!collectionAccess) continue

      const ripplePermissions = collectionAccess.permissions.filter((permission) =>
        VIEW_ONLY_CAP.includes(permission),
      )
      if (!ripplePermissions.includes('open')) continue

      const rippleTemplateId: AccessProfileId | null = ripplePermissions.includes('download') ? 'viewer' : null

      for (const assetId of collection.assetIds) {
        for (const variantId of getAssetIdVariants(assetId)) {
          const current = accessById.get(variantId)
          const permissions = mergePermissions(current?.permissions ?? [], ripplePermissions)
          accessById.set(variantId, {
            templateId: current?.templateId ?? rippleTemplateId,
            permissions,
            canEdit: false,
          })
        }
      }
    }

    return accessById
  }, [collections, collectionAccessById])

  const visibleCollections = useMemo(() => {
    return collections.filter((collection) => collectionAccessById.has(collection.id))
  }, [collections, collectionAccessById])

  const getVisibleCollection = useCallback((id: string): UserCollection | undefined => {
    return visibleCollections.find((collection) => collection.id === id)
  }, [visibleCollections])

  const getInheritedFolderAccess = useCallback((
    resourceId: string,
    currentGrants: Grant[] = grants,
  ): EffectiveAccess => {
    if (!userId) {
      return {
        templateId: null,
        permissions: [],
        canEdit: false,
      }
    }

    let templateId: AccessProfileId | null = null
    let permissions: Permission[] = []

    let parentId = nodeToParent.get(resourceId)
    while (parentId) {
      const inheritedAccess = resolveAccess(
        userId,
        parentId,
        currentGrants,
        roleGroups,
        getResourceDepartmentId(parentId),
      )

      if (inheritedAccess.permissions.length > 0) {
        templateId = mostPermissiveProfile(templateId, inheritedAccess.effectiveProfile)
        permissions = mergePermissions(permissions, inheritedAccess.permissions)
      }

      parentId = nodeToParent.get(parentId)
    }

    return {
      templateId,
      permissions,
      canEdit: permissions.includes('write'),
    }
  }, [userId, grants, nodeToParent, roleGroups, getResourceDepartmentId])

  const getEffectiveAccessForId = useCallback((
    resourceId: string,
    currentGrants: Grant[] = grants,
  ): EffectiveAccess => {
    if (!activePersona) {
      return {
        templateId: 'owner',
        permissions: getPermissionsForProfile('owner', roleGroups),
        canEdit: true,
      }
    }

    if (!userId) {
      return {
        templateId: null,
        permissions: [],
        canEdit: false,
      }
    }

    const explicitAccess = resolveAccess(
      userId,
      resourceId,
      currentGrants,
      roleGroups,
      getResourceDepartmentId(resourceId),
    )
    const inheritedAccess = getInheritedFolderAccess(resourceId, currentGrants)
    const collectionAccess = collectionAccessById.get(resourceId)
    const collectionRippleAccess = collectionAssetAccessById.get(resourceId)

    const permissions = mergePermissions(
      explicitAccess.permissions,
      inheritedAccess.permissions,
      collectionAccess?.permissions ?? [],
      collectionRippleAccess?.permissions ?? [],
    )

    return {
      templateId: [
        explicitAccess.effectiveProfile,
        inheritedAccess.templateId,
        collectionAccess?.templateId ?? null,
        collectionRippleAccess?.templateId ?? null,
      ].reduce<AccessProfileId | null>((best, next) => mostPermissiveProfile(best, next), null),
      permissions,
      canEdit: permissions.includes('write'),
    }
  }, [
    activePersona,
    userId,
    grants,
    roleGroups,
    getResourceDepartmentId,
    getInheritedFolderAccess,
    collectionAccessById,
    collectionAssetAccessById,
  ])

  const currentUserPermissionsForResource = useCallback((
    resource: ResourceRef,
    currentGrants: Grant[] = grants,
  ): Permission[] => {
    if (!activePersona) return getPermissionsForProfile('owner', roleGroups)
    if (!userId) return []

    const collectionOwnerPermissions = resource.type === 'collection'
      ? (() => {
          const collection = collections.find((candidate) => candidate.id === resource.id)
          return collection?.createdBy === activePersona.email
            ? getPermissionsForProfile('owner', roleGroups)
            : []
        })()
      : []

    const explicitAccess = resolveAccess(
      userId,
      resource.id,
      currentGrants,
      roleGroups,
      resource.departmentId ?? getResourceDepartmentId(resource.id),
    )
    const inheritedAccess = getInheritedFolderAccess(resource.id, currentGrants)
    const collectionRipplePermissions =
      resource.type === 'asset' || resource.type === 'cut'
        ? collectionAssetAccessById.get(resource.id)?.permissions ?? []
        : []

    return mergePermissions(
      explicitAccess.permissions,
      inheritedAccess.permissions,
      collectionOwnerPermissions,
      collectionRipplePermissions,
    )
  }, [
    activePersona,
    userId,
    collections,
    grants,
    roleGroups,
    getResourceDepartmentId,
    getInheritedFolderAccess,
    collectionAssetAccessById,
  ])

  const canShareFn = useCallback((resource: ResourceRef, currentGrants: Grant[] = grants): boolean => {
    if (!activePersona) return true
    if (!userId) return false

    const permissions = currentUserPermissionsForResource(resource, currentGrants)
    return permissions.includes('share') || permissions.includes('edit-acl')
  }, [activePersona, userId, grants, currentUserPermissionsForResource])

  const canGrantProfileForResourceFn = useCallback((
    resource: ResourceRef,
    profileId: AccessProfileId,
    currentGrants: Grant[] = grants,
  ): boolean => {
    if (profileId === 'owner' || profileId === 'link-viewer') return false

    if (!activePersona) return true
    if (!userId) return false

    const currentPermissions = currentUserPermissionsForResource(resource, currentGrants)
    if (!canAssignProfile(currentPermissions, profileId, roleGroups)) return false

    return true
  }, [activePersona, userId, grants, roleGroups, currentUserPermissionsForResource])

  const canEditAclFn = useCallback((resource: ResourceRef, currentGrants: Grant[] = grants): boolean => {
    if (!activePersona) return true
    if (!userId) return false

    return currentUserPermissionsForResource(resource, currentGrants).includes('edit-acl')
  }, [activePersona, userId, grants, currentUserPermissionsForResource])

>>>>>>> origin/main
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

  // canAccess: explicit grants plus folder inheritance and collection ripple
  const canAccess = useCallback((id: string): boolean => {
    return getEffectiveAccessForId(id).permissions.includes('open')
  }, [getEffectiveAccessForId])

<<<<<<< HEAD
    const referenceNode = nodeById.get(id)
    if (isReferenceFolder(referenceNode)) {
      return getEffectivePermissionSet({
        id: referenceNode.reference.resourceId,
        type: referenceNode.reference.resourceType,
        departmentId: referenceNode.reference.departmentId,
      }).permissions.includes('open')
    }

    if (!nodeToDepartment.has(id) && !nodeToParent.has(id)) return true
    return getEffectivePermissionSet({
      id,
      type: collectionById.has(id) ? 'collection' : 'asset',
      departmentId: getResourceDepartmentId(id),
    }).permissions.includes('open')
  }, [
    activePersona,
    userId,
    nodeById,
    nodeToDepartment,
    nodeToParent,
    collectionById,
    getEffectivePermissionSet,
    getResourceDepartmentId,
  ])

  const getVisibilityState = useCallback((resource: ResourceRef): VisibilityState => {
    if (canAccess(resource.id)) return 'accessible'
    if (!activePersona) return 'accessible'
    if (resource.type !== 'asset' && resource.type !== 'cut') return 'hidden'

    const rule = SCENARIO.discovery[resource.type]
    const settings = discoverySettings[resource.type]
    if (!settings.enabled) return 'hidden'
    if (!rule.allowedRoles.includes(activePersona.role)) return 'hidden'

    const departmentId = resource.departmentId
      ?? (resource.type === 'cut' ? 'editorial' : getResourceDepartmentId(resource.id))

    if (departmentId && settings.disabledDepartments.has(departmentId)) return 'hidden'

    return 'discoverable'
  }, [activePersona, canAccess, discoverySettings, getResourceDepartmentId])
=======
  const getVisibilityState = useCallback((resource: ResourceRef): VisibilityState => {
    if (!activePersona) return 'accessible'
    if (canAccess(resource.id)) return 'accessible'

    const discoveryType: DiscoveryResourceType | null = resource.type === 'cut'
      ? 'cut'
      : resource.type === 'asset'
      ? 'asset'
      : null

    if (!discoveryType) return 'hidden'

    const settings = discoverySettings[discoveryType]
    if (!settings.enabled) return 'hidden'
    if (!settings.roles.includes(activePersona.role)) return 'hidden'

    const dept = resource.departmentId ?? getResourceDepartmentId(resource.id)
    if (dept && settings.disabledDepartments.has(dept)) return 'hidden'

    return 'discoverable'
  }, [activePersona, canAccess, discoverySettings, getResourceDepartmentId])

  const canDiscover = useCallback((id: string, departmentId?: DepartmentId, resourceType: DiscoveryResourceType = 'asset'): boolean => {
    return getVisibilityState({
      id,
      type: resourceType,
      departmentId,
    }) === 'discoverable'
  }, [getVisibilityState])
>>>>>>> origin/main

  // filterByAccess: filter assets by persona access
  // Accepts optional additionalIds for domain-specific cascade rules (e.g., cut constituents)
  const filterByAccess = useCallback((assets: Asset[], additionalIds?: Set<string>): Asset[] => {
    if (!activePersona) return assets
    return assets.filter((asset) => {
      if (canAccess(asset.id)) return true
      if (asset.sourceFolderIds?.some((fid) => canAccess(fid))) return true
      if (asset.department && canAccess(DEPARTMENT_FOLDER_MAP[asset.department].id)) return true
      if (additionalIds?.has(asset.id)) return true
      return false
    })
  }, [activePersona, canAccess])

  // Collection asset counts — uses resolveCollectionAssetIds for consistent resolution
  const collectionAssetCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const collection of collections) {
      if (!collectionAccessById.has(collection.id)) continue
      const assetIds = resolveCollectionAssetIds(collection)
      let count = 0
      for (const assetId of assetIds) {
        if (canAccess(assetId)) count++
      }
      counts.set(collection.id, count)
    }
    return counts
  }, [collections, collectionAccessById, canAccess])

  const getCollectionAssetCount = useCallback((id: string): number => {
    return collectionAssetCounts.get(id) ?? 0
  }, [collectionAssetCounts])

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
<<<<<<< HEAD
    return resolveShareLabels(buildSharesCreatedByMe(userId, grants))
  }, [userId, grants, resolveShareLabels])

  const sharesReceivedByMe = useMemo(() => {
    if (!userId) return []
    return resolveShareLabels(buildSharesReceivedByMe(userId, grants))
  }, [userId, grants, resolveShareLabels])
=======
    return buildSharesCreatedByMe(userId, grants, roleGroups)
  }, [userId, grants, roleGroups])

  const sharesReceivedByMe = useMemo(() => {
    if (!userId) return []
    return buildSharesReceivedByMe(userId, grants, roleGroups)
  }, [userId, grants, roleGroups])
>>>>>>> origin/main

  const unreadInboxCount = useMemo(() => {
    return sharesReceivedByMe.filter((s) => !readShareIds.has(s.id)).length
  }, [sharesReceivedByMe, readShareIds])

  const allProjectShares = useMemo(() => {
<<<<<<< HEAD
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
      templateId: 'comment',
      permissions: getPermissionsForProfile('comment', roleGroups),
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
    if (!activePersona) return 'owner'
    return getEffectivePermissionSet({
      id,
      type: collectionById.has(id) ? 'collection' : 'asset',
      departmentId: getResourceDepartmentId(id),
    }).templateId
  }, [activePersona, collectionById, getEffectivePermissionSet, getResourceDepartmentId])

  const canEditFn = useCallback((id: string): boolean => {
    if (!activePersona) return true
    return getEffectivePermissionSet({
      id,
      type: collectionById.has(id) ? 'collection' : 'asset',
      departmentId: getResourceDepartmentId(id),
    }).canEdit
  }, [activePersona, collectionById, getEffectivePermissionSet, getResourceDepartmentId])
=======
    return buildAllProjectShares(grants, roleGroups)
  }, [grants, roleGroups])

  // New API
  const getPermission = useCallback((id: string): AccessProfileId | null => {
    return getEffectiveAccessForId(id).templateId
  }, [getEffectiveAccessForId])

  const canEditFn = useCallback((id: string): boolean => {
    return getEffectiveAccessForId(id).canEdit
  }, [getEffectiveAccessForId])
>>>>>>> origin/main

  const getResourceGrants = useCallback((id: string): Grant[] => {
    return getResourceGrantsFromList(id, grants)
  }, [grants])

  const getGrantableProfiles = useCallback((resource: ResourceRef): AccessProfileId[] => {
    return roleGroups
      .filter((roleGroup) => roleGroup.id !== 'owner' && roleGroup.id !== 'link-viewer')
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
      allowUpload?: boolean
      expiresInDays?: number
    },
  ) => {
    if (activePersona && !userId) return

    setGrants((prev) => {
<<<<<<< HEAD
      if (!canShareFn(resource, prev)) return prev

      // Use explicit permissions if provided (toggle-based), otherwise resolve from profile
      const grantPermissions = options?.permissions ?? getPermissionsForProfile(profileId, roleGroups)

      const now = new Date()
      const expiresAt = options?.expiresInDays
        ? new Date(now.getTime() + options.expiresInDays * 86400000).toISOString().slice(0, 10)
        : undefined
=======
      const isSmartCollectionOwnerBootstrap =
        Boolean(userId) &&
        resource.type === 'smart-collection' &&
        principal.type === 'user' &&
        principal.userId === userId &&
        profileId === 'manager' &&
        !prev.some((grant) => grant.resource.id === resource.id && isGrantActive(grant))

      if (!isSmartCollectionOwnerBootstrap) {
        if (!canShareFn(resource, prev)) return prev
        if (!canGrantProfileForResourceFn(resource, profileId, prev)) return prev
      }
>>>>>>> origin/main

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
        allowUpload: options?.allowUpload,
      }

      return [...prev, newGrant]
    })
  }, [activePersona, userId, roleGroups, canShareFn, grantorUserId, setGrants])

  const canManageGrantForState = useCallback((grant: Grant, currentGrants: Grant[]): boolean => {
    if (canEditAclFn(grant.resource, currentGrants)) return true
    if (userId && canShareFn(grant.resource, currentGrants) && grant.grantedByUserId === userId) return true
    return false
  }, [canEditAclFn, canShareFn, userId])

<<<<<<< HEAD
  const canManageGrant = useCallback((grant: Grant): boolean => {
    return canManageGrantForState(grant, grants)
  }, [canManageGrantForState, grants])
=======
  const canManageGrantById = useCallback((grantId: string): boolean => {
    const grant = grants.find((candidate) => candidate.id === grantId && isGrantActive(candidate))
    if (!grant) return false
    return canManageGrant(grant, grants)
  }, [grants, canManageGrant])

  const createGuestLink = useCallback((resource: ResourceRef, options: { allowDownload: boolean; passcode: boolean; expiresInDays: number }) => {
    if (!canShareFn(resource, grants)) return

    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + options.expiresInDays)

    const link: GuestLinkSeed = {
      id: `link-${Date.now()}`,
      resource: { id: resource.id, type: resource.type, departmentId: resource.departmentId },
      label: resource.id,
      permissions: options.allowDownload ? ['open', 'download'] : ['open'],
      templateId: 'link-viewer',
      createdByUserId: grantorUserId,
      createdAt: now.toISOString().slice(0, 10),
      expiresAt: expires.toISOString().slice(0, 10),
      allowDownload: options.allowDownload,
      passcode: options.passcode,
    }

    setGuestLinks(prev => [...prev, link])
    return link
  }, [canShareFn, grants, grantorUserId])

  const canManageGuestLink = useCallback((link: GuestLinkSeed, currentGrants: Grant[] = grants): boolean => {
    const resource: ResourceRef = {
      id: link.resource.id,
      type: link.resource.type as ResourceType,
      departmentId: link.resource.departmentId,
    }

    if (!activePersona) return true
    if (canEditAclFn(resource, currentGrants)) return true
    if (userId && canShareFn(resource, currentGrants) && link.createdByUserId === userId) return true
    return false
  }, [activePersona, grants, userId, canEditAclFn, canShareFn])

  const revokeGuestLink = useCallback((linkId: string) => {
    setGuestLinks(prev => {
      const link = prev.find(l => l.id === linkId)
      if (!link) return prev
      if (!canManageGuestLink(link, grants)) return prev
      return prev.filter(l => l.id !== linkId)
    })
  }, [grants, canManageGuestLink])
>>>>>>> origin/main

  const revokeGrant = useCallback((grantId: string) => {
    setGrants((prev) => {
      const grant = prev.find((candidate) => candidate.id === grantId && isGrantActive(candidate))
      if (!grant || !canManageGrantForState(grant, prev)) return prev

      return prev.map((candidate) =>
        candidate.id === grantId && isGrantActive(candidate)
          ? { ...candidate, revokedAt: new Date().toISOString() }
          : candidate,
      )
    })
  }, [canManageGrantForState, setGrants])

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

  const canManageGuestLinkForState = useCallback((link: GuestLinkSeed, currentGrants: Grant[]): boolean => {
    if (!activePersona) return true
    const resource: ResourceRef = {
      id: link.resource.id,
      type: link.resource.type as ResourceType,
      departmentId: link.resource.departmentId,
    }
    if (canEditAclFn(resource, currentGrants)) return true
    return Boolean(userId && canShareFn(resource, currentGrants) && link.createdByUserId === userId)
  }, [activePersona, canEditAclFn, canShareFn, userId])

  const canManageGuestLink = useCallback((link: GuestLinkSeed): boolean => {
    return canManageGuestLinkForState(link, grants)
  }, [canManageGuestLinkForState, grants])

  const createGuestLink = useCallback((resource: ResourceRef, options: { allowDownload: boolean; passcode: boolean; expiresInDays: number }) => {
    if (!activePersona) return
    if (!canShareFn(resource, grants)) return

    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + options.expiresInDays)
    const link: GuestLinkSeed = {
      id: `link-${Date.now()}`,
      resource: { id: resource.id, type: resource.type, departmentId: resource.departmentId },
      label: resource.id,
      permissions: options.allowDownload ? ['open', 'download'] : ['open'],
      templateId: 'link-viewer',
      createdByUserId: activePersona.id,
      createdAt: now.toISOString().slice(0, 10),
      expiresAt: expires.toISOString().slice(0, 10),
      allowDownload: options.allowDownload,
      passcode: options.passcode,
    }
    setGuestLinks((prev) => [...prev, link])
    return link
  }, [activePersona, grants, canShareFn])

  const updateGuestLink = useCallback((linkId: string, updates: Partial<Pick<GuestLinkSeed, 'allowDownload' | 'passcode' | 'expiresAt'>>) => {
    setGuestLinks((prev) => prev.map((link) => {
      if (link.id !== linkId) return link
      if (!canManageGuestLinkForState(link, grants)) return link
      return {
        ...link,
        ...updates,
        permissions: (updates.allowDownload ?? link.allowDownload) ? ['open' as const, 'download' as const] : ['open' as const],
      }
    }))
  }, [grants, canManageGuestLinkForState])

  const revokeGuestLink = useCallback((linkId: string) => {
    setGuestLinks((prev) => {
      const link = prev.find((candidate) => candidate.id === linkId)
      if (!link || !canManageGuestLinkForState(link, grants)) return prev
      return prev.filter((candidate) => candidate.id !== linkId)
    })
  }, [grants, canManageGuestLinkForState])

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

  const restoreResourceGuestLinks = useCallback((resourceId: string, snapshot: GuestLinkSeed[]) => {
    setGuestLinks((prev) => {
      const otherLinks = prev.filter((link) => link.resource.id !== resourceId)
      return [...otherLinks, ...snapshot]
    })
  }, [])

  // Inherited grants display — walks parent chain for folder inheritance
  const getInheritedGrants = useCallback((resourceId: string) => {
    const inherited: { grant: Grant; fromResourceId: string; fromResourceName: string }[] = []
    let parentId = nodeToParent.get(resourceId)
    while (parentId) {
      const parentGrants = grants.filter(g => g.resource.id === parentId && isGrantActive(g))
      if (parentGrants.length > 0) {
        const name = findNodeInTree(fileTree, parentId)?.name ?? parentId
        for (const g of parentGrants) {
          inherited.push({ grant: g, fromResourceId: parentId, fromResourceName: name })
        }
      }
      parentId = nodeToParent.get(parentId)
    }
    return inherited
  }, [nodeToParent, grants, fileTree])

  // Collection ripple grants display — finds grants that reach an asset through collection membership
  const getCollectionRippleGrants = useCallback((assetId: string) => {
    const rippled: { grant: Grant; fromResourceId: string; fromResourceName: string }[] = []
    for (const collection of collections) {
      const collectionAssetIds = new Set(resolveCollectionAssetIds(collection).flatMap(getAssetIdVariants))
      if (!collectionAssetIds.has(assetId)) continue
      const collGrants = grants.filter(g => g.resource.id === collection.id && isGrantActive(g))
      for (const g of collGrants) {
        rippled.push({ grant: g, fromResourceId: collection.id, fromResourceName: collection.name })
      }
    }
    return rippled
  }, [collections, grants])

  const contextValue = useMemo(() => ({
    canAccess,
    filterByAccess,
    sharesCreatedByMe,
    sharesReceivedByMe,
    allProjectShares,
<<<<<<< HEAD
    visibleShares,
=======
>>>>>>> origin/main
    getPermission,
    canEdit: canEditFn,
    getResourceGrants,
    visibleCollections,
    getVisibleCollection,
    getCollectionAssetCount,
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
<<<<<<< HEAD
    getDiscoverySettings,
    setDiscoveryEnabledForType,
    toggleDepartmentDiscoveryForType,
    getVisibilityState,
=======
    canManageGrant: canManageGrantById,
    discoverySettings,
    setDiscoveryEnabledForType,
    toggleDepartmentDiscoveryForType,
    getVisibilityState,
    canDiscover,
>>>>>>> origin/main
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
  }), [
    canAccess,
    filterByAccess,
    sharesCreatedByMe,
    sharesReceivedByMe,
    allProjectShares,
<<<<<<< HEAD
    visibleShares,
=======
>>>>>>> origin/main
    getPermission,
    canEditFn,
    getResourceGrants,
    visibleCollections,
    getVisibleCollection,
    getCollectionAssetCount,
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
<<<<<<< HEAD
    getDiscoverySettings,
    setDiscoveryEnabledForType,
    toggleDepartmentDiscoveryForType,
    getVisibilityState,
=======
    canManageGrantById,
    discoverySettings,
    setDiscoveryEnabledForType,
    toggleDepartmentDiscoveryForType,
    getVisibilityState,
    canDiscover,
>>>>>>> origin/main
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
