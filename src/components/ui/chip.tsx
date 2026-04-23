import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  onDismiss?: () => void
  dismissLabel?: string
  disabled?: boolean
  size?: 'standard' | 'compact'
}

export function Chip({
  children,
  onDismiss,
  dismissLabel = 'Dismiss',
  disabled = false,
  size = 'standard',
  className,
  ...props
}: ChipProps) {
  const isCompact = size === 'compact'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded bg-gray-600 p-1',
        isCompact ? 'text-label-0-bold' : 'text-body-0-bold',
        'text-foreground-inverse dark:bg-gray-400 dark:text-foreground',
        disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-center rounded text-current',
            isCompact ? 'size-4' : 'size-6',
            'transition-colors hover:bg-gray-500/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
          aria-label={dismissLabel}
        >
          <X className={isCompact ? 'size-4' : 'size-6'} />
        </button>
      )}
    </span>
  )
}
