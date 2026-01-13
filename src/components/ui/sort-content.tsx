'use client'

import { useState, useEffect } from 'react'
import { ArrowDownAZ, ArrowUpAZ, X, Plus } from 'lucide-react'
import { Button } from './button'
import { Card } from './card'
import { FormSelect } from './form-select'
import { ToggleButtonGroup } from './toggle-button-group'

/*
 * SortContent - Sort criteria UI with field selection and direction toggles
 */

export interface SortField {
  value: string
  label: string
}

export interface SortCriterion {
  field: string
  direction: 'asc' | 'desc'
}

export interface SortContentProps {
  /** Available fields to sort by */
  fields: SortField[]
  /** Current sort criteria */
  value: SortCriterion[]
  /** Callback when sort is applied */
  onApply: (criteria: SortCriterion[]) => void
  /** Callback when cancel is clicked */
  onCancel: () => void
}

export function SortContent({
  fields,
  value,
  onApply,
  onCancel,
}: SortContentProps) {
  const [localCriteria, setLocalCriteria] = useState<SortCriterion[]>(
    value.length > 0 ? value : [{ field: fields[0]?.value || '', direction: 'asc' }]
  )

  useEffect(() => {
    setLocalCriteria(
      value.length > 0 ? value : [{ field: fields[0]?.value || '', direction: 'asc' }]
    )
  }, [value, fields])

  const handleFieldChange = (index: number, field: string) => {
    const updated = [...localCriteria]
    updated[index] = { ...updated[index], field }
    setLocalCriteria(updated)
  }

  const handleDirectionChange = (index: number, direction: 'asc' | 'desc') => {
    const updated = [...localCriteria]
    updated[index] = { ...updated[index], direction }
    setLocalCriteria(updated)
  }

  const handleRemove = (index: number) => {
    if (localCriteria.length > 1) {
      setLocalCriteria(localCriteria.filter((_, i) => i !== index))
    }
  }

  const handleAdd = () => {
    const usedFields = new Set(localCriteria.map(c => c.field))
    const availableField = fields.find(f => !usedFields.has(f.value))
    if (availableField) {
      setLocalCriteria([...localCriteria, { field: availableField.value, direction: 'asc' }])
    }
  }

  const canAdd = localCriteria.length < fields.length

  return (
    <>
      <Card.Body>
        <div className="flex flex-col gap-6">
          <p className="text-label-1-bold text-foreground">
            Sort by the following criteria
          </p>

          <div className="flex flex-col gap-3">
            {localCriteria.map((criterion, index) => (
              <div key={index} className="flex items-center gap-1">
                <Button
                  variant="icon"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  disabled={localCriteria.length <= 1}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>

                <FormSelect
                  options={fields}
                  value={criterion.field}
                  onChange={(val) => handleFieldChange(index, val)}
                  size="standard"
                  className="flex-1"
                />

                <ToggleButtonGroup
                  options={[
                    { value: 'desc' as const, label: 'Descending', icon: <ArrowDownAZ className="w-4 h-4" /> },
                    { value: 'asc' as const, label: 'Ascending', icon: <ArrowUpAZ className="w-4 h-4" /> },
                  ]}
                  value={criterion.direction}
                  onChange={(dir) => handleDirectionChange(index, dir)}
                  compact
                  iconOnly
                />
              </div>
            ))}

            {canAdd && (
              <div className="pl-7">
                <Button variant="secondary" onClick={handleAdd} icon={<Plus className="w-4 h-4" />}>
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card.Body>

      <Card.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => onApply(localCriteria)}>
          Apply
        </Button>
      </Card.Footer>
    </>
  )
}
