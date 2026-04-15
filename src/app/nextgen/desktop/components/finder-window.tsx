'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DesktopWindow } from './desktop-window'
import { cn, formatDate } from '@/lib/utils'
import type { WindowState, SyncStatus } from '../view'
import type { UnifiedFileNode } from '@/lib/workspace-data'
import { DOMAIN_FOLDER_MAP, isReferenceFolder } from '@/lib/workspace-data'
import { useAccess, useCollections, useFileTree, usePersona } from '@/hooks'
import { materializeReferenceFolders } from '@/lib/reference-folder-utils'
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Columns,
  ChevronRight as ChevronRightSmall,
  Folder,
  File,
  Image as ImageIcon,
  FileVideo,
  FileText,
  HardDrive,
  Monitor,
  Cloud,
  CloudOff,
  Download,
  FileIcon,
  FolderOpen,
  Briefcase,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { getAssetsByIds } from '@/lib/data'
import type { Asset, AssetType } from '@/lib/data'
import type { DomainId } from '@/components/department/types'

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
  { id: 'workspace', name: 'Apex S1 / 7168465', icon: Briefcase, type: 'location' },
]

// Use UnifiedFileNode as the file node type throughout Finder
type FileNode = UnifiedFileNode

const DOMAIN_ROOT_IDS = new Set(
  Object.values(DOMAIN_FOLDER_MAP).map((domainFolder) => domainFolder.id),
)

// LocalStorage key for expanded folders (workspace files now live in useFileTree)
const EXPANDED_FOLDERS_STORAGE_KEY = 'desktop-expanded-folders'

// Default expanded folders
const DEFAULT_EXPANDED_FOLDERS = ['1', '2', '3', 'ws-art', 'ws-vfx', 'ws-camera', 'ws-editorial', 'ws-audio']

// Mock file tree data representing local file system (non-workspace OS files)
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

// Helper function to find a node by ID
function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function filterWorkspaceNodeByAccess(
  node: FileNode,
  canAccess: (id: string) => boolean,
  canSeeRestrictedFolders: boolean,
): FileNode | null {
  const isVisible = canAccess(node.id) || (node.type === 'folder' && canSeeRestrictedFolders)
  if (!isVisible) return null

  if (!node.children) return node

  return {
    ...node,
    children: node.children
      .map((child) => filterWorkspaceNodeByAccess(child, canAccess, canSeeRestrictedFolders))
      .filter((child): child is FileNode => child !== null),
  }
}

function getFileIcon(node: FileNode, sizeClass: string = 'w-4 h-4') {
  if (node.type === 'folder') {
    return <Folder className={cn(sizeClass, 'text-blue-500')} />
  }

  const ext = node.extension?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'psd', 'ai'].includes(ext || '')) {
    return <ImageIcon className={cn(sizeClass, 'text-foreground/70')} />
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) {
    return <FileVideo className={cn(sizeClass, 'text-foreground/70')} />
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
    return <FileText className={cn(sizeClass, 'text-foreground/70')} />
  }
  return <File className={cn(sizeClass, 'text-foreground/70')} />
}

