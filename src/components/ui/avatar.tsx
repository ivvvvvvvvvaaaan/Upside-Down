import { cn } from '@/lib/utils'
import Image from 'next/image'

/*
 * ===========================================
 * AVATAR COMPONENT
 * ===========================================
 * Hawkins avatar — user/entity representation.
 * Shows image if provided, otherwise initials.
 *
 * Sizes (from Hawkins design system):
 *   compact: 20px circle, 10px bold
 *   sm:      24px circle, 10px bold
 *   md:      32px circle, 16px bold
 *   lg:      48px circle, 24px bold
 *   xl:      64px circle, 32px bold
 *
 * Color: gray-500 (#808080) bg at 20%, gray-500 text
 */

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  name?: string
  size?: 'compact' | 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  compact: 'w-5 h-5',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

const fontClasses = {
  compact: 'text-label-0-bold',
  sm: 'text-label-0-bold',
  md: 'text-body-2-bold',
  lg: 'text-heading-2',
  xl: 'text-heading-4',
}

const imageSizes = {
  compact: '20px',
  sm: '24px',
  md: '32px',
  lg: '48px',
  xl: '64px',
}

function Avatar({
  className,
  src,
  name,
  size = 'sm',
  ...props
}: AvatarProps) {
  const initials = name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0',
        'bg-gray-500/20 text-gray-500 dark:text-white',
        sizeClasses[size],
        fontClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={name || 'Avatar'}
          fill
          className="object-cover"
          sizes={imageSizes[size]}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

export { Avatar }
