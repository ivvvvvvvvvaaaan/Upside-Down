'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, Users, Pencil, LayoutGrid, ChevronDown } from 'lucide-react'
import { SceneIcon, LocationIcon } from './collection-card'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from './button'
import { Tag } from './tag'
import { ResponsivePanel } from './responsive-panel'
import { SmartCollectionFilterBuilder } from './smart-collection-filter-builder'
import { pick, IMAGE_POOL } from '@/lib/images'
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

function getCollectionImages(collectionId: string) {
  return {
    mainImage: pick(IMAGE_POOL, collectionId, 1)[0],
    thumbnails: pick(IMAGE_POOL, collectionId + '-thumb', 2),
  }
}

function CharacterChips({ items }: { items: SmartCollection[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map(item => {
        const { mainImage } = getCollectionImages(item.id)
        return (
          <Link key={item.id} href={`/nextgen/smart-collections/${item.id}`}
            className="flex flex-col items-center gap-1 shrink-0 group">
            <div className="w-12 h-12 rounded-full overflow-hidden relative bg-surface-2">
              {mainImage && <Image src={mainImage} alt={item.name} fill sizes="48px" className="object-cover" />}
            </div>
            <span className="text-body-0-regular text-foreground group-hover:text-foreground-system-link text-center transition-colors whitespace-nowrap">
              {item.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

function EntityCards({ items }: { items: SmartCollection[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map(item => {
        const { mainImage, thumbnails } = getCollectionImages(item.id)
        return (
          <Link key={item.id} href={`/nextgen/smart-collections/${item.id}`}
            className="shrink-0 w-[140px] rounded overflow-hidden border border-border-dim group hover:border-border-subtle transition-colors relative">
            <div className="flex h-20 gap-px bg-surface-2">
              <div className="flex-[2] relative">
                {mainImage && <Image src={mainImage} alt={item.name} fill sizes="90px" className="object-cover" />}
              </div>
              {thumbnails.map((t, i) => (
                <div key={i} className="flex-1 relative">
                  <Image src={t} alt="" fill sizes="45px" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-1 left-1">
              <span className="text-label-0-bold text-white backdrop-blur-md bg-black/40 px-2 py-0.5 rounded-full truncate max-w-[120px] block">
                {item.name}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}


const DIMENSION_CONFIG = {
  characters: { label: 'Characters', Icon: Users },
  scenes: { label: 'Scenes', Icon: SceneIcon },
  locations: { label: 'Locations', Icon: LocationIcon },
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
              Smart Collection
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
            <h3 className="text-body-0-bold text-foreground">Relationships</h3>
            {relationships.characters.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-body-0-bold text-foreground-dim">Characters</h3>
                <CharacterChips items={relationships.characters} />
              </section>
            )}
            {relationships.scenes.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-body-0-bold text-foreground-dim">Scenes</h3>
                <EntityCards items={relationships.scenes} />
              </section>
            )}
            {relationships.locations.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-body-0-bold text-foreground-dim">Locations</h3>
                <EntityCards items={relationships.locations} />
              </section>
            )}
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
            <Button
              variant="secondary"
              compact
              icon={<Pencil className="w-3.5 h-3.5" />}
              onClick={startEditing}
            >
              Edit filters
            </Button>
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
