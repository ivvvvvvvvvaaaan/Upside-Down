'use client'

import { useEffect, useState } from 'react'
import { cn, formatDate } from '@/lib/utils'
import { Folder, File, Image as ImageIcon, FileVideo, FileText, ChevronRight, List, Columns } from 'lucide-react'


/**
 * File Explorer Component
 *
 * Shows folder/file structure representing raw files before assetization.
 * Supports multiple view modes like macOS Finder.
 *
 * TOKENS USED:
 * - text-body-0-regular: File/folder names
 * - text-label-0-regular: Metadata (size, date)
 * - text-foreground: Primary text
 * - text-foreground-dim: Secondary text
 * - bg-surface-2: Row hover state
 * - border-border-dim: Borders
 */

export type FileViewMode = 'list' | 'icons' | 'columns' | 'gallery'

export interface FileNode {
  id: string
  name: string
  type: 'folder' | 'file'
  /** File extension for files */
  extension?: string
  /** Size in bytes */
  size?: number
  /** Modified date */
  modifiedAt?: string
  /** Children for folders */
  children?: FileNode[]
  /** Whether this node is inside a managed zone */
  managedZone?: boolean
  /** Thumbnail URL for gallery view */
  thumbnail?: string
}

export interface FileExplorerProps {
  files: FileNode[]
  className?: string
  /** Optional title to display */
  title?: string
  viewMode?: FileViewMode
  onViewModeChange?: (mode: FileViewMode) => void
  selectedIds?: Set<string>
  primaryId?: string | null
  onFileClick?: (file: FileNode) => void
  onFolderClick?: (folder: FileNode) => void
  /** Show view mode toggle */
  showViewToggle?: boolean
  /** Right-click handler for file/folder rows */
  onContextMenu?: (event: React.MouseEvent, node: FileNode) => void
}

function findNodePath(nodes: FileNode[], targetId: string, ancestors: FileNode[] = []): FileNode[] | null {
  for (const node of nodes) {
    const path = [...ancestors, node]
    if (node.id === targetId) return path
    if (node.children) {
      const childPath = findNodePath(node.children, targetId, path)
      if (childPath) return childPath
    }
  }
  return null
}

function getFileIcon(node: FileNode, sizeClass: string = 'w-4 h-4') {
  if (node.type === 'folder') {
    return <Folder className={cn(sizeClass, 'text-foreground-dim')} />
  }

  const ext = node.extension?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'psd', 'ai'].includes(ext || '')) {
    return <ImageIcon className={cn(sizeClass, 'text-foreground-dim')} />
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) {
    return <FileVideo className={cn(sizeClass, 'text-foreground-dim')} />
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
    return <FileText className={cn(sizeClass, 'text-foreground-dim')} />
  }
  return <File className={cn(sizeClass, 'text-foreground-dim')} />
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}


interface FileRowProps {
  node: FileNode
  depth: number
  selectedIds?: Set<string>
  primaryId?: string | null
  onFileClick?: (file: FileNode) => void
  onFolderClick?: (folder: FileNode) => void
  onContextMenu?: (event: React.MouseEvent, node: FileNode) => void
}

function FileRow({ node, depth, selectedIds, primaryId, onFileClick, onFolderClick, onContextMenu }: FileRowProps) {
  const [expanded, setExpanded] = useState(false)
  const isSelected = selectedIds?.has(node.id) ?? false
  const isPrimary = primaryId === node.id

  const handleClick = () => {
    if (node.type === 'folder') {
      setExpanded(!expanded)
      onFolderClick?.(node)
    } else {
      onFileClick?.(node)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault()
      onContextMenu(e, node)
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
          'border-b border-border-dim last:border-b-0',
          isPrimary
            ? 'bg-surface-selected-subtle ring-1 ring-inset ring-border-selected'
            : isSelected
              ? 'bg-surface-2'
              : 'hover:bg-surface-2'
        )}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {/* Expand chevron for folders */}
        <div className="w-4 flex-shrink-0">
          {node.type === 'folder' && node.children && node.children.length > 0 && (
            <ChevronRight
              className={cn(
                'w-4 h-4 text-foreground-dim transition-transform',
                expanded && 'rotate-90'
              )}
            />
          )}
        </div>

        {/* Icon */}
        {getFileIcon(node)}

        {/* Name */}
        <span className="flex-1 text-body-0-regular text-foreground truncate">
          {node.name}
        </span>

        {/* Size */}
        <span className="w-20 text-right text-label-0-regular text-foreground-dim">
          {node.type === 'file' ? formatFileSize(node.size) : `${node.children?.length || 0} items`}
        </span>

        {/* Modified date */}
        <span className="w-28 text-right text-label-0-regular text-foreground-dim">
          {formatDate(node.modifiedAt)}
        </span>
      </div>

      {/* Children */}
      {expanded && node.children && (
        <>
          {node.children.map((child) => (
            <FileRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              primaryId={primaryId}
              onFileClick={onFileClick}
              onFolderClick={onFolderClick}
              onContextMenu={onContextMenu}
            />
          ))}
        </>
      )}
    </>
  )
}

