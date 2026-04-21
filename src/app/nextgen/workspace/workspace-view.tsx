'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { cn, formatDate } from '@/lib/utils'
import {
  Stack,
  AssetCard,
  CardGrid,
  PageHeader,
  EmptyState,
  AppearanceDropdown,
  SortDropdown,
  HawkinsSearch,
  Button,
  FileExplorer,
  CollectionCard,
  ContextualActionBar,
  NewFolderModal,
  AccessModal,
  MobileToolbar,
  Dropdown,
  DropdownMenuItem,
  DropdownMenuDivider,
  MoveWarningModal,
  Tag,
} from '@/components/ui'
import type { ResourceRef } from '@/lib/grants'
import { profileLabel } from '@/lib/grants'
import { TEAMS, isUserWorkspaceOwner, getDomainOwnerTeam } from '@/lib/teams'
import { PERSONAS } from '@/lib/personas'
import { ShareIcon } from '@/components/ui/share-icon'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import type { FileNode, FileViewMode } from '@/components/ui/file-explorer'
import { ContextMenu } from '@/components/ui/context-menu'
import type { ContextMenuItem } from '@/components/ui/context-menu'
import { getGridColumns, useViewPreferences, useResourceSelection, useFileTree, useAccess, usePersona, useMobilePanel, useCollections } from '@/hooks'

