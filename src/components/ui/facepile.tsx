import { cn } from '@/lib/utils'
import { Avatar } from './avatar'

/**
 * Facepile Component
 *
 * Shows a row of overlapping user avatars with optional overflow count.
 *
 * TOKENS USED:
 * - Avatar component for individual faces
 * - bg-surface-flat: Background for overflow badge
 * - text-label-0-bold: Overflow count text
 * - border-border-dim: Ring around avatars for separation
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
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export function Facepile({ users, max = 5, size = 'sm', className }: FacepileProps) {
  const visibleUsers = users.slice(0, max)
  const overflowCount = users.length - max

  const overlapClass = size === 'xs' ? '-ml-2' : size === 'sm' ? '-ml-2.5' : '-ml-3'
  const ringClass = 'ring-2 ring-surface-flat'

  return (
    <div className={cn('flex items-center', className)}>
      {visibleUsers.map((user, index) => (
        <Avatar
          key={user.id}
          src={user.avatarSrc}
          name={user.name}
          size={size}
          className={cn(ringClass, index > 0 && overlapClass)}
          title={user.name}
        />
      ))}
      {overflowCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-surface-3 text-foreground-dim',
            ringClass,
            overlapClass,
            size === 'xs' && 'w-6 h-6 text-label-0-bold',
            size === 'sm' && 'w-8 h-8 text-label-0-bold',
            size === 'md' && 'w-10 h-10 text-label-1-bold'
          )}
          title={`${overflowCount} more members`}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  )
}
