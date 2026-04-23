import type { DomainId } from '@/components/department/types'
import type { Team } from '@/lib/teams'
import type { UnifiedFileNode } from '@/lib/workspace-data'
import { DOMAIN_FOLDER_MAP, isReferenceFolder } from '@/lib/workspace-data'
import type { User } from '@/lib/personas'
import type { ReleaseDomain } from '@/lib/scenario'
import type {
  AccessProfileId,
  Block,
  Grant,
  Permission,
  PrincipalMatchKind,
  ResourceRef,
  RoleGroup,
} from '@/lib/grants'
import {
  DEFAULT_ROLE_GROUPS,
  getGrantPermissions,
  getPermissionsForProfile,
  matchPrincipalToUser,
  mostPermissiveProfile,
} from '@/lib/grants'

export type AccessCollection = {
  id: string
  name?: string
  assetIds: string[]
  createdBy?: string
}

export type AccessPathKind =
  | 'admin'
  | 'direct'
  | 'team'
  | 'release'
  | 'folder'
  | 'collection'
  | 'owner'
  | 'project'
  | 'reference'

export type AccessPathScope =
  | 'direct'
  | 'folder-inherited'
  | 'collection-live'
  | 'collection-snapshot'
  | 'release'
  | 'owner'
  | 'reference'

export type AccessPath = {
  kind: AccessPathKind
  scope: AccessPathScope
  permissions: Permission[]
  profile: AccessProfileId | null
  grantId?: string
  sourceResourceId: string
  sourceLabel?: string
}

export type AccessDeniedReason =
  | 'block'
  | 'project-lock'
  | 'sensitive-media'
  | 'no-open-permission'

export type AccessDecision = {
  allowed: boolean
  permissions: Permission[]
  effectiveProfile: AccessProfileId | null
  paths: AccessPath[]
  deniedBy?: AccessDeniedReason
}

export type AccessEngineSharedContext = {
  users: User[]
  blocks?: Block[]
  roleGroups?: RoleGroup[]
  teams: Team[]
  releaseDomains: ReleaseDomain[]
  fileTree: UnifiedFileNode[]
  collections: AccessCollection[]
  resolveCollectionAssetIds?: (collection: AccessCollection) => string[]
  sensitiveResourceIds?: Set<string>
  projectLocked?: boolean
  isProductionDomain?: (domainId: DomainId) => boolean
  currentDate?: string
}

export type AccessEngineRuntimeContext = {
  user: User | null
  grants: Grant[]
}

export type AccessEngineContext = AccessEngineSharedContext & AccessEngineRuntimeContext

type ResolveOptions = {
  includeCollectionPaths?: boolean
  enforceSensitiveMedia?: boolean
}

type TreeIndex = {
  nodeById: Map<string, UnifiedFileNode>
  parentById: Map<string, string>
  domainById: Map<string, DomainId>
}

export type PreparedAccessEngineContext = {
  users: User[]
  userById: Map<string, User>
  blocks: Block[]
  roleGroups: RoleGroup[]
  teams: Team[]
  teamById: Map<string, Team>
  releaseDomains: ReleaseDomain[]
  releaseDomainById: Map<string, ReleaseDomain>
  nodeById: Map<string, UnifiedFileNode>
  parentById: Map<string, string>
  domainById: Map<string, DomainId>
  collections: AccessCollection[]
  collectionById: Map<string, AccessCollection>
  collectionAssetIdsById: Map<string, string[]>
  collectionIdsByAssetId: Map<string, string[]>
  sensitiveResourceIds: Set<string>
  projectLocked?: boolean
  isProductionDomain?: (domainId: DomainId) => boolean
  currentDate: string
}

