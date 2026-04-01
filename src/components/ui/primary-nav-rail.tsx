'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PrimaryNavRailProps {
  className?: string
}

export function PrimaryNavRail({ className }: PrimaryNavRailProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className={cn('w-20 bg-surface-3 flex-shrink-0 flex flex-col items-center px-4 py-6 gap-12', className)}>
      <Image
        src="/assets/Vertical/Lockup/Logo/N-Professional.svg"
        alt="Logo"
        width={120}
        height={40}
        className="h-10"
        style={{ width: 'auto' }}
      />
      {/* First group: Library icon (selected) + 1 ghost box */}
      <div className="flex flex-col gap-4 items-center">
        <div className="w-10 h-10 rounded bg-indigo-500/20 flex items-center justify-center">
          <Image
            src="/Icons/icon-libirary.svg"
            alt="Library"
            width={16}
            height={16}
          />
        </div>
        <div className="w-6 h-6 rounded bg-surface-4" />
      </div>
      {/* Second group: 3 ghost boxes */}
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded bg-surface-4"
          />
        ))}
      </div>
      {/* Third group: 5 ghost boxes */}
      <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded bg-surface-4"
          />
        ))}
      </div>
      {/* Avatar with menu */}
      <div className="relative mt-auto">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-10 h-10 rounded-full bg-surface-4 hover:bg-surface-highlight transition-colors"
          aria-label="User menu"
        />
        {showMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            {/* Menu */}
            <div className="absolute bottom-12 left-0 w-48 py-2 bg-surface-high/95 backdrop-blur-xl rounded-lg border border-border-dim shadow-high z-50">
              <div className="px-3 py-1.5 text-label-0-bold text-foreground-dim border-b border-border-dim mb-1">
                Prototypes
              </div>
              <Link
                href="/nextgen/desktop"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-body-0-regular text-foreground hover:bg-surface-selected-subtle transition-colors"
              >
                <Monitor className="w-4 h-4" />
                Desktop Environment
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
