'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  Video,
  Bug,
  Glasses,
  ListTodo,
  Bell,
  HelpCircle,
  Newspaper,
  ChevronDown,
  Grid,
  Folder,
  Search,
  FileText,
  Settings,
  Users,
  Database,
  Layout,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import type { NavConfig } from '@/types/navigation'

/**
 * Horizontal Navbar
 *
 * Tiered horizontal navigation following Hawkins design system.
 * - Tier 1 (72px): Logo, primary nav, quick actions, user controls
 * - Tier 2 (54px): Secondary navigation links
 * - Total height: 130px with both tiers, 72px with one tier
 */

// Icon map for dynamic icon rendering
const iconMap: Record<string, LucideIcon> = {
  Home,
  Video,
  Bug,
  Glasses,
  ListTodo,
  Grid,
  Folder,
  Search,
  FileText,
  Settings,
  Users,
  Database,
  Layout,
}

export interface HorizontalNavbarProps {
  /** Navigation configuration */
  navConfig?: NavConfig
  /** Show secondary tier */
  showSecondaryNav?: boolean
  /** Product name displayed next to logo */
  productName?: string
  /** Custom className */
  className?: string
}

interface NavLinkProps {
  href: string
  label: string
  icon?: string
  isActive?: boolean
  tier?: 1 | 2
}

function getIconComponent(iconName?: string): React.ReactNode {
  if (!iconName) return null
  const IconComponent = iconMap[iconName]
  if (!IconComponent) return null
  return <IconComponent className="w-4 h-4" />
}

function Tier1NavLink({ href, label, icon, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-full text-body-0-bold transition-colors',
        isActive
          ? 'bg-surface-inverse text-foreground-inverse'
          : 'text-foreground hover:bg-surface-2'
      )}
    >
      {icon && getIconComponent(icon)}
      <span>{label}</span>
    </Link>
  )
}

function Tier2NavLink({ href, label, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-1 px-3 py-2 text-body-0-regular transition-colors',
        isActive
          ? 'text-foreground border-b-2 border-foreground'
          : 'text-foreground-subtle hover:text-foreground'
      )}
    >
      <span>{label}</span>
    </Link>
  )
}

export function HorizontalNavbar({
  navConfig,
  showSecondaryNav = true,
  productName = 'Product name',
  className,
}: HorizontalNavbarProps) {
  const pathname = usePathname()

  // Get nav items from config
  const allItems = navConfig?.sections.flatMap(s => s.items) || []
  const topLevelItems = navConfig?.topLevel || []
  const primaryItems = [...topLevelItems, ...allItems.slice(0, 5)] // First 5 items for tier 1
  const secondaryItems = allItems.slice(5) // Rest for tier 2

  // For demo, if no config, show placeholder items
  const hasPrimaryNav = primaryItems.length > 0
  const hasSecondaryNav = showSecondaryNav && secondaryItems.length > 0

  return (
    <div className={cn('flex flex-col bg-surface-flat', className)}>
      {/* Tier 1 - Primary Navigation */}
      <div className="h-[72px] bg-surface-mid border-b border-border-dim flex items-center px-6 gap-6">
        {/* Logo + Product Name */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/assets/Vertical/Lockup/Logo/N-Professional.svg"
            alt="Logo"
            width={24}
            height={24}
            className="h-6"
            style={{ width: 'auto' }}
          />
          <span className="text-body-1-bold text-foreground">{productName}</span>
        </Link>

        {/* Primary Nav Links */}
        <nav className="flex items-center gap-1 flex-1">
          {hasPrimaryNav ? (
            primaryItems.map((item) => (
              <Tier1NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
              />
            ))
          ) : (
            <>
              <Tier1NavLink href="#" label="Homepage" icon="Home" isActive={false} />
              <Tier1NavLink href="#" label="Videos" icon="Video" isActive={true} />
              <Tier1NavLink href="#" label="Bug Reports" icon="Bug" isActive={false} />
              <Tier1NavLink href="#" label="Watchlist" icon="Glasses" isActive={false} />
              <Tier1NavLink href="#" label="Todos" icon="ListTodo" isActive={false} />
            </>
          )}
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="compact">Secondary</Button>
          <Button variant="primary" size="compact">Primary</Button>
        </div>

        {/* User Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-2 rounded hover:bg-surface-2 transition-colors text-foreground-dim hover:text-foreground">
            <Newspaper className="w-5 h-5" />
          </button>
          <button className="p-2 rounded hover:bg-surface-2 transition-colors text-foreground-dim hover:text-foreground">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 rounded hover:bg-surface-2 transition-colors text-foreground-dim hover:text-foreground relative">
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {/* Avatar */}
          <button className="flex items-center gap-1 p-1 rounded hover:bg-surface-2 transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-body-0-bold">
              U
            </div>
            <ChevronDown className="w-4 h-4 text-foreground-dim" />
          </button>
        </div>
      </div>

      {/* Tier 2 - Secondary Navigation */}
      {(hasSecondaryNav || !hasPrimaryNav) && (
        <div className="h-[54px] bg-surface-low border-b border-border-dim flex items-center px-6">
          <nav className="flex items-center gap-4">
            {hasSecondaryNav ? (
              secondaryItems.map((item) => (
                <Tier2NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={pathname === item.href}
                />
              ))
            ) : (
              <>
                <Tier2NavLink href="#" label="All videos" isActive={false} />
                <Tier2NavLink href="#" label="Approved" isActive={false} />
                <Tier2NavLink href="#" label="Rejected" isActive={false} />
                <button className="flex items-center gap-1 px-3 py-2 text-body-0-regular text-foreground-subtle hover:text-foreground transition-colors">
                  <span>Pending</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
