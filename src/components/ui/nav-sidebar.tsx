'use client'

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  Plus,

  Grid,
  Folder,
  FolderOpen,
  FolderSymlink,
  Search,
  FileText,
  Home,
  Settings,
  Users,
  Image,
  Video,
  Music,
  Database,
  Film,
  Layout,
  Layers,
  MapPin,
  Zap,
  Lock,
  Inbox,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { useSmartCollections, useFileTree, useAccess, usePersona } from '@/hooks'
import { useUserCollections } from '@/hooks/useUserCollections'
import { matchesFilter } from '@/lib/smart-collection-filters'
import { SHARED_MOUNT_FOLDER_ID } from '@/lib/workspace-data'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { collectAccessibleWorkspaceRoots, collectSharedFolderIds } from '@/lib/workspace-roots'
import { cn } from '@/lib/utils'
import { useToast } from './toast'
import { Tag } from './tag'
import type { NavConfig } from '@/types/navigation'

/**
 * Navigation Sidebar
 *
 * Vertical navigation following Hawkins design system
 * - Section headers: 10px uppercase, 40% opacity, collapsible with chevron
 * - Links: 13px semibold, selected has indigo bg at 20% opacity
 *
 * Can render dynamic navigation via navConfig prop, or falls back to
 * hardcoded nextgen navigation for backward compatibility.
 */

const NAV_STORAGE_KEY = 'nav-expanded'
const NAV_SCROLL_STORAGE_KEY = 'nav-scroll-top'
const NAV_SCROLL_RESTORE_ATTEMPTS = 8

/** Mobile variant context — when true, renders with larger touch targets and text */
const NavMobileContext = createContext(false)
function useNavMobile() { return useContext(NavMobileContext) }

function readStoredNavScrollTop(): number {
  try {
    const stored = sessionStorage.getItem(NAV_SCROLL_STORAGE_KEY)
    if (!stored) return 0
    const parsed = Number.parseInt(stored, 10)
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

function writeStoredNavScrollTop(scrollTop: number) {
  try {
    sessionStorage.setItem(NAV_SCROLL_STORAGE_KEY, String(scrollTop))
  } catch {}
}

function usePersistedExpand(key: string, fallback: boolean, skipRestore = false): [boolean, (v: boolean) => void] {
  // Always start collapsed on server to avoid hydration mismatch,
  // then restore the real value on mount.
  const [value, setValue] = useState(false)

  useEffect(() => {
    if (skipRestore) {
      setValue(fallback)
      return
    }
    try {
      const stored = localStorage.getItem(NAV_STORAGE_KEY)
      if (stored) {
        const map = JSON.parse(stored)
        if (key in map) { setValue(map[key] as boolean); return }
      }
    } catch {}
    setValue(fallback)
  }, [key, skipRestore, fallback])

  const setPersisted = useCallback((next: boolean) => {
    setValue(next)
    try {
      const stored = localStorage.getItem(NAV_STORAGE_KEY)
      const map = stored ? JSON.parse(stored) : {}
      map[key] = next
      localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(map))
    } catch {}
  }, [key])

  return [value, setPersisted]
}

// Icon map for dynamic icon rendering
const iconMap: Record<string, LucideIcon> = {
  Grid,
  Folder,
  FolderSymlink,
  Search,
  FileText,
  Home,
  Settings,
  Users,
  Image,
  Video,
  Music,
  Database,
  Layout,
}

export interface NavSidebarProps {
  className?: string
  /** Width in pixels (controlled externally for resize) */
  width?: number
  style?: React.CSSProperties
  /** Dynamic navigation configuration */
  navConfig?: NavConfig
  /** Callback when "New Collection" is clicked */
  onNewCollection?: () => void
  /** Render with larger touch targets and text for mobile */
  mobile?: boolean
}

interface NavLinkProps {
  href: string
  label: string
  badge?: number
  /** 'unread' = indigo fill (inbox/shared), 'count' = border + dim text (collections) */
  badgeStyle?: 'unread' | 'count'
  icon?: React.ReactNode
  /** When true, also highlight for subpaths (e.g. /workspace/art-design matches /workspace/art-design/subfolder) */
  matchSubpaths?: boolean
}

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function NavLink({ href, label, badge, badgeStyle = 'count', icon, matchSubpaths = false }: NavLinkProps) {
  const pathname = usePathname()
  const mobile = useNavMobile()
  const isActive = pathname === href || (matchSubpaths && pathname.startsWith(href + '/'))

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center justify-between px-3 rounded transition-colors min-w-0',
        mobile ? 'py-3 text-body-1-bold' : 'py-2 text-body-0-bold',
        isActive
          ? 'bg-indigo-500/20 text-foreground'
          : 'text-foreground-subtle hover:bg-surface-2 hover:text-foreground'
      )}
    >
      <span className="flex items-center gap-2 min-w-0 truncate">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="flex items-center gap-1.5">
          {badgeStyle === 'unread' ? (
            <Tag size="compact" type="announcement">{badge}</Tag>
          ) : (
            <Tag size="compact" type="neutral" variant="border" className="text-foreground-dim">{badge}</Tag>
          )}
        </span>
      )}
    </Link>
  )
}

