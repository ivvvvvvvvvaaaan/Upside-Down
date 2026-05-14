'use client'

import { MenuSelect } from './menu-select'
import type { MenuSelectOption } from './menu-select'

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  manager: 'Can take all actions and grant access to others',
  editor: 'Can take all actions',
  downloader: 'Can preview, download, comment, and create Share links',
  uploader: 'Can view and upload content',
  viewer: 'Can preview content',
}

export function RoleSelect({ value, options, onChange, size = 'compact', disabled, footer, triggerLabel }: {
  value: string
  options: MenuSelectOption[]
  onChange: (value: string) => void
  size?: 'compact' | 'standard'
  disabled?: boolean
  footer?: React.ReactNode
  triggerLabel?: string
}) {
  const enrichedOptions: MenuSelectOption[] = options.map(o => ({
    ...o,
    description: o.description ?? ROLE_DESCRIPTIONS[o.value],
  }))

  return (
    <MenuSelect
      value={value}
      options={enrichedOptions}
      onChange={onChange}
      size={size}
      disabled={disabled}
      footer={footer}
      triggerLabel={triggerLabel}
    />
  )
}
