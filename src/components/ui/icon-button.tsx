import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

/*
 * ===========================================
 * ICON BUTTON COMPONENT
 * ===========================================
 * Button with only an icon. Requires label for accessibility.
 */

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string  // Required for accessibility
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, label, variant = 'ghost', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600',
      secondary: 'border border-border bg-surface-primary text-content-primary hover:bg-surface-secondary',
      ghost: 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary',
    }
    
    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    }
    
    const iconSizes = {
      sm: '[&>svg]:w-4 [&>svg]:h-4',
      md: '[&>svg]:w-5 [&>svg]:h-5',
      lg: '[&>svg]:w-6 [&>svg]:h-6',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors focus-ring',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          iconSizes[size],
          className
        )}
        aria-label={label}
        title={label}
        {...props}
      >
        {icon}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

export { IconButton }