// Render folder sync indicators.
function FolderIndicators({
  node,
  className,
  cloudSyncEnabled,
  syncStatus,
}: {
  node: FileNode
  className?: string
  cloudSyncEnabled?: boolean
  syncStatus?: SyncStatus
}) {
  const showSyncStatus = cloudSyncEnabled && node.type === 'folder'

  if (node.type !== 'folder' || !showSyncStatus) {
    return null
  }

  // Get sync icon based on status
  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <Cloud className="w-3.5 h-3.5 text-foreground-dim" />
      case 'syncing':
        return <Loader2 className="w-3.5 h-3.5 text-foreground-dim animate-spin" />
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
      case 'offline':
        return <CloudOff className="w-3.5 h-3.5 text-foreground-dim" />
      default:
        return <Cloud className="w-3.5 h-3.5 text-foreground-dim" />
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {getSyncIcon()}
    </div>
  )
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
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
  cloudSyncEnabled: boolean
  syncStatus: SyncStatus
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
  cloudSyncEnabled,
  syncStatus,
}: FinderWindowProps) {
  const [selectedSidebar, setSelectedSidebar] = useState('workspace')
  const [viewMode, setViewMode] = useState<'icons' | 'list' | 'columns'>('list')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(DEFAULT_EXPANDED_FOLDERS))
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Folder navigation state (for icons view) - stores folder IDs to avoid stale references
  const [folderPathIds, setFolderPathIds] = useState<string[]>([])

  // Shared file tree from context
  const { tree: workspaceFiles, createFolder: contextCreateFolder, createFile: contextCreateFile, renameNode: contextRenameNode, deleteNode: contextDeleteNode, getFileNodesForFolder } = useFileTree()
  const { canAccess, sharesReceivedByMe, filterByAccess } = useAccess()
  const { getCollection, filterAssets, scopedAssets } = useCollections()
  const { activePersona } = usePersona()

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)
  const canSeeRestrictedFolders = activePersona?.role === 'manager'

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  useEffect(() => {
    const saved = localStorage.getItem(EXPANDED_FOLDERS_STORAGE_KEY)
    if (!saved) return
    try {
      setExpandedFolders(new Set(JSON.parse(saved)))
    } catch {
      setExpandedFolders(new Set(DEFAULT_EXPANDED_FOLDERS))
    }
  }, [])

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    item: FileNode
    isBackground?: boolean
  } | null>(null)

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }

    if (contextMenu) {
      document.addEventListener('click', handleClick)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('click', handleClick)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [contextMenu])

  // Handle right-click on file/folder
  const handleContextMenu = useCallback((e: React.MouseEvent, item: FileNode) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedFile(item.id)
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    })
  }, [])

  // Handle right-click on empty background area
  const handleBackgroundContextMenu = useCallback((e: React.MouseEvent) => {
    // Only trigger if the click target is the container itself (not a file/folder row)
    if ((e.target as HTMLElement).closest('[data-file-node]')) return
    e.preventDefault()
    // Current folder = last ID in folderPathIds, or the sidebar root
    const lastId = folderPathIds.length > 0 ? folderPathIds[folderPathIds.length - 1] : null
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item: lastId
        ? { id: lastId, name: '', type: 'folder', children: [] }
        : { id: '__root__', name: '', type: 'folder', children: [] },
      isBackground: true,
    })
  }, [folderPathIds])

  // Create a new folder inside the specified parent folder
  const handleCreateFolder = useCallback((parentId: string | null) => {
    if (selectedSidebar !== 'workspace') {
      setContextMenu(null)
      return
    }

    if (parentId) {
      const parentFolder = findNodeById(workspaceFiles, parentId)
      if (isReferenceFolder(parentFolder)) {
        setContextMenu(null)
        return
      }
    }

    const newId = contextCreateFolder(parentId, 'untitled folder')
    if (parentId) {
      setExpandedFolders((prev) => {
        const next = new Set([...Array.from(prev), parentId])
        localStorage.setItem(EXPANDED_FOLDERS_STORAGE_KEY, JSON.stringify(Array.from(next)))
        return next
      })
    }
    setContextMenu(null)
    setTimeout(() => {
      setRenamingId(newId)
      setRenameValue('untitled folder')
    }, 50)
  }, [contextCreateFolder, selectedSidebar, workspaceFiles])

  const resolveCollectionAssetsLive = useCallback((collection: import('@/lib/collection-types').Collection): Asset[] => {
    if (!('boundFolderId' in collection) || !collection.boundFolderId) return []
    const fileNodes = getFileNodesForFolder(collection.boundFolderId)
    const fileIds = fileNodes.map(n => n.id)
    const seedAssets = getAssetsByIds(fileIds)
    const seedIds = new Set(seedAssets.map(a => a.id))
    const synthesized: Asset[] = fileNodes
      .filter(n => !seedIds.has(n.id))
      .map(n => ({
        id: n.id,
        name: n.name,
        type: (n.extension ? (['mp4', 'mov', 'avi', 'mkv', 'webm', 'mxf'].includes(n.extension) ? 'video' : ['jpg', 'jpeg', 'png', 'psd', 'tiff', 'exr', 'dpx', 'svg', 'webp'].includes(n.extension) ? 'image' : ['wav', 'mp3', 'aac', 'flac', 'aiff'].includes(n.extension) ? 'audio' : 'text') : 'text') as AssetType,
        extension: n.extension,
        department: collection.boundDomainId as DomainId | undefined,
        created_at: n.modifiedAt,
      }))
    return [...seedAssets, ...synthesized]
  }, [getFileNodesForFolder])

  const resolvedWorkspaceFiles = useMemo(() => {
    return materializeReferenceFolders(workspaceFiles, {
      getCollection,
      filterAssets,
      filterByAccess,
      scopedAssets,
      resolveAssets: resolveCollectionAssetsLive,
    })
  }, [workspaceFiles, getCollection, filterAssets, filterByAccess, scopedAssets, resolveCollectionAssetsLive])

  const visibleSharedWorkspaceFiles = useMemo(() => {
    return sharesReceivedByMe
      .filter((entry) => {
        if (entry.resourceType !== 'folder') return false
        if (DOMAIN_ROOT_IDS.has(entry.resourceId)) return false
        if (activePersona?.domainId && entry.domainId === activePersona.domainId) return false
        return true
      })
      .map((entry) => {
        const sourceNode = findNodeById(resolvedWorkspaceFiles, entry.resourceId)
        const sharedNode = sourceNode?.type === 'folder'
          ? sourceNode
          : {
              id: entry.resourceId,
              name: entry.label,
              type: 'folder' as const,
              modifiedAt: entry.grantedAt,
              children: [],
            }

        return filterWorkspaceNodeByAccess(sharedNode, canAccess, canSeeRestrictedFolders)
      })
      .filter((node): node is FileNode => node !== null)
  }, [sharesReceivedByMe, activePersona, resolvedWorkspaceFiles, canAccess, canSeeRestrictedFolders])

  const visibleWorkspaceFiles = useMemo(() => {
    const roots = resolvedWorkspaceFiles
      .map((node) => {
        if (DOMAIN_ROOT_IDS.has(node.id) && !canAccess(node.id)) {
          return null
        }
        return filterWorkspaceNodeByAccess(node, canAccess, canSeeRestrictedFolders)
      })
      .filter((node): node is FileNode => node !== null)

    for (const sharedNode of visibleSharedWorkspaceFiles) {
      if (!roots.some((rootNode) => rootNode.id === sharedNode.id)) {
        roots.push(sharedNode)
      }
    }

    return roots
  }, [resolvedWorkspaceFiles, canAccess, canSeeRestrictedFolders, visibleSharedWorkspaceFiles])

  // Get root files based on selected sidebar location.
  const rootFiles = selectedSidebar === 'workspace' ? visibleWorkspaceFiles : mockFiles

  // Build folder path from IDs (to get fresh references from current state)
  const folderPath = folderPathIds.map(id => findNodeById(rootFiles, id)).filter((n): n is FileNode => n !== null)

  // Start renaming an item
  const handleStartRename = useCallback((item: FileNode) => {
    if (isReferenceFolder(item)) {
      setContextMenu(null)
      return
    }
    setRenamingId(item.id)
    setRenameValue(item.name)
    setContextMenu(null)
  }, [])

  // Finish renaming (save)
  const handleFinishRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      const item = findNodeById(rootFiles, renamingId)
      if (isReferenceFolder(item)) {
        setRenamingId(null)
        setRenameValue('')
        return
      }
      contextRenameNode(renamingId, renameValue.trim())
    }
    setRenamingId(null)
    setRenameValue('')
  }, [renamingId, renameValue, contextRenameNode, rootFiles])

  // Cancel renaming
  const handleCancelRename = useCallback(() => {
    setRenamingId(null)
    setRenameValue('')
  }, [])

  // Delete an item
  const handleDeleteItem = useCallback((itemId: string) => {
    const item = findNodeById(rootFiles, itemId)
    if (isReferenceFolder(item)) {
      setContextMenu(null)
      return
    }
    contextDeleteNode(itemId)
    setContextMenu(null)
    if (selectedFile === itemId) {
      setSelectedFile(null)
    }
  }, [selectedFile, contextDeleteNode, rootFiles])

  // Get current files based on folder path (for icons view navigation)
  const currentFiles = folderPath.length > 0
    ? folderPath[folderPath.length - 1].children || []
    : rootFiles

  // Navigate into a folder (for icons view).
  const navigateIntoFolder = useCallback((folder: FileNode) => {
    if (folder.type === 'folder' && folder.children) {
      setFolderPathIds((prev) => [...prev, folder.id])
      setSelectedFile(null)
    }
  }, [])

  // Navigate back one folder
  const navigateBack = useCallback(() => {
    setFolderPathIds((prev) => prev.slice(0, -1))
    setSelectedFile(null)
  }, [])

  // Check if we can go back
  const canGoBack = folderPath.length > 0

  // Get display name for current location
  const getLocationName = () => {
    if (folderPath.length > 0) {
      return folderPath[folderPath.length - 1].name
    }
    const item = sidebarItems.find((i) => i.id === selectedSidebar)
    return item?.name || 'Finder'
  }

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem(EXPANDED_FOLDERS_STORAGE_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  // List view row
  const renderFileRow = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id)
    const isSelected = selectedFile === node.id

    return (
      <div key={node.id}>
        <div
          data-file-node
          onClick={() => {
            setSelectedFile(node.id)
            if (node.type === 'folder') {
              toggleFolder(node.id)
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
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

          {/* Name - with inline rename support */}
          {renamingId === node.id ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFinishRename()
                } else if (e.key === 'Escape') {
                  handleCancelRename()
                }
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-body-0-regular text-foreground bg-surface-high border border-border-subtle rounded px-1 py-0 outline-none focus:border-blue-500"
            />
          ) : (
            <span className="flex-1 text-body-0-regular text-foreground truncate">
              {node.name}
            </span>
          )}

          {/* Folder indicators */}
          <div className="w-12 flex justify-end">
            <FolderIndicators node={node} cloudSyncEnabled={cloudSyncEnabled} syncStatus={syncStatus} />
          </div>

          {/* Date modified */}
          <span className="w-24 text-right text-label-0-regular text-foreground-dim">
            {formatDate(node.modifiedAt)}
          </span>

          {/* Size */}
          <span className="w-16 text-right text-label-0-regular text-foreground-dim">
            {node.type === 'file' ? formatFileSize(node.size) : '—'}
          </span>
        </div>

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
      {currentFiles.map((node) => (
        <div
          key={node.id}
          data-file-node
          onClick={() => setSelectedFile(node.id)}
          onDoubleClick={() => {
            if (node.type === 'folder') {
              navigateIntoFolder(node)
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          className={cn(
            'flex flex-col items-center gap-2 p-3 rounded cursor-pointer transition-colors',
            selectedFile === node.id ? 'bg-surface-selected' : 'hover:bg-surface-2'
          )}
        >
          {getFileIcon(node, 'w-12 h-12')}
          {renamingId === node.id ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFinishRename()
                } else if (e.key === 'Escape') {
                  handleCancelRename()
                }
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-body-0-regular text-foreground text-center bg-surface-high border border-border-subtle rounded px-1 py-0 outline-none focus:border-blue-500 w-full"
            />
          ) : (
            <span className="text-body-0-regular text-foreground text-center truncate w-full">
              {node.name}
            </span>
          )}
        </div>
      ))}
    </div>
  )

  // Columns view
  const [columnPath, setColumnPath] = useState<FileNode[]>([])

  useEffect(() => {
    setFolderPathIds([])
    setColumnPath([])
    setSelectedFile(null)
  }, [activePersona?.id, selectedSidebar])

  const renderColumnsView = () => {
    const columns: FileNode[][] = [currentFiles]

    // Build columns from selected path.
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
                  data-file-node
                  onClick={() => {
                    setSelectedFile(node.id)
                    // Update column path.
                    const newPath = columnPath.slice(0, colIndex)
                    if (node.type === 'folder') {
                      newPath.push(node)
                    }
                    setColumnPath(newPath)
                  }}
                  onContextMenu={(e) => handleContextMenu(e, node)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors',
                    isSelected ? 'bg-surface-selected' : 'hover:bg-surface-2'
                  )}
                >
                  {getFileIcon(node)}
                  {renamingId === node.id ? (
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleFinishRename()
                        } else if (e.key === 'Escape') {
                          handleCancelRename()
                        }
                        e.stopPropagation()
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-body-0-regular text-foreground bg-surface-high border border-border-subtle rounded px-1 py-0 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="flex-1 text-body-0-regular text-foreground truncate">
                      {node.name}
                    </span>
                  )}
                  <FolderIndicators node={node} cloudSyncEnabled={cloudSyncEnabled} syncStatus={syncStatus} />
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
      <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-2 dark:bg-[#232829] border-b border-border-dim sticky top-0">
        <div className="w-3 flex-shrink-0" />
        <div className="w-4 flex-shrink-0" />
        <span className="flex-1 text-label-0-bold text-foreground-dim">Name</span>
        <span className="w-12 text-right text-label-0-bold text-foreground-dim">Status</span>
        <span className="w-24 text-right text-label-0-bold text-foreground-dim">Date Modified</span>
        <span className="w-16 text-right text-label-0-bold text-foreground-dim">Size</span>
      </div>

      {/* Files */}
      <div className="py-1">
        {currentFiles.map((node) => renderFileRow(node))}
      </div>
    </>
  )

  // Title bar content with navigation and view toggles
  const titleBarContent = (
    <>
      {/* Navigation buttons */}
      <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
        <button
          onClick={navigateBack}
          disabled={!canGoBack}
          className={cn(
            'p-1 rounded transition-colors',
            canGoBack
              ? 'text-foreground-dim hover:bg-surface-selected-subtle'
              : 'text-foreground-subtle cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="p-1 rounded hover:bg-surface-selected-subtle text-foreground-dim">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Current folder name */}
      <span className="flex-1 text-body-0-bold text-foreground text-center">
        {getLocationName()}
      </span>

      {/* View mode buttons */}
      <div className="flex items-center gap-0.5 bg-surface-2 dark:bg-[#232829] rounded p-0.5" onMouseDown={(e) => e.stopPropagation()}>
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
      titleBarContent={titleBarContent}
      className="rounded-xl dark:bg-[#1D2123]"
      titleBarClassName="dark:bg-[#1D2123]"
    >
      <div className="h-full flex flex-col bg-surface-low dark:bg-[#1D2123]">
        {/* Main content area with sidebar */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar */}
          <div className="w-40 flex-shrink-0 bg-surface-1 dark:bg-[#1A1E20] border-r border-border-dim overflow-y-auto">
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
                      onClick={() => {
                        setSelectedSidebar(item.id)
                        setColumnPath([])
                        setFolderPathIds([])
                      }}
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
                      onClick={() => {
                        setSelectedSidebar(item.id)
                        setColumnPath([])
                        setFolderPathIds([])
                      }}
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
          <div
            className="flex-1 overflow-auto bg-surface-flat dark:bg-[#181B1C]"
            onContextMenu={handleBackgroundContextMenu}
          >
            {viewMode === 'list' && renderListView()}
            {viewMode === 'icons' && renderIconsView()}
            {viewMode === 'columns' && renderColumnsView()}
          </div>
        </div>

        {/* Status bar */}
        <div className="h-6 flex items-center justify-between px-3 bg-surface-mid dark:bg-[#1D2123] border-t border-border-dim flex-shrink-0">
          <span className="text-label-0-regular text-foreground-dim">
            {currentFiles.length} items
          </span>
          <span className="text-label-0-regular text-foreground-dim">
            2.5 GB available
          </span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[9999] min-w-[200px] py-1 rounded-lg border shadow-high backdrop-blur-2xl backdrop-saturate-150 bg-[rgba(30,30,30,0.65)] border-white/20"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.isBackground ? (
            <>
              <ContextMenuItem
                label="New Folder"
                shortcut="⇧⌘N"
                disabled={selectedSidebar !== 'workspace'}
                onClick={() => handleCreateFolder(contextMenu.item.id === '__root__' ? null : contextMenu.item.id)}
              />
              <ContextMenuDivider />
              <ContextMenuItem label="Get Info" shortcut="⌘I" onClick={() => setContextMenu(null)} />
              <ContextMenuItem label="Sort By" hasSubmenu />
              <ContextMenuItem label="Clean Up" onClick={() => setContextMenu(null)} />
            </>
          ) : (
            <>
              {isReferenceFolder(contextMenu.item) ? (
                <ContextMenuItem label="Open" shortcut="⌘O" onClick={() => setContextMenu(null)} />
              ) : (
                <>
              <ContextMenuItem label="Open" shortcut="⌘O" onClick={() => setContextMenu(null)} />
              <ContextMenuItem label="Open With" hasSubmenu />
              <ContextMenuDivider />
              <ContextMenuItem label="Get Info" shortcut="⌘I" onClick={() => setContextMenu(null)} />
              <ContextMenuItem
                label="Rename"
                onClick={() => handleStartRename(contextMenu.item)}
              />
              <ContextMenuDivider />
              <ContextMenuItem label="Compress" onClick={() => setContextMenu(null)} />
              <ContextMenuItem label="Duplicate" shortcut="⌘D" onClick={() => setContextMenu(null)} />
              <ContextMenuItem label="Make Alias" shortcut="⌘L" onClick={() => setContextMenu(null)} />
              <ContextMenuItem label="Quick Look" shortcut="Space" onClick={() => setContextMenu(null)} />
              <ContextMenuDivider />
              <ContextMenuItem label="Copy" shortcut="⌘C" onClick={() => setContextMenu(null)} />
              <ContextMenuItem label="Share" hasSubmenu />
              <ContextMenuDivider />
              {contextMenu.item.type === 'folder' && (
                <>
                  <ContextMenuItem
                    label="New Folder"
                    shortcut="⇧⌘N"
                    disabled={selectedSidebar !== 'workspace'}
                    onClick={() => handleCreateFolder(contextMenu.item.id)}
                  />
                  <ContextMenuItem
                    label="New File"
                    disabled={selectedSidebar !== 'workspace'}
                    onClick={() => {
                      const names = ['SEQ010_SH040_comp_v1.exr', 'hero_closeup_final.dpx', 'ambience_pit_lane.wav', 'grade_pass_02.mov', 'concept_sketch_v3.psd', 'lens_calibration_data.csv']
                      contextCreateFile(contextMenu.item.id, names[Math.floor(Math.random() * names.length)])
                    }}
                  />
                  <ContextMenuDivider />
                </>
              )}
              <ContextMenuItem
                label="Move to Trash"
                shortcut="⌘⌫"
                onClick={() => handleDeleteItem(contextMenu.item.id)}
              />
                </>
              )}
            </>
          )}
        </div>
      )}
    </DesktopWindow>
  )
}

// Context menu item component
function ContextMenuItem({
  label,
  shortcut,
  hasSubmenu,
  disabled,
  onClick,
}: {
  label: string
  shortcut?: string
  hasSubmenu?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-1 text-left transition-colors rounded-sm mx-1',
        disabled
          ? 'text-black/30 dark:text-white/30 cursor-not-allowed'
          : 'text-gray-900 dark:text-white hover:bg-blue-500 hover:text-white'
      )}
      style={{ width: 'calc(100% - 8px)' }}
    >
      <span className="text-body-0-regular">{label}</span>
      {shortcut && (
        <span className="text-label-0-regular text-black/40 dark:text-white/50 ml-4">{shortcut}</span>
      )}
      {hasSubmenu && (
        <ChevronRightSmall className="w-3 h-3 text-black/40 dark:text-white/50" />
      )}
    </button>
  )
}

// Context menu divider
function ContextMenuDivider() {
  return <div className="my-1 border-t border-black/10 dark:border-white/10 mx-2" />
}
