import { cn } from '@/lib/utils'

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
        <img 
          src={src} 
          alt={name || 'Avatar'} 
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

export { Avatar }
