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
  type LucideIcon,
} from 'lucide-react'
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
}

interface NavLinkProps {
  href: string
  label: string
  badge?: number
  icon?: React.ReactNode
}

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function NavLink({ href, label, badge, icon }: NavLinkProps) {
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
      {badge !== undefined && badge > 0 && (
        <Tag size="compact" type="announcement">{badge}</Tag>
      )}
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

function HardcodedNavigation() {
  return (
    <>
      {/* All Assets - Top Level */}
      <div className="pt-4 pb-2">
        <div className="px-3">
          <NavLink href="/nextgen/assets" label="All Assets" />
        </div>
      </div>

      {/* Departments Section */}
      <CollapsibleSection title="Departments">
        <NavLink href="/nextgen/departments/art-design" label="Art & Design" />
        <NavLink href="/nextgen/departments/camera" label="Camera" />
        <NavLink href="/nextgen/departments/editorial" label="Editorial" />
        <NavLink href="/nextgen/departments/vfx" label="VFX" />
        <NavLink href="/nextgen/departments/audio-sound" label="Audio & Sound" />
      </CollapsibleSection>

      {/* Smart Collections Section */}
      <CollapsibleSection title="Smart Collections">
        <NavLink href="/nextgen/collections" label="All Collections" />
        <NavLink href="/nextgen/collections/characters" label="Characters" />
        <NavLink href="/nextgen/collections/locations" label="Locations" />
        <NavLink href="/nextgen/collections/scenes" label="Scenes" />
      </CollapsibleSection>

      {/* My Collections Section */}
      <CollapsibleSection title="My Collections">
        <p className="px-3 py-1 text-label-0-regular text-foreground-dim">No collections yet</p>
        <button className="flex items-center gap-2 px-3 py-2 text-body-0-bold text-foreground-dim hover:text-foreground-subtle transition-colors min-w-0">
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">New Collection</span>
        </button>
      </CollapsibleSection>

      {/* Sharing Section */}
      <CollapsibleSection title="Sharing">
        <div className="pl-3">
          <div className="flex items-center gap-2 px-3 py-1.5 min-w-0">
            <ArrowUpRight className="w-3 h-3 text-foreground-dim flex-shrink-0" />
            <span className="text-label-0-bold uppercase text-foreground-dim truncate">Sent</span>
          </div>
          <p className="px-3 py-1 pl-8 text-label-0-regular text-foreground-dim truncate">Nothing sent</p>

          <div className="flex items-center gap-2 px-3 py-1.5 mt-2 min-w-0">
            <ArrowDownLeft className="w-3 h-3 text-foreground-dim flex-shrink-0" />
            <span className="text-label-0-bold uppercase text-foreground-dim truncate">Incoming</span>
          </div>
          <div className="pl-3">
            <NavLink href="/nextgen/sharing/incoming/1" label="Project Assets" badge={4} />
          </div>
        </div>
      </CollapsibleSection>
    </>
  )
}

export function NavSidebar({ className, width, style, navConfig }: NavSidebarProps) {
  return (
    <nav
      className={cn('bg-surface-1 flex-shrink-0 flex flex-col overflow-y-auto', className)}
      style={{ width: width ? `${width}px` : '240px', ...style }}
    >
      {navConfig ? (
        <DynamicNavigation navConfig={navConfig} />
      ) : (
        <HardcodedNavigation />
      )}
    </nav>
  )
}
