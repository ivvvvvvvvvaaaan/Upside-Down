'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, Users, Film, MapPin, Pencil, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'
import { Tag } from './tag'
import { ResponsivePanel } from './responsive-panel'
import { SmartCollectionFilterBuilder } from './smart-collection-filter-builder'
import type { SmartCollection, AssetFilter } from '@/lib/data'
import type { RelatedCollections } from '@/hooks/useSmartCollections'

interface SmartCollectionSidePanelProps {
  collection: SmartCollection
  open: boolean
  onClose: () => void
  onUpdate: (updates: { name?: string; filter?: AssetFilter }) => void
  onDelete?: () => void
  matchingCount?: number
  relationships?: RelatedCollections
}

const DIMENSION_CONFIG = {
  characters: { label: 'Characters', Icon: Users },
  scenes: { label: 'Scenes', Icon: Film },
  locations: { label: 'Locations', Icon: MapPin },
} as const

const FILTER_DISPLAY: Record<string, string> = {
  query: 'Name contains',
  types: 'Asset type',
  department: 'Department',
  typeTags: 'Type tag',
  isKeyArt: 'Key art only',
  isFinal: 'Finals only',
  aiHasCharacters: 'Has character tags',
  aiHasScene: 'Has scene tags',
  aiHasLocation: 'Has location tags',
  aiCharacters: 'Character',
  aiScene: 'Scene',
  aiLocation: 'Location',
  aiConfidenceBelow: 'AI confidence below',
}

function getFilterSummary(filter: AssetFilter): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = []
  if (filter.aiHasCharacters) items.push({ label: FILTER_DISPLAY.aiHasCharacters, value: 'Yes' })
  if (filter.aiHasScene) items.push({ label: FILTER_DISPLAY.aiHasScene, value: 'Yes' })
  if (filter.aiHasLocation) items.push({ label: FILTER_DISPLAY.aiHasLocation, value: 'Yes' })
  if (filter.aiCharacters?.length) items.push({ label: FILTER_DISPLAY.aiCharacters, value: filter.aiCharacters.join(', ') })
  if (filter.aiScene) items.push({ label: FILTER_DISPLAY.aiScene, value: filter.aiScene })
  if (filter.aiLocation) items.push({ label: FILTER_DISPLAY.aiLocation, value: filter.aiLocation })
  if (filter.types?.length) items.push({ label: FILTER_DISPLAY.types, value: filter.types.join(', ') })
  if (filter.department) items.push({ label: FILTER_DISPLAY.department, value: filter.department })
  if (filter.typeTags?.length) items.push({ label: FILTER_DISPLAY.typeTags, value: filter.typeTags.join(', ') })
  if (filter.query) items.push({ label: FILTER_DISPLAY.query, value: `"${filter.query}"` })
  if (filter.isKeyArt) items.push({ label: FILTER_DISPLAY.isKeyArt, value: 'Yes' })
  if (filter.isFinal) items.push({ label: FILTER_DISPLAY.isFinal, value: 'Yes' })
  if (filter.aiConfidenceBelow != null) items.push({ label: FILTER_DISPLAY.aiConfidenceBelow, value: String(filter.aiConfidenceBelow) })
  return items
}

