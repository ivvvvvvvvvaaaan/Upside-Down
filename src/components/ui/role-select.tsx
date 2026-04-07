'use client'

import { MenuSelect } from './menu-select'
import type { MenuSelectOption } from './menu-select'

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
  const enrichedOptions: MenuSelectOption[] = options.map(o => ({
    ...o,
    description: ROLE_DESCRIPTIONS[o.value],
  }))

  return (
    <MenuSelect
      value={value}
      options={enrichedOptions}
      onChange={onChange}
      size={size}
    />
  )
}
