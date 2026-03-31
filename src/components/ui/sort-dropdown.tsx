'use client'

import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { Dropdown } from './dropdown'
import { SortContent } from './sort-content'
import type { SortField, SortCriterion } from './sort-content'

/*
 * SortDropdown - Sort button with dropdown panel
 */

export type { SortField, SortCriterion }

export interface SortDropdownProps {
  /** Available fields to sort by */
  fields: SortField[]
  /** Current sort criteria */
  value: SortCriterion[]
  /** Callback when sort criteria change */
  onChange: (criteria: SortCriterion[]) => void
  /** Trigger label */
  label?: string
  /** Show only icon in trigger */
  iconOnly?: boolean
}

export function SortDropdown({
  fields,
  value,
  onChange,
  label = 'Sort',
  iconOnly = false,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleApply = (criteria: SortCriterion[]) => {
    onChange(criteria)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  return (
    <Dropdown
      label={label}
      icon={<ArrowUpDown />}
      size="standard"
      align="end"
      width="xl"
      open={isOpen}
      onOpenChange={setIsOpen}
      iconOnly={iconOnly}
    >
      <SortContent
        fields={fields}
        value={value}
        onApply={handleApply}
        onCancel={handleCancel}
      />
    </Dropdown>
  )
}
