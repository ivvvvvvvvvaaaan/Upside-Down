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
 * - Compact: 10px font (text-overline), 4px horizontal/0px vertical padding (px-1 py-0), no icons
 * - Standard: 13px font (text-caption), 8px horizontal/0px vertical padding (px-2 py-0), optional icons
 *
 * TYPES (semantic colors):
 * - Announcement: Purple (indigo-500)
 * - Informative: Blue (blue-500)
 * - Neutral: Dark gray (gray-600/gray-400 - consistent rgb(65,65,65))
 * - Positive: Green (green-500)
 * - Notice: Yellow (yellow-500)
 * - Negative: Red (red-500)
 *
 * STYLES:
 * - Fill: Colored background, white text
 * - Border: Border only, dark text
 *
 * TOKENS USED (Hawkins only):
 * - Typography: text-overline (10px font / 15px line), text-caption (13px font / 20px line), font-semibold
 * - Colors: Semantic tag colors (gray-600, indigo-500, blue-500, etc.)
 * - Spacing: space-4 (4px) for compact, space-8 (8px) for standard, space-0 (0px) vertical
 * - Border: border-radius-4 (4px rounded)
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
  // Typography based on size (Hawkins spacing tokens - exact Figma specs)
  const sizeStyles = {
    compact: 'text-tag-small px-1 py-0',  // 10px font, 15px line, 600 weight (from Figma tag--text-small), 4px horizontal, 0px vertical
    standard: 'text-body-0-bold px-2 py-0',  // 13px font, 20px line, 600 weight (from Figma), 8px horizontal, 0px vertical
  }

  // Colors based on type and style
  // Note: neutral uses gray-600 (light) / gray-400 (dark) for consistent rgb(65,65,65) across themes
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
      fill: 'bg-gray-600 dark:bg-gray-400 text-white',
      border: 'border border-gray-600 dark:border-gray-400 text-foreground',
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
