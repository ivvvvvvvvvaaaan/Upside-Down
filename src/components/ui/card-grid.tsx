import { cn } from '@/lib/utils'

export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /** Gap between cards: '4' (16px) or '6' (24px) */
  gap?: '4' | '6'
  /** Number of columns at xl breakpoint: 3 (large), 4 (medium), 6 (small) */
  columns?: 3 | 4 | 6
  /** Layout mode: 'grid' or 'list' */
  layout?: 'grid' | 'list'
}

// Minimum card width per column setting — grid auto-fills based on container width
const MIN_CARD_WIDTH: Record<3 | 4 | 6, number> = {
  3: 280,
  4: 200,
  6: 160,
}

/**
 * Responsive grid layout for cards (asset cards, collection cards, etc.)
 * Uses auto-fill with min card widths so the grid adapts to actual container
 * width (works correctly when side panels reduce available space).
 */
export function CardGrid({
  children,
  gap = '6',
  columns = 4,
  layout = 'grid',
  className,
  style,
  ...props
}: CardGridProps) {
  if (layout === 'list') {
    return (
      <div
        className={cn(
          'flex flex-col',
          gap === '4' && 'gap-4',
          gap === '6' && 'gap-6',
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }

  const minWidth = MIN_CARD_WIDTH[columns]

  return (
    <div
      className={cn(
        'grid',
        gap === '4' && 'gap-4',
        gap === '6' && 'gap-6',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