interface TreeNavLinkProps {
  href?: string
  label: string
  icon?: React.ReactNode
  /** Icon shown when the node is expanded (replaces icon) */
  iconExpanded?: React.ReactNode
  badge?: number
  /** 'unread' = indigo fill (inbox/shared), 'count' = border + dim text (collections) */
  badgeStyle?: 'unread' | 'count'
  children?: React.ReactNode
  defaultExpanded?: boolean
  /** Reserve chevron space even when there are no children, for alignment */
  indent?: boolean
  /** When true, forces the node to expand (e.g. when a child route becomes active externally) */
  forceExpand?: boolean
  /** Auto-expand the full child tree when a descendant becomes active */
  autoExpandOnActiveChild?: boolean
  /** Optional collapsed preview shown when a descendant is active but the tree is collapsed */
  collapsedPreview?: React.ReactNode
  /** Optional icon rendered on the right side, after the badge area */
  trailingIcon?: React.ReactNode
  /** Called when assets are dropped on this item */
  onAssetDrop?: (assetIds: string[]) => void
}

function TreeNavLink({
  href,
  label,
  icon,
  iconExpanded,
  badge,
  badgeStyle = 'count',
  children,
  defaultExpanded = true,
  indent = false,
  forceExpand = false,
  autoExpandOnActiveChild = true,
  collapsedPreview,
  trailingIcon,
  onAssetDrop,
}: TreeNavLinkProps) {
  const pathname = usePathname()
  const mobile = useNavMobile()
  const [isDragOver, setIsDragOver] = useState(false)
  const isActive = href ? pathname === href : false
  // Check both /parent/ subroutes AND --child smart collection IDs
  const collectionBase = href ? href.replace(/^\/nextgen\/(smart-collections|collections)\//, '') : ''
  const currentPath = pathname.replace(/^\/nextgen\/(smart-collections|collections)\//, '')
  const isChildActive = href
    ? pathname.startsWith(href + '/') || (collectionBase && currentPath.startsWith(collectionBase + '--'))
    : false
  const shouldAutoExpandOnActiveChild = autoExpandOnActiveChild && isChildActive
  const storageKey = href || `tree:${label}`
  const hasActiveCollapsedPreview = Boolean(collapsedPreview) && isChildActive
  const [isExpanded, setIsExpanded] = usePersistedExpand(
    storageKey,
    hasActiveCollapsedPreview ? false : defaultExpanded,
  )

  // Force-expand when prop says so, or when a child route becomes active
  useEffect(() => {
    if ((forceExpand || shouldAutoExpandOnActiveChild) && !isExpanded) {
      setIsExpanded(true)
    }
  }, [forceExpand, shouldAutoExpandOnActiveChild, isExpanded, setIsExpanded])

  const hasChevron = !!children
  const hasLeadingIcon = !!icon
  const reserveChevronSpace = indent && !hasChevron && !hasLeadingIcon
  const showCollapsedPreview = hasActiveCollapsedPreview && !isExpanded
  const effectiveExpanded = isExpanded
  const hasLeadingArea = hasLeadingIcon || hasChevron || reserveChevronSpace

  const linkClassName = cn(
    'flex-1 flex items-center justify-between pr-3 min-w-0',
    mobile ? 'py-3' : 'py-2',
    hasLeadingArea ? 'pl-1' : 'pl-3',
  )

  const linkContent = (
    <>
      <span className="flex items-center gap-2 min-w-0 truncate">
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-center gap-1">
        {trailingIcon}
        {badge !== undefined && badge > 0 && (
          badgeStyle === 'unread' ? (
            <Tag size="compact" type="announcement">{badge}</Tag>
          ) : (
            <Tag size="compact" type="neutral" variant="border" className="text-foreground-dim">{badge}</Tag>
          )
        )}
      </span>
    </>
  )

  const resolvedIcon = ((effectiveExpanded || isActive || isChildActive) && iconExpanded) ? iconExpanded : icon

  const chevronIcon = effectiveExpanded
    ? <ChevronDown className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
    : <ChevronRight className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />

  const leadingArea = hasLeadingIcon ? (
    // Combined chevron + icon: consistent width regardless of children
    hasChevron ? (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-0.5 pl-1 py-2 flex-shrink-0"
      >
        {chevronIcon}
        {resolvedIcon}
      </button>
    ) : (
      <span className="flex items-center gap-0.5 pl-1 py-2 flex-shrink-0">
        <span className="w-3.5 flex-shrink-0" />
        {resolvedIcon}
      </span>
    )
  ) : hasChevron ? (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className="w-7 flex items-center justify-center py-2 flex-shrink-0"
    >
      {chevronIcon}
    </button>
  ) : reserveChevronSpace ? (
    <span className="w-7 flex-shrink-0" />
  ) : null

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes('application/x-asset-ids')) return
          e.preventDefault()
          if (onAssetDrop) {
            e.dataTransfer.dropEffect = 'copy'
            setIsDragOver(true)
          } else {
            e.dataTransfer.dropEffect = 'none'
          }
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onAssetDrop ? (e) => {
          e.preventDefault()
          setIsDragOver(false)
          const data = e.dataTransfer.getData('application/x-asset-ids')
          if (data) {
            try { onAssetDrop(JSON.parse(data)) } catch {}
          }
        } : undefined}
        className={cn(
          'flex items-center justify-between rounded transition-colors min-w-0',
          mobile ? 'text-body-1-bold' : 'text-body-0-bold',
          isDragOver
            ? 'bg-indigo-500/20 text-foreground ring-1 ring-indigo-500/40'
            : isActive
            ? 'bg-indigo-500/20 text-foreground'
            : isChildActive
            ? 'text-foreground hover:bg-surface-2'
            : 'text-foreground-subtle hover:bg-surface-2 hover:text-foreground'
        )}
      >
        {leadingArea}
        {href ? (
          <Link href={href} className={linkClassName}>
            {linkContent}
          </Link>
        ) : (
          <button
            onClick={children ? () => setIsExpanded(!isExpanded) : undefined}
            className={cn(linkClassName, 'text-left')}
          >
            {linkContent}
          </button>
        )}
      </div>
      {children && (
        <div className={cn('pl-8 space-y-1 mt-1', !(effectiveExpanded || showCollapsedPreview) && 'hidden')}>
          {effectiveExpanded ? children : collapsedPreview}
        </div>
      )}
    </div>
  )
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = usePersistedExpand(`section:${title}`, defaultOpen)
  const mobile = useNavMobile()

  return (
    <div className="py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn('w-full flex items-center gap-1 px-3 text-left group min-w-0', mobile ? 'py-2' : 'py-1')}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-foreground-dim flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-foreground-dim flex-shrink-0" />
        )}
        <span className={cn('uppercase text-foreground-dim group-hover:text-foreground-subtle transition-colors truncate', mobile ? 'text-label-1-bold' : 'text-label-0-bold')}>
          {title}
        </span>
      </button>
      <div className={cn('px-3 space-y-1 mt-1', !isOpen && 'hidden')}>
        {children}
      </div>
    </div>
  )
}

