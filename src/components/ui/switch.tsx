'use client'

import { cn } from '@/lib/utils'

/**
 * Toggle Component — Hawkins Design System
 *
 * iOS-style boolean toggle for on/off states.
 *
 * Tokens used:
 * - bg-indigo-500: Active track
 * - bg-surface-mid / dark:bg-white/[0.08]: Inactive track
 * - border-border-dim: Inactive border
 * - rounded-full: Pill shape
 */

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        checked
          ? 'bg-indigo-500'
          : 'bg-surface-mid dark:bg-white/[0.08] border border-border-dim',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}
