'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { DomainId } from '@/components/department/types'
import { type WorkspaceFileNode } from '@/lib/workspace-data'
import { generateAssetInstances, groupInstancesByCategory } from '@/lib/asset-instances'
import type { AssetInstance, AssetInstanceGroup } from '@/lib/asset-instances'
import type { Asset, AssetType } from '@/lib/data'
import { useFileTree } from './useFileTree'

function getStorageKey(domainId: DomainId) {
  return `workspace-${domainId}`
}

const WORKSPACE_STATE_VERSION = 2

interface StoredState {
  version: number
  disabledFolderIds: string[]
}

const DEFAULT_STATE: StoredState = {
  version: WORKSPACE_STATE_VERSION,
  disabledFolderIds: [],
}

function getStoredState(domainId: DomainId): StoredState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const stored = localStorage.getItem(getStorageKey(domainId))
    if (!stored) return DEFAULT_STATE
    const parsed = JSON.parse(stored)
    if (parsed.version !== WORKSPACE_STATE_VERSION) return DEFAULT_STATE
    return {
      version: WORKSPACE_STATE_VERSION,
      disabledFolderIds: Array.isArray(parsed.disabledFolderIds) ? parsed.disabledFolderIds : DEFAULT_STATE.disabledFolderIds,
    }
  } catch {
    return DEFAULT_STATE
  }
}

function saveState(domainId: DomainId, state: StoredState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStorageKey(domainId), JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save workspace state:', error)
  }
}

/** Walk tree and mark sync as enabled by default, with explicit folder opt-outs. */
function markManagedChildren(
  nodes: WorkspaceFileNode[],
  disabledIds: Set<string>,
  parentIsManaged: boolean,
): WorkspaceFileNode[] {
  return nodes.map((node) => {
    if (node.type === 'file') {
      return { ...node, managedZone: parentIsManaged || undefined }
    }
    const explicitlyDisabled = disabledIds.has(node.id)
    const effectiveManaged = parentIsManaged && !explicitlyDisabled
    const children = node.children
      ? markManagedChildren(node.children, disabledIds, effectiveManaged)
      : undefined
    return {
      ...node,
      zone: effectiveManaged ? 'managed' as const : 'wip' as const,
      managedZone: effectiveManaged || undefined,
      children,
    }
  })
}

function markManagedZones(nodes: WorkspaceFileNode[], disabledIds: Set<string>): WorkspaceFileNode[] {
  return markManagedChildren(nodes, disabledIds, true)
}

function collectManagedFolderIds(nodes: WorkspaceFileNode[]): Set<string> {
  const ids = new Set<string>()
  function walk(children: WorkspaceFileNode[]) {
    for (const node of children) {
      if (node.type === 'folder') {
        if (node.managedZone) ids.add(node.id)
        if (node.children) walk(node.children)
      }
    }
  }
  walk(nodes)
  return ids
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
  processedFiles: WorkspaceFileNode[]
  totalFileCount: number
  assetInstances: AssetInstance[]
  instanceGroups: AssetInstanceGroup[]
  /** True while curated assets are being fetched */
  loading: boolean
  createFolder: (name: string, parentPath: string[]) => void
}

export function useWorkspaceState(domainId: DomainId): UseWorkspaceStateReturn {
  const [mounted, setMounted] = useState(false)
  const [disabledFolderIds, setDisabledFolderIds] = useState<Set<string>>(new Set())
  const [curatedAssetNodes, setCuratedAssetNodes] = useState<WorkspaceFileNode[]>([])
  const [loading, setLoading] = useState(true)
  const fileTree = useFileTree()

  const createFolder = useCallback((name: string, parentPath: string[]) => {
    // Determine parent folder ID from the path; null means root of department
    const parentId = parentPath.length > 0 ? parentPath[parentPath.length - 1] : null
    fileTree.createFolder(parentId, name)
  }, [fileTree])

  // Load state on mount
  useEffect(() => {
    setMounted(true)
    const stored = getStoredState(domainId)
    setDisabledFolderIds(new Set(stored.disabledFolderIds))
  }, [domainId, fileTree])

  // Fetch curated assets and convert to file nodes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/departments/${domainId}/assets`)
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
  }, [domainId])

  const toggleManagedZone = useCallback((folderId: string) => {
    setDisabledFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      if (mounted) {
        saveState(domainId, {
          version: WORKSPACE_STATE_VERSION,
          disabledFolderIds: Array.from(next),
        })
      }
      return next
    })
  }, [mounted, domainId])

  const rawFiles = useMemo(
    () => fileTree.getDomainFiles(domainId),
    [fileTree, domainId],
  )

  const processedFiles = useMemo(() => {
    const marked = markManagedZones(rawFiles, disabledFolderIds)
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
    return [...marked, ...newNodes]
  }, [rawFiles, disabledFolderIds, curatedAssetNodes])

  const managedFolderIds = useMemo(
    () => collectManagedFolderIds(processedFiles),
    [processedFiles],
  )

  const totalFileCount = useMemo(() => countFiles(processedFiles), [processedFiles])

  const assetInstances = useMemo(
    () => generateAssetInstances(processedFiles, domainId),
    [processedFiles, domainId],
  )

  const instanceGroups = useMemo(
    () => groupInstancesByCategory(assetInstances),
    [assetInstances],
  )

  return {
    managedFolderIds,
    toggleManagedZone,
    processedFiles,
    totalFileCount,
    assetInstances,
    instanceGroups,
    loading,
    createFolder,
  }
}
