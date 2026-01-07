'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Text } from './text'

/**
 * Navigation Sidebar
 *
 * Minimal navigation between vertical logo bar and main content
 * Shows Collections and Assets links
 */

export interface NavSidebarProps {
  className?: string
}

export function NavSidebar({ className }: NavSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/media-library', label: 'Media Library' },
    { href: '/collection-cards', label: 'Collections' },
    { href: '/assets', label: 'Assets' },
  ]

  return (
    <nav className={cn('w-48 bg-surface-1 border-r border-border-subtle flex-shrink-0 py-6 px-4', className)}>
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-3 py-2 rounded transition-colors',
                isActive
                  ? 'bg-surface-highlight text-foreground'
                  : 'text-foreground-dim hover:bg-surface-2 hover:text-foreground'
              )}
            >
              <Text variant="body-2" weight={isActive ? 'semibold' : 'normal'}>
                {item.label}
              </Text>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
