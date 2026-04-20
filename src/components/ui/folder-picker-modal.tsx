'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderSymlink, Check } from 'lucide-react'
import { Modal } from './modal'
import { Button } from './button'
import { useFileTree, useAccess } from '@/hooks'
import { SHARED_MOUNT_FOLDER_ID } from '@/lib/workspace-data'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { collectAccessibleWorkspaceRoots, collectSharedFolderIds } from '@/lib/workspace-roots'
import { cn } from '@/lib/utils'

export interface FolderPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (folderId: string, folderName: string) => void
  title?: string
  confirmLabel?: string
}

function FolderTreeItem({
  node,
  depth,
  selectedId,
  onSelect,
  sharedIds,
}: {
  node: WorkspaceFileNode
  depth: number
  selectedId: string | null
  onSelect: (id: string, name: string) => void
  sharedIds: Set<string>
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const subfolders = (node.children ?? []).filter((n) => n.type === 'folder')
  const hasChildren = subfolders.length > 0
  const isSelected = selectedId === node.id
  const isShared = sharedIds.has(node.id)
  const FolderIcon = isShared ? FolderSymlink : Folder

  return (
    <div>
      <button
        onClick={() => onSelect(node.id, node.name)}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors',
          isSelected
            ? 'bg-indigo-500/20 text-foreground'
            : 'text-foreground hover:bg-surface-2',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="flex-shrink-0 p-0.5"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-foreground-dim" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-foreground-dim" />
            )}
          </button>
        ) : (
          <span className="w-4.5 flex-shrink-0" />
        )}
        <FolderIcon className="w-4 h-4 flex-shrink-0 text-foreground-dim" />
        <span className="text-body-0-regular truncate">{node.name}</span>
        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto flex-shrink-0" />}
      </button>
      {expanded && hasChildren && (
        <div>
          {subfolders.map((child) => (
            <FolderTreeItem
              key={child.id}
              node={child as WorkspaceFileNode}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              sharedIds={sharedIds}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderPickerModal({
  open,
  onClose,
  onSelect,
  title = 'Place in folder',
  confirmLabel = 'Place here',
}: FolderPickerModalProps) {
  const { tree: fileTree } = useFileTree()
  const { canAccess, getResourceGrants } = useAccess()
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null)

  const workspaceRoots = useMemo(() => collectAccessibleWorkspaceRoots(
    fileTree.filter((node): node is WorkspaceFileNode => node.type === 'folder' && node.id !== SHARED_MOUNT_FOLDER_ID),
    canAccess,
  ), [fileTree, canAccess])

  const sharedIds = useMemo(() => {
    const all = new Set<string>()
    for (const root of workspaceRoots) {
      collectSharedFolderIds([root], getResourceGrants).forEach(id => all.add(id))
    }
    return all
  }, [workspaceRoots, getResourceGrants])

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected.id, selected.name)
      onClose()
      setSelected(null)
    }
  }

  const handleClose = () => {
    onClose()
    setSelected(null)
  }

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) handleClose() }} size="sm">
      <Modal.Header title={title} onClose={handleClose} />
      <Modal.Body>
        <div className="max-h-80 overflow-y-auto -mx-2">
          {workspaceRoots.length === 0 ? (
            <p className="text-body-0-regular text-foreground-dim px-2 py-4">No folders available</p>
          ) : (
            workspaceRoots.map((root) => (
              <FolderTreeItem
                key={root.id}
                node={root}
                depth={0}
                selectedId={selected?.id ?? null}
                onSelect={(id, name) => setSelected({ id, name })}
                sharedIds={sharedIds}
              />
            ))
          )}
        </div>
      </Modal.Body>
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-border-dim">
        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        <Button variant="primary" onClick={handleConfirm} disabled={!selected}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
