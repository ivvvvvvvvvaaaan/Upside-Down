'use client'

import { X, Trash2, Users, Film, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'
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

/**
 * Smart Collection Side Panel
 *
 * Right-side panel for editing smart collection filters or showing ontology relationships.
 */
export function SmartCollectionSidePanel({
  collection,
  open,
  onClose,
  onUpdate,
  onDelete,
  matchingCount,
  relationships,
}: SmartCollectionSidePanelProps) {
  if (!open) return null

  const isRelationshipMode = !!relationships

  return (
    <div className="w-[360px] flex-shrink-0 border-l border-border bg-surface-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <span className="text-body-1-bold text-foreground">
            {isRelationshipMode ? collection.name : 'Smart Collection'}
          </span>
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
        {isRelationshipMode ? (
          <div className="space-y-4">
            {(Object.keys(DIMENSION_CONFIG) as (keyof RelatedCollections)[]).map(dimension => {
              const items = relationships[dimension]
              if (items.length === 0) return null
              const { label, Icon } = DIMENSION_CONFIG[dimension]
              return (
                <section key={dimension} className="space-y-2">
                  <h3 className="text-label-0-bold uppercase text-foreground-dim">{label}</h3>
                  <div className="bg-surface-2 rounded p-3">
                    <div className="space-y-2">
                      {items.map(item => (
                        <Link
                          key={item.id}
                          href={`/nextgen/smart-collections/${item.id}`}
                          className="flex items-center gap-2 text-body-1-regular text-foreground hover:text-foreground-system-link transition-colors"
                        >
                          <Icon className="w-4 h-4 text-foreground-dim flex-shrink-0" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              )
            })}
            {relationships.characters.length === 0 &&
              relationships.scenes.length === 0 &&
              relationships.locations.length === 0 && (
              <p className="text-label-1-regular text-foreground-dim">
                No related collections found
              </p>
            )}
          </div>
        ) : (
          <SmartCollectionFilterBuilder
            name={collection.name}
            filter={collection.filter}
            onNameChange={(name) => onUpdate({ name })}
            onFilterChange={(filter) => onUpdate({ filter })}
          />
        )}
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
