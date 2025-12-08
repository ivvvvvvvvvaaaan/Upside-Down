import { cn } from '@/lib/utils'

/*
 * ===========================================
 * STACK COMPONENT
 * ===========================================
 * Flexbox layout with consistent spacing.
 * The most-used layout component.
 * 
 * Use instead of raw divs with flex classes.
 */

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical'
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
}

function Stack({ 
  className, 
  direction = 'vertical', 
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  children,
  ...props 
}: StackProps) {
  const spacingStyles = {
    none: 'gap-0',
    xs: 'gap-1',    // 4px
    sm: 'gap-2',    // 8px
    md: 'gap-4',    // 16px
    lg: 'gap-6',    // 24px
    xl: 'gap-8',    // 32px
  }
  
  const alignStyles = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  }
  
  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  }

  return (
    <div
      className={cn(
        'flex',
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        spacingStyles[spacing],
        alignStyles[align],
        justifyStyles[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Stack }
