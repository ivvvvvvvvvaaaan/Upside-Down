'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

/*
 * ===========================================
 * DROPDOWN COMPONENT
 * ===========================================
 * Hawkins-style dropdown with trigger button and popover content.
 *
 * TOKENS USED (from Hawkins design system):
 * - dropdown--surface: bg-surface-flat (light) / bg-surface-highlight (dark)
 * - dropdown--border: 1px border-border-dim (gray/white 20%)
 * - dropdown--foreground-filled: text-foreground (90% opacity)
 * - dropdown--foreground-empty: text-foreground-subtle (70% opacity)
 * - border-system-focus: indigo (#4061e7) - 2px focus ring
 * - border-radius-4: 4px rounded corners
 * - Font: text-body-0-regular (13px)
 *
 * Sizes:
 * - standard: 40px height (py-2.5 with 13px text)
 * - compact: 32px height (py-1.5 with 13px text)
 */

export interface DropdownProps {
  /** Text label for the dropdown trigger */
  label: string
  /** Optional icon to show before the label */
  icon?: React.ReactNode
  /** Size variant */
  size?: 'standard' | 'compact'
  /** Popover alignment */
  align?: 'start' | 'center' | 'end'
  /** Width of the popover content */
  width?: 'auto' | 'sm' | 'md' | 'lg'
  /** Disabled state */
  disabled?: boolean
  /** Children rendered inside the popover */
  children: React.ReactNode
  /** Additional className for the trigger button */
  triggerClassName?: string
  /** Additional className for the popover content */
  contentClassName?: string
}

export function Dropdown({
  label,
  icon,
  size = 'compact',
  align = 'end',
  width = 'md',
  disabled = false,
  children,
  triggerClassName,
  contentClassName,
}: DropdownProps) {
  const widthClasses = {
    auto: 'w-auto',
    sm: 'w-48',
    md: 'w-56',
    lg: 'w-72',
  }

  const sizeClasses = {
    standard: 'h-10 px-3',
    compact: 'h-8 px-3',
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'flex items-center justify-between gap-2 rounded',
            sizeClasses[size],
            'bg-surface-flat border border-border-dim',
            'text-body-0-regular text-foreground',
            'transition-colors',
            // Hover state
            !disabled && 'hover:bg-surface-2',
            // Focus state - 1px border + 1px inset ring = 2px indigo
            'focus:outline-none focus:border-border-system-focus focus:ring-1 focus:ring-inset focus:ring-border-system-focus',
            // Open state - maintain focus style
            'data-[state=open]:border-border-system-focus data-[state=open]:ring-1 data-[state=open]:ring-inset data-[state=open]:ring-border-system-focus',
            // Disabled state
            disabled && 'opacity-40 cursor-not-allowed',
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2">
            {icon}
            {label}
          </span>
          <ChevronDown className={cn(
            'w-4 h-4 shrink-0',
            disabled ? 'text-foreground-dim' : 'text-foreground-dim'
          )} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(widthClasses[width], contentClassName)}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

/*
 * Dropdown Section - groups related options with a label
 */
export interface DropdownSectionProps {
  /** Section label */
  label: string
  children: React.ReactNode
  className?: string
}

export function DropdownSection({ label, children, className }: DropdownSectionProps) {
  return (
    <div className={className}>
      <div className="text-label-0-bold text-foreground-dim uppercase mb-2">
        {label}
      </div>
      {children}
    </div>
  )
}

/*
 * Dropdown Option Group - horizontal group of toggle options
 */
export interface DropdownOptionGroupProps {
  children: React.ReactNode
  className?: string
}

export function DropdownOptionGroup({ children, className }: DropdownOptionGroupProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      {children}
    </div>
  )
}

/*
 * Dropdown Option - single selectable option button
 */
export interface DropdownOptionProps {
  /** Whether this option is selected */
  selected?: boolean
  /** Click handler */
  onClick?: () => void
  /** Optional icon */
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DropdownOption({
  selected,
  onClick,
  icon,
  children,
  className
}: DropdownOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-body-0-regular',
        selected
          ? 'bg-surface-selected-subtle text-foreground'
          : 'text-foreground-dim hover:bg-surface-highlight hover:text-foreground',
        className
      )}
    >
      {icon}
      {children}
    </button>
  )
}
