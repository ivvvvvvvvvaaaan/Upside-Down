'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Stack,
  AssetCard,
  CardGrid,
  PageHeader,
  EmptyState,
  AppearanceDropdown,
  SortDropdown,
  HawkinsSearch,
  CompactBar,
  Button,
  FileExplorer,
  CollectionCard,
  SelectionBar,
  NewFolderModal,
  AccessModal,
} from '@/components/ui'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import type { FileNode, FileViewMode } from '@/components/ui/file-explorer'
import { ContextMenu } from '@/components/ui/context-menu'
import type { ContextMenuItem } from '@/components/ui/context-menu'
import { AppLayout } from '@/components/layouts'
import { getGridColumns, useViewPreferences, useCompactBar, useWorkspaceState, useResourceSelection, useFileTree, useAccess, usePersona } from '@/hooks'

import type { DepartmentId } from '@/components/department/types'
import { DEPARTMENT_FOLDER_MAP } from '@/lib/workspace-data'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { promotedInstanceToAsset } from '@/lib/asset-instances'
import type { Asset } from '@/lib/data'
import { WorkspaceSidePanel } from '@/components/department/WorkspaceSidePanel'
import { AssetDetailPanel } from '@/components/ui/asset-detail-panel'
import { getContextAssetGroups } from '@/lib/context-relationships'
import { useSmartCollections } from '@/hooks'
import { ArrowLeft, List, Columns, LayoutGrid, PanelRight, Lock, Users, FolderPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { departmentConfigs } from '@/lib/department-configs'
import { assetToSelectionEntity, folderToSelectionEntity } from '@/lib/selection-actions'
import type { SelectionEntity } from '@/lib/selection-actions'

interface ContextMenuState {
  x: number
  y: number
  node: WorkspaceFileNode
}

interface WorkspaceSelectionEntry {
  id: string
  entity: SelectionEntity
  node: WorkspaceFileNode
  departmentId?: DepartmentId
  asset?: Asset
}

/** Convert WorkspaceFileNode tree to FileNode tree for FileExplorer */
function toFileNodes(nodes: WorkspaceFileNode[]): FileNode[] {
  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type,
    extension: n.extension,
    size: n.size,
    modifiedAt: n.modifiedAt,
    children: n.children ? toFileNodes(n.children) : undefined,
    managedZone: n.managedZone,
  }))
}

function folderNodeToAsset(node: WorkspaceFileNode, departmentId: DepartmentId): Asset {
  return {
    id: node.id,
    name: node.name,
    type: 'text',
    department: departmentId,
    created_at: node.modifiedAt,
  }
}

/** Count files recursively, skipping inaccessible folders */
function countAccessibleFiles(nodes: WorkspaceFileNode[], canAccess: (id: string) => boolean): number {
  let count = 0
  for (const node of nodes) {
    if (!canAccess(node.id)) continue
    if (node.type === 'file') count++
    if (node.children) count += countAccessibleFiles(node.children, canAccess)
  }
  return count
}

/** Find a WorkspaceFileNode by id in a tree */
function findNodeById(nodes: WorkspaceFileNode[], id: string): WorkspaceFileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function flattenWorkspaceNodes(nodes: WorkspaceFileNode[]): WorkspaceFileNode[] {
  return nodes.flatMap((node) => [
    node,
    ...(node.children ? flattenWorkspaceNodes(node.children) : []),
  ])
}

function findDepartmentIdForNode(
  node: WorkspaceFileNode,
  getDepartmentFiles: (id: DepartmentId) => WorkspaceFileNode[],
): DepartmentId | undefined {
  if (node.departmentId) return node.departmentId
  if (isDepartmentLandingNode(node.id)) return node.id

  for (const deptId of ALL_DEPARTMENT_IDS) {
    if (findNodeById(getDepartmentFiles(deptId), node.id)) {
      return deptId
    }
  }

  return undefined
}

function isDepartmentLandingNode(nodeId: string): nodeId is DepartmentId {
  return Object.prototype.hasOwnProperty.call(DEPARTMENT_FOLDER_MAP, nodeId)
}

