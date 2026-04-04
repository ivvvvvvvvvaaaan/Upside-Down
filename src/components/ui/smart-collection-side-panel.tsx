'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, Pencil, LayoutGrid } from 'lucide-react'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { SmartCollectionFilterBuilder } from './smart-collection-filter-builder'
import { OntologySection } from './ontology-section'
import { Tag } from './tag'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import type { SmartCollection, SmartCollectionGroupBy, AssetFilter } from '@/lib/data'
import type { RelatedCollections } from '@/hooks/useSmartCollections'

interface SmartCollectionSidePanelProps {
  collection: SmartCollection
  open: boolean
  onClose: () => void
  onUpdate: (updates: { name?: string; filter?: AssetFilter }) => void
  onDelete?: () => void
  matchingCount?: number
  relationships?: RelatedCollections
  /** Which dimension to suppress in ontology (parent's groupBy) */
  suppressDimension?: SmartCollectionGroupBy
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
  suppressDimension,
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
              Smart Collection
            </p>
          </div>
        </div>
        <Button variant="icon" compact onClick={handleClose} className="flex-shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {editing ? (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <SmartCollectionFilterBuilder
              name={draftName}
              filter={draftFilter}
              onNameChange={setDraftName}
              onFilterChange={setDraftFilter}
            />
          </div>
          <div className="p-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        </>
      ) : (
        <Tabs defaultValue="details" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="px-4 shrink-0">
            <Tab value="details">Details</Tab>
            {isRelationshipMode && (
              <Tab value="connections"><span className="flex items-center gap-1.5">Connections{(() => {
                const count = (relationships?.characters.length ?? 0) + (relationships?.scenes.length ?? 0) + (relationships?.locations.length ?? 0) + (relationships?.takes.length ?? 0) + (relationships?.cameras.length ?? 0)
                return count > 0 ? <Tag size="compact" type="neutral" variant="border">{count}</Tag> : null
              })()}</span></Tab>
            )}
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="details" className="px-4 pb-4 space-y-4">
              <section className="space-y-1">
                <div className="flex justify-between text-body-0-regular">
                  <span className="text-foreground-dim">Assets</span>
                  <span className="text-foreground">{matchingCount ?? 0}</span>
                </div>
                <div className="flex justify-between text-body-0-regular">
                  <span className="text-foreground-dim">Created</span>
                  <span className="text-foreground">{collection.createdAt.toLocaleDateString()}</span>
                </div>
              </section>
              {!isRelationshipMode && (
                <Button
                  variant="secondary"
                  icon={<Pencil className="w-3.5 h-3.5" />}
                  onClick={startEditing}
                >
                  Edit filters
                </Button>
              )}
              {onDelete && (
                <div className="pt-2">
                  <Button
                    variant="tertiary"
                    className="w-full justify-start text-foreground-system-error hover:bg-surface-system-error-subtle"
                    icon={<Trash2 />}
                    onClick={onDelete}
                  >
                    Delete Collection
                  </Button>
                </div>
              )}
            </TabsContent>

            {isRelationshipMode && (
              <TabsContent value="connections" className="px-4 pb-4">
                <OntologySection
                  dimensions={relationships}
                  suppressDimension={suppressDimension}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>
      )}
    </ResponsivePanel>
  )
}
