import { cn } from '@/lib/utils'

/**
 * Tag Component (Hawkins Design System)
 *
 * Tags categorize content and workflow environments with shared labels and visual attributes.
 * Follows official Hawkins Tag component patterns.
 *
 * Documentation: https://sites.google.com/netflix.com/hawkins-professional/components/tags
 *
 * SIZES:
 * - compact: text-label-0-bold (10px/15px/600), px-1 (4px), py-0 (0px)
 * - standard: text-body-0-bold (13px/20px/600), px-2 (8px), py-0 (0px)
 *
 * TYPES (semantic colors):
 * - neutral: Gray (gray-600/gray-400 for theme support)
 * - positive: Green (green-500)
 * - negative: Red (red-500)
 * - notice: Yellow (yellow-500)
 * - informative: Blue (blue-500)
 * - announcement: Purple (indigo-500)
 *
 * VARIANTS:
 * - fill: Colored background, white text (default)
 * - border: Border only, foreground text
 *
 * TOKENS USED (Hawkins only - NO hardcoded values):
 * - Typography: text-label-0-bold (10px/15px/600), text-body-0-bold (13px/20px/600)
 * - Colors: bg-{color}-500, border-{color}-500, text-foreground, text-white
 * - Spacing: px-1 (4px), px-2 (8px), py-0 (0px)
 * - Border: rounded (4px)
 */

const FILL_COLORS = {
  neutral: 'bg-gray-500 dark:bg-gray-400 !text-white',
  positive: 'bg-green-400 !text-white',
  negative: 'bg-red-400 !text-white',
  notice: 'bg-yellow-400 !text-white',
  informative: 'bg-blue-400 !text-white',
  announcement: 'bg-indigo-400 !text-white',
} as const

const BORDER_COLORS = {
  neutral: 'border border-gray-600 dark:border-gray-400 text-foreground',
  positive: 'border border-green-500 text-foreground',
  negative: 'border border-red-500 text-foreground',
  notice: 'border border-yellow-500 text-foreground',
  informative: 'border border-blue-500 text-foreground',
  announcement: 'border border-indigo-500 text-foreground',
} as const

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  size?: 'compact' | 'standard'
  type?: 'neutral' | 'positive' | 'negative' | 'notice' | 'informative' | 'announcement'
  variant?: 'fill' | 'border'
}

export function Tag({
  className,
  children,
  size = 'compact',
  type = 'neutral',
  variant = 'fill',
  ...props
}: TagProps) {
  const colorClasses = variant === 'fill' ? FILL_COLORS[type] : BORDER_COLORS[type]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'py-0 rounded',
        colorClasses,
        size === 'compact' && 'text-label-0-bold px-1',
        size === 'standard' && 'text-body-0-bold px-2',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
