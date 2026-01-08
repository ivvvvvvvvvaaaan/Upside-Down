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
    { href: '/media-library', label: 'Media Library' },
    { href: '/assets', label: 'Assets' },
  ]

  const collectionItems = [
    { href: '/collections/characters', label: 'Characters' },
    { href: '/collections/locations', label: 'Locations' },
    { href: '/collections/scenes', label: 'Scenes' },
  ]

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const isActive = pathname === href
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
    <nav className={cn('w-60 bg-surface-1 border-r border-border-subtle flex-shrink-0 flex flex-col', className)}>
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
