import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface PrimaryNavRailProps {
  className?: string
}

export function PrimaryNavRail({ className }: PrimaryNavRailProps) {
  return (
    <div className={cn('w-20 bg-surface-3 flex-shrink-0 flex flex-col items-center px-4 py-6 gap-6', className)}>
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
  )
}
