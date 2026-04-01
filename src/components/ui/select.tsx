'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import { ChevronDown, X } from 'lucide-react'

/*
 * ===========================================
 * SELECT COMPONENT
 * ===========================================
 * Hawkins-style form dropdown select.
 *
 * TOKENS USED (from Hawkins design system):
 * - dropdown--surface: bg-surface-flat (white in light, dark surface in dark)
 * - dropdown--border: border-border-dim (gray/white 20%)
 * - dropdown--foreground-filled: text-foreground (90% opacity)
 * - dropdown--foreground-empty: text-foreground-subtle (70% opacity)
 * - border-system-focus: indigo (#4061e7) - 2px focus ring
 * - border-radius-4: 4px rounded corners
 * - Font: text-body-0-regular (13px)
 *
 * Sizes:
 * - standard: 40px height
 * - compact: 32px height
 *
 * Validation states:
 * - undefined: default border
 * - success: green border
 * - warning: yellow border
 * - error: red border
 */

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'> {
  /** Label displayed above the select */
  label?: string
  /** Whether the field is required (shows * after label) */
  required?: boolean
  /** Description text below the label */
  description?: string
  /** Validation status */
  validationStatus?: 'undefined' | 'success' | 'warning' | 'error'
  /** Error/validation message */
  validationMessage?: string
  /** Available options */
  options: SelectOption[]
  /** Placeholder text when no value selected */
  placeholder?: string
  /** Current value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
  /** Whether the selection can be cleared */
  clearable?: boolean
  /** Clear handler */
  onClear?: () => void
  /** Size variant */
  size?: 'standard' | 'compact'
  /** Borderless style for inline/list usage */
  borderless?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    label,
    required,
    description,
    validationStatus = 'undefined',
    validationMessage,
    options,
    placeholder,
    value,
    onChange,
    onClear,
    clearable = false,
    size = 'standard',
    borderless = false,
    disabled,
    id,
    ...props
  }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, '-')
    const hasValue = value !== undefined && value !== ''
    const showClear = clearable && hasValue && !disabled

    const sizeClasses = {
      standard: 'h-10',
      compact: 'h-8',
    }

    const validationBorderClasses = {
      undefined: 'border-border-dim',
      success: 'border-border-system-success',
      warning: 'border-border-system-warning',
      error: 'border-border-system-error',
    }

    const validationMessageClasses = {
      undefined: 'text-foreground-dim',
      success: 'text-foreground-system-success',
      warning: 'text-foreground-system-warning',
      error: 'text-foreground-system-error',
    }

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onClear?.()
      onChange?.('')
    }

    return (
      <div className={cn('w-full', className)}>
        {/* Label */}
        {label && (
          <div className="flex items-center gap-1 mb-1">
            <label
              htmlFor={selectId}
              className="text-body-0-bold text-foreground"
            >
              {label}
            </label>
            {required && (
              <span className="text-body-0-regular text-foreground-system-error">*</span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-label-1-regular text-foreground-subtle mb-1">
            {description}
          </p>
        )}

        {/* Select field */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            value={value}
            disabled={disabled}
            className={cn(
              'w-full rounded appearance-none',
              size === 'compact' ? 'text-label-0-regular' : 'text-body-0-regular',
              borderless
                ? 'bg-transparent border-transparent hover:bg-surface-highlight'
                : 'bg-surface-flat dark:bg-white/[0.04] border',
              sizeClasses[size],
              'px-3',
              showClear ? 'pr-16' : 'pr-8',
              !borderless && validationBorderClasses[validationStatus],
              hasValue ? 'text-foreground' : 'text-foreground-subtle',
              'transition-colors',
              // Focus state - 2px indigo border
              'focus:outline-none focus:border-border-system-focus focus:ring-1 focus:ring-inset focus:ring-border-system-focus',
              // Disabled state
              disabled && 'opacity-40 cursor-not-allowed'
            )}
            onChange={(e) => onChange?.(e.target.value)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Clear button and divider */}
          {showClear && (
            <>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 h-full flex items-center">
                <div className="w-px h-full bg-border-dim" />
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-highlight transition-colors mr-1"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4 text-foreground-dim" />
              </button>
            </>
          )}

          {/* Caret icon */}
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-dim pointer-events-none" />
        </div>

        {/* Validation message */}
        {validationMessage && (
          <p className={cn(
            'mt-1 text-label-1-regular',
            validationMessageClasses[validationStatus]
          )}>
            {validationMessage}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
