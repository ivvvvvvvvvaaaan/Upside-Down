'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { usePersona } from './usePersona'
import type { DomainId, ProductionDomainId } from '@/components/department/types'
import {
  getFinderWorkspaceTree,
  findNodeInTree,
  DOMAIN_FOLDER_MAP,
  type ReferenceFolderSource,
  type FileReference,
  type UnifiedFileNode,
  type WorkspaceFileNode,
} from '@/lib/workspace-data'
import { SEED_VERSION } from '@/lib/constants'
import { assignSharedMountOwner, filterSharedMountsForViewer } from '@/lib/shared-mount-utils'
import { generateAssetInstances, promotedInstanceToAsset } from '@/lib/asset-instances'
import { seedCutToAsset } from '@/lib/cuts'
import { buildCuts } from '@/lib/scenario'
import type { Asset } from '@/lib/data'
import type { UserCollection } from './useUserCollections'

const STORAGE_KEY = 'unified-workspace-files'
const VERSION_KEY = 'unified-workspace-files-version'

function loadTree(mountedByUserId: string | null): { tree: UnifiedFileNode[]; didMigrate: boolean } {
  if (typeof window === 'undefined') {
    return { tree: getFinderWorkspaceTree(), didMigrate: false }
  }
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY)
    if (storedVersion === String(SEED_VERSION)) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as UnifiedFileNode[]
        const migrated = assignSharedMountOwner(parsed, mountedByUserId)
        return { tree: migrated.nodes, didMigrate: migrated.didChange }
      }
    } else {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(VERSION_KEY, String(SEED_VERSION))
    }
  } catch {}
  return { tree: getFinderWorkspaceTree(), didMigrate: false }
}

function persistTree(tree: UnifiedFileNode[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree))
    localStorage.setItem(VERSION_KEY, String(SEED_VERSION))
  } catch {}
}

/** Domain ID to wrapper folder ID, derived from DOMAIN_FOLDER_MAP */
const DOMAIN_TO_FOLDER_ID: Record<ProductionDomainId, string> = Object.fromEntries(
  (Object.entries(DOMAIN_FOLDER_MAP) as [ProductionDomainId, { id: string }][])
    .map(([domainId, folder]) => [domainId, folder.id]),
) as Record<ProductionDomainId, string>


function generateId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function addNodeToTree(
  nodes: UnifiedFileNode[],
  parentId: string | null,
  newNode: UnifiedFileNode,
): UnifiedFileNode[] {
  if (parentId === null) return [...nodes, newNode]
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), newNode] }
    }
    if (node.children) {
      return { ...node, children: addNodeToTree(node.children, parentId, newNode) }
    }
    return node
  })
}

function upsertNodeInTree(
  nodes: UnifiedFileNode[],
  parentId: string | null,
  newNode: UnifiedFileNode,
  matcher: (node: UnifiedFileNode) => boolean,
): UnifiedFileNode[] {
  const upsert = (children: UnifiedFileNode[]) => {
    const existingIndex = children.findIndex(matcher)
    if (existingIndex === -1) return [...children, newNode]

    return children.map((child, index) => (
      index === existingIndex
        ? { ...child, ...newNode, id: child.id }
        : child
    ))
  }

  if (parentId === null) return upsert(nodes)
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: upsert(node.children ?? []) }
    }
    if (node.children) {
      return { ...node, children: upsertNodeInTree(node.children, parentId, newNode, matcher) }
    }
    return node
  })
}

function renameNodeInTree(
  nodes: UnifiedFileNode[],
  nodeId: string,
  newName: string,
): UnifiedFileNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, name: newName, modifiedAt: new Date().toISOString().split('T')[0] }
    }
    if (node.children) {
      return { ...node, children: renameNodeInTree(node.children, nodeId, newName) }
    }
    return node
  })
}

function toggleManagedZoneInTree(
  nodes: UnifiedFileNode[],
  nodeId: string,
): UnifiedFileNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId && node.type === 'folder') {
      return {
        ...node,
        zone: node.zone === 'wip' ? 'managed' : 'wip',
      }
    }
    if (node.children) {
      return { ...node, children: toggleManagedZoneInTree(node.children, nodeId) }
    }
    return node
  })
}

function deleteNodeFromTree(
  nodes: UnifiedFileNode[],
  nodeId: string,
): UnifiedFileNode[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => {
      if (node.children) {
        return { ...node, children: deleteNodeFromTree(node.children, nodeId) }
      }
      return node
    })
}

