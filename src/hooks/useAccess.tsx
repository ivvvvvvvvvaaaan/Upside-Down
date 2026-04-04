'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { usePersona } from './usePersona'
import { useUserCollections } from './useUserCollections'
import type { UserCollection } from './useUserCollections'
import type { Asset } from '@/lib/data'
import { getAssetIdVariants } from '@/lib/data'
import type { DepartmentId } from '@/components/department/types'
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
  userHasAccess,
  resolveAccess,
  mostPermissiveProfile,
  getPermissionsForProfile,
  canAssignProfile,
  canCreateGrantForResource,
  canEditAclForResource,
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
import type { GuestLinkSeed } from '@/lib/scenario'
import { isUserInTeam } from '@/lib/teams'

export type AccessRequest = {
  id: string
  resourceId: string
  resourceRef: ResourceRef
  requestedByUserId: string
  requestedAt: string
}

// Re-export types consumers may need
export type { Grant, GrantView, ResourceRef, ResourceType, PrincipalRef, AccessProfileId, RoleGroup, Permission }

export type AccessPathSource =
  | 'department'           // user is in the same department
  | 'direct-grant'         // explicit grant on this resource
  | 'folder-inheritance'   // inherited from a parent folder grant
  | 'collection-ripple'    // accessible via a shared collection
  | 'admin'                // admin bypass

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

interface AccessContextValue {
  // Access resolution
  canAccess: (id: string) => boolean
  getAccessPath: (id: string, departmentId?: DepartmentId) => AccessPath | null
  filterByAccess: (assets: Asset[]) => Asset[]
  accessibleFolderIds: Set<string>

  // Share views (reimplemented from grants)
  sharesCreatedByMe: GrantView[]
  sharesReceivedByMe: GrantView[]
  allProjectShares: GrantView[]
  revokeShare: (resourceId: string) => void

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

  // Discovery
  discoveryEnabled: boolean
  setDiscoveryEnabled: (enabled: boolean) => void
  discoveryDisabledDepartments: Set<DepartmentId>
  toggleDepartmentDiscovery: (deptId: DepartmentId) => void
  canDiscover: (id: string, departmentId?: DepartmentId) => boolean
  requestAccess: (resourceId: string, resourceRef: ResourceRef) => void
  accessRequests: AccessRequest[]

