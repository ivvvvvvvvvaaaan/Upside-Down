'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
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
  /** Render a divider above this option */
  separated?: boolean
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
  const triggerClasses = cn(
    size === 'compact' ? 'text-label-0-regular min-w-28' : 'text-body-0-regular min-w-36',
    className,
  )

  if (disabled) {
    return (
      <span className={cn(
        'inline-flex items-center justify-between gap-1.5 rounded bg-surface-flat dark:bg-white/[0.04] ring-1 ring-inset ring-border-dim text-foreground-dim opacity-50',
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
      triggerClassName={triggerClasses}
    >
      <div className="py-1">
        {options.map((option, i) => {
          const prevOption = i > 0 ? options[i - 1] : null
          const showSeparator = option.separated || (option.destructive && prevOption && !prevOption.destructive)
          const isSelected = value === option.value && !option.destructive
          return (
            <div key={option.value}>
              {showSeparator && <div className="my-1 border-t border-border-dim" />}
              <button
                onClick={() => { onChange(option.value); setOpen(false) }}
                className={cn(
                  'flex w-full items-start gap-2 px-3 py-2.5 text-left text-body-0-regular transition-colors',
                  'hover:bg-surface-highlight',
                  isSelected && 'bg-surface-highlight',
                )}
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                  {isSelected ? <Check className="h-4 w-4 text-foreground" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <span className={cn('block', option.destructive ? 'text-foreground-system-error' : 'text-foreground')}>
                    {option.label}
                  </span>
                  {hasDescriptions && option.description && (
                    <span className="text-label-0-regular text-foreground-dim block">
                      {option.description}
                    </span>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </Dropdown>
  )
}
