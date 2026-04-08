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
  getProjectUserGrants as getProjectUserGrantsFromList,
  getProjectTeamGrants as getProjectTeamGrantsFromList,
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
} from '@/lib/grants'
import { useFileTree } from './useFileTree'
import { getDepartmentWorkspaceFiles, findNodeInTree, DEPARTMENT_FOLDER_MAP } from '@/lib/workspace-data'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
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

interface AccessContextValue {
  // Access resolution
  canAccess: (id: string) => boolean
  filterByAccess: (assets: Asset[]) => Asset[]

  // Share views (reimplemented from grants)
  sharesCreatedByMe: GrantView[]
  sharesReceivedByMe: GrantView[]
  allProjectShares: GrantView[]

  // New grant-based API
  getPermission: (id: string) => AccessProfileId | null
  canEdit: (id: string) => boolean
  getResourceGrants: (id: string) => Grant[]
  visibleCollections: UserCollection[]
  getVisibleCollection: (id: string) => UserCollection | undefined
  getCollectionAssetCount: (id: string) => number
  createGrant: (resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId) => void
  getGrantableProfiles: (resource: ResourceRef) => AccessProfileId[]
  revokeGrant: (grantId: string) => void
  grants: Grant[]

  // Project-level grants
  projectUserGrants: Grant[]
  projectTeamGrants: Grant[]
  createProjectGrant: (principal: PrincipalRef, profileId: AccessProfileId) => void
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
  discoverySettings: DiscoverySettings
  setDiscoveryEnabledForType: (resourceType: DiscoveryResourceType, enabled: boolean) => void
  toggleDepartmentDiscoveryForType: (resourceType: DiscoveryResourceType, deptId: DepartmentId) => void
  getVisibilityState: (resource: ResourceRef) => VisibilityState
  canDiscover: (id: string, departmentId?: DepartmentId, resourceType?: DiscoveryResourceType) => boolean
  requestAccess: (resourceId: string, resourceRef: ResourceRef) => void
  accessRequests: AccessRequest[]

  // Guest links
  guestLinks: GuestLinkSeed[]
  getResourceGuestLinks: (resourceId: string) => GuestLinkSeed[]
  canManageGuestLink: (link: GuestLinkSeed) => boolean
  createGuestLink: (resource: ResourceRef, options: { allowDownload: boolean; passcode: boolean; expiresInDays: number }) => GuestLinkSeed | undefined
  revokeGuestLink: (linkId: string) => void

  // Read state tracking
  readShareIds: Set<string>
  markShareRead: (id: string) => void
  unreadInboxCount: number
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


// Bump this when grant schema or seed data changes — forces localStorage re-seed
const GRANTS_VERSION = 18

function loadStoredGrants(): Grant[] {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_GRANTS)
  try {
    const storedVersion = localStorage.getItem('access-grants-version')
    if (storedVersion === String(GRANTS_VERSION)) {
      const stored = localStorage.getItem('access-grants')
      if (stored) return JSON.parse(stored) as Grant[]
    } else {
      localStorage.removeItem('access-grants')
      localStorage.removeItem('access-role-groups')
      localStorage.removeItem('access-groups')
      localStorage.setItem('access-grants-version', String(GRANTS_VERSION))
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
        localStorage.setItem('access-grants-version', String(GRANTS_VERSION))
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
  const [discoverySettings, setDiscoverySettings] = useState<DiscoverySettings>(() => ({
    asset: {
      enabled: SCENARIO.discovery.asset.enabled,
      roles: [...SCENARIO.discovery.asset.roles],
      disabledDepartments: new Set(SCENARIO.discovery.asset.disabledDepartments),
    },
    cut: {
      enabled: SCENARIO.discovery.cut.enabled,
      roles: [...SCENARIO.discovery.cut.roles],
      disabledDepartments: new Set(SCENARIO.discovery.cut.disabledDepartments),
    },
  }))
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])

  useEffect(() => {
    setGrantsState(loadStoredGrants())
    setRoleGroupsState(loadStoredRoleGroups())
  }, [])

