'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, Users, Film, MapPin, Pencil, LayoutGrid, ChevronDown } from 'lucide-react'
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
            <span className="text-body-0-regular text-foreground-dim group-hover:text-foreground-system-link text-center transition-colors whitespace-nowrap">
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
            className="shrink-0 w-[140px] rounded overflow-hidden border border-border-dim group hover:border-border-subtle transition-colors">
            <div className="flex h-16 gap-px bg-surface-2">
              <div className="flex-[2] relative">
                {mainImage && <Image src={mainImage} alt={item.name} fill sizes="90px" className="object-cover" />}
              </div>
              {thumbnails.map((t, i) => (
                <div key={i} className="flex-1 relative">
                  <Image src={t} alt="" fill sizes="45px" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="px-2 py-1">
              <p className="text-body-0-regular text-foreground truncate group-hover:text-foreground-system-link transition-colors">
                {item.name}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function RelationshipGraph({
  center,
  related,
}: {
  center: { name: string; id: string }
  related: { name: string; id: string; dimension: string }[]
}) {
  const [expanded, setExpanded] = useState(true)

  if (related.length === 0) return null

  const dimensionColor: Record<string, string> = {
    characters: 'var(--indigo-500, #6366f1)',
    scenes: 'var(--amber-500, #f59e0b)',
    locations: 'var(--emerald-500, #10b981)',
  }

  // Dynamic viewBox: wider when more nodes to avoid text overlap
  const nodeCount = related.length
  const width = Math.max(400, nodeCount * 50)
  const height = 220
  const cx = width / 2, cy = height / 2, r = Math.min(90, width / 2 - 60)
  const nodes = related.map((item, i) => {
    const angle = (2 * Math.PI * i) / related.length - Math.PI / 2
    return { ...item, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })

  return (
    <section className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-body-0-bold text-foreground-dim hover:text-foreground transition-colors"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        Relationship Graph
      </button>
      {expanded && (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 320, height: 220 }}>
            {nodes.map(n => (
              <line key={`line-${n.id}`} x1={cx} y1={cy} x2={n.x} y2={n.y}
                stroke="var(--border-dim, #333)" strokeWidth={1} opacity={0.5} />
            ))}
            <circle cx={cx} cy={cy} r={24} fill="var(--surface-3, #333)" stroke="var(--border-dim, #555)" strokeWidth={1} />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
              fill="var(--foreground, #fff)" fontSize="11" fontWeight="600">
              {center.name}
            </text>
            <style>{`
              .graph-node .node-icon { opacity: 1; }
              .graph-node .node-label { opacity: 0; }
              .graph-node:hover .node-icon { opacity: 0; }
              .graph-node:hover .node-label { opacity: 1; }
              .graph-node:hover circle { filter: brightness(1.25); }
            `}</style>
            {nodes.map(n => {
              const iconPath = n.dimension === 'characters'
                ? 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 3a4 4 0 1 1-8 0 4 4 0 0 1 8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'
                : n.dimension === 'scenes'
                ? 'M7 2v4M17 2v4M2 10h20M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'
                : 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'
              return (
                <a key={n.id} href={`/nextgen/smart-collections/${n.id}`} className="graph-node" style={{ cursor: 'pointer' }}>
                  <circle cx={n.x} cy={n.y} r={20}
                    fill="var(--surface-2, #222)" stroke={dimensionColor[n.dimension] ?? 'var(--border-dim, #555)'} strokeWidth={1.5}
                    className="transition-all" />
                  <g className="node-icon pointer-events-none" style={{ transition: 'opacity 0.15s' }}>
                    <g transform={`translate(${n.x - 8}, ${n.y - 8}) scale(0.67)`}>
                      <path d={iconPath} fill="none" stroke={dimensionColor[n.dimension] ?? 'var(--foreground-dim, #aaa)'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </g>
                  <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                    fill="var(--foreground-dim, #aaa)" fontSize="9"
                    className="node-label pointer-events-none" style={{ transition: 'opacity 0.15s' }}>
                    {n.name}
                  </text>
                </a>
              )
            })}
          </svg>
        </div>
      )}
    </section>
  )
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
            <RelationshipGraph
              center={{ name: collection.name, id: collection.id }}
              related={[
                ...relationships.characters.map(c => ({ name: c.name, id: c.id, dimension: 'characters' })),
                ...relationships.scenes.map(s => ({ name: s.name, id: s.id, dimension: 'scenes' })),
                ...relationships.locations.map(l => ({ name: l.name, id: l.id, dimension: 'locations' })),
              ]}
            />
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
