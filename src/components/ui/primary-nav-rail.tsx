import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface PrimaryNavRailProps {
  className?: string
}

export function PrimaryNavRail({ className }: PrimaryNavRailProps) {
  return (
    <div className={cn('w-20 bg-surface-3 flex-shrink-0 flex flex-col items-center px-4 py-6 gap-12', className)}>
      <Image
        src="/assets/Vertical/Lockup/Logo/N-Professional.svg"
        alt="Logo"
        width={120}
        height={40}
        className="h-10 w-auto"
      />
      {/* First group: 3 ghost boxes */}
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded bg-surface-4"
          />
        ))}
      </div>
      {/* Second group: Library icon (selected) + 1 ghost box */}
      <div className="flex flex-col gap-4 items-center">
        {/* Library icon with selected background */}
        <div className="w-10 h-10 rounded bg-indigo-500/20 flex items-center justify-center">
          <Image
            src="/Icons/icon-libirary.svg"
            alt="Library"
            width={16}
            height={16}
          />
        </div>
        {/* Ghost box */}
        <div className="w-6 h-6 rounded bg-surface-4" />
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
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-surface-4 mt-auto" />
    </div>
  )
}
