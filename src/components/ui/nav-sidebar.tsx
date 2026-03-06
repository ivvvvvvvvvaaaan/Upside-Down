'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Grid,
  Folder,
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
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useDepartmentAccess, useUserCollections, useSmartCollections } from '@/hooks'
import type { DepartmentId } from '@/components/department/types'
import { getDepartmentWorkspaceFiles, type WorkspaceFileNode } from '@/lib/workspace-data'
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

// Icon map for dynamic icon rendering
const iconMap: Record<string, LucideIcon> = {
  Grid,
  Folder,
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

type AccessIndicator = 'none' | 'partial' | 'full'

interface NavLinkProps {
  href: string
  label: string
  badge?: number
  icon?: React.ReactNode
  accessLevel?: AccessIndicator
  /** When true, also highlight for subpaths (e.g. /workspace/art-design matches /workspace/art-design/subfolder) */
  matchSubpaths?: boolean
}

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function NavLink({ href, label, badge, icon, accessLevel = 'full', matchSubpaths = false }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (matchSubpaths && pathname.startsWith(href + '/'))
  const isLocked = accessLevel === 'none'

  const className = cn(
    'flex items-center justify-between px-3 py-2 rounded transition-colors text-body-0-bold min-w-0',
    isLocked
      ? 'text-foreground-dim cursor-not-allowed opacity-50'
      : isActive
        ? 'bg-indigo-500/20 text-foreground'
        : 'text-foreground-subtle hover:bg-surface-2 hover:text-foreground'
  )

  const content = (
    <>
      <span className="flex items-center gap-2 min-w-0 truncate">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-center gap-1.5">
        {isLocked && (
          <Lock className="w-3 h-3 text-foreground-dim flex-shrink-0" />
        )}
        {accessLevel === 'partial' && (
          <Users className="w-3 h-3 text-foreground-dim flex-shrink-0" />
        )}
        {badge !== undefined && badge > 0 && (
          <Tag size="compact" type="announcement">{badge}</Tag>
        )}
      </span>
    </>
  )

  if (isLocked) {
    return <div className={className}>{content}</div>
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}

interface TreeNavLinkProps {
  href: string
  label: string
  icon?: React.ReactNode
  badge?: number
  accessLevel?: AccessIndicator
  children?: React.ReactNode
  defaultExpanded?: boolean
}

function TreeNavLink({ href, label, icon, badge, accessLevel = 'full', children, defaultExpanded = true }: TreeNavLinkProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const isActive = pathname === href
  const isLocked = accessLevel === 'none'
  // Check both /parent/ subroutes AND --child smart collection IDs
  const smartCollectionBase = href.replace(/^\/nextgen\/smart-collections\//, '')
  const currentPath = pathname.replace(/^\/nextgen\/smart-collections\//, '')
  const isChildActive = pathname.startsWith(href + '/') ||
    (smartCollectionBase && currentPath.startsWith(smartCollectionBase + '--'))

  const linkClassName = cn(
    'flex-1 flex items-center justify-between py-2 pr-3 min-w-0',
    children ? 'pl-1' : 'pl-3',
    isLocked && 'cursor-not-allowed'
  )

  const linkContent = (
    <>
      <span className="flex items-center gap-2 min-w-0 truncate">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-center gap-1.5">
        {isLocked && (
          <Lock className="w-3 h-3 text-foreground-dim flex-shrink-0" />
        )}
        {accessLevel === 'partial' && (
          <Users className="w-3 h-3 text-foreground-dim flex-shrink-0" />
        )}
        {badge !== undefined && badge > 0 && (
          <Tag size="compact" type="announcement">{badge}</Tag>
        )}
      </span>
    </>
  )

  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between rounded transition-colors text-body-0-bold min-w-0',
          isLocked
            ? 'text-foreground-dim opacity-50'
            : isActive
              ? 'bg-indigo-500/20 text-foreground'
              : isChildActive
              ? 'text-foreground'
              : 'text-foreground-subtle hover:bg-surface-2 hover:text-foreground'
        )}
      >
        {children && (
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
        )}
        {isLocked ? (
          <div className={linkClassName}>{linkContent}</div>
        ) : (
          <Link href={href} className={linkClassName}>
            {linkContent}
          </Link>
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
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1 px-3 py-2 text-left group min-w-0"
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

/** Recursively render workspace folders as nav tree items */
function FolderNavTree({ nodes, basePath, accessLevel }: { nodes: WorkspaceFileNode[]; basePath: string; accessLevel?: AccessIndicator }) {
  const folders = nodes.filter((n) => n.type === 'folder')
  if (folders.length === 0) return null

  return (
    <>
      {folders.map((folder) => {
        const href = `${basePath}/${folder.id}`
        const subfolders = (folder.children ?? []).filter((n) => n.type === 'folder')
        if (subfolders.length > 0) {
          return (
            <TreeNavLink key={folder.id} href={href} label={folder.name} accessLevel={accessLevel} defaultExpanded={false}>
              <FolderNavTree nodes={folder.children ?? []} basePath={href} accessLevel={accessLevel} />
            </TreeNavLink>
          )
        }
        return <NavLink key={folder.id} href={href} label={folder.name} accessLevel={accessLevel} matchSubpaths />
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


function HardcodedNavigation({ onNewCollection }: { onNewCollection?: () => void }) {
  const { getAccessLevel } = useDepartmentAccess()
  const { collections: userCollections } = useUserCollections()
  const { collections: smartCollections, getChildren } = useSmartCollections()

  return (
    <>
      {/* Top Level Items */}
      <div className="pt-4 pb-2">
        <div className="px-3 space-y-1">
          <NavLink href="/nextgen" label="Search" />
          <TreeNavLink href="/nextgen/workspace" label="Workspace" defaultExpanded={true}>
            {DEPARTMENT_NAV_ITEMS.map((item) => {
              const files = getDepartmentWorkspaceFiles(item.id)
              const hasFolders = files.some((n) => n.type === 'folder')
              if (hasFolders) {
                return (
                  <TreeNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    accessLevel={getAccessLevel(item.id)}
                    defaultExpanded={false}
                  >
                    <FolderNavTree nodes={files} basePath={item.href} accessLevel={getAccessLevel(item.id)} />
                  </TreeNavLink>
                )
              }
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  accessLevel={getAccessLevel(item.id)}
                  matchSubpaths
                />
              )
            })}
          </TreeNavLink>
        </div>
      </div>

      {/* Collections Section - Smart + User collections unified */}
      <CollapsibleSection title="Collections">
        {/* Smart collections - Sparkles icon, tree for groupBy */}
        {smartCollections.map((collection) => {
          const children = collection.groupBy ? getChildren(collection.id) : []
          if (collection.groupBy && children.length > 0) {
            return (
              <TreeNavLink
                key={collection.id}
                href={`/nextgen/smart-collections/${collection.id}`}
                label={collection.name}
                icon={<Sparkles className="w-4 h-4 flex-shrink-0" />}
                defaultExpanded={false}
              >
                {children.map(child => (
                  <NavLink
                    key={child.id}
                    href={`/nextgen/smart-collections/${child.id}`}
                    label={child.name}
                    icon={<Sparkles className="w-4 h-4 flex-shrink-0" />}
                  />
                ))}
              </TreeNavLink>
            )
          }
          return (
            <NavLink
              key={collection.id}
              href={`/nextgen/smart-collections/${collection.id}`}
              label={collection.name}
              icon={<Sparkles className="w-4 h-4 flex-shrink-0" />}
            />
          )
        })}
        {/* User collections - Folder icon */}
        {userCollections.map((collection) => (
          <NavLink
            key={collection.id}
            href={`/nextgen/collections/${collection.id}`}
            label={collection.name}
            icon={<Folder className="w-4 h-4 flex-shrink-0" />}
            badge={collection.assetIds.length}
          />
        ))}
        {/* New collection button */}
        <button
          onClick={onNewCollection}
          className="flex items-center gap-2 px-3 py-2 text-body-0-bold text-foreground-dim hover:text-foreground-subtle transition-colors min-w-0"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">New Collection</span>
        </button>
      </CollapsibleSection>

      {/* Sharing Section */}
      <CollapsibleSection title="Links">
        <NavLink
          href="/nextgen/sharing/incoming/1"
          label="Project Assets"
          badge={4}
          icon={<ArrowDownLeft className="w-4 h-4 flex-shrink-0" />}
        />
      </CollapsibleSection>
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