/** Resolve URL path segments to an array of WorkspaceFileNode folders */
function resolvePathSegments(
  segments: string[],
  rootNodes: WorkspaceFileNode[],
): WorkspaceFileNode[] {
  const result: WorkspaceFileNode[] = []
  let currentLevel = rootNodes
  for (const seg of segments) {
    const folder = currentLevel.find((n) => n.id === seg && n.type === 'folder')
    if (!folder) break
    result.push(folder)
    currentLevel = folder.children ?? []
  }
  return result
}

function buildLandingFolderHref(rootFolderId: string, nestedPath: string[] = []): string {
  const suffix = nestedPath.length > 0 ? `/${nestedPath.join('/')}` : ''
  return `/nextgen/workspace/${rootFolderId}${suffix}`
}

const VIEW_MODE_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: <LayoutGrid className="w-4 h-4" /> },
  { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
  { value: 'columns', label: 'Columns', icon: <Columns className="w-4 h-4" /> },
]

const ALL_DEPARTMENT_IDS = Object.keys(DEPARTMENT_FOLDER_MAP) as DepartmentId[]
const DEPT_FOLDER_IDS = new Set(Object.values(DEPARTMENT_FOLDER_MAP).map(d => d.id))

interface WorkspaceViewProps {
  /** Department to display. When omitted, shows department folder landing. */
  departmentId?: DepartmentId
  /** URL path segments representing the drilled-down folder path */
  folderPath: string[]
  /** Workspace-level transient folder ID to auto-drill into on the landing page */
  landingFolderId?: string
}