type AccessEngineInstance = {
  resolve: (resource: ResourceRef, options?: ResolveOptions) => AccessDecision
  activeGrants: Grant[]
  getResourceDomainId: (resource: ResourceRef) => DomainId | undefined
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

const DEFAULT_OPTIONS: Required<ResolveOptions> = {
  includeCollectionPaths: true,
  enforceSensitiveMedia: true,
}

function uniquePermissions(permissions: Permission[]): Permission[] {
  return Array.from(new Set(permissions))
}

function isGrantActiveAt(grant: Grant, currentDate: string): boolean {
  if (grant.revokedAt) return false
  if (grant.expiresAt && grant.expiresAt < currentDate) return false
  return true
}

function buildTreeIndex(fileTree: UnifiedFileNode[]): TreeIndex {
  const nodeById = new Map<string, UnifiedFileNode>()
  const parentById = new Map<string, string>()
  const domainById = new Map<string, DomainId>()
  const rootIdToDomain = new Map(
    (Object.entries(DOMAIN_FOLDER_MAP) as [DomainId, { id: string }][]).map(([domainId, folder]) => [folder.id, domainId]),
  )

  const walk = (nodes: UnifiedFileNode[], domainId?: DomainId, parentId?: string) => {
    for (const node of nodes) {
      nodeById.set(node.id, node)
      if (parentId) parentById.set(node.id, parentId)

      const nextDomainId = rootIdToDomain.get(node.id) ?? domainId ?? node.domainId
      if (nextDomainId) domainById.set(node.id, nextDomainId)

      if (node.children) walk(node.children, nextDomainId, node.id)
    }
  }

  walk(fileTree)
  return { nodeById, parentById, domainById }
}

function mergePaths(paths: AccessPath[]): Pick<AccessDecision, 'permissions' | 'effectiveProfile'> {
  return {
    permissions: uniquePermissions(paths.flatMap((path) => path.permissions)),
    effectiveProfile: paths.reduce<AccessProfileId | null>(
      (current, path) => mostPermissiveProfile(current, path.profile),
      null,
    ),
  }
}

function matchUserOnGrant(
  grant: Grant,
  userId: string,
  teams: Team[],
  releaseDomains: ReleaseDomain[],
): PrincipalMatchKind | null {
  return matchPrincipalToUser(grant.principal, userId, teams, releaseDomains)
}

function pathForGrant(
  grant: Grant,
  kind: AccessPathKind,
  scope: AccessPathScope,
  roleGroups: RoleGroup[],
  sourceResourceId: string = grant.resource.id,
  sourceLabel?: string,
): AccessPath {
  return {
    kind,
    scope,
    grantId: grant.id,
    sourceResourceId,
    sourceLabel,
    profile: grant.templateId ?? null,
    permissions: getGrantPermissions(grant, roleGroups),
  }
}

function getParentIds(resourceId: string, parentById: Map<string, string>): string[] {
  const parentIds: string[] = []
  let parentId = parentById.get(resourceId)
  while (parentId) {
    parentIds.push(parentId)
    parentId = parentById.get(parentId)
  }
  return parentIds
}

function appendToListMap(map: Map<string, string[]>, key: string, value: string) {
  const existing = map.get(key)
  if (existing) {
    existing.push(value)
    return
  }
  map.set(key, [value])
}

export function prepareAccessEngineContext(context: AccessEngineSharedContext): PreparedAccessEngineContext {
  const roleGroups = context.roleGroups ?? DEFAULT_ROLE_GROUPS
  const blocks = context.blocks ?? []
  const sensitiveResourceIds = context.sensitiveResourceIds ?? new Set<string>()
  const currentDate = context.currentDate ?? new Date().toISOString().slice(0, 10)
  const { nodeById, parentById, domainById } = buildTreeIndex(context.fileTree)
  const collectionById = new Map(context.collections.map((collection) => [collection.id, collection]))
  const collectionAssetIdsById = new Map<string, string[]>()
  const collectionIdsByAssetId = new Map<string, string[]>()

  for (const collection of context.collections) {
    const assetIds = context.resolveCollectionAssetIds?.(collection) ?? collection.assetIds
    collectionAssetIdsById.set(collection.id, assetIds)
    for (const assetId of assetIds) {
      appendToListMap(collectionIdsByAssetId, assetId, collection.id)
    }
  }

  return {
    users: context.users,
    userById: new Map(context.users.map((user) => [user.id, user])),
    blocks,
    roleGroups,
    teams: context.teams,
    teamById: new Map(context.teams.map((team) => [team.id, team])),
    releaseDomains: context.releaseDomains,
    releaseDomainById: new Map(context.releaseDomains.map((domain) => [domain.id, domain])),
    nodeById,
    parentById,
    domainById,
    collections: context.collections,
    collectionById,
    collectionAssetIdsById,
    collectionIdsByAssetId,
    sensitiveResourceIds,
    projectLocked: context.projectLocked,
    isProductionDomain: context.isProductionDomain,
    currentDate,
  }
}

export function createAccessEngine(
  preparedContext: PreparedAccessEngineContext,
  runtime: AccessEngineRuntimeContext,
): AccessEngineInstance {
  const activeGrants = runtime.grants.filter((grant) => isGrantActiveAt(grant, preparedContext.currentDate))
  const grantsByResourceId = new Map<string, Grant[]>()
  const snapshotCollectionIdsByAssetId = new Map<string, string[]>()
  for (const grant of activeGrants) {
    const existing = grantsByResourceId.get(grant.resource.id)
    if (existing) {
      existing.push(grant)
    } else {
      grantsByResourceId.set(grant.resource.id, [grant])
    }

    if (grant.resource.type === 'collection' && grant.shareMode === 'snapshot' && grant.snapshotAssetIds) {
      for (const assetId of grant.snapshotAssetIds) {
        appendToListMap(snapshotCollectionIdsByAssetId, assetId, grant.resource.id)
      }
    }
  }

  const isBlocked = (userId: string, resourceId: string): boolean => {
    return preparedContext.blocks.some((block) => block.userId === userId && block.resourceId === resourceId)
  }

  const getResourceDomainId = (resource: ResourceRef): DomainId | undefined => {
    return resource.domainId ?? preparedContext.domainById.get(resource.id)
  }

  const createResolver = (user: User | null) => {
    const resolve = (resource: ResourceRef, options?: ResolveOptions): AccessDecision => {
      const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }

      if (!user) {
        return {
          allowed: true,
          permissions: [...ALL_PERMISSIONS],
          effectiveProfile: 'manager',
          paths: [{
            kind: 'admin',
            scope: 'direct',
            sourceResourceId: resource.id,
            profile: 'manager',
            permissions: [...ALL_PERMISSIONS],
          }],
        }
      }

      if (preparedContext.projectLocked) {
        const domainId = user.domainId
        if (!domainId || !preparedContext.isProductionDomain?.(domainId)) {
          return {
            allowed: false,
            permissions: [],
            effectiveProfile: null,
            paths: [],
            deniedBy: 'project-lock',
          }
        }
      }

      if (isBlocked(user.id, resource.id)) {
        return {
          allowed: false,
          permissions: [],
          effectiveProfile: null,
          paths: [],
          deniedBy: 'block',
        }
      }

      if (user.isAdmin) {
        return {
          allowed: true,
          permissions: [...ALL_PERMISSIONS],
          effectiveProfile: 'manager',
          paths: [{
            kind: 'admin',
            scope: 'direct',
            sourceResourceId: resource.id,
            profile: 'manager',
            permissions: [...ALL_PERMISSIONS],
          }],
        }
      }

      const referenceNode = preparedContext.nodeById.get(resource.id)
      if (isReferenceFolder(referenceNode)) {
        const referenced = resolve({
          id: referenceNode.reference.resourceId,
          type: referenceNode.reference.resourceType,
          domainId: referenceNode.reference.domainId,
        }, resolvedOptions)

        return {
          ...referenced,
          paths: referenced.paths.map((path) => ({
            ...path,
            kind: path.kind === 'admin' ? path.kind : 'reference',
            scope: 'reference',
            sourceResourceId: referenceNode.reference.resourceId,
          })),
        }
      }

      const paths: AccessPath[] = []

      if (
        preparedContext.nodeById.has(resource.id)
        && !preparedContext.domainById.has(resource.id)
        && !preparedContext.parentById.has(resource.id)
      ) {
        paths.push({
          kind: 'owner',
          scope: 'owner',
          sourceResourceId: resource.id,
          profile: 'manager',
          permissions: getPermissionsForProfile('manager', preparedContext.roleGroups),
        })
      }

      const collection = preparedContext.collectionById.get(resource.id)
      if (collection?.createdBy && collection.createdBy === user.email) {
        paths.push({
          kind: 'owner',
          scope: 'owner',
          sourceResourceId: collection.id,
          sourceLabel: collection.name,
          profile: 'manager',
          permissions: getPermissionsForProfile('manager', preparedContext.roleGroups),
        })
      }

      for (const grant of grantsByResourceId.get(resource.id) ?? []) {
        const kind = matchUserOnGrant(grant, user.id, preparedContext.teams, preparedContext.releaseDomains)
        if (!kind) continue
        const scope = kind === 'release' ? 'release' : 'direct'
        paths.push(pathForGrant(
          grant,
          resource.type === 'project' ? 'project' : kind,
          scope,
          preparedContext.roleGroups,
        ))
      }

      for (const parentId of getParentIds(resource.id, preparedContext.parentById)) {
        if (isBlocked(user.id, parentId)) continue
        for (const grant of grantsByResourceId.get(parentId) ?? []) {
          const kind = matchUserOnGrant(grant, user.id, preparedContext.teams, preparedContext.releaseDomains)
          if (!kind) continue
          paths.push(pathForGrant(grant, 'folder', 'folder-inherited', preparedContext.roleGroups, parentId))
        }
      }

      const domainId = getResourceDomainId(resource)
      const domainRoot = domainId ? DOMAIN_FOLDER_MAP[domainId] : undefined
      if (
        domainRoot
        && resource.id !== domainRoot.id
        && !preparedContext.nodeById.has(resource.id)
        && !preparedContext.parentById.has(resource.id)
      ) {
        for (const grant of grantsByResourceId.get(domainRoot.id) ?? []) {
          const kind = matchUserOnGrant(grant, user.id, preparedContext.teams, preparedContext.releaseDomains)
          if (!kind) continue
          paths.push(pathForGrant(
            grant,
            'folder',
            'folder-inherited',
            preparedContext.roleGroups,
            domainRoot.id,
            domainRoot.name,
          ))
        }
      }

      if (resolvedOptions.includeCollectionPaths && resource.type !== 'collection' && resource.type !== 'smart-collection') {
        const candidateCollectionIds = Array.from(new Set([
          ...(preparedContext.collectionIdsByAssetId.get(resource.id) ?? []),
          ...(snapshotCollectionIdsByAssetId.get(resource.id) ?? []),
        ]))

        for (const collectionId of candidateCollectionIds) {
          const candidateCollection = preparedContext.collectionById.get(collectionId)
          if (!candidateCollection) continue

          const ownerCanUseCollection =
            candidateCollection.createdBy === user.email
            && !isBlocked(user.id, candidateCollection.id)

          if (ownerCanUseCollection) {
            const ownerDecision = resolve(resource, {
              ...resolvedOptions,
              includeCollectionPaths: false,
              enforceSensitiveMedia: false,
            })

            if (ownerDecision.allowed) {
              paths.push({
                kind: 'collection',
                scope: 'collection-live',
                sourceResourceId: candidateCollection.id,
                sourceLabel: candidateCollection.name,
                profile: ownerDecision.effectiveProfile,
                permissions: ownerDecision.permissions,
              })
            }
          }

          for (const grant of grantsByResourceId.get(candidateCollection.id) ?? []) {
            if (isBlocked(user.id, grant.resource.id)) continue
            const kind = matchUserOnGrant(grant, user.id, preparedContext.teams, preparedContext.releaseDomains)
            if (!kind) continue

            const scopedAssetIds = grant.shareMode === 'snapshot' && grant.snapshotAssetIds
              ? grant.snapshotAssetIds
              : preparedContext.collectionAssetIdsById.get(candidateCollection.id) ?? candidateCollection.assetIds
            if (!scopedAssetIds.includes(resource.id)) continue

            const sharer = preparedContext.userById.get(grant.grantedByUserId)
            if (!sharer) continue

            const sharerDecision = createResolver(sharer).resolve(resource, {
              ...resolvedOptions,
              includeCollectionPaths: false,
              enforceSensitiveMedia: false,
            })
            if (!sharerDecision.allowed) continue

            const grantedPermissions = getGrantPermissions(grant, preparedContext.roleGroups)
            const cappedPermissions = grantedPermissions.filter((permission) =>
              sharerDecision.permissions.includes(permission),
            )
            if (!cappedPermissions.includes('open')) continue

            paths.push({
              kind: 'collection',
              scope: grant.shareMode === 'snapshot' ? 'collection-snapshot' : 'collection-live',
              grantId: grant.id,
              sourceResourceId: candidateCollection.id,
              sourceLabel: candidateCollection.name,
              profile: grant.templateId ?? null,
              permissions: cappedPermissions,
            })
          }
        }
      }

      const merged = mergePaths(paths)
      const allowedByPermission = merged.permissions.includes('open')

      if (
        allowedByPermission
        && resolvedOptions.enforceSensitiveMedia
        && preparedContext.sensitiveResourceIds.has(resource.id)
        && user.sensitiveMediaCapability !== true
      ) {
        return {
          allowed: false,
          permissions: [],
          effectiveProfile: null,
          paths,
          deniedBy: 'sensitive-media',
        }
      }

      return {
        allowed: allowedByPermission,
        permissions: merged.permissions,
        effectiveProfile: merged.effectiveProfile,
        paths,
        deniedBy: allowedByPermission ? undefined : 'no-open-permission',
      }
    }

    return { resolve }
  }

  return {
    resolve: createResolver(runtime.user).resolve,
    activeGrants,
    getResourceDomainId,
  }
}
