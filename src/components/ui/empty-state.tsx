import { cn } from '@/lib/utils'
import { Text } from './text'

export interface EmptyStateProps {
  title: string
  message?: string
  className?: string
  /** Compact variant for inline/nested contexts */
  compact?: boolean
}

/**
 * Reusable empty state component for when no content is available
 */
export function EmptyState({ title, message, className, compact = false }: EmptyStateProps) {
  if (compact) {
    return (
      <div className={cn('text-center py-4', className)}>
        <Text variant="body-1" color="secondary">{title}</Text>
      </div>
    )
  }

  return (
    <div className={cn('text-center py-12', className)}>
      <Text variant="headline-3" className="mb-2">{title}</Text>
      {message && <Text variant="body-2" color="secondary">{message}</Text>}
    </div>
  )
}
