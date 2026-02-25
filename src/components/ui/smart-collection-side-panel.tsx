'use client'

import { X, Trash2 } from 'lucide-react'
import { Button } from './button'
import { SmartCollectionFilterBuilder } from './smart-collection-filter-builder'
import type { SmartCollection, AssetFilter } from '@/lib/data'

interface SmartCollectionSidePanelProps {
  collection: SmartCollection
  open: boolean
  onClose: () => void
  onUpdate: (updates: { name?: string; filter?: AssetFilter }) => void
  onDelete?: () => void
  matchingCount?: number
}

/**
 * Smart Collection Side Panel
 *
 * Right-side panel for editing smart collection filters.
 */
export function SmartCollectionSidePanel({
  collection,
  open,
  onClose,
  onUpdate,
  onDelete,
  matchingCount,
}: SmartCollectionSidePanelProps) {
  if (!open) return null

  return (
    <div className="w-[360px] flex-shrink-0 border-l border-border bg-surface-1 flex flex-col h-full">
      {/* Header with matching count */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <span className="text-body-1-bold text-foreground">Smart Collection</span>
          {matchingCount !== undefined && (
            <p className="text-label-1-regular text-foreground-dim">
              {matchingCount} matching asset{matchingCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button variant="icon" compact onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <SmartCollectionFilterBuilder
          name={collection.name}
          filter={collection.filter}
          onNameChange={(name) => onUpdate({ name })}
          onFilterChange={(filter) => onUpdate({ filter })}
        />
      </div>

      {/* Footer with delete */}
      {onDelete && (
        <div className="p-4 border-t border-border">
          <Button
            variant="tertiary"
            className="w-full justify-start text-foreground-system-error hover:bg-surface-system-error-subtle"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={onDelete}
          >
            Delete Collection
          </Button>
        </div>
      )}
    </div>
  )
}
