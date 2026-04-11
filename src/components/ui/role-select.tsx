'use client'

import { MenuSelect } from './menu-select'
import type { MenuSelectOption } from './menu-select'

const ROLE_DESCRIPTIONS: Record<string, string> = {
  viewer: 'Open and preview content',
  editor: 'Edit, reshare, and download',
  manager: 'Full control — manage people and permissions',
}

export function RoleSelect({ value, options, onChange, size = 'compact', disabled }: {
  value: string
  options: MenuSelectOption[]
  onChange: (value: string) => void
  size?: 'compact' | 'standard'
  disabled?: boolean
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
    />
  )
}
