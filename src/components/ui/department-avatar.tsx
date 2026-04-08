import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'
import { departmentConfigs } from '@/lib/department-configs'
import type { DepartmentId } from '@/components/department/types'

interface DepartmentAvatarProps {
  departmentId?: DepartmentId
  size?: 'compact' | 'sm' | 'md'
}

const sizeClasses = {
  compact: 'w-5 h-5 rounded-sm',
  sm: 'w-6 h-6 rounded',
  md: 'w-8 h-8 rounded',
}

const iconSizes = {
  compact: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
}

export function DepartmentAvatar({ departmentId, size = 'sm' }: DepartmentAvatarProps) {
  const config = departmentId ? departmentConfigs[departmentId] : undefined
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
