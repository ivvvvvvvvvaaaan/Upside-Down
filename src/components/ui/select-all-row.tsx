'use client'

import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectAllRowProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  label: string
}

export function SelectAllRow({ selectedCount, totalCount, onSelectAll, onClearSelection, label }: SelectAllRowProps) {
  const hasSelection = selectedCount > 0
  const allSelected = hasSelection && selectedCount >= totalCount

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={hasSelection ? onClearSelection : onSelectAll}
        className={cn(
          'w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer',
          hasSelection
            ? 'bg-indigo-500 text-white'
            : 'bg-transparent border border-white/40',
        )}
        aria-label={hasSelection ? 'Clear selection' : 'Select all'}
      >
        {allSelected ? (
          <Check className="w-3 h-3" strokeWidth={3} />
        ) : hasSelection ? (
          <Minus className="w-3 h-3" strokeWidth={3} />
        ) : null}
      </button>
      <span className="text-body-0-regular text-foreground-subtle">
        {hasSelection ? `${selectedCount} selected` : label}
      </span>
    </div>
  )
}
