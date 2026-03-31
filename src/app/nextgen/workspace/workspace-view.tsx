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
} from '@/components/ui'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import type { FileNode, FileViewMode } from '@/components/ui/file-explorer'
import { ContextMenu } from '@/components/ui/context-menu'
import type { ContextMenuItem } from '@/components/ui/context-menu'
import { AppLayout } from '@/components/layouts'
import { useViewPreferences, useCompactBar, useWorkspaceState, useAssetSelection, useUserCollections, useFileTree, useAccess, usePersona } from '@/hooks'

import type { DepartmentId } from '@/components/department/types'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { instanceToAsset } from '@/lib/asset-instances'
import type { AssetInstance } from '@/lib/asset-instances'
import { WorkspaceSidePanel } from '@/components/department/WorkspaceSidePanel'
import { ArrowLeft, List, Columns, LayoutGrid, PanelRight, X, Lock, Users, FolderPlus, Link2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { departmentConfigs } from '@/lib/department-configs'

const EXTENSION_MAP: Record<string, 'image' | 'video' | 'audio' | 'text'> = {
  psd: 'image', png: 'image', jpg: 'image', jpeg: 'image', gif: 'image',
  webp: 'image', svg: 'image', ai: 'image', tiff: 'image', exr: 'image', tx: 'image',
  mov: 'video', mp4: 'video', avi: 'video', mkv: 'video', webm: 'video', prproj: 'video',
  wav: 'audio', mp3: 'audio', aac: 'audio', flac: 'audio', ptx: 'audio',
  pdf: 'text', doc: 'text', docx: 'text', txt: 'text', md: 'text', xlsx: 'text',
}

interface ContextMenuState {
  x: number
  y: number
  node: WorkspaceFileNode
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

/** Convert a single file node to an AssetInstance for card rendering */
function fileToInstance(node: WorkspaceFileNode, departmentId: DepartmentId): AssetInstance {
  return {
    id: node.id,
    name: node.name.replace(/\.[^.]+$/, ''),
    sourceFileId: node.id,
    sourceFileName: node.name,
    sourcePath: node.name,
    department: departmentId,
    category: '',
    type: EXTENSION_MAP[node.extension?.toLowerCase() ?? ''] ?? 'text',
    size: node.size,
    modifiedAt: node.modifiedAt,
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

const VIEW_MODE_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: <LayoutGrid className="w-4 h-4" /> },
  { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
  { value: 'columns', label: 'Columns', icon: <Columns className="w-4 h-4" /> },
]

const ALL_DEPARTMENT_IDS: DepartmentId[] = ['art-design', 'camera', 'editorial', 'vfx', 'audio-sound']
const DEPT_FOLDER_IDS = new Set(['ws-art', 'ws-vfx', 'ws-camera', 'ws-editorial', 'ws-audio'])

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
  const { canAccess, sharesReceivedByMe } = useAccess()
  const { activePersona } = usePersona()
  const menuHref = departmentId
    ? `/nextgen/menu?return=%2Fnextgen%2Fworkspace%2F${departmentId}`
    : '/nextgen/menu?return=%2Fnextgen%2Fworkspace'

  const { layout, setLayout, cardSize, setCardSize, viewMode, setViewMode, sidePanelOpen: showPanel, setSidePanelOpen: setShowPanel } = useViewPreferences()
  const { scrollRef, headerRef, showCompactBar } = useCompactBar()
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const { createCollection } = useUserCollections()
  const { setBreadcrumbExtras, clearBreadcrumbExtras } = useBreadcrumbExtras()

  const {
    managedFolderIds,
    toggleManagedZone,
    selectedNode,
    setSelectedNode,
    processedFiles,
    loading,
    createFolder,
  // Always call hook (React rules); results ignored when isLanding
  } = useWorkspaceState(departmentId ?? 'art-design', 'files')

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [newFolderParentPath, setNewFolderParentPath] = useState<string[]>([])
  const [landingDrillFolder, setLandingDrillFolder] = useState<WorkspaceFileNode | null>(null)
  const { createFolder: fileTreeCreateFolder, tree: fileTree, getDepartmentFiles: getFileTreeDeptFiles } = useFileTree()
  // Workspace-level folders: top-level folders created by user (exclude department folders already rendered via departmentNodes)
  const landingFolders = useMemo(() => {
    return fileTree.filter((f) => f.type === 'folder' && !DEPT_FOLDER_IDS.has(f.id)) as WorkspaceFileNode[]
  }, [fileTree])

  // Shared folder/collection nodes injected into the workspace landing
  const sharedFolderNodes: WorkspaceFileNode[] = useMemo(() => {
    if (!isLanding) return []
    return sharesReceivedByMe
      .filter(e => e.resourceType === 'folder')
      .map(entry => ({
        id: entry.resourceId,
        name: entry.label,
        type: 'folder' as const,
        modifiedAt: entry.grantedAt,
        children: [],
      }))
  }, [isLanding, sharesReceivedByMe])

  // O(1) lookup for shared folder IDs
  const sharedFolderIds = useMemo(() => new Set(sharedFolderNodes.map(n => n.id)), [sharedFolderNodes])

  // Auto-drill into a workspace-level transient folder when navigated to via URL
  useEffect(() => {
    if (landingFolderId && isLanding) {
      const folder = landingFolders.find(f => f.id === landingFolderId)
      if (folder) setLandingDrillFolder(folder)
    }
  }, [landingFolderId, isLanding, landingFolders])

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
  const departmentAccessible = departmentId ? canAccess(departmentId) : true

  // Department folder nodes for landing view — real WorkspaceFileNode shapes
  const departmentNodes: WorkspaceFileNode[] = useMemo(() => {
    if (!isLanding) return []
    return ALL_DEPARTMENT_IDS
      .filter((id) => canAccess(id))
      .map((id) => ({
      id,
      name: departmentConfigs[id].name,
      type: 'folder' as const,
      children: getFileTreeDeptFiles(id) as WorkspaceFileNode[],
    }))
  }, [isLanding, canAccess, getFileTreeDeptFiles])

  // Resolve URL path segments to actual folder nodes
  const resolvedFolderPath = useMemo(
    () => resolvePathSegments(urlPath, processedFiles),
    [urlPath, processedFiles],
  )

  // Sync breadcrumb extras: Workspace > Department > Folder > ...
  useEffect(() => {
    const extras: { label: string; href?: string; onClick?: () => void }[] = []

    // Workspace crumb — link when deeper, plain when on landing
    if (departmentId) {
      extras.push({ label: 'Workspace', href: '/nextgen/workspace' })
    } else {
      extras.push({ label: 'Workspace' })
    }

    // Department crumb
    if (departmentId) {
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
    }

    setBreadcrumbExtras(extras)
    return () => clearBreadcrumbExtras()
  }, [departmentId, resolvedFolderPath, setBreadcrumbExtras, clearBreadcrumbExtras, router])

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
      if (landingDrillFolder) {
        items = landingDrillFolder.children ?? []
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
      if (canAccess(node.id)) return true
      // Not accessible — show only if persona can see restricted (folders only, files stay hidden)
      if (node.type === 'folder') return activePersona?.role === 'manager'
      return false
    })
  }, [isLanding, landingDrillFolder, departmentNodes, sharedFolderNodes, landingFolders, processedFiles, resolvedFolderPath, canAccess, activePersona])

  // Access-filtered total file count for compact bar
  const filteredFileCount = useMemo(
    () => countAccessibleFiles(processedFiles, canAccess),
    [processedFiles, canAccess],
  )

  // Flat asset list for selection — on landing each folder's "department" is itself
  const currentGridAssets = useMemo(() => {
    return currentGridItems.map((n) =>
      instanceToAsset(fileToInstance(n, (departmentId ?? n.id) as DepartmentId))
    )
  }, [currentGridItems, departmentId])

  const selectedAssets = useMemo(() => {
    return currentGridAssets.filter((a) => selectedIds.has(a.id))
  }, [currentGridAssets, selectedIds])

  const handleCreateCollection = useCallback((name: string) => {
    createCollection(name, selectedAssets.map((a) => a.id))
    clearSelection()
  }, [createCollection, selectedAssets, clearSelection])

  const handleNodeClick = useCallback((fileNode: FileNode) => {
    const wsNode = findNodeById(processedFiles, fileNode.id)
    if (wsNode) setSelectedNode(wsNode)
  }, [processedFiles, setSelectedNode])

  const handleContextMenu = useCallback((event: React.MouseEvent, fileNode: FileNode) => {
    event.preventDefault()
    const wsNode = findNodeById(processedFiles, fileNode.id)
    if (wsNode) {
      setContextMenu({ x: event.clientX, y: event.clientY, node: wsNode })
    }
  }, [processedFiles])

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  const handleFolderDrilldown = useCallback((folder: WorkspaceFileNode) => {
    if (isLanding) {
      // Transient folders and shared collections on landing: drill down locally (no URL change)
      if (folder.id.startsWith('new-folder-') || sharedFolderIds.has(folder.id)) {
        setLandingDrillFolder(folder)
      } else {
        router.push(`/nextgen/workspace/${folder.id}`)
      }
    } else {
      const newPath = [...urlPath, folder.id]
      router.push(`/nextgen/workspace/${departmentId}/${newPath.join('/')}`)
    }
  }, [departmentId, isLanding, router, sharedFolderIds, urlPath])

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
      ]
    }
    return []
  })()

  const isInsideFolder = resolvedFolderPath.length > 0
  const currentFolder = isInsideFolder ? resolvedFolderPath[resolvedFolderPath.length - 1] : null
  const departmentName = departmentId ? (departmentConfigs[departmentId]?.name ?? departmentId) : 'Workspace'
  const pageTitle = landingDrillFolder?.name ?? currentFolder?.name ?? departmentName
  const backHref = isLanding
    ? undefined
    : isInsideFolder
      ? urlPath.length <= 1
        ? `/nextgen/workspace/${departmentId}`
        : `/nextgen/workspace/${departmentId}/${urlPath.slice(0, -1).join('/')}`
      : `/nextgen/workspace`

  const isGridView = viewMode === 'grid'
  const explorerViewMode = (isGridView ? 'list' : viewMode) as import('@/components/ui/file-explorer').FileViewMode

  const getColumns = () => {
    switch (cardSize) {
      case 'sm': return 6
      case 'lg': return 3
      default: return 4
    }
  }

  if (!isLanding && !departmentAccessible) {
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
                      size="icon"
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
                    {landingDrillFolder ? (
                      <div className="flex items-center gap-3">
                        <Button variant="icon" size="icon" aria-label="Back" className="-my-4" onClick={() => setLandingDrillFolder(null)}>
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <PageHeader title={pageTitle} />
                      </div>
                    ) : (
                      <PageHeader title={pageTitle} backHref={backHref ?? undefined} />
                    )}
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
                        size="icon"
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
                      <CardGrid gap="4" columns={getColumns()}>
                        {currentGridItems.map((node) => {
                          if (node.type === 'folder') {
                            const fileCount = countAccessibleFiles(node.children ?? [], canAccess)
                            const isSharedFolder = sharedFolderIds.has(node.id)
                            const dept = (departmentId ?? node.id) as DepartmentId
                            const folderAsset = instanceToAsset(fileToInstance(node, dept))
                            const folderAccessible = canAccess(node.id)
                            const isRestricted = !folderAccessible && !isSharedFolder
                            const accessIcon = isSharedFolder
                              ? <Link2 className="w-4 h-4" />
                              : isRestricted
                              ? <Lock className="w-4 h-4" />
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
                                    handleAssetClick(folderAsset, e as React.MouseEvent, currentGridAssets)
                                    setSelectedNode(node)
                                  }
                                }
                                onDoubleClick={isLocked ? undefined : () => handleFolderDrilldown(node)}
                              />
                            )
                          }
                          const asset = instanceToAsset(fileToInstance(node, departmentId!))
                          return (
                            <AssetCard
                              key={node.id}
                              asset={asset}
                              selected={selectedIds.has(node.id)}
                              primary={primaryId === node.id}
                              onClick={(a, e) => {
                                handleAssetClick(a, e, currentGridAssets)
                                setSelectedNode(node)
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
              onFileClick={handleNodeClick}
              onFolderClick={handleNodeClick}
              onContextMenu={handleContextMenu}
            />
          )}

        </div>

        {/* Side Panel — flush right, full height */}
        <WorkspaceSidePanel
          node={selectedNode}
          open={showPanel}
          onClose={() => setShowPanel(false)}
          departmentId={departmentId}
          isManagedZone={selectedNode?.type === 'folder' ? managedFolderIds.has(selectedNode.id) : undefined}
          onToggleManagedZone={selectedNode?.type === 'folder' ? toggleManagedZone : undefined}
        />
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
          selectedCount={selectedIds.size}
          selectedAssets={selectedAssets}
          onClear={clearSelection}
          onCreateCollection={handleCreateCollection}
          onShare={() => console.log('Share:', Array.from(selectedIds))}
        />
        <NewFolderModal
          open={newFolderModalOpen}
          onOpenChange={setNewFolderModalOpen}
          onCreate={handleCreateFolder}
        />
      </div>
    </AppLayout>
  )
}
