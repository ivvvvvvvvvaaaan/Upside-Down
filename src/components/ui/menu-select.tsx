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
  /** Render in destructive (red) style */
  destructive?: boolean
}

export interface MenuSelectProps {
  value: string
  options: MenuSelectOption[]
  onChange: (value: string) => void
  size?: 'compact' | 'standard'
  align?: 'start' | 'center' | 'end'
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  className?: string
}

export function MenuSelect({
  value,
  options,
  onChange,
  size = 'compact',
  align = 'end',
  width = 'lg',
  disabled = false,
  className,
}: MenuSelectProps) {
  const [open, setOpen] = useState(false)
  const selectedLabel = options.find(o => o.value === value)?.label ?? value
  const hasDescriptions = options.some(o => o.description)

  if (disabled) {
    return (
      <span className={cn(
        'inline-flex items-center justify-between gap-1.5 rounded border border-border-dim bg-surface-highlight text-foreground-dim opacity-50',
        size === 'compact' ? 'h-8 px-3 text-label-0-regular min-w-28' : 'h-10 px-3 text-body-0-regular min-w-36',
        className,
      )}>
        <span className="truncate">{selectedLabel}</span>
        <svg className="size-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 12 12">
          <path d="M2 4.5L6 8.5L10 4.5H2Z" />
        </svg>
      </span>
    )
  }

  return (
    <Dropdown
      label={selectedLabel}
      size={size}
      align={align}
      width={width}
      open={open}
      onOpenChange={setOpen}
      triggerClassName={cn(
        size === 'compact' ? 'text-label-0-regular min-w-28' : 'text-body-0-regular min-w-36',
        className,
      )}
    >
      <div className="py-1">
        {options.map((option, i) => {
          const prevOption = i > 0 ? options[i - 1] : null
          const showSeparator = option.destructive && prevOption && !prevOption.destructive
          return (
            <div key={option.value}>
              {showSeparator && <div className="my-1 border-t border-border-dim" />}
              <button
                onClick={() => { onChange(option.value); setOpen(false) }}
                className={cn(
                  'w-full text-left px-3 transition-colors',
                  hasDescriptions ? 'py-2' : 'py-1.5',
                  'hover:bg-surface-3',
                  value === option.value && !option.destructive && 'bg-surface-3',
                )}
              >
                <span className={cn('text-body-0-regular block', option.destructive ? 'text-foreground-system-error' : 'text-foreground')}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-label-0-regular text-foreground-dim block">
                    {option.description}
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </Dropdown>
  )
}
