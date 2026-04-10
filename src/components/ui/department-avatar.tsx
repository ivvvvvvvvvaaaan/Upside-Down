import { cn } from '@/lib/utils'
import { Users, Globe } from 'lucide-react'
import { domainConfigs } from '@/lib/domain-configs'
import type { DomainId } from '@/components/department/types'

type AvatarSize = 'compact' | 'sm' | 'md'

const sizeClasses: Record<AvatarSize, string> = {
  compact: 'w-5 h-5 rounded-sm',
  sm: 'w-6 h-6 rounded',
  md: 'w-8 h-8 rounded',
}

const iconSizes: Record<AvatarSize, string> = {
  compact: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
}

export function DepartmentAvatar({ domainId, size = 'sm' }: { domainId?: DomainId; size?: AvatarSize }) {
  const config = domainId ? domainConfigs[domainId] : undefined
  const colorClass = config?.color ?? 'bg-gray-500'
  return (
    <span
      className={cn(
        'flex items-center justify-center flex-shrink-0 text-white',
        sizeClasses[size],
        colorClass,
      )}
    >
      <Users className={iconSizes[size]} />
    </span>
  )
}

export function ReleaseDomainAvatar({ size = 'sm' }: { size?: AvatarSize }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center flex-shrink-0 text-white bg-gray-600',
        sizeClasses[size],
      )}
    >
      <Globe className={iconSizes[size]} />
    </span>
  )
}
