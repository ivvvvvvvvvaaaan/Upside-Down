'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
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
  type LucideIcon,
} from 'lucide-react'
import { useDepartmentAccess, useUserCollections } from '@/hooks'
import type { DepartmentId } from '@/components/department/types'
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
}

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function NavLink({ href, label, badge, icon, accessLevel = 'full' }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

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
      <span className="flex items-center gap-1.5">
        {accessLevel === 'none' && (
          <Lock className="w-3 h-3 text-foreground-dim flex-shrink-0" />
        )}
        {accessLevel === 'partial' && (
          <Users className="w-3 h-3 text-foreground-dim flex-shrink-0" />
        )}
        {badge !== undefined && badge > 0 && (
          <Tag size="compact" type="announcement">{badge}</Tag>
        )}
      </span>
    </Link>
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
        <ChevronDown
          className={cn(
            'w-4 h-4 text-foreground-dim transition-transform flex-shrink-0',
            !isOpen && '-rotate-90'
          )}
        />
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

// Department info for nav items
const DEPARTMENT_NAV_ITEMS: { href: string; label: string; id: DepartmentId }[] = [
  { href: '/nextgen/departments/art-design', label: 'Art & Design', id: 'art-design' },
  { href: '/nextgen/departments/camera', label: 'Camera', id: 'camera' },
  { href: '/nextgen/departments/editorial', label: 'Editorial', id: 'editorial' },
  { href: '/nextgen/departments/vfx', label: 'VFX', id: 'vfx' },
  { href: '/nextgen/departments/audio-sound', label: 'Audio & Sound', id: 'audio-sound' },
]

function HardcodedNavigation({ onNewCollection }: { onNewCollection?: () => void }) {
  const { getAccessLevel } = useDepartmentAccess()
  const { collections: userCollections } = useUserCollections()

  return (
    <>
      {/* Top Level Items */}
      <div className="pt-4 pb-2">
        <div className="px-3 space-y-1">
          <NavLink href="/nextgen" label="Search" />
          <NavLink href="/nextgen/assets" label="All Assets" />
        </div>
      </div>

      {/* Departments Section */}
      <div className="py-2">
        <SectionHeader title="Departments" />
        <div className="px-3 space-y-1">
          {DEPARTMENT_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              accessLevel={getAccessLevel(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Smart Collections Section */}
      <div className="py-2">
        <SectionHeader title="Smart Collections" />
        <div className="px-3 space-y-1">
          <NavLink href="/nextgen/collections" label="All Collections" />
          <NavLink href="/nextgen/collections/characters" label="Characters" />
          <NavLink href="/nextgen/collections/locations" label="Locations" />
          <NavLink href="/nextgen/collections/scenes" label="Scenes" />
        </div>
      </div>

      {/* My Collections Section */}
      <div className="py-2">
        <SectionHeader title="My Collections" />
        <div className="px-3 space-y-1">
          {userCollections.length === 0 ? (
            <p className="px-3 py-1 text-label-0-regular text-foreground-dim">No collections yet</p>
          ) : (
            userCollections.map((collection) => (
              <NavLink
                key={collection.id}
                href={`/nextgen/collections/${collection.id}`}
                label={collection.name}
                badge={collection.assetIds.length}
              />
            ))
          )}
          <button
            onClick={onNewCollection}
            className="flex items-center gap-2 px-3 py-2 text-body-0-bold text-foreground-dim hover:text-foreground-subtle transition-colors min-w-0"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">New Collection</span>
          </button>
        </div>
      </div>

      {/* Sharing Section */}
      <div className="py-2">
        <SectionHeader title="Sharing" />
        <div className="px-3 space-y-1">
          <div className="flex items-center gap-2 px-3 py-1.5 min-w-0">
            <ArrowUpRight className="w-3 h-3 text-foreground-dim flex-shrink-0" />
            <span className="text-label-0-bold uppercase text-foreground-dim truncate">Sent</span>
          </div>
          <p className="px-3 py-1 pl-8 text-label-0-regular text-foreground-dim truncate">Nothing sent</p>

          <div className="flex items-center gap-2 px-3 py-1.5 mt-2 min-w-0">
            <ArrowDownLeft className="w-3 h-3 text-foreground-dim flex-shrink-0" />
            <span className="text-label-0-bold uppercase text-foreground-dim truncate">Incoming</span>
          </div>
          <NavLink href="/nextgen/sharing/incoming/1" label="Project Assets" badge={4} />
        </div>
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
