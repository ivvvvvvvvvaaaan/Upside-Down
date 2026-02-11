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

/**
 * Responsive grid layout for cards (asset cards, collection cards, etc.)
 * Default: 1 col mobile, 2 col sm, 3 col lg, 4 col xl
 */
export function CardGrid({
  children,
  gap = '6',
  columns = 4,
  layout = 'grid',
  className,
  ...props
}: CardGridProps) {
  const columnClasses = {
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  }

  if (layout === 'list') {
    return (
      <div
        className={cn(
          'flex flex-col',
          gap === '4' && 'gap-4',
          gap === '6' && 'gap-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid',
        columnClasses[columns],
        gap === '4' && 'gap-4',
        gap === '6' && 'gap-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
