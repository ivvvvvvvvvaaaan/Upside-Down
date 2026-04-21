'use client'

import Image from 'next/image'
import { Settings, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PersonaPicker } from './persona-picker'
import { SettingsModal } from './settings-modal'
import { UserJourneyModal } from './user-journey-modal'
import { useState } from 'react'

export interface PrimaryNavRailProps {
  className?: string
}

export function PrimaryNavRail({ className }: PrimaryNavRailProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [journeyOpen, setJourneyOpen] = useState(false)

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
      <div className="flex flex-col gap-4 items-center">
        <div className="w-10 h-10 rounded bg-indigo-500/20 flex items-center justify-center">
          <Image
            src="/Icons/icon-libirary.svg"
            alt="Library"
            width={16}
            height={16}
          />
        </div>
      </div>
      <div className="mt-auto flex flex-col items-center gap-3">
        <button
          onClick={() => setJourneyOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground-dim hover:bg-surface-4 transition-colors"
          aria-label="Sharing Map"
          title="Sharing Map"
        >
          <Map className="w-5 h-5" />
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground-dim hover:bg-surface-4 transition-colors"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        <PersonaPicker compact avatarOnly />
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <UserJourneyModal open={journeyOpen} onClose={() => setJourneyOpen(false)} />
    </div>
  )
}
