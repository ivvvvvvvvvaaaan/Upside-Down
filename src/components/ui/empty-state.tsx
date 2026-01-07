import { cn } from '@/lib/utils'
import { Text } from './text'

export interface EmptyStateProps {
  title: string
  message: string
  className?: string
}

/**
 * Reusable empty state component for when no content is available
 */
export function EmptyState({ title, message, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <Text variant="headline-3" className="mb-2">{title}</Text>
      <Text variant="body-2" color="secondary">{message}</Text>
    </div>
  )
}
