import { cn } from '@/lib/utils'
import Image from 'next/image'

/*
 * ===========================================
 * AVATAR COMPONENT
 * ===========================================
 * User or entity representation.
 * Shows image if provided, otherwise initials.
 */

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

function Avatar({ 
  className, 
  src, 
  name,
  size = 'md',
  ...props 
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  }

  // Helper to get pixel value for next/image sizes prop
  // Tailwind unit (e.g. 10) * 4 = pixels (40px)
  const getPixelSize = (s: keyof typeof sizes) => {
    const match = sizes[s].match(/w-(\d+)/)
    const unit = match ? parseInt(match[1]) : 10
    return `${unit * 4}px`
  }
  
  // Generate initials from name
  const initials = name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
  
  // Generate consistent background color from name
  const colorIndex = name 
    ? name.charCodeAt(0) % 5 
    : 0
  const bgColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
  ]

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center font-medium text-white',
        sizes[size],
        !src && bgColors[colorIndex],
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
          sizes={getPixelSize(size)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

export { Avatar }
