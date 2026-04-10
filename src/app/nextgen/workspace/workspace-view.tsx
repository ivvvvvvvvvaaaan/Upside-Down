'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
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
  MobileToolbar,
  DropdownMenuItem,
  DropdownMenuDivider,
} from '@/components/ui'
import { useShareAsCollection } from '@/hooks/useShareAsCollection'
import type { ResourceRef } from '@/lib/grants'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import type { FileNode, FileViewMode } from '@/components/ui/file-explorer'
import { ContextMenu } from '@/components/ui/context-menu'
import type { ContextMenuItem } from '@/components/ui/context-menu'
import { getGridColumns, useViewPreferences, useCompactBar, useWorkspaceState, useResourceSelection, useFileTree, useAccess, usePersona, useMobilePanel, useCollections } from '@/hooks'

import type { DomainId } from '@/components/department/types'
import { DOMAIN_FOLDER_MAP, isReferenceFolder, SHARED_MOUNT_FOLDER_ID } from '@/lib/workspace-data'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { promotedInstanceToAsset } from '@/lib/asset-instances'
import type { Asset } from '@/lib/data'
import { WorkspaceSidePanel } from '@/components/department/WorkspaceSidePanel'
import { AssetDetailPanel } from '@/components/ui/asset-detail-panel'
import { getContextAssetGroups } from '@/lib/context-relationships'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { List, Columns, LayoutGrid, PanelRight, Info, Lock, Users, FolderPlus, FolderSymlink, Share2, Settings, RefreshCw, Trash2, FilePlus, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { domainConfigs } from '@/lib/domain-configs'
import { assetToSelectionEntity, folderToSelectionEntity } from '@/lib/selection-actions'
import type { SelectionEntity } from '@/lib/selection-actions'
import { materializeReferenceFolders } from '@/lib/reference-folder-utils'

interface ContextMenuState {
  x: number
  y: number
  node: WorkspaceFileNode
}

interface WorkspaceSelectionEntry {
  id: string
  entity: SelectionEntity
  node: WorkspaceFileNode
  domainId?: DomainId
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

function folderNodeToAsset(node: WorkspaceFileNode, domainId: DomainId): Asset {
  return {
    id: node.id,
    name: node.name,
    type: 'text',
    department: domainId,
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

function findDomainIdForNode(
  node: WorkspaceFileNode,
  getDomainFiles: (id: DomainId) => WorkspaceFileNode[],
): DomainId | undefined {
  if (node.domainId) return node.domainId
  if (isDomainLandingNode(node.id)) return node.id

  for (const domId of ALL_DOMAIN_IDS) {
    if (findNodeById(getDomainFiles(domId), node.id)) {
      return domId
    }
  }

  return undefined
}

function isDomainLandingNode(nodeId: string): nodeId is DomainId {
  return Object.prototype.hasOwnProperty.call(DOMAIN_FOLDER_MAP, nodeId)
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

const ALL_DOMAIN_IDS = Object.keys(DOMAIN_FOLDER_MAP) as DomainId[]
const DOMAIN_FOLDER_IDS = new Set(Object.values(DOMAIN_FOLDER_MAP).map(d => d.id))

interface WorkspaceViewProps {
  /** Domain to display. When omitted, shows domain folder landing. */
  domainId?: DomainId
  /** URL path segments representing the drilled-down folder path */
  folderPath: string[]
  /** Workspace-level transient folder ID to auto-drill into on the landing page */
  landingFolderId?: string
}

export function WorkspaceView({ domainId, folderPath: urlPath, landingFolderId }: WorkspaceViewProps) {
  const router = useRouter()
  const isLanding = !domainId
  const { canAccess, sharesReceivedByMe, getInheritedGrants, filterByAccess } = useAccess()
  const { activePersona } = usePersona()
  const { getCollection, filterAssets: filterCollectionAssets, scopedAssets, ensureAssetsLoaded } = useCollections()
  const { layout, setLayout, cardSize, setCardSize, viewMode, setViewMode, sidePanelOpen: showPanel, setSidePanelOpen: setShowPanel, showTags, setShowTags, metadataFields, setMetadataField } = useViewPreferences()
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(showPanel, setShowPanel)
  const { scrollRef, headerRef, showCompactBar } = useCompactBar()
  const isMobile = useIsMobile()
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
  } = useWorkspaceState(domainId ?? 'art-design')

  const { resolveShareTarget } = useShareAsCollection()
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [accessModalNode, setAccessModalNode] = useState<WorkspaceFileNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [newFolderParentPath, setNewFolderParentPath] = useState<string[]>([])
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | null>(null)
  const [landingDrillPath, setLandingDrillPath] = useState<WorkspaceFileNode[]>([])
  const { createFolder: fileTreeCreateFolder, createFile: fileTreeCreateFile, deleteNode: fileTreeDeleteNode, renameNode: fileTreeRenameNode, tree: fileTree, getDomainFiles: getFileTreeDomainFiles } = useFileTree()
  const resolveReferenceNodes = useCallback((nodes: WorkspaceFileNode[]) => {
    return materializeReferenceFolders(nodes, {
      getCollection,
      filterAssets: filterCollectionAssets,
      filterByAccess,
      scopedAssets,
    }) as WorkspaceFileNode[]
  }, [getCollection, filterCollectionAssets, filterByAccess, scopedAssets])
  // Workspace-level folders: top-level folders created by user (exclude domain folders already rendered via domainNodes)
  const landingFolders = useMemo(() => {
    return resolveReferenceNodes(
      fileTree.filter((f) => f.type === 'folder' && !DOMAIN_FOLDER_IDS.has(f.id)) as WorkspaceFileNode[],
    )
  }, [fileTree, resolveReferenceNodes])

  // Shared folder/collection nodes injected into the workspace landing
  const sharedFolderNodes: WorkspaceFileNode[] = useMemo(() => {
    if (!isLanding) return []
    // Only show folders shared from OTHER domains (not your own domain's internal folders)
    return sharesReceivedByMe
      .filter(e => {
        if (e.resourceType !== 'folder') return false
        if (DOMAIN_FOLDER_IDS.has(e.resourceId)) return false
        // Skip folders within the user's own domain
        if (activePersona?.domainId && e.departmentId === activePersona.domainId) return false
        return true
      })
      .map((entry) => {
        const domainFiles = entry.departmentId ? (getFileTreeDomainFiles(entry.departmentId) as WorkspaceFileNode[]) : []
        const sourceNode = findNodeById(domainFiles, entry.resourceId)
        if (sourceNode?.type === 'folder') {
          return {
            ...sourceNode,
            domainId: entry.departmentId,
          }
        }

        return {
          id: entry.resourceId,
          name: entry.label,
          type: 'folder' as const,
          domainId: entry.departmentId,
          modifiedAt: entry.grantedAt,
          children: [],
        }
      })
  }, [isLanding, sharesReceivedByMe, activePersona, getFileTreeDomainFiles])

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
    if (isLanding && isDomainLandingNode(node.id)) {
      return DOMAIN_FOLDER_MAP[node.id].id
    }
    if (isReferenceFolder(node)) {
      return node.reference.resourceId
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

  const handleUploadFiles = useCallback((files: FileList, folderId: string) => {
    Array.from(files).forEach(file => {
      fileTreeCreateFile(folderId, file.name, file.name.split('.').pop())
    })
  }, [fileTreeCreateFile])

  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' },
  ])
  const domainAccessible = domainId ? canAccess(DOMAIN_FOLDER_MAP[domainId].id) : true

  // Domain folder nodes for landing view — real WorkspaceFileNode shapes
  const domainNodes: WorkspaceFileNode[] = useMemo(() => {
    if (!isLanding) return []
    return ALL_DOMAIN_IDS
      .filter((id) => canAccess(DOMAIN_FOLDER_MAP[id].id))
      .map((id) => ({
        id,
        name: domainConfigs[id].name,
        type: 'folder' as const,
        domainId: id,
        children: getFileTreeDomainFiles(id) as WorkspaceFileNode[],
      }))
  }, [isLanding, canAccess, getFileTreeDomainFiles])

  // Resolve URL path segments to actual folder nodes
  const resolvedFolderPath = useMemo(
    () => resolvePathSegments(urlPath, processedFiles),
    [urlPath, processedFiles],
  )

  // Sync breadcrumb extras for domain routes and landing-scoped shared/workspace folders.
  useEffect(() => {
    const extras: { label: string; href?: string; onClick?: () => void }[] = []

    if (domainId) {
      extras.push({ label: 'Workspace', href: '/nextgen/workspace' })
      const domName = domainConfigs[domainId]?.name ?? domainId
      if (resolvedFolderPath.length > 0) {
        extras.push({ label: domName, href: `/nextgen/workspace/${domainId}` })
      } else {
        extras.push({ label: domName })
      }

      // Folder path crumbs
      resolvedFolderPath.forEach((folder, i) => {
        const isLast = i === resolvedFolderPath.length - 1
        extras.push({
          label: folder.name,
          onClick: !isLast
            ? () => {
                const pathSegments = resolvedFolderPath.slice(0, i + 1).map((f) => f.id)
                router.push(`/nextgen/workspace/${domainId}/${pathSegments.join('/')}`)
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
  }, [domainId, resolvedFolderPath, landingFolderId, landingDrillPath, setBreadcrumbExtras, clearBreadcrumbExtras, router])

  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date-added', label: 'Date Added' },
    { value: 'date-opened', label: 'Date Opened' },
    { value: 'date-modified', label: 'Date Modified' },
    { value: 'size', label: 'Size' },
    { value: 'kind', label: 'Kind' },
  ]

  const filterOptions: { id: string; label: string }[] = []

  // Unified grid items — works for both landing and domain views
  // Domain nodes on landing are always shown (no locking); folder-level filtering applies within domains
  const currentGridItems: WorkspaceFileNode[] = useMemo(() => {
    let items: WorkspaceFileNode[]
    if (isLanding) {
      const currentLandingFolder = landingDrillPath[landingDrillPath.length - 1]
      if (currentLandingFolder) {
        items = currentLandingFolder.children ?? []
      } else {
        return [...domainNodes, ...sharedFolderNodes, ...landingFolders]
      }
    } else if (resolvedFolderPath.length === 0) {
      items = processedFiles
    } else {
      const current = resolvedFolderPath[resolvedFolderPath.length - 1]
      items = current.children ?? []
    }
    // Apply access filtering to both folders and files
    return items.filter((node) => {
      if (isLanding && isDomainLandingNode(node.id)) return true
      if (canAccess(getAclResourceId(node))) return true
      // Not accessible — show only if persona can see restricted (folders only, files stay hidden)
      if (node.type === 'folder') return activePersona?.role === 'manager'
      return false
    })
  }, [isLanding, landingDrillPath, domainNodes, sharedFolderNodes, landingFolders, processedFiles, resolvedFolderPath, canAccess, activePersona, getAclResourceId])

  // Access-filtered total file count for compact bar
  const filteredFileCount = useMemo(
    () => countAccessibleFiles(processedFiles, canAccess),
    [processedFiles, canAccess],
  )

  const buildSelectionEntry = useCallback((node: WorkspaceFileNode): WorkspaceSelectionEntry => {
    const nodeDomainId = domainId
      ?? findDomainIdForNode(node, getFileTreeDomainFiles)
      ?? (node.type === 'file' ? (activePersona?.domainId ?? ALL_DOMAIN_IDS[0]) : undefined)

    if (node.type === 'file') {
      const asset = assetBySourceFileId.get(node.id) ?? folderNodeToAsset(node, nodeDomainId)
      return {
        id: asset.id,
        entity: assetToSelectionEntity(asset, { resourceId: node.id }),
        node,
        domainId: nodeDomainId,
        asset,
      }
    }

    return {
      id: node.id,
      entity: folderToSelectionEntity({
        id: node.id,
        resourceId: getAclResourceId(node),
        label: node.name,
        domainId: nodeDomainId,
      }),
      node,
      domainId: nodeDomainId,
    }
  }, [domainId, getFileTreeDomainFiles, activePersona, assetBySourceFileId, getAclResourceId])

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

  const workspaceLocationKey = `${domainId ?? 'landing'}:${landingFolderId ?? ''}:${urlPath.join('/')}`
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
      router.push(`/nextgen/workspace/${domainId}/${newPath.join('/')}`)
    }
  }, [domainId, isLanding, landingFolderId, landingFolderIds, router, sharedFolderIds, urlPath])
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
      if (isReferenceFolder(contextMenu.node)) {
        return []
      }
      return [
        {
          label: 'New Folder',
          icon: <FolderPlus className="w-4 h-4" />,
          onClick: () => {
            setNewFolderParentPath([...urlPath, contextMenu.node.id])
            setNewFolderModalOpen(true)
          },
        },
        {
          label: 'Upload',
          icon: <Upload className="w-4 h-4" />,
          onClick: () => {
            setUploadTargetFolderId(contextMenu.node.id)
            uploadInputRef.current?.click()
          },
        },
        {
          label: 'New File',
          icon: <FilePlus className="w-4 h-4" />,
          onClick: () => {
            const names = ['SEQ010_SH040_comp_v1.exr', 'hero_closeup_final.dpx', 'ambience_pit_lane.wav', 'grade_pass_02.mov', 'concept_sketch_v3.psd', 'lens_calibration_data.csv']
            fileTreeCreateFile(contextMenu.node.id, names[Math.floor(Math.random() * names.length)])
          },
        },
        {
          label: managedFolderIds.has(contextMenu.node.id) ? 'Disable Sync' : 'Enable Sync',
          icon: <RefreshCw className="w-4 h-4" />,
          onClick: () => toggleManagedZone(contextMenu.node.id),
          dividerAfter: true,
        },
        {
          label: 'Manage Access',
          icon: <Settings className="w-4 h-4" />,
          onClick: () => setAccessModalNode(contextMenu.node),
        },
        {
          label: 'Delete',
          icon: <Trash2 className="w-4 h-4" />,
          onClick: () => fileTreeDeleteNode(contextMenu.node.id),
        },
      ]
    }
    return []
  })()

  const isInsideFolder = resolvedFolderPath.length > 0
  const currentFolder = isInsideFolder ? resolvedFolderPath[resolvedFolderPath.length - 1] : null
  const domainName = domainId ? (domainConfigs[domainId]?.name ?? domainId) : 'Workspace'

  // Default panel context: show current folder or domain when nothing is explicitly selected.
  // On the landing page, domain cards use domain ids for routing, but ACL lives on the
  // domain wrapper folder ids from DOMAIN_FOLDER_MAP.
  const landingDrillFolder = landingDrillPath[landingDrillPath.length - 1] ?? null

  // Context node: what the user selected, or failing that, the folder they're currently in.
  // One concept, one priority chain: selection > current folder > current location root.
  const currentLocationNode: WorkspaceFileNode | null = useMemo(() => {
    // Inside a domain subfolder
    if (currentFolder) return currentFolder
    // Inside a workspace-level folder (landing drill-down)
    if (landingDrillFolder) return landingDrillFolder
    // At a domain root
    if (domainId) {
      return {
        id: DOMAIN_FOLDER_MAP[domainId].id,
        name: domainName,
        type: 'folder' as const,
        domainId,
        children: processedFiles,
      }
    }
    return null
  }, [currentFolder, landingDrillFolder, domainId, domainName, processedFiles])

  const effectiveNode: WorkspaceFileNode | null = useMemo(() => {
    if (primarySelectionEntry) {
      const selectedNode = primarySelectionEntry.node
      // Landing domain cards represent a domain root, not the card node itself
      if (isLanding && Object.prototype.hasOwnProperty.call(DOMAIN_FOLDER_MAP, selectedNode.id)) {
        const selectedDomainId = selectedNode.id as DomainId
        return {
          id: DOMAIN_FOLDER_MAP[selectedDomainId].id,
          name: selectedNode.name,
          type: 'folder' as const,
          domainId: selectedDomainId,
          children: getFileTreeDomainFiles(selectedDomainId) as WorkspaceFileNode[],
        }
      }
      return selectedNode
    }
    return currentLocationNode
  }, [primarySelectionEntry, isLanding, currentLocationNode, getFileTreeDomainFiles])
  const selectedNodeDomainId = primarySelectionEntry?.domainId
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
  const effectiveNodeDomainId = useMemo(() => {
    return effectiveNode
      ? domainId ?? findDomainIdForNode(effectiveNode, getFileTreeDomainFiles)
      : undefined
  }, [effectiveNode, domainId, getFileTreeDomainFiles])
  const pageTitle = landingDrillFolder?.name ?? currentFolder?.name ?? domainName
  const isGridView = viewMode === 'grid'
  const explorerViewMode = (isGridView ? 'list' : viewMode) as FileViewMode

  // Allow access if user can access the domain root OR the specific folder they're navigating to
  const targetFolderId = urlPath.length > 0 ? urlPath[urlPath.length - 1] : null
  const folderAccessible = targetFolderId ? canAccess(targetFolderId) : false

  if (!isLanding && !domainAccessible && !folderAccessible) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <EmptyState
                title="Access Restricted"
                message={`You don't have workspace access to ${domainName}. Shared items will still appear in Search, Collections, or Inbox.`}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex">
        <div ref={scrollRef} className={cn('flex-1 min-w-0 min-h-0', isGridView ? 'overflow-auto' : 'flex flex-col overflow-hidden')}>
          <CompactBar
            visible={showCompactBar}
            title={pageTitle}
            count={isLanding ? domainNodes.length : filteredFileCount}
            countLabel={isLanding ? 'domain' : 'file'}
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
                {/* Mobile nav */}
                <MobileToolbar title={pageTitle} actions={
                  <Button
                    variant="icon"
                    size="icon"
                    aria-label={panelOpen ? 'Close panel' : 'Open panel'}
                    onClick={togglePanel}
                    className={cn(panelOpen && 'bg-surface-3')}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                } />
                <div className="flex items-center gap-2 md:hidden">
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
                    showTags={showTags}
                    onShowTagsChange={setShowTags}
                    metadataFields={metadataFields}
                    onMetadataFieldChange={setMetadataField}
                  />
                </div>

                {/* Header */}
                <div ref={headerRef} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <PageHeader title={pageTitle} hideTitleOnMobile />
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
                        showTags={showTags}
                        onShowTagsChange={setShowTags}
                        metadataFields={metadataFields}
                        onMetadataFieldChange={setMetadataField}
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
                        aria-label={panelOpen ? 'Close panel' : 'Open panel'}
                        onClick={togglePanel}
                        className={cn(panelOpen && 'bg-surface-3')}
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
                            const isRefFolder = isReferenceFolder(node)
                            const folderAccessible = isLanding && isDomainLandingNode(node.id)
                              ? canAccess(DOMAIN_FOLDER_MAP[node.id].id)
                              : canAccess(node.id)
                            const isRestricted = !folderAccessible && !isSharedFolder && !isRefFolder
                            const accessIcon = isRefFolder
                              ? <FolderSymlink className="w-3.5 h-3.5" />
                              : isSharedFolder
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
                                  : isMobile
                                    ? () => handleFolderDrilldown(node)
                                    : (e) => {
                                        const selectionEntry = selectionEntryById.get(node.id)
                                        if (selectionEntry) {
                                          handleSelectionClick(selectionEntry.entity, e as React.MouseEvent, currentGridSelectionEntities)
                                        }
                                      }
                                }
                                onDoubleClick={isLocked || isMobile ? undefined : () => handleFolderDrilldown(node)}
                                menuContent={isLocked || isRefFolder ? undefined : (
                                  <div className="py-1">
                                    <DropdownMenuItem icon={<FolderPlus className="w-4 h-4" />} label="New Folder" onClick={() => { setNewFolderParentPath([...urlPath, node.id]); setNewFolderModalOpen(true) }} />
                                    <DropdownMenuItem icon={<Upload className="w-4 h-4" />} label="Upload" onClick={() => {
                                      setUploadTargetFolderId(node.id)
                                      uploadInputRef.current?.click()
                                    }} />
                                    <DropdownMenuItem icon={<FilePlus className="w-4 h-4" />} label="New File" onClick={() => {
                                      const names = ['SEQ010_SH040_comp_v1.exr', 'hero_closeup_final.dpx', 'ambience_pit_lane.wav', 'grade_pass_02.mov', 'concept_sketch_v3.psd', 'lens_calibration_data.csv']
                                      fileTreeCreateFile(node.id, names[Math.floor(Math.random() * names.length)])
                                    }} />
                                    <DropdownMenuItem icon={<RefreshCw className="w-4 h-4" />} label={managedFolderIds.has(node.id) ? 'Disable Sync' : 'Enable Sync'} onClick={() => toggleManagedZone(node.id)} />
                                    <DropdownMenuDivider />
                                    <DropdownMenuItem icon={<Settings className="w-4 h-4" />} label="Manage Access" onClick={() => setAccessModalNode(node)} />
                                    <DropdownMenuItem icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={() => fileTreeDeleteNode(node.id)} destructive />
                                  </div>
                                )}
                              />
                            )
                          }
                          const workspaceAsset = assetBySourceFileId.get(node.id) ?? folderNodeToAsset(
                            node,
                            domainId
                              ?? findDomainIdForNode(node, getFileTreeDomainFiles)
                              ?? activePersona?.domainId
                              ?? ALL_DOMAIN_IDS[0],
                          )
                          return (
                            <AssetCard
                              key={node.id}
                              asset={workspaceAsset}
                              selected={selectedIds.has(workspaceAsset.id)}
                              primary={primaryId === workspaceAsset.id}
                              showTags={showTags}
                              metadataFields={metadataFields}
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
              className="flex-1 min-w-0 overflow-hidden"
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
        {primarySelectionEntry?.node.type === 'file' && selectedNodeDomainId && primarySelectionEntry.asset ? (
          <AssetDetailPanel
            asset={primarySelectionEntry.asset}
            open={panelOpen}
            onClose={() => { clearSelection(); closePanel() }}
            contextGroups={selectedFileContextGroups}
            onContextAssetClick={handlePanelAssetSwitch}
            activeContext={{ type: 'workspace' }}
          />
        ) : (
          <WorkspaceSidePanel
            node={effectiveNode}
            open={panelOpen}
            onClose={closePanel}
            domainId={effectiveNodeDomainId}
            folderVariant={
              false
                ? 'shared'
                : primarySelectionEntry?.node && sharedFolderIds.has(primarySelectionEntry.node.id)
                ? 'shared'
                : primarySelectionEntry?.node && !canAccess(getAclResourceId(primarySelectionEntry.node))
                  ? 'restricted'
                  : undefined
            }
            onDelete={(nodeId) => fileTreeDeleteNode(nodeId)}
            onRename={(nodeId, newName) => fileTreeRenameNode(nodeId, newName)}
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
      <input
        ref={uploadInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && uploadTargetFolderId) {
            handleUploadFiles(e.target.files, uploadTargetFolderId)
          }
          e.target.value = ''
        }}
      />
      <NewFolderModal
        open={newFolderModalOpen}
        onOpenChange={setNewFolderModalOpen}
        onCreate={handleCreateFolder}
      />
      {accessModalNode && (() => {
        const nodeId = getAclResourceId(accessModalNode)
        const rawRef: ResourceRef = {
          id: nodeId,
          type: accessModalNode.type === 'folder' ? 'folder' : 'asset',
          domainId,
        }
        // Resolve folders to workspace-bound collections — same path as selection bar Share
        const resolved = accessModalNode.type === 'folder'
          ? resolveShareTarget(rawRef, accessModalNode.name)
          : null
        const modalRef = resolved
          ? { id: resolved.resourceRef.id, type: resolved.resourceRef.type, domainId } as ResourceRef
          : rawRef
        const modalId = modalRef.id
        return (
          <AccessModal
            open
            onClose={() => setAccessModalNode(null)}
            resourceId={modalId}
            resourceRef={modalRef}
            inheritedGrants={resolved ? undefined : getInheritedGrants(nodeId).map(({ grant, fromResourceName }) => ({
              grant,
              fromResourceName,
            }))}
            title={accessModalNode.name}
          />
        )
      })()}
    </div>
  )
}
