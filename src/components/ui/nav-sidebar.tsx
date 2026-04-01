'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  Plus,

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
  Lock,
  Inbox,
  Link2,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { useSmartCollections, useFileTree, useAccess, usePersona } from '@/hooks'
import { matchesFilter } from '@/lib/smart-collection-filters'
import type { DepartmentId } from '@/components/department/types'
import { DEPARTMENT_FOLDER_MAP } from '@/lib/workspace-data'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { cn } from '@/lib/utils'
import { Tag } from './tag'
import type { NavConfig, NavSection, NavItem } from '@/types/navigation'

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

function usePersistedExpand(key: string, fallback: boolean): [boolean, (v: boolean) => void] {
  // Start with fallback to match server render and avoid hydration mismatch
  const [value, setValue] = useState(fallback)

  // Sync from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NAV_STORAGE_KEY)
      if (stored) {
        const map = JSON.parse(stored)
        if (key in map) setValue(map[key] as boolean)
      }
    } catch {}
  }, [key])

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
  const isActive = pathname === href || (matchSubpaths && pathname.startsWith(href + '/'))

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center justify-between px-3 py-2 rounded transition-colors text-body-0-bold min-w-0',
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
  badge?: number
  /** 'unread' = indigo fill (inbox/shared), 'count' = border + dim text (collections) */
  badgeStyle?: 'unread' | 'count'
  children?: React.ReactNode
  defaultExpanded?: boolean
  /** Reserve chevron space even when there are no children, for alignment */
  indent?: boolean
  /** When true, forces the node to expand (e.g. when a child route becomes active externally) */
  forceExpand?: boolean
  /** Optional icon rendered on the right side, after the badge area */
  trailingIcon?: React.ReactNode
}

function TreeNavLink({ href, label, icon, badge, badgeStyle = 'count', children, defaultExpanded = true, indent = false, forceExpand = false, trailingIcon }: TreeNavLinkProps) {
  const pathname = usePathname()
  const isActive = href ? pathname === href : false
  // Check both /parent/ subroutes AND --child smart collection IDs
  const smartCollectionBase = href ? href.replace(/^\/nextgen\/smart-collections\//, '') : ''
  const currentPath = pathname.replace(/^\/nextgen\/smart-collections\//, '')
  const isChildActive = href
    ? pathname.startsWith(href + '/') || (smartCollectionBase && currentPath.startsWith(smartCollectionBase + '--'))
    : false
  const storageKey = href || `tree:${label}`
  const [isExpanded, setIsExpanded] = usePersistedExpand(storageKey, defaultExpanded || isChildActive)

  // Auto-expand when a child becomes active (e.g. navigating from relationship panel)
  useEffect(() => {
    if ((isChildActive || forceExpand) && !isExpanded) {
      setIsExpanded(true)
    }
  }, [isChildActive, forceExpand]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasChevron = !!children
  const reserveChevronSpace = indent && !hasChevron

  const linkClassName = cn(
    'flex-1 flex items-center justify-between py-2 pr-3 min-w-0',
    hasChevron ? 'pl-1' : reserveChevronSpace ? 'pl-1' : 'pl-3',
  )

  const linkContent = (
    <>
      <span className="flex items-center gap-2 min-w-0 truncate">
        {icon}
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

  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between rounded transition-colors text-body-0-bold min-w-0',
          isActive
            ? 'bg-indigo-500/20 text-foreground'
            : isChildActive
            ? 'text-foreground hover:bg-surface-2'
            : 'text-foreground-subtle hover:bg-surface-2 hover:text-foreground'
        )}
      >
        {hasChevron ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center pl-3 py-2 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-foreground-dim" />
            ) : (
              <ChevronRight className="w-4 h-4 text-foreground-dim" />
            )}
          </button>
        ) : reserveChevronSpace ? (
          <span className="flex items-center justify-center pl-3 py-2 flex-shrink-0">
            <span className="w-4 h-4" />
          </span>
        ) : null}
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
      {children && isExpanded && (
        <div className="pl-6 space-y-1 mt-1">
          {children}
        </div>
      )}
    </div>
  )
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = usePersistedExpand(`section:${title}`, defaultOpen)

  return (
    <div className="py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1 px-3 py-1 text-left group min-w-0"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-foreground-dim flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-foreground-dim flex-shrink-0" />
        )}
        <span className="text-label-0-bold uppercase text-foreground-dim group-hover:text-foreground-subtle transition-colors truncate">
          {title}
        </span>
      </button>
      {isOpen && (
        <div className="px-3 space-y-1 mt-1">
          {children}
        </div>
      )}
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
function FolderNavTree({ nodes, basePath }: { nodes: WorkspaceFileNode[]; basePath: string }) {
  const { canAccess } = useAccess()
  const { activePersona } = usePersona()
  const folders = nodes.filter((n) => n.type === 'folder')
  if (folders.length === 0) return null

  return (
    <>
      {folders.map((folder) => {
        const accessible = canAccess(folder.id)
        // Not accessible + persona can't see restricted → hidden
        if (!accessible && activePersona?.role !== 'manager') return null
        const href = `${basePath}/${folder.id}`
        // Not accessible + persona can see restricted → show with lock (non-navigable)
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
        const subfolders = (folder.children ?? []).filter((n) => n.type === 'folder')
        if (subfolders.length > 0) {
          return (
            <TreeNavLink key={folder.id} href={href} label={folder.name} defaultExpanded={false}>
              <FolderNavTree nodes={folder.children ?? []} basePath={href} />
            </TreeNavLink>
          )
        }
        return <NavLink key={folder.id} href={href} label={folder.name} matchSubpaths />
      })}
    </>
  )
}