function getIconComponent(iconName?: string): React.ReactNode {
  if (!iconName) return null
  const IconComponent = iconMap[iconName]
  if (!IconComponent) return null
  return <IconComponent className="w-4 h-4 flex-shrink-0" />
}

function DynamicNavigation({ navConfig }: { navConfig: NavConfig }) {
  return (
    <>
      {/* Top Level Items */}
      {navConfig.topLevel && navConfig.topLevel.length > 0 && (
        <div className="pt-4 pb-2">
          <div className="px-3 space-y-1">
            {navConfig.topLevel.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                badge={item.badge}
                icon={getIconComponent(item.icon)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {navConfig.sections.map((section) => (
        <CollapsibleSection
          key={section.title}
          title={section.title}
          defaultOpen={section.defaultOpen ?? true}
        >
          {section.items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              badge={item.badge}
              icon={getIconComponent(item.icon)}
            />
          ))}
        </CollapsibleSection>
      ))}
    </>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-3 py-2">
      <span className="text-label-0-bold uppercase text-foreground-dim">
        {title}
      </span>
    </div>
  )
}

/** Recursively render workspace folders as nav tree items, filtering by access */
function FolderNavTree({ nodes, basePath, sharedFolderIds, onAssetDropToFolder }: { nodes: WorkspaceFileNode[]; basePath: string; sharedFolderIds?: Set<string>; onAssetDropToFolder?: (folderId: string, folderName: string, assetIds: string[]) => void }) {
  const { canAccess } = useAccess()
  const { activePersona } = usePersona()
  const folders = nodes.filter((n) => n.type === 'folder')
  if (folders.length === 0) return null

  return (
    <>
      {folders.map((folder) => {
        const accessible = canAccess(folder.id)
        if (!accessible && activePersona?.role !== 'manager') return null
        const href = `${basePath}/${folder.id}`
        if (!accessible) {
          return (
            <div
              key={folder.id}
              className="flex items-center justify-between px-3 py-2 rounded text-body-0-bold text-foreground-dim opacity-50 cursor-not-allowed min-w-0"
            >
              <span className="truncate">{folder.name}</span>
              <Lock className="w-3 h-3 text-foreground-dim flex-shrink-0" />
            </div>
          )
        }
        const isShared = sharedFolderIds?.has(folder.id)
        const FolderIcon = isShared ? FolderSymlink : Folder
        const folderIcon = <FolderIcon className="w-4 h-4 flex-shrink-0" />
        const folderOpenIcon = <FolderOpen className="w-4 h-4 flex-shrink-0" />
        const subfolders = (folder.children ?? []).filter((n) => n.type === 'folder')
        const folderDrop = onAssetDropToFolder
          ? (assetIds: string[]) => onAssetDropToFolder(folder.id, folder.name, assetIds)
          : undefined
        if (subfolders.length > 0) {
          return (
            <TreeNavLink key={folder.id} href={href} label={folder.name} icon={folderIcon} iconExpanded={folderOpenIcon} defaultExpanded={false} onAssetDrop={folderDrop}>
              <FolderNavTree nodes={folder.children ?? []} basePath={href} sharedFolderIds={sharedFolderIds} onAssetDropToFolder={onAssetDropToFolder} />
            </TreeNavLink>
          )
        }
        return (
          <TreeNavLink key={folder.id} href={href} label={folder.name} icon={folderIcon} onAssetDrop={folderDrop} />
        )
      })}
    </>
  )
}

function WorkspaceRootNavItem({ root }: { root: WorkspaceFileNode }) {
  const pathname = usePathname()
  const { confirmMove, createFileReference } = useFileTree()
  const { getResourceGrants } = useAccess()
  const { showToast } = useToast()
  const files = root.children ?? []
  const hasFolders = files.some((n) => n.type === 'folder')
  const href = `/nextgen/workspace/${root.id}`

  const handleFolderDrop = useCallback((folderId: string, folderName: string, assetIds: string[]) => {
    for (const assetId of assetIds) {
      createFileReference(assetId, folderId)
    }
    const count = assetIds.length
    showToast(
      `Added to ${folderName}`,
      'success',
      {
        label: 'Move instead',
        onClick: () => {
          for (const assetId of assetIds) {
            confirmMove(assetId, folderId)
          }
          showToast(`Moved ${count} item${count !== 1 ? 's' : ''} to ${folderName}`)
        },
      },
    )
  }, [createFileReference, confirmMove, showToast])

  const sharedFolderIds = useMemo(
    () => collectSharedFolderIds([root], getResourceGrants),
    [root, getResourceGrants],
  )

  const folderIcon = sharedFolderIds.has(root.id)
    ? <FolderSymlink className="w-4 h-4 flex-shrink-0" />
    : <Folder className="w-4 h-4 flex-shrink-0" />
  const folderOpenIcon = <FolderOpen className="w-4 h-4 flex-shrink-0" />

  if (hasFolders) {
    const activePath: WorkspaceFileNode[] = []
    let level = files
    while (level.length > 0) {
      const match = level.find((n) => n.type === 'folder' && pathname.startsWith(`${href}/${activePath.map((p) => p.id).concat(n.id).join('/')}`))
      if (!match) break
      activePath.push(match)
      level = match.children?.filter((n) => n.type === 'folder') as WorkspaceFileNode[] ?? []
    }

    const previewFolderIcon = <Folder className="w-4 h-4 flex-shrink-0" />
    let preview: React.ReactNode = undefined
    for (let i = activePath.length - 1; i >= 0; i--) {
      const folder = activePath[i]
      const folderHref = `${href}/${activePath.slice(0, i + 1).map((p) => p.id).join('/')}`
      preview = preview ? (
        <TreeNavLink key={folder.id} href={folderHref} label={folder.name} icon={previewFolderIcon} indent={i === 0} defaultExpanded>
          {preview}
        </TreeNavLink>
      ) : (
        <TreeNavLink key={folder.id} href={folderHref} label={folder.name} icon={previewFolderIcon} indent={i === 0} />
      )
    }

    return (
      <TreeNavLink
        href={href}
        label={root.name}
        icon={folderIcon}
        iconExpanded={folderOpenIcon}
        defaultExpanded={false}
        autoExpandOnActiveChild={false}
        collapsedPreview={preview}
      >
        <FolderNavTree nodes={files} basePath={href} sharedFolderIds={sharedFolderIds} onAssetDropToFolder={handleFolderDrop} />
      </TreeNavLink>
    )
  }
  return (
    <TreeNavLink href={href} label={root.name} icon={folderIcon} />
  )
}

/** Shared nav: outbound shares only */
function SharedNavSection() {
  const { sharesCreatedByMe, allProjectShares } = useAccess()
  const { isAdmin } = usePersona()

  const badge = isAdmin ? allProjectShares.length : sharesCreatedByMe.length

  return (
    <NavLink
      href="/nextgen/shared"
      label="Shares"
      icon={<Send className="w-4 h-4 flex-shrink-0" />}
      badge={badge > 0 ? badge : undefined}
      badgeStyle="unread"
    />
  )
}

/** Inbox nav link with badge for unread received shares */
function InboxNavLink() {
  const { unreadInboxCount } = useAccess()

  return (
    <NavLink
      href="/nextgen/inbox"
      label="Inbox"
      icon={<Inbox className="w-4 h-4 flex-shrink-0" />}
      badge={unreadInboxCount}
      badgeStyle="unread"
    />
  )
}


function SmartCollectionNavItem({ collection, getChildren, badge }: {
  collection: { id: string; name: string; groupBy?: string }
  getChildren: (parentId: string) => { id: string; name: string }[]
  badge?: number
}) {
  const pathname = usePathname()
  const children = collection.groupBy ? getChildren(collection.id) : []
  const activeChild = children.find((child) => {
    const childHref = `/nextgen/collections/${child.id}`
    return pathname === childHref || pathname.startsWith(childHref + '/')
  })
  const groupByIcons: Record<string, typeof Zap> = {
    characters: Users,
    locations: MapPin,
    scenes: Film,
  }
  const IconComponent = (collection.groupBy && groupByIcons[collection.groupBy]) || Zap
  const collectionIcon = <IconComponent className="w-4 h-4 flex-shrink-0" />
  if (collection.groupBy && children.length > 0) {
    return (
      <TreeNavLink
        key={collection.id}
        href={`/nextgen/collections/${collection.id}`}
        label={collection.name}
        icon={collectionIcon}
        badge={badge}
        defaultExpanded={false}
        autoExpandOnActiveChild={false}
        collapsedPreview={activeChild ? (
          <NavLink
            href={`/nextgen/collections/${activeChild.id}`}
            label={activeChild.name}
          />
        ) : undefined}
      >
        {children.map(child => (
          <NavLink
            key={child.id}
            href={`/nextgen/collections/${child.id}`}
            label={child.name}
          />
        ))}
      </TreeNavLink>
    )
  }
  return (
    <TreeNavLink
      key={collection.id}
      href={`/nextgen/collections/${collection.id}`}
      label={collection.name}
      icon={collectionIcon}
      badge={badge}
    />
  )
}


function HardcodedNavigation({ onNewCollection }: { onNewCollection?: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { visibleCollections: smartCollections, getChildren, scopedAssets } = useSmartCollections()
  const { tree: fileTree } = useFileTree()
  const { sharesReceivedByMe, allProjectShares, canAccess, visibleCollections: userCollections, getCollectionAssetCount } = useAccess()
  const { isAdmin } = usePersona()
  const { addAssetsToCollection } = useUserCollections()
  const { showToast } = useToast()
  const workspaceRoots = useMemo(() => collectAccessibleWorkspaceRoots(
    fileTree.filter((node): node is WorkspaceFileNode => node.type === 'folder' && node.id !== SHARED_MOUNT_FOLDER_ID),
    canAccess,
  ), [fileTree, canAccess])
  const showWorkspaceLink = workspaceRoots.length > 0

  const smartCollectionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of smartCollections) {
      counts.set(c.id, scopedAssets.filter(a => matchesFilter(a, c.filter)).length)
    }
    return counts
  }, [smartCollections, scopedAssets])

  const smartCollectionIds = useMemo(() => new Set(smartCollections.map(c => c.id)), [smartCollections])
  const allOwnedIds = useMemo(() => {
    const ids = new Set(smartCollectionIds)
    for (const c of userCollections) ids.add(c.id)
    return ids
  }, [smartCollectionIds, userCollections])

  if (!mounted) return null

  return (
    <>
      <div className="pt-4 pb-2">
        <div className="px-3 space-y-1">
          <NavLink href="/nextgen" label="Search" icon={<Search className="w-4 h-4 flex-shrink-0" />} />
          <InboxNavLink />
          <NavLink href="/nextgen/library" label="Cuts" icon={<Film className="w-4 h-4 flex-shrink-0" />} matchSubpaths />
          <SharedNavSection />
        </div>
      </div>

      {/* Folders */}
      {showWorkspaceLink && (
        <>
          <SectionHeader title="Folders" />
          <div className="px-3 space-y-1">
            {workspaceRoots.map((root) => (
              <WorkspaceRootNavItem key={root.id} root={root} />
            ))}
            <button
              className="flex items-center pr-3 py-2 text-body-0-bold text-foreground-subtle hover:text-foreground transition-colors min-w-0"
            >
              <span className="w-7 flex items-center justify-center flex-shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </span>
              <span className="pl-1 truncate">New Folder</span>
            </button>
          </div>
        </>
      )}

      {/* Smart Collections */}
      <SectionHeader title="Smart Collections" />
      <div className="px-3 space-y-1">
        {smartCollections.filter(c => !c.parentId).map((collection) => (
          <SmartCollectionNavItem
            key={collection.id}
            collection={collection}
            getChildren={getChildren}
            badge={smartCollectionCounts.get(collection.id) || undefined}
          />
        ))}
      </div>

      {/* Collections */}
      <SectionHeader title="Collections" />
      <div className="px-3 space-y-1">
        {(() => {
          const seen = new Set<string>(smartCollections.map(c => c.id))
          const items: { id: string; name: string; count: number }[] = []
          for (const c of userCollections) {
            if (seen.has(c.id)) continue
            seen.add(c.id)
            items.push({ id: c.id, name: c.name, count: getCollectionAssetCount(c.id).accessible })
          }
          return items.map(item => (
            <TreeNavLink
              key={item.id}
              href={`/nextgen/collections/${item.id}`}
              label={item.name}
              icon={<Layers className="w-4 h-4 flex-shrink-0" />}
              badge={item.count || undefined}
              onAssetDrop={(assetIds) => {
                addAssetsToCollection(item.id, assetIds)
                const count = assetIds.length
                showToast(
                  `Added to ${item.name}`,
                  'success',
                  {
                    label: 'Move instead',
                    onClick: () => {
                      showToast(`Moved ${count} asset${count !== 1 ? 's' : ''} to ${item.name}`)
                    },
                  },
                )
              }}
            />
          ))
        })()}
        <button
          onClick={onNewCollection}
          className="flex items-center pr-3 py-2 text-body-0-bold text-foreground-subtle hover:text-foreground transition-colors min-w-0"
        >
          <span className="w-7 flex items-center justify-center flex-shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </span>
          <span className="pl-1 truncate">New Collection</span>
        </button>
      </div>

      {/* Shared with me */}
      {(() => {
        const seen = new Set(allOwnedIds)
        const shares = isAdmin ? allProjectShares : sharesReceivedByMe
        const sharedItems: { id: string; name: string; count: number }[] = []
        for (const entry of shares) {
          if (entry.resourceType !== 'collection' && entry.resourceType !== 'smart-collection') continue
          if (seen.has(entry.resourceId)) continue
          seen.add(entry.resourceId)
          sharedItems.push({ id: entry.resourceId, name: entry.label, count: getCollectionAssetCount(entry.resourceId).accessible })
        }
        if (sharedItems.length === 0) return null
        return (
          <>
            <SectionHeader title="Shared with me" />
            <div className="px-3 space-y-1">
              {sharedItems.map(item => (
                <TreeNavLink
                  key={item.id}
                  href={`/nextgen/collections/${item.id}`}
                  label={item.name}
                  icon={<Layers className="w-4 h-4 flex-shrink-0" />}
                  badge={item.count || undefined}
                />
              ))}
            </div>
          </>
        )
      })()}

      <div className="pb-8" />
    </>
  )
}

