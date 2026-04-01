'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { usePersona } from './usePersona'
import { useUserCollections } from './useUserCollections'
import type { UserCollection } from './useUserCollections'
import type { Asset } from '@/lib/data'
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
  getPermissionsForProfile,
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

// Re-export types consumers may need
export type { Grant, GrantView, ResourceRef, ResourceType, PrincipalRef, AccessProfileId, RoleGroup, Permission }

interface AccessContextValue {
  // Backward-compat API
  canAccess: (id: string) => boolean
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
  createGrant: (resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId) => void
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

const TEMPLATE_RANK: Record<AccessProfileId, number> = {
  owner: 7,
  manager: 6,
  editor: 5,
  contributor: 4,
  commenter: 3,
  viewer: 2,
  'link-viewer': 1,
}

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

function collectAllNodeIds(nodes: WorkspaceFileNode[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    ids.push(node.id)
    if (node.children) ids.push(...collectAllNodeIds(node.children))
  }
  return ids
}


function mergePermissions(...permissionSets: Permission[][]): Permission[] {
  return Array.from(new Set(permissionSets.flat()))
}

function getMorePermissiveTemplate(
  current: AccessProfileId | null,
  next: AccessProfileId | null,
): AccessProfileId | null {
  if (!next) return current
  if (!current) return next
  return TEMPLATE_RANK[next] > TEMPLATE_RANK[current] ? next : current
}

// Bump this when grant schema or seed data changes — forces localStorage re-seed
const GRANTS_VERSION = 5

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

  // Resolve user for grant operations
  const userId = activePersona?.id ?? null
  const getResourceDepartmentId = useCallback((resourceId: string): DepartmentId | undefined => {
    return nodeToDepartment.get(resourceId) ?? ROOT_ID_TO_DEPARTMENT[resourceId]
  }, [nodeToDepartment])

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
        const current = accessById.get(assetId)
        accessById.set(assetId, {
          templateId: getMorePermissiveTemplate(current?.templateId ?? null, collectionAccess.templateId),
          permissions: mergePermissions(current?.permissions ?? [], cappedPermissions),
          canEdit: Boolean(current?.canEdit || cappedPermissions.includes('write')),
        })
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
    if (!activePersona || !userId) return []

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
    if (!activePersona || !userId) return false

    if (resource.type === 'collection') {
      const permissions = currentUserPermissionsForResource(resource, currentGrants)
      return permissions.includes('share') || permissions.includes('edit-acl')
    }

    return canCreateGrantForResource(userId, resource, currentGrants, roleGroups)
  }, [activePersona, userId, grants, roleGroups, currentUserPermissionsForResource])

  const canEditAclFn = useCallback((resource: ResourceRef, currentGrants: Grant[] = grants): boolean => {
    if (!activePersona || !userId) return false

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
  }, [canEditAclFn])

  const renameRoleGroup = useCallback((id: string, name: string) => {
    if (!canEditAclFn(PROJECT_RESOURCE)) return
    setRoleGroups((prev) =>
      prev.map((rg) => (rg.id === id ? { ...rg, name } : rg)),
    )
  }, [canEditAclFn])

  const addRoleGroup = useCallback((name: string, permissions: Permission[]) => {
    if (!canEditAclFn(PROJECT_RESOURCE)) return
    const id = `custom-${name.toLowerCase().replace(/\s+/g, '-')}` as AccessProfileId
    setRoleGroups((prev) => [...prev, { id, name, permissions, builtIn: false }])
  }, [canEditAclFn])

  const removeRoleGroup = useCallback((id: string) => {
    if (!canEditAclFn(PROJECT_RESOURCE)) return
    setRoleGroups((prev) => prev.filter((rg) => rg.id !== id))
  }, [canEditAclFn])

  const resetRoleGroups = useCallback(() => {
    if (!canEditAclFn(PROJECT_RESOURCE)) return
    setRoleGroups(structuredClone(DEFAULT_ROLE_GROUPS))
  }, [canEditAclFn])

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
        (grant.principal.type === 'team' && activePersona.teamIds.some((tid) => tid === (grant.principal as { type: 'team'; teamId: string }).teamId))
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
  }, [canEditAclFn])

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

  const createGrant = useCallback((resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId) => {
    if (!userId) return
    setGrants((prev) => {
      if (!canShareFn(resource, prev)) return prev

      const newGrant: Grant = {
        id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resource,
        principal,
        templateId: profileId,
        permissions: getPermissionsForProfile(profileId, roleGroups),
        grantedByUserId: userId,
        grantedAt: new Date().toISOString().slice(0, 10),
      }
      return [...prev, newGrant]
    })
  }, [userId, roleGroups, canShareFn])

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
  }, [canEditAclFn])

  // Project-level grants
  const projectUserGrants = useMemo(() => getProjectUserGrantsFromList(grants), [grants])
  const projectTeamGrants = useMemo(() => getProjectTeamGrantsFromList(grants), [grants])

  const createProjectGrant = useCallback((principal: PrincipalRef, profileId: AccessProfileId) => {
    if (!userId) return
    setGrants((prev) => {
      if (!canShareFn(PROJECT_RESOURCE, prev)) return prev

      const newGrant: Grant = {
        id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resource: PROJECT_RESOURCE,
        principal,
        templateId: profileId,
        permissions: getPermissionsForProfile(profileId, roleGroups),
        grantedByUserId: userId,
        grantedAt: new Date().toISOString().slice(0, 10),
      }
      return [...prev, newGrant]
    })
  }, [userId, roleGroups, canShareFn])

  const updateGrantProfile = useCallback((grantId: string, profileId: AccessProfileId) => {
    setGrants((prev) => {
      const grant = prev.find((candidate) => candidate.id === grantId)
      if (!grant || !canEditAclFn(grant.resource, prev)) return prev

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
  }, [roleGroups, canEditAclFn])

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
      if (!collection.assetIds.includes(assetId)) continue
      const collGrants = grants.filter(g => g.resource.id === collection.id && !g.revokedAt)
      for (const g of collGrants) {
        rippled.push({ grant: g, fromResourceId: collection.id, fromResourceName: collection.name })
      }
    }
    return rippled
  }, [collections, grants])

  const contextValue = useMemo(() => ({
    canAccess,
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
    createGrant,
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
    readShareIds,
    markShareRead,
    unreadInboxCount,
  }), [
    canAccess,
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
    createGrant,
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