/** Check if a node (by id) is a descendant of a folder (by id) in a tree */
function isDescendantOf(nodes: UnifiedFileNode[], nodeId: string, ancestorId: string): boolean {
  const ancestor = findNodeInTree(nodes, ancestorId)
  if (!ancestor || !ancestor.children) return false
  return findNodeInTree(ancestor.children, nodeId) !== null
}

function moveNodeInTree(
  nodes: UnifiedFileNode[],
  nodeId: string,
  targetParentId: string,
): UnifiedFileNode[] {
  // First, extract the node
  const node = findNodeInTree(nodes, nodeId)
  if (!node) return nodes

  // Remove from current location
  const treeWithout = deleteNodeFromTree(nodes, nodeId)

  // Add to target
  return addNodeToTree(treeWithout, targetParentId, { ...node, modifiedAt: new Date().toISOString().split('T')[0] })
}

function findSubtree(nodes: UnifiedFileNode[], id: string): UnifiedFileNode[] | null {
  for (const node of nodes) {
    if (node.id === id) return node.children ?? []
    if (node.children) {
      const found = findSubtree(node.children, id)
      if (found) return found
    }
  }
  return null
}

/** Collect all file nodes under a folder, recursively */
function collectFileNodes(nodes: UnifiedFileNode[]): UnifiedFileNode[] {
  const files: UnifiedFileNode[] = []
  for (const node of nodes) {
    if (node.type === 'file') files.push(node)
    if (node.children) files.push(...collectFileNodes(node.children))
  }
  return files
}

function findReferenceFolder(
  nodes: UnifiedFileNode[],
  parentId: string | null,
  reference: ReferenceFolderSource,
  mountedByUserId: string | null,
): UnifiedFileNode | null {
  const matchesReference = (node: UnifiedFileNode) =>
    node.type === 'folder'
    && node.reference?.resourceId === reference.resourceId
    && node.reference?.resourceType === reference.resourceType
    && (node.mountedByUserId ?? null) === mountedByUserId

  if (parentId === null) {
    return nodes.find(matchesReference) ?? null
  }

  for (const node of nodes) {
    if (node.id === parentId) {
      return (node.children ?? []).find(matchesReference) ?? null
    }
    if (node.children) {
      const found = findReferenceFolder(node.children, parentId, reference, mountedByUserId)
      if (found) return found
    }
  }

  return null
}


export type MoveImpactShare = { id: string; name: string; grantCount: number }

export type MoveImpact = {
  impactedFolders: MoveImpactShare[]
}

interface FileTreeContextValue {
  tree: UnifiedFileNode[]
  getDomainFiles: (id: DomainId) => WorkspaceFileNode[]
  createFolder: (parentId: string | null, name: string, children?: UnifiedFileNode[]) => string
  createFile: (parentId: string, name: string, extension?: string) => string
  createReferenceFolder: (parentId: string | null, name: string, reference: ReferenceFolderSource) => string
  toggleManagedZone: (folderId: string) => void
  renameNode: (nodeId: string, newName: string) => void
  deleteNode: (nodeId: string) => void
  /** Analyze impact of moving a node — which shared folders would be affected */
  getMoveImpact: (nodeId: string, sharedFolders: { id: string; name: string }[], getGrantCount: (folderId: string) => number) => MoveImpact
  /** Execute a move operation */
  confirmMove: (nodeId: string, targetParentId: string) => void
  /** Create a file reference (same asset, different location) */
  createFileReference: (sourceFileId: string, targetParentId: string) => string | null
  /** Get all file nodes under a folder from the live tree (recursive) */
  getFileNodesForFolder: (folderId: string) => UnifiedFileNode[]
  // --- Derived asset index (single source of truth) ---
  /** All assets derived from the live file tree + cuts */
  allAssets: Asset[]
  /** O(1) asset lookup by ID */
  assetById: Map<string, Asset>
  /** Resolve asset IDs for a collection from the live tree */
  resolveCollectionAssetIds: (collection: UserCollection) => string[]
  /** Resolve full Asset objects for a collection from the live tree */
  resolveCollectionAssets: (collection: UserCollection) => Asset[]
  /** Look up assets by ID from the live index */
  getAssetsByIds: (ids: string[]) => Asset[]
  /** Recent assets sorted by date */
  getRecentAssets: (limit?: number) => Asset[]
}

const FileTreeContext = createContext<FileTreeContextValue | null>(null)

