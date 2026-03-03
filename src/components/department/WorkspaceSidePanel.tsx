'use client'

import { X, Folder, File, FolderCheck, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingToggle } from '@/components/ui/settings-panel'
import type { WorkspaceFileNode } from '@/lib/workspace-data'

interface WorkspaceSidePanelProps {
  node: WorkspaceFileNode
  onClose: () => void
  /** Whether this folder is a managed zone */
  isManagedZone?: boolean
  /** Toggle managed zone for this folder */
  onToggleManagedZone?: (folderId: string) => void
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function countChildFiles(node: WorkspaceFileNode): number {
  if (node.type === 'file') return 1
  let count = 0
  for (const child of node.children ?? []) {
    if (child.type === 'file') count++
    else count += countChildFiles(child)
  }
  return count
}

export function WorkspaceSidePanel({
  node,
  onClose,
  isManagedZone,
  onToggleManagedZone,
}: WorkspaceSidePanelProps) {
  const isFolder = node.type === 'folder'
  const fileCount = isFolder ? countChildFiles(node) : 0

  return (
    <div className="w-[360px] flex-shrink-0 border-l border-border bg-surface-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span className="text-body-1-bold text-foreground">
          {isFolder ? 'Folder Info' : 'File Info'}
        </span>
        <Button variant="icon" compact onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Details */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Details</h3>
          <div className="bg-surface-2 rounded p-3 space-y-3">
            <div className="flex items-center gap-3">
              {isFolder ? (
                <Folder className="w-8 h-8 text-foreground-dim flex-shrink-0" />
              ) : (
                <File className="w-8 h-8 text-foreground-dim flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-body-1-bold text-foreground truncate">{node.name}</p>
                <p className="text-label-0-regular text-foreground-dim">
                  {isFolder ? 'Folder' : node.extension?.toUpperCase() || 'File'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {isFolder ? (
                <div className="flex justify-between text-label-1-regular">
                  <span className="text-foreground-dim">Items</span>
                  <span className="text-foreground">{node.children?.length ?? 0} ({fileCount} files)</span>
                </div>
              ) : (
                <div className="flex justify-between text-label-1-regular">
                  <span className="text-foreground-dim">Size</span>
                  <span className="text-foreground">{formatFileSize(node.size)}</span>
                </div>
              )}
              <div className="flex justify-between text-label-1-regular">
                <span className="text-foreground-dim">Modified</span>
                <span className="text-foreground">{formatDate(node.modifiedAt)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Managed Zone (folders only) */}
        {isFolder && onToggleManagedZone && (
          <section className="space-y-2">
            <h3 className="text-label-0-bold uppercase text-foreground-dim">Zone</h3>
            <div className="bg-surface-2 rounded p-3 space-y-3">
              <SettingToggle
                label="Managed Zone"
                checked={isManagedZone ?? false}
                onChange={() => onToggleManagedZone(node.id)}
              />
              <div className="flex items-center gap-2 text-label-1-regular text-foreground-dim">
                <FolderCheck className="w-3 h-3" />
                <span>
                  {isManagedZone
                    ? `${fileCount} file${fileCount !== 1 ? 's' : ''} surfaced as asset instances`
                    : 'Files in managed zones are automatically surfaced as asset instances in the Assets tab'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Asset instance info (files in managed zones) */}
        {!isFolder && node.managedZone && (
          <section className="space-y-2">
            <h3 className="text-label-0-bold uppercase text-foreground-dim">Asset Instance</h3>
            <div className="bg-surface-2 rounded p-3">
              <div className="flex items-center gap-2 text-label-1-regular text-foreground-dim">
                <ArrowUpRight className="w-3 h-3" />
                <span>This file has an asset instance in the Assets tab</span>
              </div>
            </div>
          </section>
        )}

        {/* Path */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Path</h3>
          <div className="bg-surface-2 rounded p-3">
            <p className="text-label-0-regular text-foreground-dim font-mono break-all">
              /Workspaces/Stranger Things S6/{node.name}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
