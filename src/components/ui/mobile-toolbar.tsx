'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from './button'

interface MobileToolbarProps {
  /** Page title shown next to the hamburger icon */
  title?: string
  /** Extra action buttons on the right (e.g., info icon) */
  actions?: React.ReactNode
}

/**
 * MobileToolbar
 *
 * Consistent mobile-only toolbar.
 * [☰ Title]              [actions]
 * Hidden on desktop (md and above).
 */
export function MobileToolbar({ title, actions }: MobileToolbarProps) {
  const pathname = usePathname()
  const menuHref = `/nextgen/menu?return=${encodeURIComponent(pathname)}`

  return (
    <div className="flex items-center justify-between w-full md:hidden relative">
      <div className="flex items-center gap-2 min-w-0">
        <Button asChild variant="icon" size="icon" aria-label="Menu" className="flex-shrink-0">
          <Link href={menuHref}>
            <Menu className="w-4 h-4" />
          </Link>
        </Button>
        {title && (
          <span className="text-body-1-bold text-foreground truncate">{title}</span>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
