import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

/**
 * Input Component
 * 
 * Text input field with label, helper text, error states, and optional icon.
 * 
 * PROPS:
 * - label: Label text displayed above input
 * - error: Error message (replaces helperText when present)
 * - helperText: Helper text displayed below input
 * - icon: Icon element to display inside input
 * - iconPosition: Position of icon ('left' | 'right')
 * 
 * DIFFERENCES FROM PRODUCTION HAWKINS:
 * - Production uses InputAdornment components for icons (composition pattern)
 * - Production tracks isFocused and isHovered states
 * - Production includes character count with maxLength integration
 * - Production includes clear button for text inputs
 * - This uses simplified icon prop for convenience
 * 
 * @example
 * <Input label="Email" placeholder="Enter email" />
 * <Input icon={<SearchIcon />} iconPosition="left" placeholder="Search..." />
 * <Input label="Password" error="Password is required" />
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label?: string
  /** Error message (overrides helperText) */
  error?: string
  /** Helper text */
  helperText?: string
  /** Icon element */
  icon?: React.ReactNode
  /** Icon position */
  iconPosition?: 'left' | 'right'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, iconPosition = 'left', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-body-2 font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-dim [&_svg]:size-4">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 rounded-md text-body-1',
              'bg-surface-0 border border-border',
              'text-foreground placeholder:text-foreground-subtle',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-error focus:ring-error',
              icon && iconPosition === 'left' ? 'pl-10 pr-3' : icon && iconPosition === 'right' ? 'pl-3 pr-10' : 'px-3',
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-dim [&_svg]:size-4">
              {icon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={cn(
            'mt-1.5 text-caption',
            error ? 'text-error' : 'text-foreground-dim'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