  // Guest links
  guestLinks: GuestLinkSeed[]
  getResourceGuestLinks: (resourceId: string) => GuestLinkSeed[]
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

function collectFolderIds(nodes: WorkspaceFileNode[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    if (node.type === 'folder') {
      ids.push(node.id)
      if (node.children) ids.push(...collectFolderIds(node.children))
    }
  }
  return ids
}

function mergePermissions(...permissionSets: Permission[][]): Permission[] {
  return Array.from(new Set(permissionSets.flat()))
}

const getCollectionAssetIdVariants = getAssetIdVariants

// Bump this when grant schema or seed data changes — forces localStorage re-seed
const GRANTS_VERSION = 18

export function AccessProvider({ children }: { children: ReactNode }) {
  const { activePersona } = usePersona()
  const { collections } = useUserCollections()
  const { tree: fileTree } = useFileTree()
  const [grants, setGrantsState] = useState<Grant[]>(() => {
    if (typeof window === 'undefined') return structuredClone(DEFAULT_GRANTS)
    try {
      const storedVersion = localStorage.getItem('access-grants-version')
      if (storedVersion === String(GRANTS_VERSION)) {
        const stored = localStorage.getItem('access-grants')
        if (stored) return JSON.parse(stored) as Grant[]
      } else {
        // Version mismatch — clear stale data
        localStorage.removeItem('access-grants')
        localStorage.removeItem('access-role-groups')
        localStorage.removeItem('access-groups')
        localStorage.setItem('access-grants-version', String(GRANTS_VERSION))
      }
    } catch { /* fall through */ }
    return structuredClone(DEFAULT_GRANTS)
  })
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
  const createGuestLink = useCallback((resource: ResourceRef, options: { allowDownload: boolean; passcode: boolean; expiresInDays: number }) => {
    if (!activePersona) return
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
    setGuestLinks(prev => [...prev, link])
    return link
  }, [activePersona])
  const revokeGuestLink = useCallback((linkId: string) => {
    setGuestLinks(prev => prev.filter(l => l.id !== linkId))
  }, [])

  const [roleGroups, setRoleGroupsState] = useState<RoleGroup[]>(() => {
    if (typeof window === 'undefined') return structuredClone(DEFAULT_ROLE_GROUPS)
    try {
      const stored = localStorage.getItem('access-role-groups')
      if (stored) return JSON.parse(stored) as RoleGroup[]
    } catch { /* fall through */ }
    return structuredClone(DEFAULT_ROLE_GROUPS)
  })
  const setRoleGroups: typeof setRoleGroupsState = useCallback((action) => {
    setRoleGroupsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      try { localStorage.setItem('access-role-groups', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])
  const [readShareIds, setReadShareIds] = useState<Set<string>>(() => new Set())
  const [discoveryEnabled, setDiscoveryEnabled] = useState(SCENARIO.discoveryEnabled)
  const [discoveryDisabledDepts, setDiscoveryDisabledDepts] = useState<Set<DepartmentId>>(
    () => new Set(SCENARIO.discoveryDisabledDepartments)
  )
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])

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

  const toggleDepartmentDiscovery = useCallback((deptId: DepartmentId) => {
    setDiscoveryDisabledDepts((prev) => {
      const next = new Set(prev)
      if (next.has(deptId)) next.delete(deptId)
      else next.add(deptId)
      return next
    })
  }, [])

  // Resolve user for grant operations
  const userId = activePersona?.id ?? null
  const grantorUserId = activePersona?.id ?? 'system-admin'
  const getResourceDepartmentId = useCallback((resourceId: string): DepartmentId | undefined => {
    return nodeToDepartment.get(resourceId) ?? ROOT_ID_TO_DEPARTMENT[resourceId]
  }, [nodeToDepartment])

  // Discovery: can user see a restricted asset as a blurred tile?
  const canDiscover = useCallback((id: string, departmentId?: DepartmentId): boolean => {
    if (!activePersona) return true // admin sees everything
    if (!discoveryEnabled) return false
    const dept = departmentId ?? nodeToDepartment.get(id)
    if (dept && discoveryDisabledDepts.has(dept)) return false
    return true
  }, [activePersona, discoveryEnabled, discoveryDisabledDepts, nodeToDepartment])

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

      // Apply ripple policy from the grant (default: view-only)
      const grant = grants.find(g => g.resource.id === collection.id && !g.revokedAt)
      const policy = grant?.ripplePolicy ?? 'view-only'
      const cappedPermissions = policy === 'view-only'
        ? collectionAccess.permissions.filter(p => VIEW_ONLY_CAP.includes(p))
        : policy === 'match-grant'
        ? collectionAccess.permissions
        : (grant?.ripplePermissions ?? VIEW_ONLY_CAP)

      for (const assetId of collection.assetIds) {
        for (const variantId of getCollectionAssetIdVariants(assetId)) {
          const current = accessById.get(variantId)
          accessById.set(variantId, {
            templateId: mostPermissiveProfile(current?.templateId ?? null, collectionAccess.templateId),
            permissions: mergePermissions(current?.permissions ?? [], cappedPermissions),
            canEdit: Boolean(current?.canEdit || cappedPermissions.includes('write')),
          })
        }
      }
    }