import type { DomainId, ProductionDomainId } from '@/components/department/types'
import { DOMAIN_FOLDER_MAP, isReferenceFolder, SHARED_MOUNT_FOLDER_ID } from '@/lib/workspace-data'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { generateAssetInstances, promotedInstanceToAsset } from '@/lib/asset-instances'
import type { Asset } from '@/lib/data'
import { WorkspaceSidePanel } from '@/components/department/WorkspaceSidePanel'
import { AssetDetailPanel } from '@/components/ui/asset-detail-panel'
import { getContextAssetGroups } from '@/lib/context-relationships'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { List, Columns, LayoutGrid, PanelRight, Info, Lock, Users, FolderPlus, FolderSymlink, Share2, RefreshCw, Trash2, FilePlus, Upload, FolderInput, HardDriveDownload, Download, Check, Minus, MoreVertical, Link2, Pencil, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { assetToSelectionEntity, folderToSelectionEntity } from '@/lib/selection-actions'
import type { SelectionEntity } from '@/lib/selection-actions'
import { materializeReferenceFolders } from '@/lib/reference-folder-utils'
import { collectAccessibleWorkspaceRoots, collectSharedFolderIds } from '@/lib/workspace-roots'
import { useToast } from '@/components/ui/toast'
import { SelectAllRow } from '@/components/ui/select-all-row'

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

function folderNodeToAsset(node: WorkspaceFileNode, domainId?: DomainId): Asset {
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

function applyManagedZoneState(
  nodes: WorkspaceFileNode[],
  parentIsManaged: boolean = true,
): WorkspaceFileNode[] {
  return nodes.map((node) => {
    if (node.type === 'file') {
      return {
        ...node,
        managedZone: parentIsManaged || undefined,
      }
    }

    const isManaged = parentIsManaged && node.zone !== 'wip'
    return {
      ...node,
      managedZone: isManaged || undefined,
      children: node.children ? applyManagedZoneState(node.children, isManaged) : undefined,
    }
  })
}

function collectManagedFolderIds(nodes: WorkspaceFileNode[]): Set<string> {
  const managedIds = new Set<string>()

  const walk = (folders: WorkspaceFileNode[]) => {
    for (const folder of folders) {
      if (folder.type !== 'folder') continue
      if (folder.managedZone) managedIds.add(folder.id)
      if (folder.children) walk(folder.children)
    }
  }

  walk(nodes)
  return managedIds
}

function findDomainIdForNode(
  node: WorkspaceFileNode,
  getDomainFiles: (id: DomainId) => WorkspaceFileNode[],
): DomainId | undefined {
  if (node.domainId) return node.domainId
  const rootDomainId = ROOT_FOLDER_ID_TO_DOMAIN[node.id]
  if (rootDomainId) return rootDomainId

  for (const domId of ALL_DOMAIN_IDS) {
    if (findNodeById(getDomainFiles(domId), node.id)) {
      return domId
    }
  }

  return undefined
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

const ALL_DOMAIN_IDS = Object.keys(DOMAIN_FOLDER_MAP) as ProductionDomainId[]
const ROOT_FOLDER_ID_TO_DOMAIN = Object.fromEntries(
  Object.entries(DOMAIN_FOLDER_MAP).map(([domId, folder]) => [folder.id, domId as DomainId]),
) as Record<string, DomainId>

type AccessTagInfo =
  | { kind: 'owner'; subtitle: string }
  | { kind: 'recipient'; subtitle: string }

interface WorkspaceViewProps {
  /** URL path segments representing the drilled-down folder path */
  folderPath: string[]
  /** Accessible workspace root folder ID */
  landingFolderId?: string
}

export function WorkspaceView({ folderPath: urlPath, landingFolderId }: WorkspaceViewProps) {
  const router = useRouter()
  const { canAccess, canShare: canShareResource, canEdit: canEditResource, getInheritedGrants, getResourceGrants, isSensitiveAsset } = useAccess()
  const { activePersona } = usePersona()
  const { scopedAssets, ensureAssetsLoaded } = useCollections()
  const { layout, setLayout, cardSize, setCardSize, viewMode, setViewMode, sidePanelOpen: showPanel, setSidePanelOpen: setShowPanel, showTags, setShowTags, metadataFields, setMetadataField } = useViewPreferences()
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(showPanel, setShowPanel)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const {
    selectedIds,
    primaryId,
    handleSelectionClick,
    selectOnly,
    selectAll,
    clearSelection,
  } = useResourceSelection<{ id: string }>()
  const { setBreadcrumbExtras, clearBreadcrumbExtras, setBreadcrumbActions, clearBreadcrumbActions } = useBreadcrumbExtras()

  const {
    toggleManagedZone,
    createFolder: fileTreeCreateFolder,
    createFile: fileTreeCreateFile,
    createReferenceFolder: fileTreeCreateReferenceFolder,
    deleteNode: fileTreeDeleteNode,
    renameNode: fileTreeRenameNode,
    tree: fileTree,
    getDomainFiles: getFileTreeDomainFiles,
    getMoveImpact,
    confirmMove,
    createFileReference,
  } = useFileTree()
  const { showToast } = useToast()

  const [accessModalNode, setAccessModalNode] = useState<WorkspaceFileNode | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: WorkspaceFileNode } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [newFolderParentPath, setNewFolderParentPath] = useState<string[]>([])
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | null>(null)
  const [landingDrillPath, setLandingDrillPath] = useState<WorkspaceFileNode[]>([])
  const [moveWarningState, setMoveWarningState] = useState<{
    open: boolean
    nodeId: string
    fileName: string
    targetParentId: string
    impactedFolders: { id: string; name: string; grantCount: number }[]
  } | null>(null)
  const resolveReferenceNodes = useCallback((nodes: WorkspaceFileNode[]) => {
    return materializeReferenceFolders(nodes, {
      getFolderChildren: (resourceId) => {
        const sourceNode = findNodeById(fileTree as WorkspaceFileNode[], resourceId)
        return sourceNode?.type === 'folder' ? sourceNode.children : undefined
      },
    }) as WorkspaceFileNode[]
  }, [fileTree])
  const workspaceTreeRoots = useMemo(() => {
    return resolveReferenceNodes(
      fileTree.filter((node): node is WorkspaceFileNode => node.type === 'folder' && node.id !== SHARED_MOUNT_FOLDER_ID),
    )
  }, [fileTree, resolveReferenceNodes])
  const managedWorkspaceTree = useMemo(
    () => applyManagedZoneState(workspaceTreeRoots),
    [workspaceTreeRoots],
  )
  const workspaceRootNodes = useMemo(() => {
    return collectAccessibleWorkspaceRoots(managedWorkspaceTree, canAccess)
  }, [managedWorkspaceTree, canAccess])
  const managedFolderIds = useMemo(
    () => collectManagedFolderIds(managedWorkspaceTree),
    [managedWorkspaceTree],
  )
  const sharedFolderIds = useMemo(
    () => collectSharedFolderIds(managedWorkspaceTree, getResourceGrants),
    [managedWorkspaceTree, getResourceGrants],
  )
  const assetBySourceFileId = useMemo(() => {
    return new Map(
      ALL_DOMAIN_IDS.flatMap((domainId) =>
        generateAssetInstances(getFileTreeDomainFiles(domainId), domainId).map((instance) => [
          instance.sourceFileId,
          promotedInstanceToAsset(instance),
        ] as const),
      ),
    )
  }, [getFileTreeDomainFiles])
  const folderThumbnails = useMemo(() => {
    const map = new Map<string, string[]>()
    const walk = (nodes: WorkspaceFileNode[], ancestorIds: string[]) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          const asset = assetBySourceFileId.get(node.id)
          if (asset?.thumbnail) {
            for (const folderId of ancestorIds) {
              const existing = map.get(folderId)
              if (!existing) map.set(folderId, [asset.thumbnail])
              else if (existing.length < 4) existing.push(asset.thumbnail)
            }
          }
        }
        if (node.type === 'folder' && node.children) {
          walk(node.children as WorkspaceFileNode[], [...ancestorIds, node.id])
        }
      }
    }
    walk(fileTree as WorkspaceFileNode[], [])
    return map
  }, [fileTree, assetBySourceFileId])

  const getAclResourceId = useCallback((node: WorkspaceFileNode): string => {
    if (isReferenceFolder(node)) {
      return node.reference.resourceId
    }
    return node.id
  }, [])

  const requestedWorkspaceRoot = useMemo(() => {
    if (!landingFolderId) return null
    return findNodeById(managedWorkspaceTree, landingFolderId)
  }, [landingFolderId, managedWorkspaceTree])
  const activeWorkspaceRoot = useMemo(() => {
    if (!landingFolderId) return null
    return workspaceRootNodes.find((candidate) => candidate.id === landingFolderId) ?? null
  }, [landingFolderId, workspaceRootNodes])

  // Auto-drill into a workspace root folder when navigated to via URL
  useEffect(() => {
    if (!landingFolderId) {
      setLandingDrillPath([])
      return
    }

    const folder = activeWorkspaceRoot
    if (!folder) {
      setLandingDrillPath([])
      return
    }

    const nestedFolders = resolvePathSegments(urlPath, folder.children ?? [])
    setLandingDrillPath([folder, ...nestedFolders])
  }, [landingFolderId, activeWorkspaceRoot, urlPath])

  const handleCreateFolder = useCallback((name: string) => {
    const parentId = newFolderParentPath[newFolderParentPath.length - 1]
      ?? landingDrillPath[landingDrillPath.length - 1]?.id
      ?? null
    fileTreeCreateFolder(parentId, name)
  }, [fileTreeCreateFolder, newFolderParentPath, landingDrillPath])

  const handleUploadFiles = useCallback((files: FileList, folderId: string) => {
    Array.from(files).forEach(file => {
      fileTreeCreateFile(folderId, file.name, file.name.split('.').pop())
    })
  }, [fileTreeCreateFile])

  const handleMountFolderToDrive = useCallback((node: WorkspaceFileNode) => {
    if (node.type !== 'folder' || node.id === SHARED_MOUNT_FOLDER_ID || isReferenceFolder(node)) return

    fileTreeCreateReferenceFolder(SHARED_MOUNT_FOLDER_ID, node.name, {
      resourceId: node.id,
      resourceType: 'folder',
      domainId: findDomainIdForNode(node, getFileTreeDomainFiles),
    })
    showToast(`Mounted "${node.name}" to /Shared/${node.name}`)
  }, [fileTreeCreateReferenceFolder, getFileTreeDomainFiles, showToast])

  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' },
  ])
  const currentWorkspaceFolder = landingDrillPath[landingDrillPath.length - 1] ?? activeWorkspaceRoot

  // Sync breadcrumb extras for the folder-root workspace model.
  useEffect(() => {
    const extras: { label: string; href?: string; onClick?: () => void }[] = []

    if (landingFolderId && landingDrillPath.length > 0) {
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
  }, [landingFolderId, landingDrillPath, setBreadcrumbExtras, clearBreadcrumbExtras])


  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date-added', label: 'Date Added' },
    { value: 'date-opened', label: 'Date Opened' },
    { value: 'date-modified', label: 'Date Modified' },
    { value: 'size', label: 'Size' },
    { value: 'kind', label: 'Kind' },
  ]

  const filterOptions: { id: string; label: string }[] = []

  // Unified grid items for the folder-root workspace model.
  const currentGridItems: WorkspaceFileNode[] = useMemo(() => {
    const items = currentWorkspaceFolder
      ? currentWorkspaceFolder.children ?? []
      : workspaceRootNodes

    return items.filter((node) => {
      if (canAccess(getAclResourceId(node))) return true
      if (node.type === 'folder') return activePersona?.role === 'manager'
      return false
    })
  }, [currentWorkspaceFolder, workspaceRootNodes, canAccess, activePersona, getAclResourceId])

  const filteredFileCount = useMemo(
    () => countAccessibleFiles(currentGridItems, canAccess),
    [currentGridItems, canAccess],
  )

  const buildSelectionEntry = useCallback((node: WorkspaceFileNode): WorkspaceSelectionEntry => {
    const nodeDomainId = findDomainIdForNode(node, getFileTreeDomainFiles)
      ?? (node.type === 'file' ? activePersona?.domainId : undefined)

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
  }, [getFileTreeDomainFiles, activePersona, assetBySourceFileId, getAclResourceId])

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

  const workspaceLocationKey = `${landingFolderId ?? 'landing'}:${urlPath.join('/')}`
  useEffect(() => {
    clearSelection()
  }, [workspaceLocationKey, clearSelection])

  const handleNodeClick = useCallback((fileNode: FileNode) => {
    const entry = selectionEntryByNodeId.get(fileNode.id)
    if (entry) {
      selectOnly(entry.entity)
    }
  }, [selectionEntryByNodeId, selectOnly])


  const handleFolderDrilldown = useCallback((folder: WorkspaceFileNode) => {
    if (landingFolderId) {
      router.push(buildLandingFolderHref(landingFolderId, [...urlPath, folder.id]))
      return
    }

    router.push(buildLandingFolderHref(folder.id))
  }, [landingFolderId, router, urlPath])
  const handlePanelAssetSwitch = useCallback((nextAsset: Asset) => {
    const selectionEntry = selectionEntryById.get(nextAsset.id)
    if (selectionEntry) {
      selectOnly(selectionEntry.entity)
      setShowPanel(true)
      return
    }
    router.push(`/nextgen/assets/${nextAsset.id}`)
  }, [selectionEntryById, selectOnly, setShowPanel, router])

  const handleMoveFile = useCallback((node: WorkspaceFileNode) => {
    const fallbackRootFolders = fileTree.filter(
      (candidate): candidate is WorkspaceFileNode => candidate.type === 'folder' && candidate.id !== SHARED_MOUNT_FOLDER_ID,
    )
    const targetParentId = currentWorkspaceFolder?.id
      ?? workspaceRootNodes[0]?.id
      ?? fallbackRootFolders[0]?.id

    if (!targetParentId) return

    const sharedFoldersForImpact: { id: string; name: string }[] = []
    const collectSharedFolders = (nodes: WorkspaceFileNode[]) => {
      for (const candidate of nodes) {
        if (candidate.type !== 'folder') continue
        if (getResourceGrants(candidate.id).length > 0) {
          sharedFoldersForImpact.push({ id: candidate.id, name: candidate.name })
        }
        if (candidate.children) collectSharedFolders(candidate.children as WorkspaceFileNode[])
      }
    }
    collectSharedFolders(managedWorkspaceTree)

    const getGrantCount = (folderId: string) => getResourceGrants(folderId).length

    const impact = getMoveImpact(node.id, sharedFoldersForImpact, getGrantCount)

    if (impact.impactedFolders.length > 0) {
      setMoveWarningState({
        open: true,
        nodeId: node.id,
        fileName: node.name,
        targetParentId,
        impactedFolders: impact.impactedFolders,
      })
    } else {
      // No impact, move directly
      confirmMove(node.id, targetParentId)
    }
  }, [fileTree, currentWorkspaceFolder, workspaceRootNodes, managedWorkspaceTree, getResourceGrants, getMoveImpact, confirmMove])

  const handleConfirmMove = useCallback(() => {
    if (moveWarningState) {
      confirmMove(moveWarningState.nodeId, moveWarningState.targetParentId)
      setMoveWarningState(null)
    }
  }, [moveWarningState, confirmMove])

  const workspaceRootMissing = Boolean(landingFolderId && !requestedWorkspaceRoot)
  const requestedWorkspaceAccessible = requestedWorkspaceRoot
    ? canAccess(getAclResourceId(requestedWorkspaceRoot))
    : true

  // Context node: what the user selected, or failing that, the folder they're currently in.
  const currentLocationNode: WorkspaceFileNode | null = useMemo(() => {
    return currentWorkspaceFolder ?? null
  }, [currentWorkspaceFolder])

  const effectiveNode: WorkspaceFileNode | null = useMemo(() => {
    if (primarySelectionEntry) return primarySelectionEntry.node
    return currentLocationNode
  }, [primarySelectionEntry, currentLocationNode])
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
      ? findDomainIdForNode(effectiveNode, getFileTreeDomainFiles)
      : undefined
  }, [effectiveNode, getFileTreeDomainFiles])
  const pageTitle = currentLocationNode?.name ?? 'Workspace'

  const [pageAccessModalOpen, setPageAccessModalOpen] = useState(false)

  const pageAccessResourceRef: ResourceRef | undefined = currentLocationNode ? {
    id: getAclResourceId(currentLocationNode),
    type: 'folder',
    domainId: effectiveNodeDomainId,
  } : undefined

  const canShareCurrentFolder = pageAccessResourceRef ? canShareResource(pageAccessResourceRef) : false
  const canEditCurrentFolder = currentLocationNode ? canEditResource(getAclResourceId(currentLocationNode)) : true
  const canMountCurrentFolder = Boolean(
    currentLocationNode
    && currentLocationNode.type === 'folder'
    && currentLocationNode.id !== SHARED_MOUNT_FOLDER_ID
    && !isReferenceFolder(currentLocationNode),
  )

  const isCurrentFolderOwner = useMemo(() => {
    if (!currentLocationNode || !activePersona) return true
    const nodeId = getAclResourceId(currentLocationNode)
    return isUserWorkspaceOwner(activePersona.id, nodeId, effectiveNodeDomainId)
  }, [currentLocationNode, activePersona, getAclResourceId, effectiveNodeDomainId])

  const pageAccessTag = useMemo((): AccessTagInfo | null => {
    if (!currentLocationNode || currentLocationNode.type !== 'folder') return null
    const nodeId = getAclResourceId(currentLocationNode)
    const direct = getResourceGrants(nodeId)
    const inherited = getInheritedGrants(nodeId)
    const allGrants = [...direct, ...inherited.map(({ grant }) => grant)]
    if (allGrants.length === 0) return null

    // Recipient: show who shared it
    if (!isCurrentFolderOwner) {
      const grantor = direct.length > 0 ? PERSONAS.find(p => p.id === direct[0].grantedByUserId) : undefined
      const sharedBy = grantor?.name ?? getDomainOwnerTeam(effectiveNodeDomainId ?? '')?.name ?? 'someone'
      return { kind: 'recipient', subtitle: `Shared by ${sharedBy} · View only` }
    }

    // Owner: show how many people it's shared with
    const sharedGrants = allGrants.filter((g) => {
      const p = g.principal
      return p.type !== 'team' || !TEAMS.find((t) => t.id === p.teamId)?.rootFolderId
    })
    if (sharedGrants.length === 0) return null
    return { kind: 'owner', subtitle: `Shared with ${sharedGrants.length} ${sharedGrants.length === 1 ? 'person' : 'people'}` }
  }, [currentLocationNode, getAclResourceId, getResourceGrants, getInheritedGrants, isCurrentFolderOwner, effectiveNodeDomainId])

  const shareBanner = useMemo(() => {
    if (!currentLocationNode || isCurrentFolderOwner) return null
    const nodeId = getAclResourceId(currentLocationNode)
    const direct = getResourceGrants(nodeId)
    const inherited = getInheritedGrants(nodeId)
    const allGrants = [...direct, ...inherited.map(({ grant }) => grant)]

    const grantWithNote = allGrants.find((g) => g.note)
    if (!grantWithNote) return null

    const sharer = PERSONAS.find((p) => p.id === grantWithNote.grantedByUserId)
    return {
      note: grantWithNote.note!,
      sharerName: sharer?.name,
      date: grantWithNote.grantedAt,
    }
  }, [currentLocationNode, isCurrentFolderOwner, getAclResourceId, getResourceGrants, getInheritedGrants])

  const buildFolderContextMenuItems = useCallback((node: WorkspaceFileNode): ContextMenuItem[] => {
    const isRefFolder = isReferenceFolder(node)
    const canEdit = canEditResource(getAclResourceId(node))
    const items: ContextMenuItem[] = [
      {
        label: 'Share',
        icon: <ShareIcon className="w-4 h-4" />,
        onClick: () => setAccessModalNode(node),
      },
      {
        label: 'Copy link',
        icon: <Link2 className="w-4 h-4" />,
        onClick: () => {
          const href = `${window.location.origin}${buildLandingFolderHref(landingFolderId ?? node.id, landingFolderId ? [...urlPath, node.id] : [])}`
          navigator.clipboard.writeText(href)
          showToast('Link copied')
        },
      },
      {
        label: 'Download',
        icon: <Download className="w-4 h-4" />,
        onClick: () => showToast(`Downloading "${node.name}"...`),
      },
      {
        label: 'Mount to Drive',
        icon: <HardDriveDownload className="w-4 h-4" />,
        onClick: () => handleMountFolderToDrive(node),
        dividerAfter: !isRefFolder && canEdit,
      },
    ]

    if (!isRefFolder && canEdit) {
      items.push(
        { label: 'Rename', icon: <Pencil className="w-4 h-4" />, onClick: () => fileTreeRenameNode(node.id, prompt('New name', node.name) ?? node.name) },
        { label: 'Copy to', icon: <FolderPlus className="w-4 h-4" />, onClick: () => showToast('Copy to not implemented yet') },
        { label: 'Move to', icon: <ArrowRight className="w-4 h-4" />, onClick: () => showToast('Move not implemented yet') },
        { label: 'View details', icon: <PanelRight className="w-4 h-4" />, onClick: () => { const entry = selectionEntryById.get(node.id); if (entry) { selectOnly(entry.entity); setShowPanel(true) } }, dividerAfter: true },
        { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => fileTreeDeleteNode(node.id) },
      )
    } else {
      items.push(
        { label: 'View details', icon: <PanelRight className="w-4 h-4" />, onClick: () => { const entry = selectionEntryById.get(node.id); if (entry) { selectOnly(entry.entity); setShowPanel(true) } } },
      )
    }

    return items
  }, [canEditResource, getAclResourceId, landingFolderId, urlPath, showToast, fileTreeRenameNode, fileTreeDeleteNode, selectionEntryById, selectOnly, setShowPanel, handleMountFolderToDrive])

  const buildAssetMenuItems = useCallback((node: WorkspaceFileNode, asset: Asset): ContextMenuItem[] => {
    const canEdit = canEditResource(node.id)
    const items: ContextMenuItem[] = [
      { label: 'Share', icon: <ShareIcon className="w-4 h-4" />, onClick: () => setAccessModalNode(node) },
      { label: 'Copy link', icon: <Link2 className="w-4 h-4" />, onClick: () => { navigator.clipboard.writeText(`${window.location.origin}/nextgen/assets/${asset.id}`); showToast('Link copied') } },
      { label: 'Download', icon: <Download className="w-4 h-4" />, onClick: () => showToast(`Downloading "${asset.name}"...`), dividerAfter: canEdit },
    ]
    if (canEdit) {
      items.push(
        { label: 'Copy to', icon: <FolderPlus className="w-4 h-4" />, onClick: () => showToast('Copy to not implemented yet') },
        { label: 'Move to', icon: <ArrowRight className="w-4 h-4" />, onClick: () => showToast('Move not implemented yet') },
        { label: 'View details', icon: <PanelRight className="w-4 h-4" />, onClick: () => { const entry = selectionEntryById.get(asset.id); if (entry) { selectOnly(entry.entity); setShowPanel(true) } }, dividerAfter: true },
        { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: () => fileTreeDeleteNode(node.id) },
      )
    } else {
      items.push(
        { label: 'View details', icon: <PanelRight className="w-4 h-4" />, onClick: () => { const entry = selectionEntryById.get(asset.id); if (entry) { selectOnly(entry.entity); setShowPanel(true) } } },
      )
    }
    return items
  }, [canEditResource, showToast, fileTreeDeleteNode, selectionEntryById, selectOnly, setShowPanel])

  const backgroundContextMenuItems = useMemo((): ContextMenuItem[] => {
    if (!canEditCurrentFolder) return []
    return [
      { label: 'New Folder', icon: <FolderPlus className="w-4 h-4" />, onClick: () => { setNewFolderParentPath(urlPath); setNewFolderModalOpen(true) } },
      { label: 'Upload', icon: <Upload className="w-4 h-4" />, onClick: () => uploadInputRef.current?.click() },
    ]
  }, [canEditCurrentFolder, urlPath])

  const isGridView = viewMode === 'grid'
  const explorerViewMode = (isGridView ? 'list' : viewMode) as FileViewMode

  if (workspaceRootMissing) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <EmptyState
                title="Workspace Not Found"
                message="This workspace root doesn't exist in the current folder tree."
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (landingFolderId && requestedWorkspaceRoot && !requestedWorkspaceAccessible) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <EmptyState
                title="Access Restricted"
                message="You don't have workspace access to this folder root. Shared items will still appear in Search, Collections, or Inbox."
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
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                {/* Mobile nav */}
                <MobileToolbar title={pageTitle} actions={
                  !panelOpen ? (
                      <Button
                        variant="icon"
                        size="icon"
                        aria-label="Open panel"
                        onClick={togglePanel}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                  ) : undefined
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

                {/* Row 1: Title + Search + Appearance */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <PageHeader
                    title={pageTitle}
                    description={pageAccessTag?.subtitle}
                    hideTitleOnMobile
                  />
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
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
                      layout={layout}
                      onLayoutChange={setLayout}
                      cardSize={cardSize}
                      onCardSizeChange={setCardSize}
                      showLayoutOptions={false}
                      viewModeOptions={VIEW_MODE_OPTIONS}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      iconOnly
                      showTags={showTags}
                      onShowTagsChange={setShowTags}
                      metadataFields={metadataFields}
                      onMetadataFieldChange={setMetadataField}
                    />
                    <Button variant="icon" onClick={togglePanel} aria-label={panelOpen ? 'Close panel' : 'Open panel'}>
                      <PanelRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <SelectAllRow
                    selectedCount={selectedIds.size}
                    totalCount={topLevelSelectionEntries.length}
                    onSelectAll={() => selectAll(currentGridSelectionEntities)}
                    onClearSelection={clearSelection}
                    label={landingFolderId
                      ? `${filteredFileCount} item${filteredFileCount !== 1 ? 's' : ''}`
                      : `${workspaceRootNodes.length} workspace${workspaceRootNodes.length !== 1 ? 's' : ''}`}
                  />
                  {selectedIds.size > 0 ? (
                    <ContextualActionBar
                      selectedEntities={selectedEntities}
                      onClearSelection={clearSelection}
                      downloadAction={{
                        enabled: true,
                        onClick: () => showToast(`Downloading ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''}...`),
                      }}
                      onPlaceInFolder={(folderId, folderName, assetIds) => {
                        for (const assetId of assetIds) {
                          createFileReference(assetId, folderId)
                        }
                        showToast(`Placed ${assetIds.length} ${assetIds.length === 1 ? 'item' : 'items'} in ${folderName}`)
                      }}
                      menuItems={(() => {
                        if (selectedIds.size !== 1) return undefined
                        const selectedNode = findNodeById(currentGridItems, Array.from(selectedIds)[0])
                        if (!selectedNode) return undefined
                        if (selectedNode.type === 'folder') return buildFolderContextMenuItems(selectedNode)
                        const asset = assetBySourceFileId.get(selectedNode.id) ?? folderNodeToAsset(selectedNode, findDomainIdForNode(selectedNode, getFileTreeDomainFiles) ?? activePersona?.domainId)
                        return buildAssetMenuItems(selectedNode, asset)
                      })()}
                      inline
                    />
                  ) : (
                    <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                      {landingFolderId && currentLocationNode && (() => {
                        const items = buildFolderContextMenuItems(currentLocationNode)
                        return (
                          <>
                            {items.slice(0, 3).map((item, i) => (
                              <Button key={i} variant="secondary" compact icon={item.icon} onClick={item.onClick}>
                                {item.label}
                              </Button>
                            ))}
                            {items.length > 3 && (
                              <Dropdown label="More" icon={<MoreVertical className="w-4 h-4" />} iconOnly compact align="end" width="sm">
                                <div className="py-1">
                                  {items.slice(3).map((item, i) => (
                                    <div key={i}>
                                      <DropdownMenuItem icon={item.icon} label={item.label} onClick={item.onClick} />
                                      {item.dividerAfter && <DropdownMenuDivider />}
                                    </div>
                                  ))}
                                </div>
                              </Dropdown>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>

                {shareBanner && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-surface-mid border border-border-dim">
                    <div className="min-w-0">
                      <p className="text-body-0-regular text-foreground">{shareBanner.note}</p>
                      {shareBanner.sharerName && (
                        <p className="text-label-0-regular text-foreground-dim mt-0.5">
                          {shareBanner.sharerName}{shareBanner.date ? ` · ${formatDate(shareBanner.date)}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Content */}
                {isGridView && (
                <div
                  className="min-h-[400px] flex-1"
                  onContextMenu={(e) => {
                    const card = (e.target as HTMLElement).closest('[data-card]')
                    if (!card) {
                      e.preventDefault()
                      if (backgroundContextMenuItems.length > 0) {
                        setContextMenu({ x: e.clientX, y: e.clientY, node: { id: '__background__', name: '', type: 'folder' } as WorkspaceFileNode })
                      }
                      return
                    }
                    const nodeId = card.getAttribute('data-card')
                    if (nodeId) {
                      const wsNode = findNodeById(currentGridItems, nodeId)
                      if (wsNode) {
                        e.preventDefault()
                        setContextMenu({ x: e.clientX, y: e.clientY, node: wsNode })
                      }
                    }
                  }}
                >
                  {currentGridItems.length > 0 ? (
                      <CardGrid gap="4" columns={getGridColumns(cardSize)}>
                        {currentGridItems.map((node) => {
                          if (node.type === 'folder') {
                            const fileCount = countAccessibleFiles(node.children ?? [], canAccess)
                            const isSharedFolder = sharedFolderIds.has(node.id)
                            const isRefFolder = isReferenceFolder(node)
                            const folderAccessible = canAccess(getAclResourceId(node))
                            const isRestricted = !folderAccessible && !isSharedFolder && !isRefFolder
                            const accessIcon = isRefFolder
                              ? <FolderSymlink className="w-3.5 h-3.5" />
                              : isSharedFolder
                              ? <Users className="w-3.5 h-3.5" />
                              : isRestricted
                              ? <Lock className="w-3.5 h-3.5" />
                              : undefined
                            const isLocked = isRestricted || (isSharedFolder && !folderAccessible)

                            const folderThumbs = folderThumbnails.get(node.id) ?? []

                            return (
                              <CollectionCard
                                key={node.id}
                                data-card={node.id}
                                title={node.name}
                                assetCount={fileCount}
                                type="folder"
                                mainImage={folderThumbs[0]}
                                thumbnailImages={folderThumbs.slice(1, 3)}
                                numberOfAssets={folderThumbs.length >= 3 ? 'Many' : folderThumbs.length === 2 ? 'Two' : folderThumbs.length === 1 ? 'One' : 'None'}
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
                                menuContent={isLocked ? undefined : (
                                  <div className="py-1">
                                    {buildFolderContextMenuItems(node).map((item, i) => (
                                      <div key={i}>
                                        <DropdownMenuItem icon={item.icon} label={item.label} onClick={item.onClick} />
                                        {item.dividerAfter && <DropdownMenuDivider />}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              />
                            )
                          }
                          const workspaceAsset = assetBySourceFileId.get(node.id) ?? folderNodeToAsset(
                            node,
                            findDomainIdForNode(node, getFileTreeDomainFiles)
                              ?? activePersona?.domainId,
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
                              menuContent={
                                <div className="py-1">
                                  {buildAssetMenuItems(node, workspaceAsset).map((item, i) => (
                                    <div key={i}>
                                      <DropdownMenuItem icon={item.icon} label={item.label} onClick={item.onClick} />
                                      {item.dividerAfter && <DropdownMenuDivider />}
                                    </div>
                                  ))}
                                </div>
                              }
                              sensitive={isSensitiveAsset(workspaceAsset.id)}
                              allSelectedIds={selectedIds}
                            />
                          )
                        })}
                      </CardGrid>
                    ) : (
                      <EmptyState
                        title={landingFolderId ? 'Empty Folder' : 'No Workspaces'}
                        message={landingFolderId ? 'No files in this folder' : 'No accessible workspace roots are available for this persona.'}
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
              effectiveNode && sharedFolderIds.has(effectiveNode.id)
                ? 'shared'
                : effectiveNode && effectiveNode.type === 'folder' && !canAccess(getAclResourceId(effectiveNode))
                  ? 'restricted'
                  : undefined
            }
            onDelete={(nodeId) => fileTreeDeleteNode(nodeId)}
            onRename={(nodeId, newName) => fileTreeRenameNode(nodeId, newName)}
          />
        )}
      </div>


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
      {moveWarningState && (
        <MoveWarningModal
          open={moveWarningState.open}
          onClose={() => setMoveWarningState(null)}
          onConfirm={handleConfirmMove}
          fileName={moveWarningState.fileName}
          impactedFolders={moveWarningState.impactedFolders}
        />
      )}
      {accessModalNode && (() => {
        const nodeId = getAclResourceId(accessModalNode)
        const rawRef: ResourceRef = {
          id: nodeId,
          type: accessModalNode.type === 'folder' ? 'folder' : 'asset',
          domainId: findDomainIdForNode(accessModalNode, getFileTreeDomainFiles),
        }
        return (
          <AccessModal
            open
            onClose={() => setAccessModalNode(null)}
            resourceId={rawRef.id}
            resourceRef={rawRef}
            inheritedGrants={getInheritedGrants(nodeId).map(({ grant, fromResourceName }) => ({
              grant,
              fromResourceName,
            }))}
            title={accessModalNode.type === 'folder' ? `${accessModalNode.name} folder` : accessModalNode.name}
          />
        )
      })()}
      {pageAccessModalOpen && currentLocationNode && pageAccessResourceRef && (
        <AccessModal
          open
          onClose={() => setPageAccessModalOpen(false)}
          resourceId={pageAccessResourceRef.id}
          resourceRef={pageAccessResourceRef}
          inheritedGrants={getInheritedGrants(getAclResourceId(currentLocationNode)).map(({ grant, fromResourceName }) => ({
            grant,
            fromResourceName,
          }))}
          title={currentLocationNode.name}
        />
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.node.id === '__background__'
            ? backgroundContextMenuItems
            : contextMenu.node.type === 'folder'
              ? buildFolderContextMenuItems(contextMenu.node)
              : buildAssetMenuItems(contextMenu.node, assetBySourceFileId.get(contextMenu.node.id) ?? folderNodeToAsset(contextMenu.node, findDomainIdForNode(contextMenu.node, getFileTreeDomainFiles) ?? activePersona?.domainId))}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
