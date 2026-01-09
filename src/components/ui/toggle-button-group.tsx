'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export interface ToggleButtonOption<T extends string = string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface ToggleButtonGroupProps<T extends string = string> {
  options: ToggleButtonOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Compact size for smaller UI contexts */
  compact?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Toggle Button Group - Hawkins Design System
 *
 * Figma: https://www.figma.com/design/8FNmhzKUqlr6MEo7pJINCd/?node-id=12-5626
 *
 * Design tokens used:
 * - Container bg: surface-highlight-rgb at 4%
 * - Container border: surface-highlight-rgb at 20%
 * - Selected: indigo-500 at 40%
 * - Text: foreground (90% in dark)
 * - Typography: label-1-bold (12px/18px semibold)
 */
export function ToggleButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  compact = false,
  className,
}: ToggleButtonGroupProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex rounded p-1 gap-1',
        // Container: surface-highlight at 4% bg, 20% border
        'bg-[rgb(var(--surface-highlight-rgb)/0.04)]',
        'border border-[rgb(var(--surface-highlight-rgb)/0.2)]',
        className
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              // Base styles
              'inline-flex items-center justify-center rounded transition-colors',
              // Typography: label-1-bold equivalent (12px semibold)
              'text-label-1-bold',
              // Text color: foreground
              'text-foreground',
              // Size: compact=32px height, normal=40px height
              // Figma: compact total 40px, normal total 48px (with 4px container padding)
              compact ? 'h-8 px-4' : 'h-10 px-4',
              // Selected: indigo-500 at 40% opacity
              isSelected
                ? 'bg-[rgb(var(--indigo-500)/0.4)]'
                : 'bg-transparent hover:bg-[rgb(var(--surface-highlight-rgb)/0.04)]'
            )}
          >
            {option.icon && (
              <span className={cn('flex-shrink-0', option.label ? 'mr-2' : '')}>
                {option.icon}
              </span>
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
