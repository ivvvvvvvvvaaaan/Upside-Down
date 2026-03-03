'use client'

import { useState, useCallback } from 'react'
import { FileExplorer, Text } from '@/components/ui'
import { ContextMenu } from '@/components/ui/context-menu'
import type { ContextMenuItem } from '@/components/ui/context-menu'
import { useWorkspaceState } from '@/hooks/useWorkspaceState'
import type { FileNode } from '@/components/ui/file-explorer'
import type { DepartmentId } from '@/components/department/types'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { WorkspaceSidePanel } from './WorkspaceSidePanel'

interface WorkspaceFilesTabProps {
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

export function WorkspaceFilesTab({ departmentId }: WorkspaceFilesTabProps) {
  const {
    managedFolderIds,
    toggleManagedZone,
    selectedNode,
    setSelectedNode,
    processedFiles,
    totalFileCount,
  } = useWorkspaceState(departmentId, 'files')

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

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

  const fileNodes = toFileNodes(processedFiles)

  return (
    <div className="flex h-full min-h-[400px]">
      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Item count */}
        <div className="flex items-center justify-end mb-4">
          <Text variant="body-1" color="secondary">
            {totalFileCount} {totalFileCount === 1 ? 'item' : 'items'}
          </Text>
        </div>

        {/* File Explorer */}
        <FileExplorer
          files={fileNodes}
          showViewToggle
          onFileClick={handleNodeClick}
          onFolderClick={handleNodeClick}
          onContextMenu={handleContextMenu}
        />
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
