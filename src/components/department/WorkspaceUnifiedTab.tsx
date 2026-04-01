'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { FileExplorer, Text, AssetCard, CardGrid } from '@/components/ui'
import { ContextMenu } from '@/components/ui/context-menu'
import type { ContextMenuItem } from '@/components/ui/context-menu'
import { useWorkspaceState } from '@/hooks/useWorkspaceState'
import type { FileNode, FileViewMode } from '@/components/ui/file-explorer'
import type { DepartmentId } from '@/components/department/types'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { promotedInstanceToAsset } from '@/lib/asset-instances'
import { WorkspaceSidePanel } from './WorkspaceSidePanel'
import { List, Columns, LayoutGrid } from 'lucide-react'

type WorkspaceViewMode = FileViewMode | 'grid'

interface WorkspaceUnifiedTabProps {
  departmentId: DepartmentId
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

/** Build a set of file IDs that are inside managed zones */
function getManagedFileIds(nodes: WorkspaceFileNode[]): Set<string> {
  const ids = new Set<string>()
  function walk(nodes: WorkspaceFileNode[]) {
    for (const node of nodes) {
      if (node.type === 'file' && node.managedZone) ids.add(node.id)
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return ids
}

function ViewModeButton({
  mode,
  currentMode,
  icon: Icon,
  label,
  onClick,
}: {
  mode: WorkspaceViewMode
  currentMode: WorkspaceViewMode
  icon: typeof List
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'p-1.5 rounded transition-colors',
        currentMode === mode
          ? 'bg-surface-selected-subtle text-foreground'
          : 'text-foreground-dim hover:text-foreground hover:bg-surface-2'
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

export function WorkspaceUnifiedTab({ departmentId }: WorkspaceUnifiedTabProps) {
  const {
    managedFolderIds,
    toggleManagedZone,
    selectedNode,
    setSelectedNode,
    processedFiles,
    totalFileCount,
    assetInstances,
  } = useWorkspaceState(departmentId, 'files')

  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('list')
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const fileNodes = toFileNodes(processedFiles)

  const allFiles = useMemo(() => assetInstances, [assetInstances])

  const managedFileIds = useMemo(
    () => getManagedFileIds(processedFiles),
    [processedFiles],
  )

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

  const contextMenuItems: ContextMenuItem[] = contextMenu?.node.type === 'folder'
    ? [
        {
          label: managedFolderIds.has(contextMenu.node.id) ? 'Unmark Managed Zone' : 'Mark as Managed Zone',
          checked: managedFolderIds.has(contextMenu.node.id),
          onClick: () => toggleManagedZone(contextMenu.node.id),
        },
      ]
    : []

  const isGridView = viewMode === 'grid'
  const explorerViewMode = isGridView ? 'list' : viewMode

  return (
    <div className="flex h-full min-h-[400px]">
      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Text variant="body-1" color="secondary">
              {totalFileCount} {totalFileCount === 1 ? 'item' : 'items'}
            </Text>
          </div>
          <div className="flex items-center gap-1">
            <ViewModeButton mode="list" currentMode={viewMode} icon={List} label="List" onClick={() => setViewMode('list')} />
            <ViewModeButton mode="columns" currentMode={viewMode} icon={Columns} label="Columns" onClick={() => setViewMode('columns')} />
            <ViewModeButton mode="grid" currentMode={viewMode} icon={LayoutGrid} label="Grid" onClick={() => setViewMode('grid')} />
          </div>
        </div>

        {/* Grid view — all files as asset cards */}
        {isGridView ? (
          <CardGrid gap="4" columns={4} layout="grid">
            {allFiles.map((file) => (
              <AssetCard
                key={file.id}
                asset={promotedInstanceToAsset(file)}
                fromWorkspace={managedFileIds.has(file.sourceFileId)}
                onClick={() => {
                  const wsNode = findNodeById(processedFiles, file.sourceFileId)
                  if (wsNode) setSelectedNode(wsNode)
                }}
              />
            ))}
          </CardGrid>
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

      {/* Side Panel */}
      {selectedNode && (
        <WorkspaceSidePanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          isManagedZone={selectedNode.type === 'folder' ? managedFolderIds.has(selectedNode.id) : undefined}
          onToggleManagedZone={selectedNode.type === 'folder' ? toggleManagedZone : undefined}
        />
      )}

      {/* Context Menu */}
      {contextMenu && contextMenuItems.length > 0 && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
