'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * Navigation Sidebar
 *
 * Vertical navigation following Hawkins design system
 * - Section headers: 10px uppercase, 40% opacity
 * - Links: 13px semibold, selected has indigo bg at 20% opacity
 */

export interface NavSidebarProps {
  className?: string
}

export function NavSidebar({ className }: NavSidebarProps) {
  const pathname = usePathname()

  const mainItems = [
    { href: '/nextgen', label: 'Media Library' },
    { href: '/nextgen/assets', label: 'Assets' },
  ]

  const collectionItems = [
    { href: '/nextgen/media-library', label: 'All Collections' },
    { href: '/nextgen/collections/characters', label: 'Characters' },
    { href: '/nextgen/collections/locations', label: 'Locations' },
    { href: '/nextgen/collections/scenes', label: 'Scenes' },
  ]

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    // Check exact match or if pathname starts with href (for nested routes)
    const isActive = pathname === href || (href !== '/nextgen' && pathname.startsWith(href))
    return (
      <Link
        href={href}
        className={cn(
          'block px-3 py-2 rounded transition-colors text-body-0-bold',
          isActive
            ? 'bg-indigo-500/20 text-foreground'
            : 'text-foreground-subtle hover:bg-surface-2 hover:text-foreground'
        )}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className={cn('w-60 bg-surface-1 border-r border-border-dim flex-shrink-0 flex flex-col', className)}>
      {/* Main Items (no header) */}
      <div className="pt-4 pb-2">
        <div className="px-3 space-y-1">
          {mainItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </div>

      {/* Collections Section */}
      <div className="py-2">
        <div className="px-6 py-2">
          <span className="text-label-0-bold uppercase text-foreground-dim">
            Collections
          </span>
        </div>
        <div className="px-3 space-y-1">
          {collectionItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </div>
    </nav>
  )
}
