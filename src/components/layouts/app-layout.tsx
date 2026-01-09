'use client'

import { NavSidebar, PrimaryNavRail } from '@/components/ui'

/**
 * App Layout
 *
 * Shared layout with vertical logo bar and navigation sidebar
 * Wraps all main content pages (collections, assets, etc.)
 */

export interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen bg-surface-flat flex overflow-hidden">
      <div className="hidden md:flex">
        <PrimaryNavRail />
        <NavSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