  // Reactive maps derived from the live file tree (handles user-created folders)
  const { nodeToDepartment, nodeToParent } = useMemo(() => {
    const deptMap = new Map<string, DepartmentId>()
    const parentMap = new Map<string, string>()
    const walk = (nodes: WorkspaceFileNode[], dept: DepartmentId, parentId?: string) => {
      for (const node of nodes) {
        deptMap.set(node.id, dept)
        if (parentId) parentMap.set(node.id, parentId)
        if (node.children) walk(node.children, dept, node.id)
      }
    }
    for (const dept of ALL_DEPARTMENTS) {
      // Walk static seed data
      walk(getDepartmentWorkspaceFiles(dept), dept, DEPARTMENT_WRAPPER_IDS[dept])
      // Walk live tree (includes user-created folders)
      const deptRoot = fileTree.find(n => n.id === DEPARTMENT_WRAPPER_IDS[dept])
      if (deptRoot?.children) walk(deptRoot.children, dept, deptRoot.id)
    }
    return { nodeToDepartment: deptMap, nodeToParent: parentMap }
  }, [fileTree])

  const markShareRead = useCallback((id: string) => {
    setReadShareIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

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
      const nextDepartments = new Set(prev[resourceType].disabledDepartments)
      if (nextDepartments.has(deptId)) nextDepartments.delete(deptId)
      else nextDepartments.add(deptId)

      return {
        ...prev,
        [resourceType]: {
          ...prev[resourceType],
          disabledDepartments: nextDepartments,
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

  // filterByAccess: filter assets by persona access
  const filterByAccess = useCallback((assets: Asset[]): Asset[] => {
    if (!activePersona) return assets
    return assets.filter((asset) => {
      // Direct access via grants
      if (canAccess(asset.id)) return true
      // Source folder access
      if (asset.sourceFolderIds?.some((fid) => canAccess(fid))) return true
      // Department-root policy for curated department assets
      if (asset.department && canAccess(DEPARTMENT_FOLDER_MAP[asset.department].id)) return true
      return false
    })
  }, [activePersona, canAccess])

  // Collection asset counts — access-filtered
  const collectionAssetCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const collection of collections) {
      if (!collectionAccessById.has(collection.id)) continue
      let count = 0
      for (const assetId of collection.assetIds) {
        if (canAccess(assetId)) count++
      }
      counts.set(collection.id, count)
    }
    return counts
  }, [collections, collectionAccessById, canAccess])

  const getCollectionAssetCount = useCallback((id: string): number => {
    return collectionAssetCounts.get(id) ?? 0
  }, [collectionAssetCounts])

  // Share views
  const sharesCreatedByMe = useMemo(() => {
    if (!userId) return []
    return buildSharesCreatedByMe(userId, grants, roleGroups)
  }, [userId, grants, roleGroups])

  const sharesReceivedByMe = useMemo(() => {
    if (!userId) return []
    return buildSharesReceivedByMe(userId, grants, roleGroups)
  }, [userId, grants, roleGroups])

  const unreadInboxCount = useMemo(() => {
    return sharesReceivedByMe.filter((s) => !readShareIds.has(s.id)).length
  }, [sharesReceivedByMe, readShareIds])

  const allProjectShares = useMemo(() => {
    return buildAllProjectShares(grants, roleGroups)
  }, [grants, roleGroups])

  // New API
  const getPermission = useCallback((id: string): AccessProfileId | null => {
    return getEffectiveAccessForId(id).templateId
  }, [getEffectiveAccessForId])

  const canEditFn = useCallback((id: string): boolean => {
    return getEffectiveAccessForId(id).canEdit
  }, [getEffectiveAccessForId])

  const getResourceGrants = useCallback((id: string): Grant[] => {
    return getResourceGrantsFromList(id, grants)
  }, [grants])

  const getGrantableProfiles = useCallback((resource: ResourceRef): AccessProfileId[] => {
    return roleGroups
      .filter((roleGroup) => roleGroup.id !== 'owner' && roleGroup.id !== 'link-viewer')
      .map((roleGroup) => roleGroup.id)
      .filter((profileId) => canGrantProfileForResourceFn(resource, profileId))
  }, [roleGroups, canGrantProfileForResourceFn])

  const createGrant = useCallback((resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId) => {
    if (activePersona && !userId) return

    setGrants((prev) => {
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

      const newGrant: Grant = {
        id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resource,
        principal,
        templateId: profileId,
        permissions: getPermissionsForProfile(profileId, roleGroups),
        grantedByUserId: grantorUserId,
        grantedAt: new Date().toISOString().slice(0, 10),
      }

      return [...prev, newGrant]
    })
  }, [activePersona, userId, roleGroups, canShareFn, canGrantProfileForResourceFn, grantorUserId, setGrants])

  const canManageGrant = useCallback((grant: Grant, currentGrants: Grant[]): boolean => {
    if (canEditAclFn(grant.resource, currentGrants)) return true
    if (userId && canShareFn(grant.resource, currentGrants) && grant.grantedByUserId === userId) return true
    return false
  }, [canEditAclFn, canShareFn, userId])

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

  const revokeGrant = useCallback((grantId: string) => {
    setGrants((prev) => {
      const grant = prev.find((candidate) => candidate.id === grantId && isGrantActive(candidate))
      if (!grant || !canManageGrant(grant, prev)) return prev

      return prev.map((candidate) =>
        candidate.id === grantId && isGrantActive(candidate)
          ? { ...candidate, revokedAt: new Date().toISOString() }
          : candidate,
      )
    })
  }, [canManageGrant, setGrants])

  // Project-level grants
  const projectUserGrants = useMemo(() => getProjectUserGrantsFromList(grants), [grants])
  const projectTeamGrants = useMemo(() => getProjectTeamGrantsFromList(grants), [grants])

  const createProjectGrant = useCallback((principal: PrincipalRef, profileId: AccessProfileId) => {
    if (activePersona && !userId) return
    setGrants((prev) => {
      if (!canShareFn(PROJECT_RESOURCE, prev)) return prev
      if (!canGrantProfileForResourceFn(PROJECT_RESOURCE, profileId, prev)) return prev

      const newGrant: Grant = {
        id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resource: PROJECT_RESOURCE,
        principal,
        templateId: profileId,
        permissions: getPermissionsForProfile(profileId, roleGroups),
        grantedByUserId: grantorUserId,
        grantedAt: new Date().toISOString().slice(0, 10),
      }
      return [...prev, newGrant]
    })
  }, [activePersona, userId, roleGroups, canShareFn, canGrantProfileForResourceFn, grantorUserId, setGrants])

  const updateGrantProfile = useCallback((grantId: string, profileId: AccessProfileId) => {
    setGrants((prev) => {
      const grant = prev.find((candidate) => candidate.id === grantId)
      if (!grant || !canManageGrant(grant, prev)) return prev
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
  }, [roleGroups, canManageGrant, canGrantProfileForResourceFn, setGrants])

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
      const collectionAssetIds = new Set(collection.assetIds.flatMap(getAssetIdVariants))
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
    getPermission,
    canEdit: canEditFn,
    getResourceGrants,
    visibleCollections,
    getVisibleCollection,
    getCollectionAssetCount,
    createGrant,
    getGrantableProfiles,
    revokeGrant,
    grants,
    projectUserGrants,
    projectTeamGrants,
    createProjectGrant,
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
    canManageGrant: canManageGrantById,
    discoverySettings,
    setDiscoveryEnabledForType,
    toggleDepartmentDiscoveryForType,
    getVisibilityState,
    canDiscover,
    requestAccess,
    accessRequests,
    guestLinks,
    getResourceGuestLinks,
    canManageGuestLink,
    createGuestLink,
    revokeGuestLink,
    readShareIds,
    markShareRead,
    unreadInboxCount,
  }), [
    canAccess,
    filterByAccess,
    sharesCreatedByMe,
    sharesReceivedByMe,
    allProjectShares,
    getPermission,
    canEditFn,
    getResourceGrants,
    visibleCollections,
    getVisibleCollection,
    getCollectionAssetCount,
    createGrant,
    getGrantableProfiles,
    revokeGrant,
    grants,
    projectUserGrants,
    projectTeamGrants,
    createProjectGrant,
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
    canManageGrantById,
    discoverySettings,
    setDiscoveryEnabledForType,
    toggleDepartmentDiscoveryForType,
    getVisibilityState,
    canDiscover,
    requestAccess,
    accessRequests,
    guestLinks,
    getResourceGuestLinks,
    canManageGuestLink,
    createGuestLink,
    revokeGuestLink,
    readShareIds,
    markShareRead,
    unreadInboxCount,
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
