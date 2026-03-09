'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { DepartmentId } from '@/components/department/types'
import { getDepartmentWorkspaceFiles, type WorkspaceFileNode } from '@/lib/workspace-data'
import { generateAssetInstances, groupInstancesByCategory } from '@/lib/asset-instances'
import type { AssetInstance, AssetInstanceGroup } from '@/lib/asset-instances'
import type { Asset, AssetType } from '@/lib/data'
import { useTransientFolders, useCreateFolder } from './useWorkspaceFiles'

export type WorkspaceViewFilter = 'files' | 'assets' | 'mixed'

function getStorageKey(departmentId: DepartmentId) {
  return `workspace-${departmentId}`
}

interface StoredState {
  managedFolderIds: string[]
}

const DEFAULT_STATE: StoredState = {
  managedFolderIds: [],
}

function getStoredState(departmentId: DepartmentId): StoredState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const stored = localStorage.getItem(getStorageKey(departmentId))
    if (!stored) return DEFAULT_STATE
    const parsed = JSON.parse(stored)
    return {
      managedFolderIds: Array.isArray(parsed.managedFolderIds) ? parsed.managedFolderIds : DEFAULT_STATE.managedFolderIds,
    }
  } catch {
    return DEFAULT_STATE
  }
}

function saveState(departmentId: DepartmentId, state: StoredState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStorageKey(departmentId), JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save workspace state:', error)
  }
}

/** Collect default managed zone folder IDs from mock data */
function getDefaultManagedIds(files: WorkspaceFileNode[]): string[] {
  const ids: string[] = []
  function walk(nodes: WorkspaceFileNode[]) {
    for (const node of nodes) {
      if (node.zone === 'managed') ids.push(node.id)
      if (node.children) walk(node.children)
    }
  }
  walk(files)
  return ids
}

/** Walk tree and mark managedZone on nodes whose parent folder is managed */
function markManagedZones(nodes: WorkspaceFileNode[], managedIds: Set<string>): WorkspaceFileNode[] {
  return nodes.map((node) => {
    const isManaged = managedIds.has(node.id)
    if (node.type === 'folder') {
      const children = node.children
        ? markManagedChildren(node.children, managedIds, isManaged)
        : undefined
      return { ...node, zone: isManaged ? 'managed' as const : undefined, managedZone: isManaged || undefined, children }
    }
    return node
  })
}

function markManagedChildren(
  nodes: WorkspaceFileNode[],
  managedIds: Set<string>,
  parentIsManaged: boolean,
): WorkspaceFileNode[] {
  return nodes.map((node) => {
    if (node.type === 'file') {
      return { ...node, managedZone: parentIsManaged || undefined }
    }
    const isManaged = managedIds.has(node.id)
    const effectiveManaged = isManaged || parentIsManaged
    const children = node.children
      ? markManagedChildren(node.children, managedIds, effectiveManaged)
      : undefined
    return { ...node, zone: isManaged ? 'managed' as const : undefined, managedZone: effectiveManaged || undefined, children }
  })
}

/** Map asset type to a representative file extension */
const ASSET_TYPE_TO_EXT: Record<AssetType, string> = {
  image: 'png',
  video: 'mov',
  audio: 'wav',
  text: 'pdf',
  shot: 'mov',
}

/** Convert a curated Asset to a WorkspaceFileNode for display in the file browser */
function assetToFileNode(asset: Asset): WorkspaceFileNode {
  const ext = ASSET_TYPE_TO_EXT[asset.type] ?? 'txt'
  return {
    id: asset.id,
    name: `${asset.name}.${ext}`,
    type: 'file',
    extension: ext,
    modifiedAt: asset.created_at,
  }
}

/** Count total files in a tree */
function countFiles(nodes: WorkspaceFileNode[]): number {
  let count = 0
  for (const node of nodes) {
    if (node.type === 'file') count++
    if (node.children) count += countFiles(node.children)
  }
  return count
}

