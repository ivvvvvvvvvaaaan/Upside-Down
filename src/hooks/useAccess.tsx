'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { usePersona } from './usePersona'
import { useUserCollections } from './useUserCollections'
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
import { isDepartmentRole } from '@/lib/personas'
import { useFileTree } from './useFileTree'
import { getDepartmentWorkspaceFiles, findNodeInTree } from '@/lib/workspace-data'
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
  updateRoleGroup: (id: AccessProfileId, permissions: Permission[]) => void
  resetRoleGroups: () => void

  // Inheritance display
  getInheritedGrants: (resourceId: string) => { grant: Grant; fromResourceId: string; fromResourceName: string }[]
  getCollectionRippleGrants: (assetId: string) => { grant: Grant; fromResourceId: string; fromResourceName: string }[]

  // Sharing authority
  canShare: () => boolean

  // Read state tracking
  readShareIds: Set<string>
  markShareRead: (id: string) => void
  unreadInboxCount: number
}

const AccessContext = createContext<AccessContextValue | null>(null)

// Build workspace folder IDs for department access
const ALL_DEPARTMENTS: DepartmentId[] = ['art-design', 'vfx', 'camera', 'editorial', 'audio-sound']
const DEPARTMENT_WRAPPER_IDS: Record<DepartmentId, string> = {
  'art-design': 'ws-art',
  'vfx': 'ws-vfx',
  'camera': 'ws-camera',
  'editorial': 'ws-editorial',
  'audio-sound': 'ws-audio',
}

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

