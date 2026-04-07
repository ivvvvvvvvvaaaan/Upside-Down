'use client'

import * as React from 'react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

/*
 * Dropdown — two trigger modes:
 * - iconOnly: uses Button (for toolbar icon buttons that open menus)
 * - default: uses a lightweight select-style trigger (for form controls)
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
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl'
  /** Disabled state */
  disabled?: boolean
  /** Children rendered inside the popover */
  children: React.ReactNode
  /** Additional className for the trigger */
  triggerClassName?: string
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Show only icon in trigger (uses Button) */
  iconOnly?: boolean
}

const TRIANGLE = (
  <svg className="size-2 flex-shrink-0" fill="currentColor" viewBox="0 0 12 12">
    <path d="M2 4.5L6 8.5L10 4.5H2Z" />
  </svg>
)

export function Dropdown({
  label,
  icon,
  size = 'compact',
  align = 'end',
  width = 'md',
  disabled = false,
  children,
  triggerClassName,
  open,
  onOpenChange,
  iconOnly = false,
}: DropdownProps) {
  const widthClasses = {
    auto: 'w-auto',
    sm: 'w-48',
    md: 'w-56',
    lg: 'w-72',
    xl: 'w-96',
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {iconOnly ? (
          <Button
            variant="icon"
            size="icon"
            disabled={disabled}
            className={triggerClassName}
            aria-label={label}
          >
            {icon}
          </Button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1.5 rounded border border-border-dim',
              'bg-transparent hover:border-border-subtle transition-colors',
              'text-foreground disabled:opacity-50',
              size === 'compact' ? 'h-8 px-2 text-label-0-regular' : 'h-10 px-3 text-body-0-regular',
              triggerClassName,
            )}
          >
            {icon}
            <span className="truncate">{label}</span>
            {TRIANGLE}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(widthClasses[width], 'p-0')}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
