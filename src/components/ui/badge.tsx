import { cn } from '@/lib/utils'

/**
 * Badge Component (Hawkins Design System)
 *
 * Displays status indicators and labels with semantic colors.
 * Updated to match Hawkins design patterns.
 *
 * SIZES:
 * - compact: text-label-0-bold (10px/15px/600), px-1 (4px), py-0 (0px)
 * - standard: text-body-0-bold (13px/20px/600), px-2 (8px), py-0 (0px)
 *
 * VARIANTS (semantic colors):
 * - default: Gray background
 * - success: Green background
 * - warning: Yellow background
 * - error: Red background
 * - info: Blue background
 *
 * STYLES:
 * - fill: Colored background with white text (default)
 * - subtle: Light background with colored text
 *
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error" compact>High</Badge>
 * <Badge variant="warning" style="subtle">Pending</Badge>
 */

const FILL_COLORS = {
  default: 'bg-gray-600 dark:bg-gray-400 text-white',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
} as const

const SUBTLE_COLORS = {
  default: 'bg-gray-600/10 text-foreground border border-gray-600/20',
  success: 'bg-green-500/10 text-green-500 border border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
  error: 'bg-red-500/10 text-red-500 border border-red-500/20',
  info: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
} as const

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  /** Visual style: fill (solid bg) or subtle (light bg with border) */
  badgeStyle?: 'fill' | 'subtle'
  /** Reduced size for dense layouts */
  compact?: boolean
}

function Badge({
  className,
  variant = 'default',
  badgeStyle = 'fill',
  compact = false,
  children,
  ...props
}: BadgeProps) {
  const colorClasses = badgeStyle === 'fill' ? FILL_COLORS[variant] : SUBTLE_COLORS[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded',
        colorClasses,
        compact ? 'text-label-0-bold px-1 py-0' : 'text-body-0-bold px-2 py-0',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
