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
  /** Compact sizing for icon-only triggers */
  compact?: boolean
  /** Ghost trigger: no border, no background, no chevron */
  ghost?: boolean
}

const TRIANGLE = (
  <svg className="size-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 12 12">
    <path d="M2 4.5L6 8.5L10 4.5H2Z" />
  </svg>
)

export interface DropdownMenuItemProps {
  icon?: React.ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
}

export function DropdownMenuItem({ icon, label, onClick, destructive }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2.5 text-body-0-regular hover:bg-surface-highlight transition-colors text-left',
        destructive ? 'text-foreground-system-error' : 'text-foreground',
      )}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  )
}

export function DropdownMenuDivider() {
  return <div className="my-1 border-t border-border-dim" />
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
  open,
  onOpenChange,
  iconOnly = false,
  compact = false,
  ghost = false,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open ?? internalOpen
  const handleOpenChange = (next: boolean) => {
    setInternalOpen(next)
    onOpenChange?.(next)
  }

  const widthClasses = {
    auto: 'w-auto',
    sm: 'w-48',
    md: 'w-56',
    lg: 'w-72',
    xl: 'w-96',
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {iconOnly ? (
          <Button
            variant="icon"
            compact={compact}
            disabled={disabled}
            className={cn(isOpen && 'bg-surface-3', triggerClassName)}
            aria-label={label}
          >
            {icon}
          </Button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'inline-flex items-center justify-between gap-1.5 rounded transition-colors',
              'text-foreground disabled:opacity-50',
              ghost
                ? 'bg-transparent'
                : (
                  isOpen
                    ? 'bg-surface-flat dark:bg-white/[0.04] ring-2 ring-inset ring-border-system-focus'
                    : 'bg-surface-flat dark:bg-white/[0.04] ring-1 ring-inset ring-border-dim'
                ),
              ghost
                ? (size === 'compact' ? 'h-8 px-3 text-label-1-bold' : 'h-10 px-3 text-body-1-bold')
                : (size === 'compact' ? 'h-8 px-3 text-label-0-regular' : 'h-10 px-3 text-body-0-regular'),
              triggerClassName,
            )}
          >
            {icon}
            <span className="truncate">{label}</span>
            {!ghost && TRIANGLE}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(widthClasses[width], 'bg-surface-mid p-0')}
        onClick={() => handleOpenChange(false)}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
