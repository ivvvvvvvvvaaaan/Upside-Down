'use client'

import * as React from 'react'
import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

/*
 * ===========================================
 * FORM SELECT COMPONENT
 * ===========================================
 * Hawkins-style custom select dropdown.
 * Uses Popover for fully styled dropdown options.
 *
 * TOKENS USED (from Hawkins design system):
 * - dropdown--surface: bg-surface-flat
 * - dropdown--border: border-border-dim (20%)
 * - dropdown--foreground-filled: text-foreground (90%)
 * - dropdown--foreground-empty: text-foreground-subtle (70%)
 * - border-system-focus: indigo (#4061e7) - 2px focus ring
 * - border-radius-4: 4px rounded corners
 * - Font: text-body-0-regular (13px)
 *
 * Sizes:
 * - standard: 40px height
 * - compact: 32px height
 */

export interface FormSelectOption {
  value: string
  label: string
}

export interface FormSelectProps {
  /** Available options */
  options: FormSelectOption[]
  /** Current value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
  /** Placeholder text when no value selected */
  placeholder?: string
  /** Size variant */
  size?: 'standard' | 'compact'
  /** Disabled state */
  disabled?: boolean
  /** Additional className */
  className?: string
}

export function FormSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  size = 'standard',
  disabled = false,
  className,
}: FormSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedOption = options.find(opt => opt.value === value)
  const displayLabel = selectedOption?.label || placeholder
  const hasValue = !!selectedOption

  const sizeClasses = {
    standard: 'h-10',
    compact: 'h-8',
  }

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center justify-between gap-3 rounded w-full',
            sizeClasses[size],
            'px-3',
            'bg-surface-flat dark:bg-white/[0.04] border border-border-dim',
            'text-body-0-regular',
            hasValue ? 'text-foreground' : 'text-foreground-subtle',
            'transition-colors',
            // Hover state
            !disabled && 'hover:bg-surface-highlight',
            // Focus state - 2px indigo border
            'focus:outline-none focus:border-border-system-focus focus:ring-1 focus:ring-inset focus:ring-border-system-focus',
            // Open state
            'data-[state=open]:border-border-system-focus data-[state=open]:ring-1 data-[state=open]:ring-inset data-[state=open]:ring-border-system-focus',
            // Disabled state
            disabled && 'opacity-40 cursor-not-allowed',
            className
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown className="w-4 h-4 shrink-0 text-foreground-dim" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-1 min-w-[var(--radix-popover-trigger-width)]"
      >
        <div className="flex flex-col">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                'flex items-center justify-between gap-2 px-3 py-2 rounded',
                'text-body-0-regular text-foreground',
                'transition-colors',
                'hover:bg-surface-highlight',
                option.value === value && 'bg-surface-selected-subtle'
              )}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && (
                <Check className="w-4 h-4 shrink-0 text-foreground" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