export function AccessProvider({ children }: { children: ReactNode }) {
  const { activePersona } = usePersona()
  const { collections } = useUserCollections()
  const { tree: fileTree } = useFileTree()
  const [grants, setGrantsState] = useState<Grant[]>(() => {
    if (typeof window === 'undefined') return structuredClone(DEFAULT_GRANTS)
    try {
      const stored = localStorage.getItem('access-grants')
      if (stored) return JSON.parse(stored) as Grant[]
    } catch { /* fall through */ }
    return structuredClone(DEFAULT_GRANTS)
  })
  const setGrants: typeof setGrantsState = useCallback((action) => {
    setGrantsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      try { localStorage.setItem('access-grants', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>(() => structuredClone(DEFAULT_ROLE_GROUPS))
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
      walk(getDepartmentWorkspaceFiles(dept), dept)
      // Walk live tree (includes user-created folders)
      const deptRoot = fileTree.find(n => n.id === DEPARTMENT_WRAPPER_IDS[dept])
      if (deptRoot?.children) walk(deptRoot.children, dept, deptRoot.id)
    }
    return { nodeToDepartment: deptMap, nodeToParent: parentMap }
  }, [fileTree])

  const updateRoleGroup = useCallback((id: AccessProfileId, permissions: Permission[]) => {
    setRoleGroups((prev) =>
      prev.map((rg) => (rg.id === id ? { ...rg, permissions } : rg)),
    )
  }, [])

  const resetRoleGroups = useCallback(() => {
    setRoleGroups(structuredClone(DEFAULT_ROLE_GROUPS))
  }, [])

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

  // canAccess: check grants + implicit department access
  const canAccess = useCallback((id: string): boolean => {
    // Admin mode (null persona) → full access
    if (!activePersona) return true
    if (!userId) return false

    // Check explicit grants
    if (userHasAccess(userId, id, grants)) return true
    if (collectionAccessById.has(id)) return true
    if (collectionAssetAccessById.has(id)) return true

    // Check implicit department access for workspace items
    if (activePersona.departmentId && isDepartmentRole(activePersona.role)) {
      // Check if this is a department ID
      if (id === activePersona.departmentId) return true
      // Check if this is a department wrapper ID
      if (DEPARTMENT_WRAPPER_IDS[activePersona.departmentId] === id) return true
      // Check if this node belongs to the user's department
      const nodeDept = nodeToDepartment.get(id)
      if (nodeDept === activePersona.departmentId) return true
    }

    return false
  }, [activePersona, userId, grants, collectionAccessById, collectionAssetAccessById, nodeToDepartment])

  // filterByAccess: filter assets by persona access
  const filterByAccess = useCallback((assets: Asset[]): Asset[] => {
    if (!activePersona) return assets
    return assets.filter((asset) => {
      // Direct access via grants
      if (canAccess(asset.id)) return true
      // Department membership
      if (asset.department && activePersona.departmentId === asset.department && isDepartmentRole(activePersona.role)) return true
      // Source folder access
      if (asset.sourceFolderIds?.some((fid) => canAccess(fid))) return true
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

    // Department folders
    if (activePersona.departmentId && isDepartmentRole(activePersona.role)) {
      ids.add(activePersona.departmentId)
      ids.add(DEPARTMENT_WRAPPER_IDS[activePersona.departmentId])
      collectFolderIds(getDepartmentWorkspaceFiles(activePersona.departmentId)).forEach((id) => ids.add(id))
    }

    // Granted folder access
    for (const grant of grants) {
      if (grant.revokedAt) continue
      if (grant.resource.type !== 'folder') continue
      const isGrantee =
        (grant.principal.type === 'user' && grant.principal.userId === activePersona.id) ||
        (grant.principal.type === 'team' && activePersona.teamIds.some((tid) => tid === (grant.principal as { type: 'team'; teamId: string }).teamId))
      if (isGrantee) ids.add(grant.resource.id)
    }

    return ids
  }, [activePersona, grants])

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
    setGrants((prev) =>
      prev.map((g) =>
        g.resource.id === resourceId && !g.revokedAt
          ? { ...g, revokedAt: new Date().toISOString() }
          : g,
      ),
    )
  }, [])

  // New API
  const getPermission = useCallback((id: string): AccessProfileId | null => {
    if (!userId) return 'owner' // admin
    const explicitAccess = resolveAccess(userId, id, grants, roleGroups)
    if (explicitAccess.effectiveProfile) return explicitAccess.effectiveProfile
    if (collectionAccessById.has(id)) return collectionAccessById.get(id)?.templateId ?? null
    return collectionAssetAccessById.get(id)?.templateId ?? null
  }, [userId, grants, roleGroups, collectionAccessById, collectionAssetAccessById])

  const canEditFn = useCallback((id: string): boolean => {
    if (!activePersona) return true // admin
    if (!userId) return false
    const explicitAccess = resolveAccess(userId, id, grants, roleGroups)
    if (explicitAccess.canEdit) return true
    if (collectionAccessById.get(id)?.canEdit) return true
    return collectionAssetAccessById.get(id)?.canEdit ?? false
  }, [activePersona, userId, grants, roleGroups, collectionAccessById, collectionAssetAccessById])

  const getResourceGrants = useCallback((id: string): Grant[] => {
    return getResourceGrantsFromList(id, grants)
  }, [grants])

  const createGrant = useCallback((resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId) => {
    if (!userId) return
    const newGrant: Grant = {
      id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      resource,
      principal,
      templateId: profileId,
      permissions: getPermissionsForProfile(profileId, roleGroups),
      grantedByUserId: userId,
      grantedAt: new Date().toISOString().slice(0, 10),
    }
    setGrants((prev) => [...prev, newGrant])
  }, [userId, roleGroups])

  const revokeGrant = useCallback((grantId: string) => {
    setGrants((prev) =>
      prev.map((g) =>
        g.id === grantId && !g.revokedAt
          ? { ...g, revokedAt: new Date().toISOString() }
          : g,
      ),
    )
  }, [])

  // Project-level grants
  const projectUserGrants = useMemo(() => getProjectUserGrantsFromList(grants), [grants])
  const projectTeamGrants = useMemo(() => getProjectTeamGrantsFromList(grants), [grants])

  const createProjectGrant = useCallback((principal: PrincipalRef, profileId: AccessProfileId) => {
    if (!userId) return
    const newGrant: Grant = {
      id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      resource: PROJECT_RESOURCE,
      principal,
      templateId: profileId,
      permissions: getPermissionsForProfile(profileId, roleGroups),
      grantedByUserId: userId,
      grantedAt: new Date().toISOString().slice(0, 10),
    }
    setGrants((prev) => [...prev, newGrant])
  }, [userId, roleGroups])

  const updateGrantProfile = useCallback((grantId: string, profileId: AccessProfileId) => {
    setGrants((prev) =>
      prev.map((g) => (
        g.id === grantId
          ? {
              ...g,
              templateId: profileId,
              permissions: getPermissionsForProfile(profileId, roleGroups),
            }
          : g
      )),
    )
  }, [roleGroups])

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

  // Sharing authority — only manager/artist roles can create grants
  const canShareFn = useCallback((): boolean => {
    if (!activePersona) return false
    return activePersona.role === 'manager' || activePersona.role === 'artist'
  }, [activePersona])

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
    createGrant,
    revokeGrant,
    grants,
    projectUserGrants,
    projectTeamGrants,
    createProjectGrant,
    updateGrantProfile,
    roleGroups,
    updateRoleGroup,
    resetRoleGroups,
    getInheritedGrants,
    getCollectionRippleGrants,
    canShare: canShareFn,
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
    createGrant,
    revokeGrant,
    grants,
    projectUserGrants,
    projectTeamGrants,
    createProjectGrant,
    updateGrantProfile,
    roleGroups,
    updateRoleGroup,
    resetRoleGroups,
    getInheritedGrants,
    getCollectionRippleGrants,
    canShareFn,
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
