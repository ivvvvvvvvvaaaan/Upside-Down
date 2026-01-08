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
      <div className="w-20 bg-surface-3 flex-shrink-0 flex flex-col items-center px-4 py-6 gap-6">
        <Image
          src="/assets/Vertical/Lockup/Logo/N-Professional.svg"
          alt="Logo"
          width={120}
          height={40}
          className="h-10 w-auto"
        />
        {/* Skeletal nav buttons */}
        <div className="flex flex-col gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded bg-surface-4"
            />
          ))}
        </div>
        <div className="flex flex-col gap-4 mt-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded bg-surface-4"
            />
          ))}
        </div>
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-surface-4 mt-auto" />
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
