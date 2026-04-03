import { cn } from '@/lib/utils'
import { Avatar } from './avatar'

/**
 * Facepile Component
 *
 * Shows a row of overlapping user avatars with optional overflow count.
 * Uses CSS mask to punch a hole for the next avatar — no rings or
 * background-matching needed, works on any surface.
 */

export interface FacepileUser {
  id: string
  name: string
  avatarSrc?: string
}

export interface FacepileProps {
  users: FacepileUser[]
  /** Maximum avatars to show before "+X" overflow */
  max?: number
  /** Avatar size */
  size?: 'compact' | 'sm' | 'md'
  className?: string
}

const SIZES = {
  compact: { px: 20, overlap: 8, gap: 2 },
  sm:      { px: 24, overlap: 10, gap: 2 },
  md:      { px: 32, overlap: 12, gap: 2 },
} as const

const overflowSizeClass = {
  compact: 'w-5 h-5 text-label-0-bold',
  sm: 'w-6 h-6 text-label-0-bold',
  md: 'w-8 h-8 text-body-2-bold',
}

function cutoutMask(avatarPx: number, overlap: number, gap: number): string {
  // Center of the next avatar relative to this one
  const cx = avatarPx - overlap + avatarPx / 2
  const cy = avatarPx / 2
  const r = avatarPx / 2 + gap
  // radial-gradient punches a transparent circle; everything else stays visible
  return `radial-gradient(circle ${r}px at ${cx}px ${cy}px, transparent 100%, black 100%)`
}

export function Facepile({ users, max = 5, size = 'sm', className }: FacepileProps) {
  const visibleUsers = users.slice(0, max)
  const overflowCount = users.length - max
  const hasOverflow = overflowCount > 0
  const totalVisible = visibleUsers.length + (hasOverflow ? 1 : 0)

  const { px, overlap, gap } = SIZES[size]
  const mask = cutoutMask(px, overlap, gap)
  const overlapClass = size === 'compact' ? '-ml-2' : size === 'sm' ? '-ml-2.5' : '-ml-3'

  return (
    <div className={cn('flex items-center', className)}>
      {visibleUsers.map((user, index) => {
        const needsMask = index < totalVisible - 1
        return (
          <div
            key={user.id}
            className={cn(index > 0 && overlapClass)}
            style={needsMask ? { WebkitMaskImage: mask, maskImage: mask } : undefined}
          >
            <Avatar
              src={user.avatarSrc}
              name={user.name}
              size={size}
              title={user.name}
            />
          </div>
        )
      })}
      {hasOverflow && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-surface-3 text-foreground-dim',
            overlapClass,
            overflowSizeClass[size],
          )}
          title={`${overflowCount} more members`}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  )
}
