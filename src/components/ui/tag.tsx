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
 * - Compact: 10px font, compact padding (px-1.5 py-0.5), no icons
 * - Standard: 13px font, standard padding (px-2 py-0.5), optional icons
 *
 * TYPES (semantic colors):
 * - Announcement: Purple (#6d3be3)
 * - Informative: Blue (#2172e3)
 * - Neutral: Gray (#808080)
 * - Positive: Green (#0aa356)
 * - Notice: Yellow (#d89d31)
 * - Negative: Red (#c11119)
 *
 * STYLES:
 * - Fill: Colored background, white text
 * - Border: Border only, dark text
 *
 * TOKENS USED (Hawkins only):
 * - Typography: text-overline (10px), text-caption (13px), font-semibold
 * - Colors: Semantic tag colors (tag--surface-*, tag--border-*)
 * - Spacing: Space tokens (px-1.5/2, py-0.5)
 * - Border: rounded (4px)
 */

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  type?: 'announcement' | 'informative' | 'neutral' | 'positive' | 'notice' | 'negative'
  size?: 'compact' | 'standard'
  variant?: 'fill' | 'border'
}

export function Tag({
  className,
  children,
  type = 'neutral',
  size = 'compact',
  variant = 'fill',
  ...props
}: TagProps) {
  // Typography based on size
  const sizeStyles = {
    compact: 'text-overline font-semibold px-1.5 py-0.5',
    standard: 'text-caption font-semibold px-2 py-0.5',
  }

  // Colors based on type and style
  const typeStyles = {
    announcement: {
      fill: 'bg-indigo-500 text-white',
      border: 'border border-indigo-500 text-foreground',
    },
    informative: {
      fill: 'bg-blue-500 text-white',
      border: 'border border-blue-500 text-foreground',
    },
    neutral: {
      fill: 'bg-gray-600 text-white',
      border: 'border border-gray-600 text-foreground',
    },
    positive: {
      fill: 'bg-green-500 text-white',
      border: 'border border-green-500 text-foreground',
    },
    notice: {
      fill: 'bg-yellow-500 text-white',
      border: 'border border-yellow-500 text-foreground',
    },
    negative: {
      fill: 'bg-red-500 text-white',
      border: 'border border-red-500 text-foreground',
    },
  }

  return (
    <span
      className={cn(
        // Layout
        'inline-flex items-center justify-center',
        // Border radius - 4px
        'rounded',
        // Size-specific styles
        sizeStyles[size],
        // Type and variant-specific colors
        typeStyles[type][variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