function filtersEqual(a: AssetFilter, b: AssetFilter): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function SmartCollectionSidePanel({
  collection,
  open,
  onClose,
  onUpdate,
  onDelete,
  matchingCount,
  relationships,
}: SmartCollectionSidePanelProps) {
  const isRelationshipMode = !!relationships
  const [editing, setEditing] = useState(false)

  // Draft state for edit mode
  const [draftName, setDraftName] = useState(collection.name)
  const [draftFilter, setDraftFilter] = useState<AssetFilter>(collection.filter)

  const hasChanges = editing && (draftName !== collection.name || !filtersEqual(draftFilter, collection.filter))

  // Warn before browser/tab close with unsaved changes
  useEffect(() => {
    if (!hasChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasChanges])

  const confirmDiscard = useCallback(() => {
    if (!hasChanges) return true
    return window.confirm('You have unsaved changes. Discard them?')
  }, [hasChanges])

  const startEditing = () => {
    setDraftName(collection.name)
    setDraftFilter({ ...collection.filter })
    setEditing(true)
  }

  const handleSave = () => {
    const updates: { name?: string; filter?: AssetFilter } = {}
    if (draftName !== collection.name) updates.name = draftName
    if (!filtersEqual(draftFilter, collection.filter)) updates.filter = draftFilter
    if (Object.keys(updates).length > 0) onUpdate(updates)
    setEditing(false)
  }

  const handleCancel = () => {
    if (confirmDiscard()) {
      setEditing(false)
    }
  }

  const handleClose = () => {
    if (editing) {
      if (confirmDiscard()) {
        setEditing(false)
        onClose()
      }
    } else {
      onClose()
    }
  }

  const filterSummary = getFilterSummary(collection.filter)

  return (
    <ResponsivePanel open={open} onClose={handleClose}>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <LayoutGrid className="w-8 h-8 text-foreground flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-body-0-bold text-foreground truncate">
              {editing ? 'Edit Collection' : collection.name}
            </p>
            <p className="text-body-0-regular text-foreground-dim">
              {editing ? 'Smart Collection' : matchingCount !== undefined ? `${matchingCount} matching asset${matchingCount !== 1 ? 's' : ''}` : 'Smart Collection'}
            </p>
          </div>
        </div>
        <Button variant="icon" compact onClick={handleClose} className="flex-shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!editing && (
          <section className="space-y-1">
            <div className="flex justify-between text-body-0-regular">
              <span className="text-foreground-dim">Assets</span>
              <span className="text-foreground">{matchingCount ?? 0}</span>
            </div>
            <div className="flex justify-between text-body-0-regular">
              <span className="text-foreground-dim">Created</span>
              <span className="text-foreground">{collection.createdAt.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-body-0-regular">
              <span className="text-foreground-dim">Type</span>
              <span className="text-foreground">Smart Collection</span>
            </div>
          </section>
        )}

        {editing ? (
          <SmartCollectionFilterBuilder
            name={draftName}
            filter={draftFilter}
            onNameChange={setDraftName}
            onFilterChange={setDraftFilter}
          />
        ) : isRelationshipMode ? (
          <div className="space-y-4">
            {(Object.keys(DIMENSION_CONFIG) as (keyof RelatedCollections)[]).map(dimension => {
              const items = relationships[dimension]
              if (items.length === 0) return null
              const { label, Icon } = DIMENSION_CONFIG[dimension]
              return (
                <section key={dimension} className="space-y-2">
                  <h3 className="text-body-0-bold text-foreground-dim">{label}</h3>
                  <div className="space-y-2">
                    {items.map(item => (
                      <Link
                        key={item.id}
                        href={`/nextgen/smart-collections/${item.id}`}
                        className="flex items-center gap-2 text-body-0-regular text-foreground hover:text-foreground-system-link transition-colors"
                      >
                        <Icon className="w-4 h-4 text-foreground-dim flex-shrink-0" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
            {relationships.characters.length === 0 &&
              relationships.scenes.length === 0 &&
              relationships.locations.length === 0 && (
              <p className="text-body-0-regular text-foreground-dim">
                No related collections found
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <section>
              <h3 className="text-body-0-bold text-foreground-dim mb-3">
                Includes assets matching
              </h3>
              {filterSummary.length === 0 ? (
                <p className="text-body-0-regular text-foreground-dim">
                  No filters. Matches all assets.
                </p>
              ) : (
                <div className="space-y-2">
                  {filterSummary.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2 rounded bg-surface-2">
                      <span className="text-body-0-regular text-foreground-dim">{item.label}</span>
                      <Tag size="compact">{item.value}</Tag>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {!isRelationshipMode && (
              <Button
                variant="secondary"
                compact
                icon={<Pencil className="w-3.5 h-3.5" />}
                onClick={startEditing}
              >
                Edit filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {editing ? (
        <div className="p-4 border-t border-border flex items-center justify-end gap-2">
          <Button variant="secondary" compact onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" compact onClick={handleSave}>
            Save
          </Button>
        </div>
      ) : onDelete ? (
        <div className="p-4 border-t border-border">
          <Button
            variant="tertiary"
            className="w-full justify-start text-foreground-system-error hover:bg-surface-system-error-subtle"
            icon={<Trash2 />}
            onClick={onDelete}
          >
            Delete Collection
          </Button>
        </div>
      ) : null}
    </ResponsivePanel>
  )
}
