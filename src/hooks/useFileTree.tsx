'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import type { DepartmentId } from '@/components/department/types'
import { getFinderWorkspaceTree, type UnifiedFileNode, type WorkspaceFileNode } from '@/lib/workspace-data'

const STORAGE_KEY = 'unified-workspace-files-v5'

function loadTree(): UnifiedFileNode[] {
  if (typeof window === 'undefined') return getFinderWorkspaceTree()
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return getFinderWorkspaceTree()
}

function persistTree(tree: UnifiedFileNode[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree))
  } catch {}
}

/** Map workspace department IDs to their wrapper folder IDs in the Finder tree */
const DEPT_TO_FOLDER_ID: Record<DepartmentId, string> = {
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

// --- Context ---

interface FileTreeContextValue {
  tree: UnifiedFileNode[]
  getDepartmentFiles: (id: DepartmentId) => WorkspaceFileNode[]
  createFolder: (parentId: string | null, name: string) => string
  renameNode: (nodeId: string, newName: string) => void
  deleteNode: (nodeId: string) => void
}

const FileTreeContext = createContext<FileTreeContextValue | null>(null)

export function FileTreeProvider({ children }: { children: ReactNode }) {
  const [tree, setTree] = useState<UnifiedFileNode[]>(getFinderWorkspaceTree)

  useEffect(() => {
    setTree(loadTree())
  }, [])

  const updateTree = useCallback((updater: (prev: UnifiedFileNode[]) => UnifiedFileNode[]) => {
    setTree((prev) => {
      const next = updater(prev)
      persistTree(next)
      return next
    })
  }, [])

  const getDepartmentFiles = useCallback((id: DepartmentId): WorkspaceFileNode[] => {
    const folderId = DEPT_TO_FOLDER_ID[id]
    return (findSubtree(tree, folderId) ?? []) as WorkspaceFileNode[]
  }, [tree])

  const createFolder = useCallback((parentId: string | null, name: string): string => {
    const id = generateId()
    const newFolder: UnifiedFileNode = {
      id,
      name,
      type: 'folder',
      modifiedAt: new Date().toISOString().split('T')[0],
      children: [],
    }
    updateTree((prev) => addNodeToTree(prev, parentId, newFolder))
    return id
  }, [updateTree])

  const renameNode = useCallback((nodeId: string, newName: string) => {
    updateTree((prev) => renameNodeInTree(prev, nodeId, newName))
  }, [updateTree])

  const deleteNode = useCallback((nodeId: string) => {
    updateTree((prev) => deleteNodeFromTree(prev, nodeId))
  }, [updateTree])

  const value = useMemo<FileTreeContextValue>(() => ({
    tree,
    getDepartmentFiles,
    createFolder,
    renameNode,
    deleteNode,
  }), [tree, getDepartmentFiles, createFolder, renameNode, deleteNode])

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