export function WorkspaceView({ departmentId, folderPath: urlPath, landingFolderId }: WorkspaceViewProps) {
  const router = useRouter()
  const isLanding = !departmentId
  const { canAccess, sharesReceivedByMe, getInheritedGrants } = useAccess()
  const { activePersona } = usePersona()
  const { scopedAssets, ensureAssetsLoaded } = useSmartCollections()
  const menuHref = departmentId
    ? `/nextgen/menu?return=%2Fnextgen%2Fworkspace%2F${departmentId}`
    : '/nextgen/menu?return=%2Fnextgen%2Fworkspace'

  const { layout, setLayout, cardSize, setCardSize, viewMode, setViewMode, sidePanelOpen: showPanel, setSidePanelOpen: setShowPanel } = useViewPreferences()
  const { scrollRef, headerRef, showCompactBar } = useCompactBar()
  const {
    selectedIds,
    primaryId,
    handleSelectionClick,
    selectOnly,
    clearSelection,
  } = useResourceSelection<{ id: string }>()
  const { setBreadcrumbExtras, clearBreadcrumbExtras } = useBreadcrumbExtras()

  const {
    managedFolderIds,
    toggleManagedZone,
    processedFiles,
    assetInstances,
    loading,
    createFolder,
  // Always call hook (React rules); results ignored when isLanding
  } = useWorkspaceState(departmentId ?? 'art-design')

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [accessModalNode, setAccessModalNode] = useState<WorkspaceFileNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [newFolderParentPath, setNewFolderParentPath] = useState<string[]>([])
  const [landingDrillPath, setLandingDrillPath] = useState<WorkspaceFileNode[]>([])
  const { createFolder: fileTreeCreateFolder, tree: fileTree, getDepartmentFiles: getFileTreeDeptFiles } = useFileTree()
  // Workspace-level folders: top-level folders created by user (exclude department folders already rendered via departmentNodes)
  const landingFolders = useMemo(() => {
    return fileTree.filter((f) => f.type === 'folder' && !DEPT_FOLDER_IDS.has(f.id)) as WorkspaceFileNode[]
  }, [fileTree])

  // Shared folder/collection nodes injected into the workspace landing
  const sharedFolderNodes: WorkspaceFileNode[] = useMemo(() => {
    if (!isLanding) return []
    // Only show folders shared from OTHER departments (not your own department's internal folders)
    return sharesReceivedByMe
      .filter(e => {
        if (e.resourceType !== 'folder') return false
        if (DEPT_FOLDER_IDS.has(e.resourceId)) return false
        // Skip folders within the user's own department
        if (activePersona?.departmentId && e.departmentId === activePersona.departmentId) return false
        return true
      })
      .map((entry) => {
        const departmentFiles = entry.departmentId ? (getFileTreeDeptFiles(entry.departmentId) as WorkspaceFileNode[]) : []
        const sourceNode = findNodeById(departmentFiles, entry.resourceId)
        if (sourceNode?.type === 'folder') {
          return {
            ...sourceNode,
            departmentId: entry.departmentId,
          }
        }

        return {
          id: entry.resourceId,
          name: entry.label,
          type: 'folder' as const,
          departmentId: entry.departmentId,
          modifiedAt: entry.grantedAt,
          children: [],
        }
      })
  }, [isLanding, sharesReceivedByMe, activePersona, getFileTreeDeptFiles])

  // O(1) lookup for shared folder IDs
  const sharedFolderIds = useMemo(() => new Set(sharedFolderNodes.map(n => n.id)), [sharedFolderNodes])
  const landingFolderIds = useMemo(
    () => new Set(landingFolders.map((folder) => folder.id)),
    [landingFolders],
  )
  const assetBySourceFileId = useMemo(() => {
    return new Map(assetInstances.map((instance) => [
      instance.sourceFileId,
      promotedInstanceToAsset(instance),
    ]))
  }, [assetInstances])
  const getAclResourceId = useCallback((node: WorkspaceFileNode): string => {
    if (isLanding && isDepartmentLandingNode(node.id)) {
      return DEPARTMENT_FOLDER_MAP[node.id].id
    }
    return node.id
  }, [isLanding])

  // Auto-drill into a workspace-level transient folder when navigated to via URL
  useEffect(() => {
    if (!isLanding || !landingFolderId) {
      setLandingDrillPath([])
      return
    }

    const folder = [...sharedFolderNodes, ...landingFolders].find((candidate) => candidate.id === landingFolderId)
    if (!folder) {
      setLandingDrillPath([])
      return
    }

    const nestedFolders = resolvePathSegments(urlPath, folder.children ?? [])
    setLandingDrillPath([folder, ...nestedFolders])
  }, [landingFolderId, isLanding, landingFolders, sharedFolderNodes, urlPath])

  const handleCreateFolder = useCallback((name: string) => {
    if (isLanding) {
      // Create at root of the unified tree
      fileTreeCreateFolder(null, name)
    } else {
      createFolder(name, newFolderParentPath)
    }
  }, [isLanding, createFolder, fileTreeCreateFolder, newFolderParentPath])
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' },
  ])
  const departmentAccessible = departmentId ? canAccess(DEPARTMENT_FOLDER_MAP[departmentId].id) : true

  // Department folder nodes for landing view — real WorkspaceFileNode shapes
  const departmentNodes: WorkspaceFileNode[] = useMemo(() => {
    if (!isLanding) return []
    return ALL_DEPARTMENT_IDS
      .filter((id) => canAccess(DEPARTMENT_FOLDER_MAP[id].id))
      .map((id) => ({
        id,
        name: departmentConfigs[id].name,
        type: 'folder' as const,
        departmentId: id,
        children: getFileTreeDeptFiles(id) as WorkspaceFileNode[],
      }))
  }, [isLanding, canAccess, getFileTreeDeptFiles])

  // Resolve URL path segments to actual folder nodes
  const resolvedFolderPath = useMemo(
    () => resolvePathSegments(urlPath, processedFiles),
    [urlPath, processedFiles],
  )

  // Sync breadcrumb extras for department routes and landing-scoped shared/workspace folders.
  useEffect(() => {
    const extras: { label: string; href?: string; onClick?: () => void }[] = []

    if (departmentId) {
      extras.push({ label: 'Workspace', href: '/nextgen/workspace' })
      const deptName = departmentConfigs[departmentId]?.name ?? departmentId
      if (resolvedFolderPath.length > 0) {
        extras.push({ label: deptName, href: `/nextgen/workspace/${departmentId}` })
      } else {
        extras.push({ label: deptName })
      }

      // Folder path crumbs
      resolvedFolderPath.forEach((folder, i) => {
        const isLast = i === resolvedFolderPath.length - 1
        extras.push({
          label: folder.name,
          onClick: !isLast
            ? () => {
                const pathSegments = resolvedFolderPath.slice(0, i + 1).map((f) => f.id)
                router.push(`/nextgen/workspace/${departmentId}/${pathSegments.join('/')}`)
              }
            : undefined,
        })
      })
    } else if (landingFolderId && landingDrillPath.length > 0) {
      extras.push({ label: 'Workspace', href: '/nextgen/workspace' })
      landingDrillPath.forEach((folder, index) => {
        const isLast = index === landingDrillPath.length - 1
        extras.push({
          label: folder.name,
          href: !isLast
            ? buildLandingFolderHref(
                landingFolderId,
                landingDrillPath.slice(1, index + 1).map((item) => item.id),
              )
            : undefined,
        })
      })
    } else {
      extras.push({ label: 'Workspace' })
    }

    setBreadcrumbExtras(extras)
    return () => clearBreadcrumbExtras()
  }, [departmentId, resolvedFolderPath, landingFolderId, landingDrillPath, setBreadcrumbExtras, clearBreadcrumbExtras, router])

  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date-added', label: 'Date Added' },
    { value: 'date-opened', label: 'Date Opened' },
    { value: 'date-modified', label: 'Date Modified' },
    { value: 'size', label: 'Size' },
    { value: 'kind', label: 'Kind' },
  ]

  const filterOptions: { id: string; label: string }[] = []

  // Unified grid items — works for both landing and department views
  // Department nodes on landing are always shown (no locking); folder-level filtering applies within departments
  const currentGridItems: WorkspaceFileNode[] = useMemo(() => {
    let items: WorkspaceFileNode[]
    if (isLanding) {
      const currentLandingFolder = landingDrillPath[landingDrillPath.length - 1]
      if (currentLandingFolder) {
        items = currentLandingFolder.children ?? []
      } else {
        return [...departmentNodes, ...sharedFolderNodes, ...landingFolders]
      }
    } else if (resolvedFolderPath.length === 0) {
      items = processedFiles
    } else {
      const current = resolvedFolderPath[resolvedFolderPath.length - 1]
      items = current.children ?? []
    }
    // Apply access filtering to both folders and files
    return items.filter((node) => {
      if (isLanding && isDepartmentLandingNode(node.id)) return true
      if (canAccess(getAclResourceId(node))) return true
      // Not accessible — show only if persona can see restricted (folders only, files stay hidden)
      if (node.type === 'folder') return activePersona?.role === 'manager'
      return false
    })
  }, [isLanding, landingDrillPath, departmentNodes, sharedFolderNodes, landingFolders, processedFiles, resolvedFolderPath, canAccess, activePersona, getAclResourceId])

  // Access-filtered total file count for compact bar
  const filteredFileCount = useMemo(
    () => countAccessibleFiles(processedFiles, canAccess),
    [processedFiles, canAccess],
  )

  const buildSelectionEntry = useCallback((node: WorkspaceFileNode): WorkspaceSelectionEntry => {
    const nodeDepartmentId = departmentId
      ?? findDepartmentIdForNode(node, getFileTreeDeptFiles)
      ?? activePersona?.departmentId
      ?? ALL_DEPARTMENT_IDS[0]

    if (node.type === 'file') {
      const asset = assetBySourceFileId.get(node.id) ?? folderNodeToAsset(node, nodeDepartmentId)
      return {
        id: asset.id,
        entity: assetToSelectionEntity(asset, { resourceId: node.id }),
        node,
        departmentId: nodeDepartmentId,
        asset,
      }
    }

    return {
      id: node.id,
      entity: folderToSelectionEntity({
        id: node.id,
        resourceId: getAclResourceId(node),
        label: node.name,
        departmentId: nodeDepartmentId,
      }),
      node,
      departmentId: nodeDepartmentId,
    }
  }, [departmentId, getFileTreeDeptFiles, activePersona, assetBySourceFileId, getAclResourceId])

  const topLevelSelectionEntries = useMemo(
    () => currentGridItems.map(buildSelectionEntry),
    [currentGridItems, buildSelectionEntry],
  )
  const allSelectionEntries = useMemo(
    () => flattenWorkspaceNodes(currentGridItems).map(buildSelectionEntry),
    [currentGridItems, buildSelectionEntry],
  )
  const currentGridSelectionEntities = useMemo(
    () => topLevelSelectionEntries.map((entry) => entry.entity),
    [topLevelSelectionEntries],
  )
  const selectionEntryById = useMemo(() => new Map(
    allSelectionEntries.map((entry) => [entry.id, entry]),
  ), [allSelectionEntries])
  const selectionEntryByNodeId = useMemo(() => new Map(
    allSelectionEntries.map((entry) => [entry.node.id, entry]),
  ), [allSelectionEntries])

  const selectedEntities = useMemo(() => {
    return allSelectionEntries
      .filter((entry) => selectedIds.has(entry.id))
      .map((entry) => entry.entity)
  }, [allSelectionEntries, selectedIds])
  const selectedNodeIds = useMemo(() => new Set(
    allSelectionEntries
      .filter((entry) => selectedIds.has(entry.id))
      .map((entry) => entry.node.id),
  ), [allSelectionEntries, selectedIds])

  const primarySelectionEntry = useMemo(() => {
    if (!primaryId) return null
    return selectionEntryById.get(primaryId) ?? null
  }, [primaryId, selectionEntryById])
  const primaryNodeId = primarySelectionEntry?.node.id ?? null

  const workspaceLocationKey = `${departmentId ?? 'landing'}:${landingFolderId ?? ''}:${urlPath.join('/')}`
  useEffect(() => {
    clearSelection()
  }, [workspaceLocationKey, clearSelection])

  const handleNodeClick = useCallback((fileNode: FileNode) => {
    const entry = selectionEntryByNodeId.get(fileNode.id)
    if (entry) {
      selectOnly(entry.entity)
    }
  }, [selectionEntryByNodeId, selectOnly])

  const handleContextMenu = useCallback((event: React.MouseEvent, fileNode: FileNode) => {
    event.preventDefault()
    const wsNode = findNodeById(currentGridItems, fileNode.id)
    if (wsNode) {
      setContextMenu({ x: event.clientX, y: event.clientY, node: wsNode })
    }
  }, [currentGridItems])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const handleFolderDrilldown = useCallback((folder: WorkspaceFileNode) => {
    if (isLanding) {
      if (landingFolderId) {
        router.push(buildLandingFolderHref(landingFolderId, [...urlPath, folder.id]))
      } else if (folder.id.startsWith('new-folder-') || sharedFolderIds.has(folder.id) || landingFolderIds.has(folder.id)) {
        router.push(buildLandingFolderHref(folder.id))
      } else {
        router.push(`/nextgen/workspace/${folder.id}`)
      }
    } else {
      const newPath = [...urlPath, folder.id]
      router.push(`/nextgen/workspace/${departmentId}/${newPath.join('/')}`)
    }
  }, [departmentId, isLanding, landingFolderId, landingFolderIds, router, sharedFolderIds, urlPath])
  const handlePanelAssetSwitch = useCallback((nextAsset: Asset) => {
    const selectionEntry = selectionEntryById.get(nextAsset.id)
    if (selectionEntry) {
      selectOnly(selectionEntry.entity)
      setShowPanel(true)
      return
    }
    router.push(`/nextgen/assets/${nextAsset.id}`)
  }, [selectionEntryById, selectOnly, setShowPanel, router])

  const contextMenuItems: ContextMenuItem[] = (() => {
    if (!contextMenu) return []
    // Background right-click — only "New Folder" at current level
    if (contextMenu.node.id === '__background__') {
      return [{
        label: 'New Folder',
        icon: <FolderPlus className="w-4 h-4" />,
        onClick: () => {
          setNewFolderParentPath(urlPath)
          setNewFolderModalOpen(true)
        },
      }]
    }
    if (contextMenu.node.type === 'folder') {
      return [
        {
          label: 'New Folder',
          icon: <FolderPlus className="w-4 h-4" />,
          onClick: () => {
            setNewFolderParentPath([...urlPath, contextMenu.node.id])
            setNewFolderModalOpen(true)
          },
          dividerAfter: true,
        },
        {
          label: managedFolderIds.has(contextMenu.node.id) ? 'Unmark Managed Zone' : 'Mark as Managed Zone',
          checked: managedFolderIds.has(contextMenu.node.id),
          onClick: () => toggleManagedZone(contextMenu.node.id),
        },
        {
          label: 'Manage Access',
          icon: <Users className="w-4 h-4" />,
          onClick: () => setAccessModalNode(contextMenu.node),
        },
      ]
    }
    return []
  })()

  const isInsideFolder = resolvedFolderPath.length > 0
  const currentFolder = isInsideFolder ? resolvedFolderPath[resolvedFolderPath.length - 1] : null
  const departmentName = departmentId ? (departmentConfigs[departmentId]?.name ?? departmentId) : 'Workspace'

  // Default panel context: show current folder or department when nothing is explicitly selected.
  // On the landing page, department cards use department ids for routing, but ACL lives on the
  // department wrapper folder ids from DEPARTMENT_FOLDER_MAP.
  const effectiveNode: WorkspaceFileNode | null = useMemo(() => {
    if (primarySelectionEntry) {
      const selectedNode = primarySelectionEntry.node
      if (
        isLanding &&
        Object.prototype.hasOwnProperty.call(DEPARTMENT_FOLDER_MAP, selectedNode.id)
      ) {
        const selectedDeptId = selectedNode.id as DepartmentId
        return {
          id: DEPARTMENT_FOLDER_MAP[selectedDeptId].id,
          name: selectedNode.name,
          type: 'folder' as const,
          departmentId: selectedDeptId,
          children: getFileTreeDeptFiles(selectedDeptId) as WorkspaceFileNode[],
        }
      }
      return selectedNode
    }

    if (currentFolder) return currentFolder

    if (departmentId) {
      return {
        id: DEPARTMENT_FOLDER_MAP[departmentId].id,
        name: departmentName,
        type: 'folder' as const,
        departmentId,
        children: processedFiles,
      }
    }

    return null
  }, [primarySelectionEntry, isLanding, currentFolder, departmentId, departmentName, processedFiles, getFileTreeDeptFiles])
  const selectedNodeDepartmentId = primarySelectionEntry?.departmentId
  const selectedFileContextGroups = useMemo(() => {
    if (!primarySelectionEntry || primarySelectionEntry.node.type !== 'file' || !primarySelectionEntry.asset) {
      return undefined
    }
    return getContextAssetGroups(primarySelectionEntry.asset, scopedAssets)
  }, [primarySelectionEntry, scopedAssets])

  useEffect(() => {
    if (primarySelectionEntry?.node.type !== 'file') return
    void ensureAssetsLoaded()
  }, [primarySelectionEntry, ensureAssetsLoaded])
  const effectiveNodeDepartmentId = useMemo(() => {
    return effectiveNode
      ? departmentId ?? findDepartmentIdForNode(effectiveNode, getFileTreeDeptFiles)
      : undefined
  }, [effectiveNode, departmentId, getFileTreeDeptFiles])
  const landingDrillFolder = landingDrillPath[landingDrillPath.length - 1] ?? null
  const pageTitle = landingDrillFolder?.name ?? currentFolder?.name ?? departmentName
  const backHref = isLanding
    ? landingFolderId
      ? urlPath.length > 0
        ? buildLandingFolderHref(landingFolderId, urlPath.slice(0, -1))
        : '/nextgen/workspace'
      : undefined
    : isInsideFolder
      ? urlPath.length <= 1
        ? `/nextgen/workspace/${departmentId}`
        : `/nextgen/workspace/${departmentId}/${urlPath.slice(0, -1).join('/')}`
      : '/nextgen/workspace'

  const isGridView = viewMode === 'grid'
  const explorerViewMode = (isGridView ? 'list' : viewMode) as FileViewMode

  // Allow access if user can access the department root OR the specific folder they're navigating to
  const targetFolderId = urlPath.length > 0 ? urlPath[urlPath.length - 1] : null
  const folderAccessible = targetFolderId ? canAccess(targetFolderId) : false

  if (!isLanding && !departmentAccessible && !folderAccessible) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <EmptyState
                  title="Access Restricted"
                  message={`You don't have workspace access to ${departmentName}. Shared items will still appear in Search, Collections, or Inbox.`}
                />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex">
        <div ref={scrollRef} className={cn('flex-1 min-h-0', isGridView ? 'overflow-auto' : 'flex flex-col')}>
          <CompactBar
            visible={showCompactBar}
            title={pageTitle}
            count={isLanding ? departmentNodes.length : filteredFileCount}
            countLabel={isLanding ? 'department' : 'file'}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterOptions={filterOptions}
            sortFields={sortFields}
            sortCriteria={sortCriteria}
            onSortChange={setSortCriteria}
            layout={layout}
            onLayoutChange={setLayout}
            cardSize={cardSize}
            onCardSizeChange={setCardSize}
            showLayoutOptions={false}
          />

          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                {/* Mobile menu button */}
                <div className="flex items-center justify-between w-full md:hidden">
                  <Button asChild variant="icon" size="icon" aria-label="Menu">
                    <Link href={menuHref}>
                      <ArrowLeft className="w-4 h-4" />
                      <span className="sr-only">Menu</span>
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2">
                    <HawkinsSearch
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      filters={filterOptions}
                    />
                    <SortDropdown
                      fields={sortFields}
                      value={sortCriteria}
                      onChange={setSortCriteria}
                      iconOnly
                    />
                    <AppearanceDropdown
                      iconOnly
                      layout={layout}
                      onLayoutChange={setLayout}
                      cardSize={cardSize}
                      onCardSizeChange={setCardSize}
                      showLayoutOptions={false}
                    />
                    <Button
                      variant="icon"
                      aria-label="Toggle panel"
                      onClick={() => setShowPanel(!showPanel)}
                      className={cn(showPanel && 'bg-surface-3')}
                    >
                      <PanelRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Header */}
                <div ref={headerRef} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <PageHeader title={pageTitle} backHref={backHref ?? undefined} />
                    <div className="hidden md:flex items-center gap-2">
                      <SortDropdown
                        fields={sortFields}
                        value={sortCriteria}
                        onChange={setSortCriteria}
                        iconOnly={showPanel}
                      />
                      <AppearanceDropdown
                        layout={layout}
                        onLayoutChange={setLayout}
                        cardSize={cardSize}
                        onCardSizeChange={setCardSize}
                        showLayoutOptions={false}
                        viewModeOptions={VIEW_MODE_OPTIONS}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        iconOnly={showPanel}
                      />
                      <Button
                        variant="icon"
                        size="icon"
                        aria-label="New folder"
                        onClick={() => {
                          setNewFolderParentPath(urlPath)
                          setNewFolderModalOpen(true)
                        }}
                      >
                        <FolderPlus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="icon"
                        aria-label="Toggle panel"
                        onClick={() => setShowPanel(!showPanel)}
                        className={cn(showPanel && 'bg-surface-3')}
                      >
                        <PanelRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <HawkinsSearch
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      filters={filterOptions}
                    />
                  </div>
                </div>

                {/* Content */}
                {isGridView && (
                <div
                  className="min-h-[400px] flex-1"
                  onContextMenu={(e) => {
                    if ((e.target as HTMLElement).closest('[data-card]') === null) {
                      e.preventDefault()
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        node: { id: '__background__', name: '', type: 'folder', children: [] },
                      })
                    }
                  }}
                >
                  {currentGridItems.length > 0 || (!isLanding && loading) ? (
                      <CardGrid gap="4" columns={getGridColumns(cardSize)}>
                        {currentGridItems.map((node) => {
                          if (node.type === 'folder') {
                            const fileCount = countAccessibleFiles(node.children ?? [], canAccess)
                            const isSharedFolder = sharedFolderIds.has(node.id)
                            const folderAccessible = isLanding && isDepartmentLandingNode(node.id)
                              ? canAccess(DEPARTMENT_FOLDER_MAP[node.id].id)
                              : canAccess(node.id)
                            const isRestricted = !folderAccessible && !isSharedFolder
                            const accessIcon = isSharedFolder
                              ? <Users className="w-3.5 h-3.5" />
                              : isRestricted
                              ? <Lock className="w-3.5 h-3.5" />
                              : undefined
                            const isLocked = isRestricted || (isSharedFolder && !folderAccessible)
                            return (
                              <CollectionCard
                                key={node.id}
                                title={node.name}
                                assetCount={fileCount}
                                type="folder"
                                numberOfAssets="None"
                                accessIcon={accessIcon}
                                className={isLocked ? 'opacity-50 cursor-not-allowed' : undefined}
                                state={selectedIds.has(node.id) ? 'Selected' : 'Normal'}
                                onClick={isLocked
                                  ? () => alert('Access requested for "' + node.name + '". An administrator will review your request.')
                                  : (e) => {
                                    const selectionEntry = selectionEntryById.get(node.id)
                                    if (selectionEntry) {
                                      handleSelectionClick(selectionEntry.entity, e as React.MouseEvent, currentGridSelectionEntities)
                                    }
                                  }
                                }
                                onDoubleClick={isLocked ? undefined : () => handleFolderDrilldown(node)}
                                onMenuClick={isLocked ? undefined : (e) => {
                                  setContextMenu({ x: e.clientX, y: e.clientY, node })
                                }}
                              />
                            )
                          }
                          const workspaceAsset = assetBySourceFileId.get(node.id) ?? folderNodeToAsset(
                            node,
                            departmentId
                              ?? findDepartmentIdForNode(node, getFileTreeDeptFiles)
                              ?? activePersona?.departmentId
                              ?? ALL_DEPARTMENT_IDS[0],
                          )
                          return (
                            <AssetCard
                              key={node.id}
                              asset={workspaceAsset}
                              selected={selectedIds.has(workspaceAsset.id)}
                              primary={primaryId === workspaceAsset.id}
                              onClick={(_, e) => {
                                const selectionEntry = selectionEntryById.get(workspaceAsset.id)
                                if (selectionEntry) {
                                  handleSelectionClick(selectionEntry.entity, e, currentGridSelectionEntities)
                                }
                              }}
                            />
                          )
                        })}
                        {!isLanding && loading && (
                          Array.from({ length: 4 }, (_, i) => (
                            <CollectionCard
                              key={`skeleton-${i}`}
                              title=""
                              assetCount={0}
                              state="Loading"
                            />
                          ))
                        )}
                      </CardGrid>
                    ) : (
                      <EmptyState
                        title="Empty folder"
                        message="No files in this folder"
                      />
                    )}
                </div>
                )}
              </Stack>
            </div>
          </div>
          {!isGridView && (
            <FileExplorer
              className="flex-1"
              files={toFileNodes(currentGridItems)}
              viewMode={explorerViewMode}
              showViewToggle={false}
              selectedIds={selectedNodeIds}
              primaryId={primaryNodeId}
              onFileClick={handleNodeClick}
              onFolderClick={handleNodeClick}
              onContextMenu={handleContextMenu}
            />
          )}

        </div>

        {/* Side Panel — AssetDetailPanel for files, WorkspaceSidePanel for folders */}
        {primarySelectionEntry?.node.type === 'file' && selectedNodeDepartmentId && primarySelectionEntry.asset ? (
          <AssetDetailPanel
            asset={primarySelectionEntry.asset}
            open={showPanel}
            onClose={() => { clearSelection(); setShowPanel(false) }}
            contextGroups={selectedFileContextGroups}
            onContextAssetClick={handlePanelAssetSwitch}
            activeContext={{ type: 'workspace' }}
          />
        ) : (
          <WorkspaceSidePanel
            node={effectiveNode}
            open={showPanel}
            onClose={() => setShowPanel(false)}
            departmentId={effectiveNodeDepartmentId}
            folderVariant={
              primarySelectionEntry?.node && sharedFolderIds.has(primarySelectionEntry.node.id)
                ? 'shared'
                : primarySelectionEntry?.node && !canAccess(getAclResourceId(primarySelectionEntry.node))
                  ? 'restricted'
                  : undefined
            }
          />
        )}
        </div>

        {/* Context Menu */}
        {contextMenu && contextMenuItems.length > 0 && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenuItems}
            onClose={closeContextMenu}
          />
        )}

        <SelectionBar
          selectedEntities={selectedEntities}
          onClear={clearSelection}
        />
        <NewFolderModal
          open={newFolderModalOpen}
          onOpenChange={setNewFolderModalOpen}
          onCreate={handleCreateFolder}
        />
        {accessModalNode && (
          <AccessModal
            open={!!accessModalNode}
            onClose={() => setAccessModalNode(null)}
            resourceId={getAclResourceId(accessModalNode)}
            resourceRef={{
              id: getAclResourceId(accessModalNode),
              type: accessModalNode.type === 'folder' ? 'folder' : 'asset',
              departmentId,
            }}
            inheritedGrants={getInheritedGrants(getAclResourceId(accessModalNode)).map(({ grant, fromResourceName }) => ({
              grant,
              fromResourceName,
            }))}
            title={accessModalNode.name}
          />
        )}
      </div>
    </AppLayout>
  )
}
