'use client'

import * as React from 'react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

/*
 * Dropdown - Button trigger with attached popover panel.
 * Use Modal for centered overlays with backdrop.
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
  /** Children rendered inside the popover (use Card.Body/Card.Footer) */
  children: React.ReactNode
  /** Additional className for the trigger button */
  triggerClassName?: string
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Show only icon in trigger */
  iconOnly?: boolean
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
        <Button
          variant="secondary"
          size={iconOnly ? 'icon' : size === 'compact' ? 'compact' : 'default'}
          icon={iconOnly ? undefined : icon}
          dropdown={!iconOnly}
          disabled={disabled}
          className={triggerClassName}
          aria-label={iconOnly ? label : undefined}
        >
          {iconOnly ? icon : label}
        </Button>
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
