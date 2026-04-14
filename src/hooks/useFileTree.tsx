'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { usePersona } from './usePersona'
import type { DomainId, ProductionDomainId } from '@/components/department/types'
import {
  getFinderWorkspaceTree,
  type ReferenceFolderSource,
  type FileReference,
  type UnifiedFileNode,
  type WorkspaceFileNode,
} from '@/lib/workspace-data'
import { SEED_VERSION } from '@/lib/constants'
import { assignSharedMountOwner, filterSharedMountsForViewer } from '@/lib/shared-mount-utils'

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

/** Map workspace domain IDs to their wrapper folder IDs in the Finder tree */
const DOMAIN_TO_FOLDER_ID: Record<ProductionDomainId, string> = {
  'art-design': 'ws-art',
  'vfx': 'ws-vfx',
  'camera': 'ws-camera',
  'editorial': 'ws-editorial',
  'audio-sound': 'ws-audio',
}

// --- Tree helpers ---

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

function findNodeInUnifiedTree(nodes: UnifiedFileNode[], id: string): UnifiedFileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeInUnifiedTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

/** Check if a node (by id) is a descendant of a folder (by id) in a tree */
function isDescendantOf(nodes: UnifiedFileNode[], nodeId: string, ancestorId: string): boolean {
  const ancestor = findNodeInUnifiedTree(nodes, ancestorId)
  if (!ancestor || !ancestor.children) return false
  return findNodeInUnifiedTree(ancestor.children, nodeId) !== null
}

function moveNodeInTree(
  nodes: UnifiedFileNode[],
  nodeId: string,
  targetParentId: string,
): UnifiedFileNode[] {
  // First, extract the node
  const node = findNodeInUnifiedTree(nodes, nodeId)
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

// --- Context ---

export type MoveImpactCollection = { id: string; name: string; grantCount: number }

export type MoveImpact = {
  impactedCollections: MoveImpactCollection[]
}

interface FileTreeContextValue {
  tree: UnifiedFileNode[]
  getDomainFiles: (id: DomainId) => WorkspaceFileNode[]
  createFolder: (parentId: string | null, name: string, children?: UnifiedFileNode[]) => string
  createFile: (parentId: string, name: string, extension?: string) => string
  createReferenceFolder: (parentId: string | null, name: string, reference: ReferenceFolderSource) => string
  renameNode: (nodeId: string, newName: string) => void
  deleteNode: (nodeId: string) => void
  /** Analyze impact of moving a node — which shared collections would be affected */
  getMoveImpact: (nodeId: string, collections: { id: string; name: string; boundFolderId?: string }[], getGrantCount: (collectionId: string) => number) => MoveImpact
  /** Execute a move operation */
  confirmMove: (nodeId: string, targetParentId: string) => void
  /** Create a file reference (same asset, different location) */
  createFileReference: (sourceFileId: string, targetParentId: string) => string | null
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

  const renameNode = useCallback((nodeId: string, newName: string) => {
    updateTree((prev) => renameNodeInTree(prev, nodeId, newName))
  }, [updateTree])

  const deleteNode = useCallback((nodeId: string) => {
    updateTree((prev) => deleteNodeFromTree(prev, nodeId))
  }, [updateTree])

  const getMoveImpact = useCallback((
    nodeId: string,
    collections: { id: string; name: string; boundFolderId?: string }[],
    getGrantCount: (collectionId: string) => number,
  ): MoveImpact => {
    const impactedCollections: MoveImpactCollection[] = []
    for (const collection of collections) {
      if (!collection.boundFolderId) continue
      // Check if the node lives inside this collection's bound folder
      if (isDescendantOf(tree, nodeId, collection.boundFolderId)) {
        const grantCount = getGrantCount(collection.id)
        if (grantCount > 0) {
          impactedCollections.push({
            id: collection.id,
            name: collection.name,
            grantCount,
          })
        }
      }
    }
    return { impactedCollections }
  }, [tree])

  const confirmMove = useCallback((nodeId: string, targetParentId: string) => {
    updateTree((prev) => moveNodeInTree(prev, nodeId, targetParentId))
  }, [updateTree])

  const createFileReference = useCallback((sourceFileId: string, targetParentId: string): string | null => {
    const sourceNode = findNodeInUnifiedTree(rawTree, sourceFileId)
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

  const value = useMemo<FileTreeContextValue>(() => ({
    tree,
    getDomainFiles,
    createFolder,
    createFile,
    createReferenceFolder,
    renameNode,
    deleteNode,
    getMoveImpact,
    confirmMove,
    createFileReference,
  }), [tree, getDomainFiles, createFolder, createFile, createReferenceFolder, renameNode, deleteNode, getMoveImpact, confirmMove, createFileReference])

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
