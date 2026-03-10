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
  SettingsPanel,
  SettingGroup,
  SettingSegmented,
  NewFolderModal,
} from '@/components/ui'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import type { FileNode, FileViewMode } from '@/components/ui/file-explorer'
import { ContextMenu } from '@/components/ui/context-menu'
import type { ContextMenuItem } from '@/components/ui/context-menu'
import { AppLayout } from '@/components/layouts'
import { useViewPreferences, useCompactBar, useWorkspaceState, useAssetSelection, useUserCollections, useDepartmentAccess, useCreateFolder, useWorkspaceLandingFolders } from '@/hooks'
import type { DepartmentAccessLevel } from '@/hooks'
import type { DepartmentId } from '@/components/department/types'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { instanceToAsset } from '@/lib/asset-instances'
import type { AssetInstance } from '@/lib/asset-instances'
import { WorkspaceSidePanel } from '@/components/department/WorkspaceSidePanel'
import { ArrowLeft, List, Columns, LayoutGrid, PanelRight, X, Lock, Users, FolderPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { departmentConfigs } from '@/lib/department-configs'
import { getDepartmentWorkspaceFiles } from '@/lib/workspace-data'

type WorkspaceViewMode = FileViewMode | 'grid'

const ACCESS_LEVEL_OPTIONS: { value: DepartmentAccessLevel; label: string }[] = [
  { value: 'full', label: 'Full' },
  { value: 'partial', label: 'Partial' },
  { value: 'none', label: 'Locked' },
]

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

/** Count total files recursively */
function countFiles(nodes: WorkspaceFileNode[]): number {
  let count = 0
  for (const node of nodes) {
    if (node.type === 'file') count++
    if (node.children) count += countFiles(node.children)
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
  const { getAccessLevel, setAccessLevel, allDepartments, accessLevels } = useDepartmentAccess()
  const menuHref = departmentId
    ? `/nextgen/menu?return=%2Fnextgen%2Fworkspace%2F${departmentId}`
    : '/nextgen/menu?return=%2Fnextgen%2Fworkspace'

  const { layout, setLayout, cardSize, setCardSize } = useViewPreferences()
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
    totalFileCount,
    loading,
    createFolder,
  // Always call hook (React rules); results ignored when isLanding
  } = useWorkspaceState(departmentId ?? 'art-design', 'files')

  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('grid')
  const [showPanel, setShowPanel] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [newFolderParentPath, setNewFolderParentPath] = useState<string[]>([])
  const [landingDrillFolder, setLandingDrillFolder] = useState<WorkspaceFileNode | null>(null)
  const contextCreateFolder = useCreateFolder()
  const landingFolders = useWorkspaceLandingFolders()

  // Auto-drill into a workspace-level transient folder when navigated to via URL
  useEffect(() => {
    if (landingFolderId && isLanding) {
      const folder = landingFolders.find(f => f.id === landingFolderId)
      if (folder) setLandingDrillFolder(folder)
    }
  }, [landingFolderId, isLanding, landingFolders])

  const handleCreateFolder = useCallback((name: string) => {
    if (isLanding) {
      contextCreateFolder('workspace', name, [])
    } else {
      createFolder(name, newFolderParentPath)
    }
  }, [isLanding, createFolder, contextCreateFolder, newFolderParentPath])
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' },
  ])

  // Department folder nodes for landing view — real WorkspaceFileNode shapes
  const departmentNodes: WorkspaceFileNode[] = useMemo(() => {
    if (!isLanding) return []
    return ALL_DEPARTMENT_IDS.map((id) => ({
      id,
      name: departmentConfigs[id].name,
      type: 'folder' as const,
      children: getDepartmentWorkspaceFiles(id),
    }))
  }, [isLanding])

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

  const fileNodes = toFileNodes(processedFiles)

  // Unified grid items — works for both landing and department views
  const currentGridItems: WorkspaceFileNode[] = useMemo(() => {
    if (isLanding) {
      if (landingDrillFolder) return landingDrillFolder.children ?? []
      return [...departmentNodes, ...landingFolders]
    }
    if (resolvedFolderPath.length === 0) return processedFiles
    const current = resolvedFolderPath[resolvedFolderPath.length - 1]
    return current.children ?? []
  }, [isLanding, landingDrillFolder, departmentNodes, landingFolders, processedFiles, resolvedFolderPath])

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
      // Transient folders on landing: drill down locally (no URL change)
      if (folder.id.startsWith('new-folder-')) {
        setLandingDrillFolder(folder)
      } else {
        router.push(`/nextgen/workspace/${folder.id}`)
      }
    } else {
      const newPath = [...urlPath, folder.id]
      router.push(`/nextgen/workspace/${departmentId}/${newPath.join('/')}`)
    }
  }, [isLanding, urlPath, router, departmentId])

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
  const explorerViewMode = isGridView ? 'list' : viewMode

  const getColumns = () => {
    switch (cardSize) {
      case 'sm': return 6
      case 'lg': return 3
      default: return 4
    }
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
          <CompactBar
            visible={showCompactBar}
            title={pageTitle}
            count={isLanding ? departmentNodes.length : totalFileCount}
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
                  </div>
                </div>

                {/* Header */}
                <div ref={headerRef} className="flex items-center justify-between gap-4">
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
                    <HawkinsSearch
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      filters={filterOptions}
                      expandable
                    />
                    <SortDropdown
                      fields={sortFields}
                      value={sortCriteria}
                      onChange={setSortCriteria}
                    />
                    <AppearanceDropdown
                      layout={layout}
                      onLayoutChange={setLayout}
                      cardSize={cardSize}
                      onCardSizeChange={setCardSize}
                      showLayoutOptions={false}
                      viewModeOptions={VIEW_MODE_OPTIONS}
                      viewMode={viewMode}
                      onViewModeChange={(m) => setViewMode(m as WorkspaceViewMode)}
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
                      onClick={() => setShowPanel((v) => !v)}
                      className={cn(showPanel && 'bg-surface-3')}
                    >
                      <PanelRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div
                  className="min-h-[400px]"
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
                  {isGridView || isLanding ? (
                    currentGridItems.length > 0 || (!isLanding && loading) ? (
                      <CardGrid gap="4" columns={getColumns()}>
                        {currentGridItems.map((node) => {
                          if (node.type === 'folder') {
                            const fileCount = countFiles(node.children ?? [])
                            const dept = (departmentId ?? node.id) as DepartmentId
                            const folderAsset = instanceToAsset(fileToInstance(node, dept))
                            const access = isLanding ? getAccessLevel(node.id as DepartmentId) : null
                            const accessIcon = access === 'none'
                              ? <Lock className="w-4 h-4" />
                              : access === 'partial'
                              ? <Users className="w-4 h-4" />
                              : undefined
                            const isLocked = access === 'none'
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
                                onClick={isLocked ? undefined : (e) => {
                                  handleAssetClick(folderAsset, e as React.MouseEvent, currentGridAssets)
                                  setSelectedNode(node)
                                }}
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
                    )
                  ) : (
                    <FileExplorer
                      files={fileNodes}
                      viewMode={explorerViewMode}
                      showViewToggle={false}
                      onFileClick={handleNodeClick}
                      onFolderClick={handleNodeClick}
                      onContextMenu={handleContextMenu}
                    />
                  )}
                </div>
              </Stack>
            </div>
          </div>

        </div>

        {/* Side Panel — flush right, full height */}
        {showPanel && (
          selectedNode ? (
            <WorkspaceSidePanel
              node={selectedNode}
              onClose={() => setShowPanel(false)}
              isManagedZone={selectedNode.type === 'folder' ? managedFolderIds.has(selectedNode.id) : undefined}
              onToggleManagedZone={selectedNode.type === 'folder' ? toggleManagedZone : undefined}
            />
          ) : (
            <div className="w-[360px] flex-shrink-0 border-l border-border-dim bg-surface-1 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border-dim">
                <span className="text-body-1-bold text-foreground">Info</span>
                <Button variant="icon" compact onClick={() => setShowPanel(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                <span className="text-body-0-regular text-foreground-dim">Select an item to see details</span>
              </div>
            </div>
          )
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
          selectedCount={selectedIds.size}
          selectedAssets={selectedAssets}
          onClear={clearSelection}
          onCreateCollection={handleCreateCollection}
          onShare={() => console.log('Share:', Array.from(selectedIds))}
        />
        <SettingsPanel>
          <SettingGroup label="Department Access">
            {allDepartments.map((deptId) => (
              <SettingSegmented
                key={deptId}
                label={departmentConfigs[deptId]?.name ?? deptId}
                options={ACCESS_LEVEL_OPTIONS}
                value={accessLevels[deptId] ?? 'full'}
                onChange={(level) => setAccessLevel(deptId, level)}
              />
            ))}
          </SettingGroup>
        </SettingsPanel>
        <NewFolderModal
          open={newFolderModalOpen}
          onOpenChange={setNewFolderModalOpen}
          onCreate={handleCreateFolder}
        />
      </div>
    </AppLayout>
  )
}
