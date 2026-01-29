import { cn } from '@/lib/utils'

/**
 * Badge Component (Hawkins Design System)
 *
 * A badge classifies and describes the status of a single entity.
 * Follows official Hawkins Badge component patterns.
 *
 * Documentation: https://sites.google.com/netflix.com/hawkins-professional/components/badge
 * Figma: https://www.figma.com/design/8FNmhzKUqlr6MEo7pJINCd/?node-id=43-9672
 *
 * SIZES:
 * - compact: text-label-1-bold (12px/18px/600 semibold), px-1.5 (6px), py-px (1px)
 * - standard: text-body-0-bold (13px/20px/600 semibold), px-2 (8px), py-0.5 (2px)
 *
 * COLORS (direct):
 * - gray, green, red, yellow, indigo, purple
 *
 * COLORS (status - maps to colors):
 * - new → indigo
 * - in progress → yellow
 * - complete → green
 * - unknown → gray
 * - failure → red
 *
 * STRUCTURE (per Figma):
 * - Outlined style: colored border + colored dot + foreground text
 * - Dot is always 8px (w-2 h-2), color matches the type
 * - Border color matches the dot color
 * - Text is always foreground (dark)
 * - Gap between elements: 8px (gap-2)
 * - Interactive: adds chevron dropdown indicator
 *
 * @example
 * <Badge color="green">Active</Badge>
 * <Badge color="red" compact>High</Badge>
 * <Badge color="failure">Error</Badge>
 * <Badge color="in progress" interactive>Pending</Badge>
 */

// Direct color mappings
const COLOR_STYLES = {
  gray: {
    border: 'border-gray-500',
    dot: 'bg-gray-500',
  },
  green: {
    border: 'border-green-500',
    dot: 'bg-green-500',
  },
  red: {
    border: 'border-red-500',
    dot: 'bg-red-500',
  },
  yellow: {
    border: 'border-yellow-600',
    dot: 'bg-yellow-600',
  },
  indigo: {
    border: 'border-indigo-500',
    dot: 'bg-indigo-500',
  },
  purple: {
    border: 'border-purple-500',
    dot: 'bg-purple-500',
  },
} as const

// Status to color mappings
const STATUS_TO_COLOR: Record<string, keyof typeof COLOR_STYLES> = {
  'new': 'indigo',
  'in progress': 'yellow',
  'complete': 'green',
  'unknown': 'gray',
  'failure': 'red',
}

export type BadgeColor = keyof typeof COLOR_STYLES | keyof typeof STATUS_TO_COLOR

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color or status value */
  color?: BadgeColor
  /** Reduced size for dense layouts */
  compact?: boolean
  /** Show dropdown chevron for interactive badges */
  interactive?: boolean
}

function Badge({
  className,
  color = 'gray',
  compact = false,
  interactive = false,
  children,
  ...props
}: BadgeProps) {
  // Resolve status to color, or use direct color
  const resolvedColor = STATUS_TO_COLOR[color] ?? color
  const styles = COLOR_STYLES[resolvedColor as keyof typeof COLOR_STYLES] ?? COLOR_STYLES.gray

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border bg-transparent text-foreground',
        styles.border,
        compact ? 'text-label-1-bold px-1.5 py-px' : 'text-body-0-bold px-2 py-0.5',
        interactive && 'cursor-pointer hover:bg-surface-interactive-hover',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          styles.dot
        )}
        aria-hidden="true"
      />
      {children}
      {interactive && (
        <svg
          className="w-2 h-2 shrink-0 fill-foreground"
          viewBox="0 0 8 8"
          aria-hidden="true"
        >
          <path d="M0 2L4 6L8 2H0Z" />
        </svg>
      )}
    </span>
  )
}

export { Badge }