export interface UseWorkspaceStateReturn {
  managedFolderIds: Set<string>
  toggleManagedZone: (folderId: string) => void
  selectedNode: WorkspaceFileNode | null
  setSelectedNode: (node: WorkspaceFileNode | null) => void
  processedFiles: WorkspaceFileNode[]
  totalFileCount: number
  assetInstances: AssetInstance[]
  instanceGroups: AssetInstanceGroup[]
  /** True while curated assets are being fetched */
  loading: boolean
  createFolder: (name: string, parentPath: string[]) => void
}

export function useWorkspaceState(departmentId: DepartmentId, viewFilter: WorkspaceViewFilter): UseWorkspaceStateReturn {
  const [mounted, setMounted] = useState(false)
  const [managedFolderIds, setManagedFolderIds] = useState<Set<string>>(new Set())
  const [selectedNode, setSelectedNode] = useState<WorkspaceFileNode | null>(null)
  const [curatedAssetNodes, setCuratedAssetNodes] = useState<WorkspaceFileNode[]>([])
  const [loading, setLoading] = useState(true)
  const transientFolders = useTransientFolders(departmentId)
  const contextCreateFolder = useCreateFolder()

  const createFolder = useCallback((name: string, parentPath: string[]) => {
    contextCreateFolder(departmentId, name, parentPath)
  }, [contextCreateFolder, departmentId])

  // Load state on mount
  useEffect(() => {
    setMounted(true)
    const rawFiles = getDepartmentWorkspaceFiles(departmentId)
    const stored = getStoredState(departmentId)

    const defaultIds = getDefaultManagedIds(rawFiles)
    const storedIds = stored.managedFolderIds
    const ids = storedIds.length > 0 ? storedIds : defaultIds
    setManagedFolderIds(new Set(ids))
  }, [departmentId])

  // Fetch curated assets and convert to file nodes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/departments/${departmentId}/assets`)
      .then((res) => res.json())
      .then((assets: Asset[]) => {
        if (!cancelled) {
          setCuratedAssetNodes(assets.map(assetToFileNode))
        }
      })
      .catch(() => {
        // Silently fail — curated assets are optional
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [departmentId])

  const toggleManagedZone = useCallback((folderId: string) => {
    setManagedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      if (mounted) {
        saveState(departmentId, { managedFolderIds: Array.from(next) })
      }
      return next
    })
  }, [mounted, departmentId])

  const rawFiles = useMemo(() => getDepartmentWorkspaceFiles(departmentId), [departmentId])

  const processedFiles = useMemo(() => {
    const marked = markManagedZones(rawFiles, managedFolderIds)
    // Merge curated assets as top-level loose files, deduplicating by ID
    const existingIds = new Set<string>()
    function collectIds(nodes: WorkspaceFileNode[]) {
      for (const n of nodes) {
        existingIds.add(n.id)
        if (n.children) collectIds(n.children)
      }
    }
    collectIds(marked)
    const newNodes = curatedAssetNodes.filter((n) => !existingIds.has(n.id))
    const merged = [...marked, ...newNodes]

    // Inject transient folders at the appropriate tree levels
    if (transientFolders.size === 0) return merged
    function injectTransient(nodes: WorkspaceFileNode[], pathPrefix: string): WorkspaceFileNode[] {
      const result = nodes.map((node) => {
        if (node.type !== 'folder') return node
        const childPath = pathPrefix ? `${pathPrefix}/${node.id}` : node.id
        const extras = transientFolders.get(childPath)
        const children = node.children
          ? injectTransient(node.children, childPath)
          : []
        return { ...node, children: extras ? [...children, ...extras] : children }
      })
      return result
    }
    const withNested = injectTransient(merged, '')
    const rootExtras = transientFolders.get('') ?? []
    return [...withNested, ...rootExtras]
  }, [rawFiles, managedFolderIds, curatedAssetNodes, transientFolders])

  const totalFileCount = useMemo(() => countFiles(processedFiles), [processedFiles])

  const assetInstances = useMemo(
    () => generateAssetInstances(processedFiles, departmentId),
    [processedFiles, departmentId],
  )

  const instanceGroups = useMemo(
    () => groupInstancesByCategory(assetInstances),
    [assetInstances],
  )

  return {
    managedFolderIds,
    toggleManagedZone,
    selectedNode,
    setSelectedNode,
    processedFiles,
    totalFileCount,
    assetInstances,
    instanceGroups,
    loading,
    createFolder,
  }
}
