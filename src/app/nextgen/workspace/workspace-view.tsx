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
} from '@/components/ui'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import type { FileNode, FileViewMode } from '@/components/ui/file-explorer'
import { ContextMenu } from '@/components/ui/context-menu'
import type { ContextMenuItem } from '@/components/ui/context-menu'
import { AppLayout } from '@/components/layouts'
import { useViewPreferences, useCompactBar, useWorkspaceState, useAssetSelection, useUserCollections } from '@/hooks'
import type { DepartmentId } from '@/components/department/types'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { instanceToAsset } from '@/lib/asset-instances'
import type { AssetInstance } from '@/lib/asset-instances'
import { WorkspaceSidePanel } from '@/components/department/WorkspaceSidePanel'
import { ArrowLeft, List, Columns, LayoutGrid, PanelRight, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type WorkspaceViewMode = FileViewMode | 'grid'

const DEPARTMENT_ID: DepartmentId = 'art-design'

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

interface WorkspaceViewProps {
  /** URL path segments representing the drilled-down folder path */
  folderPath: string[]
}

export function WorkspaceView({ folderPath: urlPath }: WorkspaceViewProps) {
  const router = useRouter()
  const menuHref = '/nextgen/menu?return=%2Fnextgen%2Fworkspace'

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
  } = useWorkspaceState(DEPARTMENT_ID, 'files')

  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('grid')
  const [showPanel, setShowPanel] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' },
  ])

  // Resolve URL path segments to actual folder nodes
  const resolvedFolderPath = useMemo(
    () => resolvePathSegments(urlPath, processedFiles),
    [urlPath, processedFiles],
  )

  // Sync breadcrumb extras with the folder path
  useEffect(() => {
    if (resolvedFolderPath.length === 0) {
      clearBreadcrumbExtras()
      return
    }

    const extras = resolvedFolderPath.map((folder, i) => ({
      label: folder.name,
      onClick: i < resolvedFolderPath.length - 1
        ? () => {
            const pathSegments = resolvedFolderPath.slice(0, i + 1).map((f) => f.id)
            router.push(`/nextgen/workspace/${pathSegments.join('/')}`)
          }
        : undefined,
    }))

    setBreadcrumbExtras(extras)
    return () => clearBreadcrumbExtras()
  }, [resolvedFolderPath, setBreadcrumbExtras, clearBreadcrumbExtras, router])

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

  // Current grid items: either top-level or inside a drilled-down folder
  const currentGridItems = useMemo(() => {
    if (resolvedFolderPath.length === 0) return processedFiles
    const current = resolvedFolderPath[resolvedFolderPath.length - 1]
    return current.children ?? []
  }, [processedFiles, resolvedFolderPath])

  // Build flat asset list from ALL current grid items (folders + files) for shift-range selection
  const currentGridAssets = useMemo(() => {
    return currentGridItems.map((n) => instanceToAsset(fileToInstance(n, DEPARTMENT_ID)))
  }, [currentGridItems])

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
    const newPath = [...urlPath, folder.id]
    router.push(`/nextgen/workspace/${newPath.join('/')}`)
  }, [urlPath, router])

  const contextMenuItems: ContextMenuItem[] = contextMenu?.node.type === 'folder'
    ? [
        {
          label: managedFolderIds.has(contextMenu.node.id) ? 'Unmark Managed Zone' : 'Mark as Managed Zone',
          checked: managedFolderIds.has(contextMenu.node.id),
          onClick: () => toggleManagedZone(contextMenu.node.id),
        },
      ]
    : []

  const isInsideFolder = resolvedFolderPath.length > 0
  const currentFolder = isInsideFolder ? resolvedFolderPath[resolvedFolderPath.length - 1] : null
  const pageTitle = currentFolder?.name ?? 'Workspace'
  const backHref = isInsideFolder
    ? urlPath.length <= 1
      ? '/nextgen/workspace'
      : `/nextgen/workspace/${urlPath.slice(0, -1).join('/')}`
    : null

  const isGridView = viewMode === 'grid'
  const explorerViewMode = isGridView ? 'list' : viewMode

  const getColumns = () => {
    switch (cardSize) {
      case 'sm': return 6
      case 'lg': return 3
      default: return 4
    }
  }

  const getAssetCount = (count: number): 'None' | 'One' | 'Two' | 'Many' => {
    if (count === 0) return 'None'
    if (count === 1) return 'One'
    if (count === 2) return 'Two'
    return 'Many'
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
          <CompactBar
            visible={showCompactBar}
            title={pageTitle}
            count={totalFileCount}
            countLabel="file"
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
                  <PageHeader title={pageTitle} backHref={backHref ?? undefined} />
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
                      aria-label="Toggle panel"
                      onClick={() => setShowPanel((v) => !v)}
                      className={cn(showPanel && 'bg-surface-3')}
                    >
                      <PanelRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="min-h-[400px]">
                  {isGridView ? (
                    <>
                      {currentGridItems.length > 0 ? (
                        <CardGrid gap="4" columns={getColumns()}>
                          {currentGridItems.map((node) => {
                            if (node.type === 'folder') {
                              const fileCount = countFiles(node.children ?? [])
                              const folderAsset = instanceToAsset(fileToInstance(node, DEPARTMENT_ID))
                              return (
                                <CollectionCard
                                  key={node.id}
                                  title={node.name}
                                  assetCount={fileCount}
                                  type="folder"
                                  numberOfAssets="None"
                                  state={selectedIds.has(node.id) ? 'Selected' : 'Normal'}
                                  onClick={(e) => {
                                    handleAssetClick(folderAsset, e as React.MouseEvent, currentGridAssets)
                                    setSelectedNode(node)
                                  }}
                                  onDoubleClick={() => handleFolderDrilldown(node)}
                                />
                              )
                            }
                            const asset = instanceToAsset(fileToInstance(node, DEPARTMENT_ID))
                            return (
                              <AssetCard
                                key={node.id}
                                asset={asset}
                                fromWorkspace={node.managedZone}
                                selected={selectedIds.has(node.id)}
                                primary={primaryId === node.id}
                                onClick={(a, e) => {
                                  handleAssetClick(a, e, currentGridAssets)
                                  setSelectedNode(node)
                                }}
                              />
                            )
                          })}
                        </CardGrid>
                      ) : (
                        <EmptyState
                          title="Empty folder"
                          message="No files in this folder"
                        />
                      )}
                    </>
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
      </div>
    </AppLayout>
  )
}
