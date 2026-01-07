import { cn } from '@/lib/utils'
import { Text } from './text'

export interface PageHeaderProps {
  title: string
  description?: string
  className?: string
}

/**
 * Standard page header with title and optional description
 */
export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={className}>
      <Text variant="headline-1" weight="bold" className="mb-2">
        {title}
      </Text>
      {description && (
        <Text variant="body-2" color="secondary">
          {description}
        </Text>
      )}
    </div>
  )
}
