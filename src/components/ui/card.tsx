import { cn } from '@/lib/utils'

/*
 * ===========================================
 * CARD COMPONENT
 * ===========================================
 * Container with background and optional elevation.
 * 
 * Variants:
 * - default: Subtle background
 * - elevated: With shadow
 * - outlined: With border
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

function Card({ 
  className, 
  variant = 'default', 
  padding = 'md',
  children,
  ...props 
}: CardProps) {
  const variants = {
    default: 'bg-surface-secondary',
    elevated: 'bg-surface-primary shadow-elevated',
    outlined: 'bg-surface-primary border border-border',
  }
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <div
      className={cn(
        'rounded-lg',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card }
