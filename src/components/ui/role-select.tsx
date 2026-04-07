'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Dropdown } from './dropdown'

const ROLE_DESCRIPTIONS: Record<string, string> = {
  view: 'Open and download',
  comment: 'View + leave review notes',
  contribute: 'View + edit + comment',
  edit: 'Edit + share with others',
  manage: 'Full control',
}

export function RoleSelect({ value, options, onChange, size = 'compact' }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  size?: 'compact' | 'standard'
}) {
  const [open, setOpen] = useState(false)
  const selectedLabel = options.find(o => o.value === value)?.label ?? value
  return (
    <Dropdown
      label={selectedLabel}
      size={size}
      align="end"
      width="lg"
      open={open}
      onOpenChange={setOpen}
      triggerClassName={size === 'compact' ? 'text-label-0-regular' : 'text-body-0-regular'}
    >
      <div className="py-1">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => { onChange(option.value); setOpen(false) }}
            className={cn(
              'w-full text-left px-4 py-2 hover:bg-surface-3 transition-colors rounded',
              value === option.value && 'bg-surface-3',
            )}
          >
            <span className="text-body-0-regular text-foreground block">{option.label}</span>
            {ROLE_DESCRIPTIONS[option.value] && (
              <span className="text-label-0-regular text-foreground-dim block">{ROLE_DESCRIPTIONS[option.value]}</span>
            )}
          </button>
        ))}
      </div>
    </Dropdown>
  )
}
