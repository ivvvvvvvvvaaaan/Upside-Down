'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export interface ToggleButtonOption<T extends string = string> {
  value: T
  /** Label text - optional for icon-only buttons */
  label?: string
  /** Icon - required for icon-only mode */
  icon?: ReactNode
}

export interface ToggleButtonGroupProps<T extends string = string> {
  options: ToggleButtonOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Compact size for smaller UI contexts */
  compact?: boolean
  /** Icon-only mode - hides labels, shows only icons */
  iconOnly?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Toggle Button Group - Hawkins Design System
 *
 * Figma: https://www.figma.com/design/8FNmhzKUqlr6MEo7pJINCd/?node-id=12-5626
 *
 * Design tokens used:
 * - Container bg: surface-mid in light, white/8% in dark
 * - Container border: border-dim (20% opacity)
 * - Selected: indigo-500 solid
 * - Text: white (selected), foreground (unselected)
 * - Typography: label-1-bold (12px/18px semibold)
 *
 * Sizes:
 * - standard: h-9 (36px) buttons, 44px container total
 * - compact: font 12/18, button py-0 px-2 gap-1, container p-1 gap-2
 */
export function ToggleButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  compact = false,
  iconOnly = false,
  className,
}: ToggleButtonGroupProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded',
        // Container height, padding and gap
        compact ? 'h-10 px-1 gap-2' : 'h-11 p-1 gap-1',
        'bg-surface-mid dark:bg-white/[0.08]',
        'border border-border-dim',
        className
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = option.value === value
        const showLabel = !iconOnly && option.label

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center rounded transition-colors',
              // Typography
              compact ? 'text-label-1-bold' : 'text-label-1-bold',
              // Size classes
              compact
                ? iconOnly ? 'size-8' : 'h-8 px-2 gap-1'
                : iconOnly ? 'size-9' : 'h-9 px-4 gap-1',
              // Color classes
              isSelected
                ? 'bg-indigo-500 text-white'
                : 'text-foreground bg-transparent hover:bg-white/[0.08] dark:hover:bg-white/[0.04]'
            )}
          >
            {option.icon && (
              <span className="flex-shrink-0">
                {option.icon}
              </span>
            )}
            {showLabel && option.label}
          </button>
        )
      })}
    </div>
  )
}