// Department info for nav items
const DEPARTMENT_NAV_ITEMS: { href: string; label: string; id: DepartmentId }[] = [
  { href: '/nextgen/workspace/art-design', label: 'Art & Design', id: 'art-design' },
  { href: '/nextgen/workspace/camera', label: 'Camera', id: 'camera' },
  { href: '/nextgen/workspace/editorial', label: 'Editorial', id: 'editorial' },
  { href: '/nextgen/workspace/vfx', label: 'VFX', id: 'vfx' },
  { href: '/nextgen/workspace/audio-sound', label: 'Audio & Sound', id: 'audio-sound' },
]


/** Renders a single department nav item, using files from the shared file tree */
function DepartmentNavItem({ item }: { item: typeof DEPARTMENT_NAV_ITEMS[number] }) {
  const { getDepartmentFiles } = useFileTree()
  const files = getDepartmentFiles(item.id) as WorkspaceFileNode[]
  const hasFolders = files.some((n) => n.type === 'folder')

  if (hasFolders) {
    return (
      <TreeNavLink
        href={item.href}
        label={item.label}
        defaultExpanded={false}
      >
        <FolderNavTree nodes={files} basePath={item.href} />
      </TreeNavLink>
    )
  }
  return (
    <NavLink
      href={item.href}
      label={item.label}
      matchSubpaths
    />
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
      label="Shared by me"
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


function SmartCollectionNavItem({ collection, getChildren, indent, badge }: {
  collection: { id: string; name: string; groupBy?: string }
  getChildren: (parentId: string) => { id: string; name: string }[]
  indent?: boolean
  badge?: number
}) {
  const children = collection.groupBy ? getChildren(collection.id) : []
  if (collection.groupBy && children.length > 0) {
    return (
      <TreeNavLink
        key={collection.id}
        href={`/nextgen/smart-collections/${collection.id}`}
        label={collection.name}
        badge={badge}
        defaultExpanded={false}
      >
        {children.map(child => (
          <NavLink
            key={child.id}
            href={`/nextgen/smart-collections/${child.id}`}
            label={child.name}
          />
        ))}
      </TreeNavLink>
    )
  }
  return (
    <TreeNavLink
      key={collection.id}
      href={`/nextgen/smart-collections/${collection.id}`}
      label={collection.name}
      badge={badge}
      indent={indent}
    />
  )
}

/** Shared collections in the nav — all for admin, received-only for regular users */
function SharedCollectionNavItems() {
  const { sharesReceivedByMe, allProjectShares, readShareIds } = useAccess()
  const { isAdmin } = usePersona()
  const entries = isAdmin ? allProjectShares : sharesReceivedByMe
  const sharedCollections = entries.filter(e => e.resourceType === 'collection' || e.resourceType === 'smart-collection')
  if (sharedCollections.length === 0) return null

  return (
    <>
      {sharedCollections.map((entry) => {
        const isUnread = !readShareIds.has(entry.id)
        const href = entry.resourceType === 'smart-collection'
          ? `/nextgen/smart-collections/${entry.resourceId}`
          : `/nextgen/collections/${entry.resourceId}`
        return (
          <TreeNavLink
            key={entry.id}
            href={href}
            label={entry.label}
            badge={isUnread ? 1 : undefined}
            badgeStyle="count"
            trailingIcon={<Link2 className="w-3.5 h-3.5 text-foreground-dim" />}
            indent
          />
        )
      })}
    </>
  )
}

function HardcodedNavigation({ onNewCollection }: { onNewCollection?: () => void }) {
  const { visibleCollections: smartCollections, getChildren, scopedAssets } = useSmartCollections()
  const { tree: fileTree } = useFileTree()
  const { sharesReceivedByMe, allProjectShares, canAccess, visibleCollections: userCollections } = useAccess()
  const { activePersona, isAdmin } = usePersona()
  // Workspace-level folders: top-level folders created by user (exclude department folders already rendered above)
  const DEPT_FOLDER_IDS = new Set(Object.values(DEPARTMENT_FOLDER_MAP).map(d => d.id))
  const workspaceFolders = fileTree.filter((f) => f.type === 'folder' && !DEPT_FOLDER_IDS.has(f.id)) as WorkspaceFileNode[]
  const accessibleDepartments = DEPARTMENT_NAV_ITEMS.filter((item) => canAccess(DEPARTMENT_FOLDER_MAP[item.id].id))
  const accessibleDepartmentIds = new Set(accessibleDepartments.map((item) => item.id))
  const workspaceFolderIds = new Set(workspaceFolders.map((folder) => folder.id))
  const receivedSharedFolders = sharesReceivedByMe.filter((entry) => {
    if (entry.resourceType !== 'folder') return false
    if (workspaceFolderIds.has(entry.resourceId)) return false
    if (entry.departmentId && accessibleDepartmentIds.has(entry.departmentId)) return false
    return true
  })
  const showWorkspaceLink = accessibleDepartments.length > 0 || workspaceFolders.length > 0 || receivedSharedFolders.length > 0
  const sharedCollectionIds = new Set(
    (isAdmin ? allProjectShares : sharesReceivedByMe)
      .filter((entry) => entry.resourceType === 'collection')
      .map((entry) => entry.resourceId),
  )
  const ownedCollections = userCollections.filter((collection) => {
    if (activePersona) return collection.createdBy === activePersona.email
    return !sharedCollectionIds.has(collection.id)
  })

  const smartCollectionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of smartCollections) {
      counts.set(c.id, scopedAssets.filter(a => matchesFilter(a, c.filter)).length)
    }
    return counts
  }, [smartCollections, scopedAssets])

  return (
    <>
      {/* Top Level Items */}
      <div className="pt-4 pb-2">
        <div className="px-3 space-y-1">
          <NavLink href="/nextgen" label="Search" icon={<Search className="w-4 h-4 flex-shrink-0" />} />
          <InboxNavLink />
          <SharedNavSection />
          <div className="pt-3" />
          {showWorkspaceLink && (
            <TreeNavLink href="/nextgen/workspace" label="Workspaces" defaultExpanded={true}>
              {accessibleDepartments.map((item) => (
                <DepartmentNavItem key={item.href} item={item} />
              ))}
              {receivedSharedFolders.map((entry) => (
                <TreeNavLink
                  key={entry.id}
                  href={`/nextgen/workspace/${entry.resourceId}`}
                  label={entry.label}
                  trailingIcon={<FolderSymlink className="w-3.5 h-3.5 text-foreground-dim" />}
                  indent
                />
              ))}
              {workspaceFolders.map((folder) => (
                <TreeNavLink key={folder.id} href={`/nextgen/workspace/${folder.id}`} label={folder.name} defaultExpanded={false}>
                  <span className="text-label-0-regular text-foreground-dim px-3 py-1">Empty</span>
                </TreeNavLink>
              ))}
            </TreeNavLink>
          )}
        </div>
      </div>

      {/* Collections — smart + user */}
      <SectionHeader title="Collections" />
      <div className="px-3 space-y-1">
        {smartCollections.map((collection) => (
            <SmartCollectionNavItem
              key={collection.id}
              collection={collection}
              getChildren={getChildren}
              indent
              badge={smartCollectionCounts.get(collection.id) || undefined}
            />
          ))}
        {ownedCollections.map((collection) => (
          <TreeNavLink
            key={collection.id}
            href={`/nextgen/collections/${collection.id}`}
            label={collection.name}
            badge={collection.assetIds.length}
            indent
          />
        ))}
        <SharedCollectionNavItems />
        <button
          onClick={onNewCollection}
          className="flex items-center gap-2 px-3 py-2 text-body-0-bold text-foreground-dim hover:text-foreground-subtle transition-colors min-w-0"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">New Collection</span>
        </button>
      </div>

    </>
  )
}

export function NavSidebar({ className, width, style, navConfig, onNewCollection }: NavSidebarProps) {
  return (
    <nav
      className={cn('bg-surface-1 flex-shrink-0 flex flex-col overflow-y-auto', className)}
      style={{ width: width ? `${width}px` : '240px', ...style }}
    >
      {navConfig ? (
        <DynamicNavigation navConfig={navConfig} />
      ) : (
        <HardcodedNavigation onNewCollection={onNewCollection} />
      )}
    </nav>
  )
}