export function FileTreeProvider({ children }: { children: ReactNode }) {
  const { activePersona, hydrated } = usePersona()
  const [rawTree, setRawTree] = useState<UnifiedFileNode[]>(getFinderWorkspaceTree)

  useEffect(() => {
    if (!hydrated) return

    const loaded = loadTree(activePersona?.id ?? null)
    setRawTree(loaded.tree)
    if (loaded.didMigrate) {
      persistTree(loaded.tree)
    }

    // Sync across windows/iframes (desktop Finder ↔ browser)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as UnifiedFileNode[]
          const migrated = assignSharedMountOwner(parsed, activePersona?.id ?? null)
          setRawTree(migrated.nodes)
          if (migrated.didChange) {
            persistTree(migrated.nodes)
          }
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [hydrated, activePersona?.id])

  const updateTree = useCallback((updater: (prev: UnifiedFileNode[]) => UnifiedFileNode[]) => {
    setRawTree((prev) => {
      const next = updater(prev)
      persistTree(next)
      return next
    })
  }, [])

  const tree = useMemo(
    () => filterSharedMountsForViewer(rawTree, activePersona?.id ?? null),
    [rawTree, activePersona?.id],
  )

  const getDomainFiles = useCallback((id: DomainId): WorkspaceFileNode[] => {
    const folderId = (DOMAIN_TO_FOLDER_ID as Partial<Record<DomainId, string>>)[id]
    if (!folderId) return []
    return (findSubtree(rawTree, folderId) ?? []) as WorkspaceFileNode[]
  }, [rawTree])

  // --- Derived asset index: single source of truth for all Asset objects ---
  const { assetById, allAssets } = useMemo(() => {
    const assets: Asset[] = []
    const domains = Object.keys(DOMAIN_TO_FOLDER_ID) as ProductionDomainId[]
    for (const domainId of domains) {
      const folderId = DOMAIN_TO_FOLDER_ID[domainId]
      const children = findSubtree(rawTree, folderId)
      if (!children) continue
      const instances = generateAssetInstances(children as WorkspaceFileNode[], domainId)
      assets.push(...instances.map(promotedInstanceToAsset))
    }
    // Merge cut assets (not from file tree)
    const cutAssets = buildCuts().map(c => seedCutToAsset(c))
    const all = [...assets, ...cutAssets]
    const byId = new Map(all.map(a => [a.id, a]))
    return { assetById: byId, allAssets: all }
  }, [rawTree])

  const getAssetsByIdsFromTree = useCallback((ids: string[]): Asset[] => {
    return ids.map(id => assetById.get(id)).filter((a): a is Asset => a != null)
  }, [assetById])

  const resolveCollectionAssetIdsFromTree = useCallback((collection: UserCollection): string[] => {
    return collection.assetIds
  }, [])

  const resolveCollectionAssetsFromTree = useCallback((collection: UserCollection): Asset[] => {
    return getAssetsByIdsFromTree(resolveCollectionAssetIdsFromTree(collection))
  }, [getAssetsByIdsFromTree, resolveCollectionAssetIdsFromTree])

  const getRecentAssetsFromTree = useCallback((limit: number = 12): Asset[] => {
    return [...allAssets]
      .sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0
        const db = b.created_at ? new Date(b.created_at).getTime() : 0
        return db - da
      })
      .slice(0, limit)
  }, [allAssets])

  const createFolder = useCallback((parentId: string | null, name: string, initialChildren?: UnifiedFileNode[]): string => {
    const id = generateId()
    const newFolder: UnifiedFileNode = {
      id,
      name,
      type: 'folder',
      modifiedAt: new Date().toISOString().split('T')[0],
      children: initialChildren ?? [],
    }
    updateTree((prev) => addNodeToTree(prev, parentId, newFolder))
    return id
  }, [updateTree])

  const createFile = useCallback((parentId: string, name: string, extension?: string): string => {
    const id = generateId()
    const ext = extension ?? name.split('.').pop() ?? ''
    const newFile: UnifiedFileNode = {
      id,
      name,
      type: 'file',
      extension: ext,
      size: Math.floor(Math.random() * 50000000) + 1000000,
      modifiedAt: new Date().toISOString().split('T')[0],
    }
    updateTree((prev) => addNodeToTree(prev, parentId, newFile))
    return id
  }, [updateTree])

  const createReferenceFolder = useCallback((
    parentId: string | null,
    name: string,
    reference: ReferenceFolderSource,
  ): string => {
    const mountedByUserId = activePersona?.id ?? null
    const existing = findReferenceFolder(rawTree, parentId, reference, mountedByUserId)
    const id = existing?.id ?? generateId()
    const newFolder: UnifiedFileNode = {
      id,
      name,
      type: 'folder',
      modifiedAt: new Date().toISOString().split('T')[0],
      mountedByUserId,
      reference,
      children: [],
    }

    updateTree((prev) => upsertNodeInTree(
      prev,
      parentId,
      newFolder,
      (node) => node.id === existing?.id,
    ))

    return id
  }, [activePersona, rawTree, updateTree])

  const toggleManagedZone = useCallback((folderId: string) => {
    updateTree((prev) => toggleManagedZoneInTree(prev, folderId))
  }, [updateTree])

  const renameNode = useCallback((nodeId: string, newName: string) => {
    updateTree((prev) => renameNodeInTree(prev, nodeId, newName))
  }, [updateTree])

  const deleteNode = useCallback((nodeId: string) => {
    updateTree((prev) => deleteNodeFromTree(prev, nodeId))
  }, [updateTree])

  const getMoveImpact = useCallback((
    nodeId: string,
    sharedFolders: { id: string; name: string }[],
    getGrantCount: (folderId: string) => number,
  ): MoveImpact => {
    const impactedFolders: MoveImpactShare[] = []
    for (const folder of sharedFolders) {
      if (isDescendantOf(tree, nodeId, folder.id)) {
        const grantCount = getGrantCount(folder.id)
        if (grantCount > 0) {
          impactedFolders.push({
            id: folder.id,
            name: folder.name,
            grantCount,
          })
        }
      }
    }
    return { impactedFolders }
  }, [tree])

  const confirmMove = useCallback((nodeId: string, targetParentId: string) => {
    updateTree((prev) => moveNodeInTree(prev, nodeId, targetParentId))
  }, [updateTree])

  const createFileReference = useCallback((sourceFileId: string, targetParentId: string): string | null => {
    const sourceNode = findNodeInTree(rawTree, sourceFileId)
    if (!sourceNode || sourceNode.type !== 'file') return null
    const refId = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const refNode: UnifiedFileNode = {
      id: refId,
      name: sourceNode.name,
      type: 'file',
      extension: sourceNode.extension,
      size: sourceNode.size,
      modifiedAt: sourceNode.modifiedAt,
      modifiedBy: sourceNode.modifiedBy,
      fileRef: {
        sourceFileId: sourceNode.fileRef?.sourceFileId ?? sourceNode.id,
        sourceDomainId: sourceNode.domainId,
      },
    }
    const srcId = refNode.fileRef!.sourceFileId
    updateTree((prev) => upsertNodeInTree(
      prev,
      targetParentId,
      refNode,
      (node) => node.fileRef?.sourceFileId === srcId,
    ))
    return refId
  }, [rawTree, updateTree])

  const getFileNodesForFolder = useCallback((folderId: string): UnifiedFileNode[] => {
    const children = findSubtree(rawTree, folderId)
    if (!children) return []
    return collectFileNodes(children)
  }, [rawTree])

  const value = useMemo<FileTreeContextValue>(() => ({
    tree,
    getDomainFiles,
    createFolder,
    createFile,
    createReferenceFolder,
    toggleManagedZone,
    renameNode,
    deleteNode,
    getMoveImpact,
    confirmMove,
    createFileReference,
    getFileNodesForFolder,
    allAssets,
    assetById,
    resolveCollectionAssetIds: resolveCollectionAssetIdsFromTree,
    resolveCollectionAssets: resolveCollectionAssetsFromTree,
    getAssetsByIds: getAssetsByIdsFromTree,
    getRecentAssets: getRecentAssetsFromTree,
  }), [tree, getDomainFiles, createFolder, createFile, createReferenceFolder, toggleManagedZone, renameNode, deleteNode, getMoveImpact, confirmMove, createFileReference, getFileNodesForFolder, allAssets, assetById, resolveCollectionAssetIdsFromTree, resolveCollectionAssetsFromTree, getAssetsByIdsFromTree, getRecentAssetsFromTree])

  return (
    <FileTreeContext.Provider value={value}>
      {children}
    </FileTreeContext.Provider>
  )
}

export function useFileTree(): FileTreeContextValue {
  const context = useContext(FileTreeContext)
  if (!context) {
    throw new Error('useFileTree must be used within a FileTreeProvider')
  }
  return context
}
