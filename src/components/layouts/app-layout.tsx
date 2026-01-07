'use client'

import Image from 'next/image'
import { NavSidebar } from '@/components/ui'

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
    <div className="min-h-screen bg-surface-flat flex">
      {/* Left vertical nav with logo */}
      <div className="w-20 bg-surface-3 flex-shrink-0 flex flex-col items-center px-4 py-6">
        <Image
          src="/assets/Vertical/Lockup/Logo/Professional.svg"
          alt="Logo"
          width={120}
          height={40}
          className="h-10 w-auto"
        />
      </div>

      {/* Navigation Sidebar */}
      <NavSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