    return accessById
  }, [collections, collectionAccessById, grants])

  const visibleCollections = useMemo(() => {
    return collections.filter((collection) => collectionAccessById.has(collection.id))
  }, [collections, collectionAccessById])

  const getVisibleCollection = useCallback((id: string): UserCollection | undefined => {
    return visibleCollections.find((collection) => collection.id === id)
  }, [visibleCollections])

  const currentUserPermissionsForResource = useCallback((
    resource: ResourceRef,
    currentGrants: Grant[] = grants,
  ): Permission[] => {
    if (!activePersona) return getPermissionsForProfile('owner', roleGroups)
    if (!userId) return []

    if (resource.type === 'collection') {
      const collection = collections.find((candidate) => candidate.id === resource.id)
      if (collection?.createdBy === activePersona.email) {
        return getPermissionsForProfile('owner', roleGroups)
      }
    }

    return resolveAccess(
      userId,
      resource.id,
      currentGrants,
      roleGroups,
      resource.departmentId,
    ).permissions
  }, [activePersona, userId, collections, grants, roleGroups])

  const canShareFn = useCallback((resource: ResourceRef, currentGrants: Grant[] = grants): boolean => {
    if (!activePersona) return true
    if (!userId) return false

    if (resource.type === 'collection') {
      const permissions = currentUserPermissionsForResource(resource, currentGrants)
      return permissions.includes('share') || permissions.includes('edit-acl')
    }

    return canCreateGrantForResource(userId, resource, currentGrants, roleGroups)
  }, [activePersona, userId, grants, roleGroups, currentUserPermissionsForResource])

  const canGrantProfileForResourceFn = useCallback((
    resource: ResourceRef,
    profileId: AccessProfileId,
    currentGrants: Grant[] = grants,
  ): boolean => {
    if (profileId === 'owner' || profileId === 'link-viewer') return false

    if (!activePersona) {
      if (resource.type === 'folder') {
        const targetPermissions = getPermissionsForProfile(profileId, roleGroups)
        return targetPermissions.includes('write')
      }

      return true
    }
    if (!userId) return false

    const currentPermissions = currentUserPermissionsForResource(resource, currentGrants)
    if (!canAssignProfile(currentPermissions, profileId, roleGroups)) return false

    if (resource.type === 'folder') {
      const targetPermissions = getPermissionsForProfile(profileId, roleGroups)
      return targetPermissions.includes('write')
    }

    return true
  }, [activePersona, userId, grants, roleGroups, currentUserPermissionsForResource])

  const canEditAclFn = useCallback((resource: ResourceRef, currentGrants: Grant[] = grants): boolean => {
    if (!activePersona) return true
    if (!userId) return false

    if (resource.type === 'collection') {
      return currentUserPermissionsForResource(resource, currentGrants).includes('edit-acl')
    }

    return canEditAclForResource(userId, resource, currentGrants, roleGroups)
  }, [activePersona, userId, grants, roleGroups, currentUserPermissionsForResource])

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
  const canAccess = useCallback((id: string): boolean => {
    if (!activePersona) return true
    if (!userId) return false

    // Explicit grants (direct, team, inherited via folder tree walking in resolveAccess)
    if (userHasAccess(userId, id, grants, nodeToDepartment.get(id), roleGroups)) return true
    // Collection access
    if (collectionAccessById.has(id)) return true
    if (collectionAssetAccessById.has(id)) return true
    // Folder inheritance: check if any ancestor has a grant
    let parentId = nodeToParent.get(id)
    while (parentId) {
      if (userHasAccess(userId, parentId, grants, nodeToDepartment.get(parentId), roleGroups)) return true
      parentId = nodeToParent.get(parentId)
    }

    return false
  }, [activePersona, userId, grants, collectionAccessById, collectionAssetAccessById, nodeToDepartment, nodeToParent, roleGroups])

  // getAccessPath: explain WHY a user can see a resource
  const getAccessPath = useCallback((id: string, departmentId?: DepartmentId): AccessPath | null => {
    if (!activePersona) return { source: 'admin', canBrowseWorkspace: true }
    if (!userId) return null

    // 1. Admin bypass
    if (activePersona.isAdmin) return { source: 'admin', canBrowseWorkspace: true }

    // 2. Direct or team grant on this resource
    if (userHasAccess(userId, id, grants, nodeToDepartment.get(id), roleGroups)) {
      // Check if it's department access (user is in this department)
      const dept = departmentId ?? nodeToDepartment.get(id)
      if (dept) {
        const deptRootId = DEPARTMENT_FOLDER_MAP[dept]?.id
        if (deptRootId && userHasAccess(userId, deptRootId, grants, dept, roleGroups)) {
          return { source: 'department', canBrowseWorkspace: true }
        }
      }
      // Direct grant on this specific resource
      const resourceGrants = grants.filter(g => g.resource.id === id && !g.revokedAt)
      const sharer = resourceGrants.find(g =>
        (g.principal.type === 'user' && g.principal.userId === userId) ||
        (g.principal.type === 'team' && isUserInTeam(userId, g.principal.teamId))
      )
      return {
        source: 'direct-grant',
        sharedByUserId: sharer?.grantedByUserId,
        canBrowseWorkspace: Boolean(dept && userHasAccess(userId, DEPARTMENT_FOLDER_MAP[dept]?.id ?? '', grants, dept, roleGroups)),
      }
    }

    // 3. Collection ripple
    if (collectionAssetAccessById.has(id)) {
      // Find which collection(s) provide this access
      const viaCollection = collections.find(c =>
        collectionAccessById.has(c.id) && c.assetIds.includes(id)
      )
      const collectionGrant = viaCollection
        ? grants.find(g => g.resource.id === viaCollection.id && !g.revokedAt)
        : undefined
      const dept = departmentId ?? nodeToDepartment.get(id)
      return {
        source: 'collection-ripple',
        viaResourceId: viaCollection?.id,
        viaResourceName: viaCollection?.name,
        sharedByUserId: collectionGrant?.grantedByUserId,
        canBrowseWorkspace: Boolean(dept && userHasAccess(userId, DEPARTMENT_FOLDER_MAP[dept]?.id ?? '', grants, dept, roleGroups)),
      }
    }

    // 4. Collection direct access (the resource IS a collection)
    if (collectionAccessById.has(id)) {
      return { source: 'direct-grant', canBrowseWorkspace: false }
    }

    // 5. Folder inheritance
    let parentId = nodeToParent.get(id)
    while (parentId) {
      if (userHasAccess(userId, parentId, grants, nodeToDepartment.get(parentId), roleGroups)) {
        return { source: 'folder-inheritance', viaResourceId: parentId, canBrowseWorkspace: true }
      }
      parentId = nodeToParent.get(parentId)
    }

    return null
  }, [activePersona, userId, grants, collections, collectionAccessById, collectionAssetAccessById, nodeToDepartment, nodeToParent, roleGroups])

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

  // accessibleFolderIds: set of folder IDs accessible to current persona
  const accessibleFolderIds = useMemo(() => {
    const ids = new Set<string>()
    if (!activePersona) {
      // Admin: all folders
      for (const dept of ALL_DEPARTMENTS) {
        ids.add(dept)
        ids.add(DEPARTMENT_WRAPPER_IDS[dept])
        collectFolderIds(getDepartmentWorkspaceFiles(dept)).forEach((id) => ids.add(id))
      }
      return ids
    }

    // All access flows through grants — add granted folders + their descendants
    for (const grant of grants) {
      if (grant.revokedAt) continue
      if (grant.resource.type !== 'folder') continue
      const isGrantee =
        (grant.principal.type === 'user' && grant.principal.userId === activePersona.id) ||
        (grant.principal.type === 'team' && isUserInTeam(activePersona.id, grant.principal.teamId))
      if (isGrantee) {
        ids.add(grant.resource.id)
        // Add all descendant folders (inheritance)
        collectFolderIds(getDepartmentWorkspaceFiles(grant.resource.departmentId as DepartmentId)).forEach((childId) => {
          // Only add if this child is actually under the granted folder
          let parent = nodeToParent.get(childId)
          while (parent) {
            if (parent === grant.resource.id) { ids.add(childId); break }
            parent = nodeToParent.get(parent)
          }
        })
      }
    }

    return ids
  }, [activePersona, grants, nodeToParent])

  // Share views
  const sharesCreatedByMe = useMemo(() => {
    if (!userId) return []
    return buildSharesCreatedByMe(userId, grants)
  }, [userId, grants])

  const sharesReceivedByMe = useMemo(() => {
    if (!userId) return []
    return buildSharesReceivedByMe(userId, grants)
  }, [userId, grants])

  const unreadInboxCount = useMemo(() => {
    return sharesReceivedByMe.filter((s) => !readShareIds.has(s.id)).length
  }, [sharesReceivedByMe, readShareIds])

  const allProjectShares = useMemo(() => {
    return buildAllProjectShares(grants)
  }, [grants])

  // Revoke all grants for a resource
  const revokeShare = useCallback((resourceId: string) => {
    setGrants((prev) => {
      const activeGrant = prev.find((grant) => grant.resource.id === resourceId && !grant.revokedAt)
      if (!activeGrant || !canEditAclFn(activeGrant.resource, prev)) return prev

      return prev.map((grant) =>
        grant.resource.id === resourceId && !grant.revokedAt
          ? { ...grant, revokedAt: new Date().toISOString() }
          : grant,
      )
    })
  }, [canEditAclFn, setGrants])

  // New API
  const getPermission = useCallback((id: string): AccessProfileId | null => {
    if (!userId) return 'owner' // admin
    const explicitAccess = resolveAccess(userId, id, grants, roleGroups, getResourceDepartmentId(id))
    if (explicitAccess.effectiveProfile) return explicitAccess.effectiveProfile
    if (collectionAccessById.has(id)) return collectionAccessById.get(id)?.templateId ?? null
    return collectionAssetAccessById.get(id)?.templateId ?? null
  }, [userId, grants, roleGroups, collectionAccessById, collectionAssetAccessById, getResourceDepartmentId])

  const canEditFn = useCallback((id: string): boolean => {
    if (!activePersona) return true // admin
    if (!userId) return false
    const explicitAccess = resolveAccess(userId, id, grants, roleGroups, getResourceDepartmentId(id))
    if (explicitAccess.canEdit) return true
    if (collectionAccessById.get(id)?.canEdit) return true
    return collectionAssetAccessById.get(id)?.canEdit ?? false
  }, [activePersona, userId, grants, roleGroups, collectionAccessById, collectionAssetAccessById, getResourceDepartmentId])

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
      if (!canShareFn(resource, prev)) return prev
      if (!canGrantProfileForResourceFn(resource, profileId, prev)) return prev

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

  const revokeGrant = useCallback((grantId: string) => {
    setGrants((prev) => {
      const grant = prev.find((candidate) => candidate.id === grantId && !candidate.revokedAt)
      if (!grant || !canEditAclFn(grant.resource, prev)) return prev

      return prev.map((candidate) =>
        candidate.id === grantId && !candidate.revokedAt
          ? { ...candidate, revokedAt: new Date().toISOString() }
          : candidate,
      )
    })
  }, [canEditAclFn, setGrants])

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
      if (!grant || !canEditAclFn(grant.resource, prev)) return prev
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
  }, [roleGroups, canEditAclFn, canGrantProfileForResourceFn, setGrants])

  // Inherited grants display — walks parent chain for folder inheritance
  const getInheritedGrants = useCallback((resourceId: string) => {
    const inherited: { grant: Grant; fromResourceId: string; fromResourceName: string }[] = []
    let parentId = nodeToParent.get(resourceId)
    while (parentId) {
      const parentGrants = grants.filter(g => g.resource.id === parentId && !g.revokedAt)
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
      const collectionAssetIds = new Set(collection.assetIds.flatMap(getCollectionAssetIdVariants))
      if (!collectionAssetIds.has(assetId)) continue
      const collGrants = grants.filter(g => g.resource.id === collection.id && !g.revokedAt)
      for (const g of collGrants) {
        rippled.push({ grant: g, fromResourceId: collection.id, fromResourceName: collection.name })
      }
    }
    return rippled
  }, [collections, grants])

  const contextValue = useMemo(() => ({
    canAccess,
    getAccessPath,
    filterByAccess,
    accessibleFolderIds,
    sharesCreatedByMe,
    sharesReceivedByMe,
    allProjectShares,
    revokeShare,
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
    discoveryEnabled,
    setDiscoveryEnabled,
    discoveryDisabledDepartments: discoveryDisabledDepts,
    toggleDepartmentDiscovery,
    canDiscover,
    requestAccess,
    accessRequests,
    guestLinks,
    getResourceGuestLinks,
    createGuestLink,
    revokeGuestLink,
    readShareIds,
    markShareRead,
    unreadInboxCount,
  }), [
    canAccess,
    getAccessPath,
    filterByAccess,
    accessibleFolderIds,
    sharesCreatedByMe,
    sharesReceivedByMe,
    allProjectShares,
    revokeShare,
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
    discoveryEnabled,
    discoveryDisabledDepts,
    toggleDepartmentDiscovery,
    canDiscover,
    requestAccess,
    accessRequests,
    guestLinks,
    getResourceGuestLinks,
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
