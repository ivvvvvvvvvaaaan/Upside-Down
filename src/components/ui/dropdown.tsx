'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
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
  disabled?: boolean
  /**
   * Renders a check mark for selected items and reserves the same slot for
   * unselected items so labels align across a menu. Use for radio-style menus
   * (group-by, episode filter, etc.) where every option indicates checked state.
   */
  selected?: boolean
}

export function DropdownMenuItem({ icon, label, onClick, destructive, disabled, selected }: DropdownMenuItemProps) {
  // When `selected` is explicitly set on any item, reserve the icon slot for
  // all items so their labels line up. The visible check appears only on the
  // selected one; unselected items render an invisible placeholder of the
  // same size.
  const reserveIconSlot = selected !== undefined || icon !== undefined
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2.5 text-body-0-regular hover:bg-surface-highlight transition-colors text-left',
        destructive ? 'text-foreground-system-error' : 'text-foreground',
        disabled && 'opacity-40 pointer-events-none',
      )}
    >
      {reserveIconSlot && (
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {selected ? <Check className="w-4 h-4" /> : icon}
        </span>
      )}
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
              'inline-flex items-center justify-between gap-1.5 rounded-md transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'text-foreground disabled:opacity-50',
              ghost
                ? cn(
                  'bg-transparent hover:bg-surface-highlight dark:hover:bg-white/10',
                  isOpen && 'bg-surface-highlight dark:bg-white/10',
                )
                : (
                  isOpen
                    ? 'bg-surface-highlight dark:bg-white/10 border border-border-system-focus ring-1 ring-inset ring-border-system-focus'
                    : 'bg-transparent border border-border-subtle dark:border-border-inverse-subtle hover:bg-surface-highlight dark:hover:bg-white/10'
                ),
              ghost
                ? (size === 'compact' ? 'h-8 px-3 text-label-1-regular' : 'h-10 px-3 text-body-1-bold')
                : (size === 'compact' ? 'h-8 px-3 text-label-1-regular' : 'h-10 px-3 text-body-0-regular'),
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
