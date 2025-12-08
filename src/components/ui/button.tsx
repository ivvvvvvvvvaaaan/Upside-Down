import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

/*
 * ===========================================
 * BUTTON COMPONENT
 * ===========================================
 * Primary action element. Mirrors Hawkins Button.
 * 
 * Variants:
 * - primary: Main action (red, high contrast)
 * - secondary: Supporting action (gray outline)
 * - ghost: Low emphasis (transparent)
 * - danger: Destructive action
 * 
 * Sizes: sm, md, lg
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
      secondary: 'border border-border bg-surface-primary text-content-primary hover:bg-surface-secondary active:bg-surface-tertiary',
      ghost: 'text-content-primary hover:bg-surface-secondary active:bg-surface-tertiary',
      danger: 'bg-error text-white hover:bg-error-dark active:bg-red-800',
    }
    
    const sizes = {
      sm: 'h-8 px-3 text-body-2 gap-1.5',
      md: 'h-10 px-4 text-body-1 gap-2',
      lg: 'h-12 px-6 text-body-1 gap-2',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
