'use client'

import { useState } from 'react'
import { DesktopWindow } from './desktop-window'
import { cn } from '@/lib/utils'
import type { WindowState } from '../view'
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Columns,
  ChevronRight as ChevronRightSmall,
  Folder,
  File,
  Image,
  FileVideo,
  FileText,
  HardDrive,
  Monitor,
  Cloud,
  Download,
  FileIcon,
  FolderOpen,
  Briefcase,
} from 'lucide-react'

// Sidebar items for Finder
interface SidebarItem {
  id: string
  name: string
  icon: typeof Folder
  type: 'favorite' | 'location' | 'tag'
}

const sidebarItems: SidebarItem[] = [
  { id: 'airdrop', name: 'AirDrop', icon: Cloud, type: 'favorite' },
  { id: 'recents', name: 'Recents', icon: FileIcon, type: 'favorite' },
  { id: 'applications', name: 'Applications', icon: FolderOpen, type: 'favorite' },
  { id: 'desktop', name: 'Desktop', icon: Monitor, type: 'favorite' },
  { id: 'documents', name: 'Documents', icon: Folder, type: 'favorite' },
  { id: 'downloads', name: 'Downloads', icon: Download, type: 'favorite' },
  { id: 'macintosh', name: 'Macintosh HD', icon: HardDrive, type: 'location' },
  { id: 'workspace', name: 'Workspaces', icon: Briefcase, type: 'location' },
]

// File node type
interface FileNode {
  id: string
  name: string
  type: 'folder' | 'file'
  extension?: string
  size?: number
  modifiedAt?: string
  children?: FileNode[]
}

// Mock file tree data representing local file system
const mockFiles: FileNode[] = [
  {
    id: '1',
    name: 'Downloads',
    type: 'folder',
    modifiedAt: '2026-02-10',
    children: [
      {
        id: '1-1',
        name: 'vacation-sunset.jpg',
        type: 'file',
        extension: 'jpg',
        size: 2457600,
        modifiedAt: '2026-02-08',
      },
      {
        id: '1-2',
        name: 'product-demo.mp4',
        type: 'file',
        extension: 'mp4',
        size: 157286400,
        modifiedAt: '2026-02-05',
      },
      {
        id: '1-3',
        name: 'meeting-notes.pdf',
        type: 'file',
        extension: 'pdf',
        size: 524288,
        modifiedAt: '2026-02-01',
      },
    ],
  },
  {
    id: '2',
    name: 'Documents',
    type: 'folder',
    modifiedAt: '2026-02-12',
    children: [
      {
        id: '2-1',
        name: 'Project Assets',
        type: 'folder',
        modifiedAt: '2026-02-11',
        children: [
          {
            id: '2-1-1',
            name: 'hero-image.png',
            type: 'file',
            extension: 'png',
            size: 3145728,
            modifiedAt: '2026-02-10',
          },
          {
            id: '2-1-2',
            name: 'logo-variations.ai',
            type: 'file',
            extension: 'ai',
            size: 8388608,
            modifiedAt: '2026-02-09',
          },
          {
            id: '2-1-3',
            name: 'brand-guidelines.pdf',
            type: 'file',
            extension: 'pdf',
            size: 2097152,
            modifiedAt: '2026-02-07',
          },
        ],
      },
      {
        id: '2-2',
        name: 'Reports',
        type: 'folder',
        modifiedAt: '2026-02-06',
        children: [
          {
            id: '2-2-1',
            name: 'Q4-review.docx',
            type: 'file',
            extension: 'docx',
            size: 1048576,
            modifiedAt: '2026-02-04',
          },
        ],
      },
    ],
  },
  {
    id: '3',
    name: 'Pictures',
    type: 'folder',
    modifiedAt: '2026-02-13',
    children: [
      {
        id: '3-1',
        name: 'Screenshots',
        type: 'folder',
        modifiedAt: '2026-02-13',
        children: [
          {
            id: '3-1-1',
            name: 'app-mockup-v2.png',
            type: 'file',
            extension: 'png',
            size: 1572864,
            modifiedAt: '2026-02-13',
          },
          {
            id: '3-1-2',
            name: 'dashboard-preview.png',
            type: 'file',
            extension: 'png',
            size: 2097152,
            modifiedAt: '2026-02-12',
          },
        ],
      },
      {
        id: '3-2',
        name: 'Camera Roll',
        type: 'folder',
        modifiedAt: '2026-02-11',
        children: [
          {
            id: '3-2-1',
            name: 'IMG_1234.jpg',
            type: 'file',
            extension: 'jpg',
            size: 4194304,
            modifiedAt: '2026-02-11',
          },
          {
            id: '3-2-2',
            name: 'IMG_1235.jpg',
            type: 'file',
            extension: 'jpg',
            size: 3670016,
            modifiedAt: '2026-02-11',
          },
        ],
      },
    ],
  },
  {
    id: '4',
    name: 'Videos',
    type: 'folder',
    modifiedAt: '2026-02-09',
    children: [
      {
        id: '4-1',
        name: 'tutorial-recording.mov',
        type: 'file',
        extension: 'mov',
        size: 524288000,
        modifiedAt: '2026-02-09',
      },
      {
        id: '4-2',
        name: 'screen-capture.mp4',
        type: 'file',
        extension: 'mp4',
        size: 104857600,
        modifiedAt: '2026-02-08',
      },
    ],
  },
]

