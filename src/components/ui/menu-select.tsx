'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Dropdown } from './dropdown'

/**
 * MenuSelect — a dropdown that renders a list of options in a popover.
 *
 * Supports two modes:
 * - Single line: just a label per option
 * - With subtitle: label + description per option
 *
 * Two sizes:
 * - compact: 10px trigger text, tight padding (inline in lists/rows)
 * - standard: 13px trigger text, normal padding (form fields)
 *
 * Usage:
 *   <MenuSelect
 *     value="view"
 *     options={[
 *       { value: 'view', label: 'Can view' },
 *       { value: 'edit', label: 'Can edit', description: 'Edit + share with others' },
 *     ]}
 *     onChange={setValue}
 *   />
 */

export interface MenuSelectOption {
  value: string
  label: string
  description?: string
}

export interface MenuSelectProps {
  value: string
  options: MenuSelectOption[]
  onChange: (value: string) => void
  size?: 'compact' | 'standard'
  align?: 'start' | 'center' | 'end'
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function MenuSelect({
  value,
  options,
  onChange,
  size = 'compact',
  align = 'end',
  width = 'lg',
  className,
}: MenuSelectProps) {
  const [open, setOpen] = useState(false)
  const selectedLabel = options.find(o => o.value === value)?.label ?? value
  const hasDescriptions = options.some(o => o.description)

  return (
    <Dropdown
      label={selectedLabel}
      size={size}
      align={align}
      width={width}
      open={open}
      onOpenChange={setOpen}
      triggerClassName={cn(
        size === 'compact' ? 'text-label-0-regular' : 'text-body-0-regular',
        className,
      )}
    >
      <div className="py-1">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => { onChange(option.value); setOpen(false) }}
            className={cn(
              'w-full text-left px-3 transition-colors rounded',
              hasDescriptions ? 'py-2' : 'py-1.5',
              'hover:bg-surface-3',
              value === option.value && 'bg-surface-3',
            )}
          >
            <span className="text-body-0-regular text-foreground block">
              {option.label}
            </span>
            {option.description && (
              <span className="text-label-0-regular text-foreground-dim block">
                {option.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </Dropdown>
  )
}
