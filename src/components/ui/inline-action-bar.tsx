'use client'

import { MoreVertical } from 'lucide-react'
import { Button } from './button'
import { Dropdown, DropdownMenuItem, DropdownMenuDivider } from './dropdown'

export interface ActionMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
  dividerAfter?: boolean
}

interface InlineActionBarProps {
  /** Menu items — first `maxInline` shown as buttons, rest in overflow three-dot */
  items: ActionMenuItem[]
  /** Max items to show inline as buttons (default 3) */
  maxInline?: number
  className?: string
}

export function InlineActionBar({ items, maxInline = 3, className }: InlineActionBarProps) {
  if (items.length === 0) return null

  const inlineItems = items.slice(0, maxInline)
  const overflowItems = items.slice(maxInline)

  return (
    <div className={className ?? 'flex items-center gap-2 flex-shrink-0'}>
      {inlineItems.map((item, i) => (
        <Button key={i} variant="secondary" compact icon={item.icon} onClick={item.onClick}>
          <span className="hidden lg:inline">{item.label}</span>
        </Button>
      ))}
      {overflowItems.length > 0 && (
        <Dropdown label="More" icon={<MoreVertical className="w-4 h-4" />} iconOnly compact align="end" width="sm">
          <div className="py-1">
            {overflowItems.map((item, i) => (
              <div key={i}>
                <DropdownMenuItem icon={item.icon} label={item.label} onClick={item.onClick} destructive={item.destructive} />
                {item.dividerAfter && <DropdownMenuDivider />}
              </div>
            ))}
          </div>
        </Dropdown>
      )}
    </div>
  )
}
