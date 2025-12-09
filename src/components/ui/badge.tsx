import { cn } from '@/lib/utils'

/**
 * Badge Component
 * 
 * Displays status indicators and labels.
 * 
 * PROPS:
 * - variant: Semantic color variants (default, success, warning, error, info)
 * - color: Direct color specification (gray, blue, green, yellow, red) - overrides variant
 * - compact: Reduced padding for dense layouts
 * - size: Legacy size prop (deprecated, use compact instead)
 * 
 * DIFFERENCES FROM PRODUCTION HAWKINS:
 * - Production uses explicit token names (Blue400, Gray500)
 * - Production includes startAdornment/endAdornment props
 * - Production supports movie phase states
 * - This uses simplified variant system
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge color="green">Active</Badge>
 * <Badge compact>New</Badge>
 */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  /** Direct color specification (overrides variant) */
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red'
  /** Legacy size prop (deprecated) */
  size?: 'sm' | 'md'
  /** Reduced padding for dense layouts */
  compact?: boolean
}

function Badge({ 
  className, 
  variant = 'default', 
  color,
  size = 'md',
  compact = false,
  children,
  ...props 
}: BadgeProps) {
  // Color prop takes precedence over variant
  const colorStyles = {
    gray: 'bg-surface-2 text-foreground border border-border-subtle',
    blue: 'bg-primary/10 text-primary border border-primary/20',
    green: 'bg-success/10 text-success border border-success/20',
    yellow: 'bg-warning/10 text-warning border border-warning/20',
    red: 'bg-destructive/10 text-destructive border border-destructive/20',
  }
  
  const variants = {
    default: 'bg-surface-2 text-foreground border border-border-subtle',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-destructive/10 text-destructive border border-destructive/20',
    info: 'bg-primary/10 text-primary border border-primary/20',
  }
  
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-caption',
  }

  const finalColor = color ? colorStyles[color] : variants[variant]
  const finalSize = compact ? sizes.sm : sizes[size]

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md',
        finalColor,
        finalSize,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
