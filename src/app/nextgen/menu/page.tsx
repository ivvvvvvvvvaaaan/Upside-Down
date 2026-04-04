'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { NavSidebar } from '@/components/ui'

/**
 * Mobile Navigation Page
 *
 * Full-screen mobile nav that adapts the desktop NavSidebar for touch.
 * Shows a horizontal app header (Netflix logo + current app label) at top,
 * then the NavSidebar with larger touch targets (mobile variant).
 *
 * Auto-redirects back to content when the viewport widens to desktop.
 */
export default function MobileNavPage() {
  const router = useRouter()

  const getReturnPath = () => {
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get('return') || '/nextgen/collections'
    } catch {
      return '/nextgen/collections'
    }
  }

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const returnTo = getReturnPath()
    const handleChange = () => {
      if (media.matches) {
        router.replace(returnTo)
      }
    }

    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [router])

  return (
    <div className="h-screen bg-surface-flat flex flex-col">
      {/* App header — horizontal version of PrimaryNavRail */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-3 flex-shrink-0">
        <Image
          src="/assets/Vertical/Lockup/Logo/N-Professional.svg"
          alt="Logo"
          width={120}
          height={32}
          className="h-8"
          style={{ width: 'auto' }}
        />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center">
            <Image
              src="/Icons/icon-libirary.svg"
              alt="Library"
              width={14}
              height={14}
            />
          </div>
          <span className="text-body-1-bold text-foreground">Library</span>
        </div>
      </div>

      {/* Nav sidebar — mobile variant with larger touch targets */}
      <NavSidebar
        mobile
        className="flex-1 w-auto border-r-0 overflow-auto"
      />
    </div>
  )
}