function getFileIcon(node: FileNode, sizeClass: string = 'w-4 h-4') {
  if (node.type === 'folder') {
    return <Folder className={cn(sizeClass, 'text-blue-500')} />
  }

  const ext = node.extension?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'psd', 'ai'].includes(ext || '')) {
    return <Image className={cn(sizeClass, 'text-foreground/70')} />
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) {
    return <FileVideo className={cn(sizeClass, 'text-foreground/70')} />
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
    return <FileText className={cn(sizeClass, 'text-foreground/70')} />
  }
  return <File className={cn(sizeClass, 'text-foreground/70')} />
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface FinderWindowProps {
  window: WindowState
  isActive: boolean
  onFocus: () => void
  onMove: (x: number, y: number) => void
  onResize: (width: number, height: number, x?: number, y?: number) => void
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}

export function FinderWindow({
  window: windowState,
  isActive,
  onFocus,
  onMove,
  onResize,
  onMinimize,
  onMaximize,
  onClose,
}: FinderWindowProps) {
  const [selectedSidebar, setSelectedSidebar] = useState('downloads')
  const [viewMode, setViewMode] = useState<'icons' | 'list' | 'columns'>('list')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '2', '3']))
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Flatten all files for icons view
  const getAllFiles = (nodes: FileNode[]): FileNode[] => {
    const result: FileNode[] = []
    for (const node of nodes) {
      result.push(node)
      if (node.type === 'folder' && node.children) {
        result.push(...getAllFiles(node.children))
      }
    }
    return result
  }

  // List view row
  const renderFileRow = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id)
    const isSelected = selectedFile === node.id

    return (
      <div key={node.id}>
        <div
          onClick={() => {
            setSelectedFile(node.id)
            if (node.type === 'folder') {
              toggleFolder(node.id)
            }
          }}
          className={cn(
            'flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors',
            isSelected ? 'bg-surface-selected' : 'hover:bg-surface-2'
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {/* Expand/collapse chevron */}
          <div className="w-3 flex-shrink-0">
            {node.type === 'folder' && node.children && node.children.length > 0 && (
              <ChevronRightSmall
                className={cn(
                  'w-3 h-3 text-foreground-dim transition-transform',
                  isExpanded && 'rotate-90'
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

          {/* Date modified */}
          <span className="w-24 text-right text-label-0-regular text-foreground-dim">
            {formatDate(node.modifiedAt)}
          </span>

          {/* Size */}
          <span className="w-16 text-right text-label-0-regular text-foreground-dim">
            {node.type === 'file' ? formatFileSize(node.size) : '—'}
          </span>
        </div>

        {/* Children */}
        {node.type === 'folder' && isExpanded && node.children && (
          <>
            {node.children.map((child) => renderFileRow(child, depth + 1))}
          </>
        )}
      </div>
    )
  }

  // Icons view
  const renderIconsView = () => (
    <div className="grid grid-cols-4 gap-4 p-4">
      {mockFiles.map((node) => (
        <div
          key={node.id}
          onClick={() => setSelectedFile(node.id)}
          className={cn(
            'flex flex-col items-center gap-2 p-3 rounded cursor-pointer transition-colors',
            selectedFile === node.id ? 'bg-surface-selected' : 'hover:bg-surface-2'
          )}
        >
          {getFileIcon(node, 'w-12 h-12')}
          <span className="text-body-0-regular text-foreground text-center truncate w-full">
            {node.name}
          </span>
        </div>
      ))}
    </div>
  )

  // Columns view
  const [columnPath, setColumnPath] = useState<FileNode[]>([])

  const renderColumnsView = () => {
    const columns: FileNode[][] = [mockFiles]

    // Build columns from selected path
    for (const node of columnPath) {
      if (node.type === 'folder' && node.children) {
        columns.push(node.children)
      }
    }

    return (
      <div className="flex h-full overflow-x-auto">
        {columns.map((columnFiles, colIndex) => (
          <div
            key={colIndex}
            className="min-w-[180px] max-w-[200px] border-r border-border-dim flex-shrink-0 overflow-y-auto"
          >
            {columnFiles.map((node) => {
              const isSelected = columnPath[colIndex]?.id === node.id
              return (
                <div
                  key={node.id}
                  onClick={() => {
                    setSelectedFile(node.id)
                    // Update column path
                    const newPath = columnPath.slice(0, colIndex)
                    if (node.type === 'folder') {
                      newPath.push(node)
                    }
                    setColumnPath(newPath)
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors',
                    isSelected ? 'bg-surface-selected' : 'hover:bg-surface-2'
                  )}
                >
                  {getFileIcon(node)}
                  <span className="flex-1 text-body-0-regular text-foreground truncate">
                    {node.name}
                  </span>
                  {node.type === 'folder' && node.children && node.children.length > 0 && (
                    <ChevronRightSmall className="w-3 h-3 text-foreground-dim" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
        {/* Empty column for visual balance */}
        <div className="flex-1 min-w-[100px]" />
      </div>
    )
  }

  // List view
  const renderListView = () => (
    <>
      {/* Column headers */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-2 border-b border-border-dim sticky top-0">
        <div className="w-3 flex-shrink-0" />
        <div className="w-4 flex-shrink-0" />
        <span className="flex-1 text-label-0-bold text-foreground-dim">Name</span>
        <span className="w-24 text-right text-label-0-bold text-foreground-dim">Date Modified</span>
        <span className="w-16 text-right text-label-0-bold text-foreground-dim">Size</span>
      </div>

      {/* Files */}
      <div className="py-1">
        {mockFiles.map((node) => renderFileRow(node))}
      </div>
    </>
  )

  return (
    <DesktopWindow
      window={windowState}
      isActive={isActive}
      canClose={true}
      onFocus={onFocus}
      onMove={onMove}
      onResize={onResize}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      onClose={onClose}
    >
      <div className="h-full flex flex-col bg-surface-low">
        {/* Toolbar */}
        <div className="h-10 flex items-center gap-2 px-3 bg-surface-mid border-b border-border-dim flex-shrink-0">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-surface-selected-subtle text-foreground-dim">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 rounded hover:bg-surface-selected-subtle text-foreground-dim">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Current folder name */}
          <span className="flex-1 text-body-0-bold text-foreground text-center">
            {selectedSidebar === 'downloads' ? 'Downloads' : 'Macintosh HD'}
          </span>

          {/* View mode buttons */}
          <div className="flex items-center gap-0.5 bg-surface-2 rounded p-0.5">
            <button
              onClick={() => setViewMode('icons')}
              className={cn(
                'p-1 rounded transition-colors',
                viewMode === 'icons' ? 'bg-surface-selected text-foreground' : 'text-foreground-dim hover:text-foreground'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1 rounded transition-colors',
                viewMode === 'list' ? 'bg-surface-selected text-foreground' : 'text-foreground-dim hover:text-foreground'
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('columns')}
              className={cn(
                'p-1 rounded transition-colors',
                viewMode === 'columns' ? 'bg-surface-selected text-foreground' : 'text-foreground-dim hover:text-foreground'
              )}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main content area with sidebar */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar */}
          <div className="w-40 flex-shrink-0 bg-surface-1 border-r border-border-dim overflow-y-auto">
            {/* Favorites section */}
            <div className="py-2">
              <div className="px-3 py-1 text-label-0-bold text-foreground-dim uppercase tracking-wider">
                Favorites
              </div>
              {sidebarItems
                .filter((item) => item.type === 'favorite')
                .map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedSidebar === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSidebar(item.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1 text-left transition-colors',
                        isSelected ? 'bg-surface-selected text-foreground' : 'text-foreground-dim hover:bg-surface-2'
                      )}
                    >
                      <Icon className="w-4 h-4 text-blue-500" />
                      <span className="text-body-0-regular truncate">{item.name}</span>
                    </button>
                  )
                })}
            </div>

            {/* Locations section */}
            <div className="py-2">
              <div className="px-3 py-1 text-label-0-bold text-foreground-dim uppercase tracking-wider">
                Locations
              </div>
              {sidebarItems
                .filter((item) => item.type === 'location')
                .map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedSidebar === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSidebar(item.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1 text-left transition-colors',
                        isSelected ? 'bg-surface-selected text-foreground' : 'text-foreground-dim hover:bg-surface-2'
                      )}
                    >
                      <Icon className="w-4 h-4 text-foreground-dim" />
                      <span className="text-body-0-regular truncate">{item.name}</span>
                    </button>
                  )
                })}
            </div>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-auto bg-surface-flat">
            {viewMode === 'list' && renderListView()}
            {viewMode === 'icons' && renderIconsView()}
            {viewMode === 'columns' && renderColumnsView()}
          </div>
        </div>

        {/* Status bar */}
        <div className="h-6 flex items-center justify-between px-3 bg-surface-mid border-t border-border-dim flex-shrink-0">
          <span className="text-label-0-regular text-foreground-dim">
            {mockFiles.length} items
          </span>
          <span className="text-label-0-regular text-foreground-dim">
            2.5 GB available
          </span>
        </div>
      </div>
    </DesktopWindow>
  )
}