export function NavSidebar({ className, width, style, navConfig, onNewCollection, mobile = false }: NavSidebarProps) {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement | null>(null)
  const scrollTopRef = useRef<number | null>(null)

  const captureScrollPosition = useCallback(() => {
    const scrollTop = navRef.current?.scrollTop ?? 0
    scrollTopRef.current = scrollTop
    writeStoredNavScrollTop(scrollTop)
  }, [])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const scrollTop = scrollTopRef.current ?? readStoredNavScrollTop()
    let attempts = 0
    let restore = 0

    const restoreScrollPosition = () => {
      nav.scrollTop = scrollTop
      scrollTopRef.current = scrollTop
      attempts += 1

      const maxScrollTop = nav.scrollHeight - nav.clientHeight
      const shouldRetry = scrollTop > 0 && attempts < NAV_SCROLL_RESTORE_ATTEMPTS && maxScrollTop < scrollTop

      if (shouldRetry) {
        restore = window.requestAnimationFrame(restoreScrollPosition)
      }
    }

    restore = window.requestAnimationFrame(restoreScrollPosition)

    return () => {
      window.cancelAnimationFrame(restore)
      captureScrollPosition()
    }
  }, [captureScrollPosition, pathname])

  return (
    <NavMobileContext.Provider value={mobile}>
      <nav
        ref={navRef}
        onScroll={captureScrollPosition}
        className={cn('bg-surface-1 flex-shrink-0 flex flex-col overflow-y-auto', className)}
        style={mobile ? style : { width: width ? `${width}px` : '240px', ...style }}
      >
        {navConfig ? (
          <DynamicNavigation navConfig={navConfig} />
        ) : (
          <HardcodedNavigation onNewCollection={onNewCollection} />
        )}
      </nav>
    </NavMobileContext.Provider>
  )
}
