import { cn } from '@/lib/utils'

export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /** Gap between cards: '4' (16px) or '6' (24px) */
  gap?: '4' | '6'
}

/**
 * Responsive grid layout for cards (asset cards, collection cards, etc.)
 * Default: 1 col mobile, 2 col sm, 3 col lg, 4 col xl
 */
export function CardGrid({
  children,
  gap = '6',
  className,
  ...props
}: CardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
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
