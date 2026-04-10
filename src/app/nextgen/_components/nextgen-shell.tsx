'use client'

import { usePathname } from 'next/navigation'
import { AppLayout } from '@/components/layouts'
import { useAccess } from '@/hooks'
import { Lock } from 'lucide-react'

function ProjectLockedBanner({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="bg-red-500/10 border-b border-red-500/40 px-4 py-2 flex items-center justify-center gap-2 flex-shrink-0">
      <Lock className="w-4 h-4 text-red-400" />
      <span className="text-body-0-bold text-red-400">
        Project locked. External access is frozen.
      </span>
      <button
        onClick={onOpenSettings}
        className="text-body-0-regular text-red-400 underline underline-offset-2 hover:text-red-300 transition-colors"
      >
        Open settings to unlock
      </button>
    </div>
  )
}

export function NextgenShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { projectLocked } = useAccess()
  const isShelllessRoute = pathname === '/nextgen/menu'
    || pathname.startsWith('/nextgen/menu/')
    || pathname === '/nextgen/desktop'
    || pathname.startsWith('/nextgen/desktop/')
  const hideNav = pathname.startsWith('/nextgen/assets/')

  const handleOpenSettings = () => {
    // Dispatch a custom event that the settings modal can listen for
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'security' } }))
    }
  }

  if (isShelllessRoute) {
    return (
      <>
        {projectLocked && <ProjectLockedBanner onOpenSettings={handleOpenSettings} />}
        {children}
      </>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {projectLocked && <ProjectLockedBanner onOpenSettings={handleOpenSettings} />}
      <div className="flex-1 min-h-0">
        <AppLayout hideNav={hideNav}>
          {children}
        </AppLayout>
      </div>
    </div>
  )
}