// View mode toggle button
function ViewModeButton({
  mode,
  currentMode,
  icon: Icon,
  label,
  onClick,
}: {
  mode: FileViewMode
  currentMode: FileViewMode
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

// Icons View - Grid of file/folder icons
function IconsView({
  files,
  selectedIds,
  primaryId,
  onFileClick,
  onFolderClick,
  onContextMenu,
}: {
  files: FileNode[]
  selectedIds?: Set<string>
  primaryId?: string | null
  onFileClick?: (file: FileNode) => void
  onFolderClick?: (folder: FileNode) => void
  onContextMenu?: (event: React.MouseEvent, node: FileNode) => void
}) {
  const handleClick = (node: FileNode) => {
    if (node.type === 'folder') {
      onFolderClick?.(node)
    } else {
      onFileClick?.(node)
    }
  }

  return (
    <div className="grid grid-cols-6 gap-4 p-4">
      {files.map((node) => {
        const isSelected = selectedIds?.has(node.id) ?? false
        const isPrimary = primaryId === node.id
        return (
          <div
            key={node.id}
            onClick={() => handleClick(node)}
            onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(e, node) } : undefined}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded cursor-pointer transition-colors',
              isPrimary
                ? 'bg-surface-selected-subtle ring-1 ring-inset ring-border-selected'
                : isSelected
                  ? 'bg-surface-2'
                  : 'hover:bg-surface-2',
            )}
          >
            <div className="w-12 h-12 flex items-center justify-center">
              {node.type === 'folder' ? (
                <Folder className="w-10 h-10 text-foreground-dim" />
              ) : (
                getFileIcon(node, 'w-10 h-10')
              )}
            </div>
            <span className="text-body-0-regular text-foreground text-center truncate w-full">
              {node.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Columns View - Miller columns like macOS Finder
function ColumnsView({
  files,
  primaryId,
  onFileClick,
  onFolderClick,
  onContextMenu,
  className,
}: {
  files: FileNode[]
  primaryId?: string | null
  onFileClick?: (file: FileNode) => void
  onFolderClick?: (folder: FileNode) => void
  onContextMenu?: (event: React.MouseEvent, node: FileNode) => void
  className?: string
}) {
  const [selectedPath, setSelectedPath] = useState<FileNode[]>([])

  useEffect(() => {
    if (!primaryId) {
      setSelectedPath([])
      return
    }

    const nextPath = findNodePath(files, primaryId)
    if (nextPath) {
      setSelectedPath(nextPath)
    }
  }, [files, primaryId])

  const handleSelect = (node: FileNode, columnIndex: number) => {
    const newPath = selectedPath.slice(0, columnIndex)
    newPath.push(node)
    setSelectedPath(newPath)

    if (node.type === 'folder') {
      onFolderClick?.(node)
    } else {
      onFileClick?.(node)
    }
  }

  const columns: FileNode[][] = [files]
  selectedPath.forEach((node) => {
    if (node.type === 'folder' && node.children) {
      columns.push(node.children)
    }
  })

  return (
    <div className={cn('flex overflow-x-auto', className)}>
      {columns.map((columnFiles, colIndex) => (
        <div
          key={colIndex}
          className="min-w-[200px] max-w-[250px] border-r border-border-dim flex-shrink-0 bg-surface-flat"
        >
          {columnFiles.map((node) => {
            const isSelected = selectedPath[colIndex]?.id === node.id
            return (
              <div
                key={node.id}
                onClick={() => handleSelect(node, colIndex)}
                onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(e, node) } : undefined}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                  isSelected ? 'bg-indigo-500/20 text-foreground' : 'hover:bg-surface-2'
                )}
              >
                {getFileIcon(node)}
                <span className="flex-1 text-body-0-regular text-foreground truncate">
                  {node.name}
                </span>
                {node.type === 'folder' && node.children && node.children.length > 0 && (
                  <ChevronRight className="w-4 h-4 text-foreground-dim" />
                )}
              </div>
            )
          })}
        </div>
      ))}
      {/* Single empty column after content */}
      <div className="min-w-[200px] flex-1 border-r-0 bg-surface-flat" />
    </div>
  )
}

// Gallery View - Large previews with details
function GalleryView({
  files,
  primaryId,
  onFileClick,
  onFolderClick,
  onContextMenu,
}: {
  files: FileNode[]
  primaryId?: string | null
  onFileClick?: (file: FileNode) => void
  onFolderClick?: (folder: FileNode) => void
  onContextMenu?: (event: React.MouseEvent, node: FileNode) => void
}) {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null)

  const flatFiles = files.flatMap((node) =>
    node.type === 'folder' ? (node.children || []) : [node]
  )

  useEffect(() => {
    if (!primaryId) {
      setSelectedNode(null)
      return
    }
    const nextPath = findNodePath(files, primaryId)
    setSelectedNode(nextPath?.at(-1) ?? null)
  }, [files, primaryId])

  const handleSelect = (node: FileNode) => {
    setSelectedNode(node)
    if (node.type === 'folder') {
      onFolderClick?.(node)
    } else {
      onFileClick?.(node)
    }
  }

  return (
    <div className="overflow-hidden">
      {/* Preview area */}
      <div className="h-64 bg-surface-2 flex items-center justify-center border-b border-border-dim">
        {selectedNode ? (
          <div className="flex flex-col items-center gap-3">
            {selectedNode.type === 'folder' ? (
              <Folder className="w-20 h-20 text-foreground-dim" />
            ) : (
              getFileIcon(selectedNode, 'w-20 h-20')
            )}
            <div className="text-center">
              <div className="text-body-1-bold text-foreground">{selectedNode.name}</div>
              <div className="text-label-0-regular text-foreground-dim">
                {selectedNode.type === 'file' ? formatFileSize(selectedNode.size) : `${selectedNode.children?.length || 0} items`}
                {' · '}
                {formatDate(selectedNode.modifiedAt)}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-body-1-regular text-foreground-dim">Select a file to preview</span>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-1 p-2 overflow-x-auto bg-surface-flat">
        {flatFiles.map((node) => (
          <div
            key={node.id}
            onClick={() => handleSelect(node)}
            onContextMenu={onContextMenu ? (e) => { e.preventDefault(); onContextMenu(e, node) } : undefined}
            className={cn(
              'flex-shrink-0 w-16 h-16 rounded flex items-center justify-center cursor-pointer transition-colors',
              selectedNode?.id === node.id
                ? 'bg-surface-selected-subtle ring-2 ring-border-selected'
                : 'bg-surface-2 hover:bg-surface-3'
            )}
          >
            {getFileIcon(node, 'w-8 h-8')}
          </div>
        ))}
      </div>
    </div>
  )
}

export function FileExplorer({
  files,
  className,
  title,
  viewMode: controlledViewMode,
  onViewModeChange,
  selectedIds,
  primaryId,
  onFileClick,
  onFolderClick,
  showViewToggle = true,
  onContextMenu,
}: FileExplorerProps) {
  const [internalViewMode, setInternalViewMode] = useState<FileViewMode>('list')
  const viewMode = controlledViewMode ?? internalViewMode

  const handleViewModeChange = (mode: FileViewMode) => {
    setInternalViewMode(mode)
    onViewModeChange?.(mode)
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header with title and view mode toggle */}
      {(title || showViewToggle) && (
        <div className="flex items-center justify-between">
          {title && (
            <span className="text-heading-2 font-bold text-foreground">{title}</span>
          )}
          {showViewToggle && (
            <div className="flex items-center gap-1">
              <ViewModeButton
                mode="list"
                currentMode={viewMode}
                icon={List}
                label="List"
                onClick={() => handleViewModeChange('list')}
              />
              <ViewModeButton
                mode="columns"
                currentMode={viewMode}
                icon={Columns}
                label="Columns"
                onClick={() => handleViewModeChange('columns')}
              />
            </div>
          )}
        </div>
      )}

      {/* View content */}
      {viewMode === 'list' && (
        <div className="overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-3 py-2 bg-surface-2 border-b border-border-dim">
            <div className="w-4 flex-shrink-0" />
            <div className="w-4 flex-shrink-0" />
            <span className="flex-1 text-label-0-bold text-foreground-dim uppercase">Name</span>
            <span className="w-20 text-right text-label-0-bold text-foreground-dim uppercase">Size</span>
            <span className="w-28 text-right text-label-0-bold text-foreground-dim uppercase">Modified</span>
          </div>

          {/* File list */}
          <div className="bg-surface-flat">
            {files.map((node) => (
              <FileRow
                key={node.id}
                node={node}
                depth={0}
                selectedIds={selectedIds}
                primaryId={primaryId}
                onFileClick={onFileClick}
                onFolderClick={onFolderClick}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        </div>
      )}

      {viewMode === 'icons' && (
        <IconsView files={files} selectedIds={selectedIds} primaryId={primaryId} onFileClick={onFileClick} onFolderClick={onFolderClick} onContextMenu={onContextMenu} />
      )}

      {viewMode === 'columns' && (
        <ColumnsView className="flex-1" files={files} primaryId={primaryId} onFileClick={onFileClick} onFolderClick={onFolderClick} onContextMenu={onContextMenu} />
      )}

      {viewMode === 'gallery' && (
        <GalleryView files={files} primaryId={primaryId} onFileClick={onFileClick} onFolderClick={onFolderClick} onContextMenu={onContextMenu} />
      )}
    </div>
  )
}
