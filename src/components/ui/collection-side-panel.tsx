'use client'

import { useMemo } from 'react'
import { X, Layers, MapPin, Film, Zap, Folder, Users } from 'lucide-react'
import { ActivityFeed } from './activity-feed'
import type { ActivityEvent } from './activity-feed'
import { Button } from './button'
import { Avatar } from './avatar'
import { ResponsivePanel } from './responsive-panel'
import { OntologySection } from './ontology-section'
import { Chip } from './chip'
import type { Collection } from '@/lib/collection-types'
import { isSmart, isCollection, getCollectionCapabilities } from '@/lib/collection-types'
import type { AssetFilter, SmartCollectionGroupBy } from '@/lib/data'
import type { RelatedCollections } from '@/hooks/useSmartCollections'
import { useAccess, useFileTree, usePersona, useUserCollections } from '@/hooks'
import { PERSONAS } from '@/lib/personas'
import { getOntologyMeta } from '@/lib/ontology-meta'
import type { OntologyMeta } from '@/lib/ontology-meta'

const PANEL_ICONS: Record<string, typeof Layers> = {
  collection: Layers,
  smart: Zap,
  location: MapPin,
  scene: Film,
  folder: Folder,
}

function PanelHeaderIcon({ icon, name, isEntity, avatarSrc }: { icon: string; name: string; isEntity?: boolean; avatarSrc?: string }) {
  if (icon === 'character' && isEntity) return <Avatar name={name} src={avatarSrc} size="lg" />
  const Icon = icon === 'character' ? Users : (PANEL_ICONS[icon] ?? Layers)
  return <Icon className="w-8 h-8 text-foreground flex-shrink-0" />
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-label-0-bold text-foreground-dim uppercase">{label}</p>
      <p className="text-body-0-regular text-foreground">{value}</p>
    </div>
  )
}

function OntologyDetails({ meta }: { meta: OntologyMeta }) {
  if (meta.type === 'character') {
    const { bio, role, episodes, notes } = meta.data
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
    return (
      <div className="space-y-4">
        <p className="text-body-0-regular text-foreground leading-relaxed">{bio}</p>
        <div className="space-y-3">
          <MetaField label="Role" value={roleLabel} />
          <MetaField label="Episodes" value={episodes.join(', ')} />
          {notes && <MetaField label="Production notes" value={notes} />}
        </div>
      </div>
    )
  }

  if (meta.type === 'scene') {
    const { description, episode, pageRange, timeOfDay, mood, notes } = meta.data
    return (
      <div className="space-y-4">
        <p className="text-body-0-regular text-foreground leading-relaxed">{description}</p>
        <div className="space-y-3">
          <div className="flex gap-4">
            <MetaField label="Episode" value={episode} />
            {pageRange && <MetaField label="Pages" value={pageRange} />}
          </div>
          <div className="flex gap-4">
            {timeOfDay && <MetaField label="Time of day" value={timeOfDay} />}
            {mood && <MetaField label="Mood" value={mood} />}
          </div>
          {notes && <MetaField label="Production notes" value={notes} />}
        </div>
      </div>
    )
  }

  if (meta.type === 'location') {
    const { description, setting, episodes, notes } = meta.data
    const settingLabel = setting.charAt(0).toUpperCase() + setting.slice(1)
    return (
      <div className="space-y-4">
        <p className="text-body-0-regular text-foreground leading-relaxed">{description}</p>
        <div className="space-y-3">
          <MetaField label="Setting" value={settingLabel} />
          <MetaField label="Episodes" value={episodes.join(', ')} />
          {notes && <MetaField label="Production notes" value={notes} />}
        </div>
      </div>
    )
  }

  return null
}

export type CollectionAction =
  | { type: 'rename'; name: string }
  | { type: 'update-filter'; filter: AssetFilter }
  | { type: 'update'; updates: { name?: string; filter?: AssetFilter } }
  | { type: 'delete' }

interface CollectionSidePanelProps {
  collection: Collection
  open: boolean
  onClose: () => void
  /** Single callback for all mutations — panel determines what's available from capabilities */
  onAction?: (action: CollectionAction) => void
  actionPermissions?: {
    canEdit?: boolean
    canDelete?: boolean
  }
  relationships?: RelatedCollections
  suppressDimension?: SmartCollectionGroupBy
  matchingCount?: number
  avatarSrc?: string
}

function describeFilters(filter: AssetFilter): string[] {
  const items: string[] = []
  if (filter.department) items.push(`Department: ${filter.department}`)
  if (filter.types?.length) items.push(`Type: ${filter.types.join(', ')}`)
  if (filter.typeTags?.length) items.push(filter.typeTags.join(', '))
  if (filter.isFinal) items.push('Final only')
  if (filter.isKeyArt) items.push('Key Art only')
  if (filter.isCircleTake) items.push('Tag: Circle Take')
  if (filter.aiCharacters?.length) items.push(`Characters: ${filter.aiCharacters.join(', ')}`)
  if (filter.aiLocation) items.push(`Location: ${filter.aiLocation}`)
  if (filter.aiScene) items.push(`Scene: ${filter.aiScene}`)
  if (filter.aiConfidenceBelow) items.push(`AI confidence below ${Math.round(filter.aiConfidenceBelow * 100)}%`)
  if (filter.query) items.push(`"${filter.query}"`)
  return items
}

export function CollectionSidePanel({
  collection,
  open,
  onClose,
  relationships,
  suppressDimension,
  matchingCount,
  avatarSrc,
}: CollectionSidePanelProps) {
  const smart = isSmart(collection) ? collection : null
  const curated = isCollection(collection) ? collection : null
  const caps = getCollectionCapabilities(collection)

  const ontologyMeta = smart ? getOntologyMeta(collection.name, smart.icon) : null

  const { collections: userCollections } = useUserCollections()
  const { sharesReceivedByMe, allProjectShares, getResourceGrants } = useAccess()
  const { resolveCollectionAssetIds } = useFileTree()
  const { isAdmin } = usePersona()

  const resolvedAssetIds = useMemo(() => (
    curated ? resolveCollectionAssetIds(curated) : []
  ), [curated, resolveCollectionAssetIds])
  const assetCount = matchingCount ?? resolvedAssetIds.length

  const linkedSnapshotCollections = useMemo(() => {
    if (!smart) return []
    return userCollections
      .filter((collection) => collection.sourceSmartCollectionId === smart.id)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  }, [smart, userCollections])

  const accessResourceId = smart && linkedSnapshotCollections.length === 1
    ? linkedSnapshotCollections[0].id
    : collection.id

  const shares = isAdmin ? allProjectShares : sharesReceivedByMe
  const share = linkedSnapshotCollections.length <= 1
    ? shares.find(s => s.resourceId === accessResourceId)
    : undefined
  const sharedBy = share ? (PERSONAS.find(p => p.id === share.grantedByUserId)?.name ?? null) : null
  const createdByName = collection.createdBy
    ? (PERSONAS.find(p => p.email === collection.createdBy)?.name ?? collection.createdBy)
    : null

  const collectionActivity = useMemo((): ActivityEvent[] => {
    const events: ActivityEvent[] = []
    const collGrants = getResourceGrants(accessResourceId)
      .filter(g => !(g.principal.type === 'user' && g.principal.userId === g.grantedByUserId))

    // Group grants by sharer+date to show "shared with N people"
    const grouped = new Map<string, { sharer: string; date: string; count: number; note?: string }>()
    for (const grant of collGrants) {
      const key = `${grant.grantedByUserId}:${grant.grantedAt}`
      const existing = grouped.get(key)
      if (existing) {
        existing.count++
      } else {
        const sharer = PERSONAS.find(p => p.id === grant.grantedByUserId)
        grouped.set(key, {
          sharer: sharer?.name ?? 'Someone',
          date: grant.grantedAt,
          count: 1,
          note: grant.note ?? undefined,
        })
      }
    }
    for (const [key, { sharer, date, count, note }] of Array.from(grouped.entries())) {
      events.push({
        id: `share-${key}`,
        icon: 'share',
        text: count === 1
          ? `${sharer} shared with 1 person`
          : `${sharer} shared with ${count} people`,
        date,
        detail: note,
      })
    }
    if (curated && collection.createdAt) {
      events.push({
        id: 'created',
        icon: 'collection-add',
        text: `${createdByName ?? 'Someone'} created this collection`,
        date: collection.createdAt.toISOString(),
      })
    }
    return events.sort((a, b) => b.date.localeCompare(a.date))
  }, [accessResourceId, getResourceGrants, collection.createdAt, createdByName, curated])

  const connectionsCount = relationships
    ? relationships.characters.length + relationships.scenes.length + relationships.locations.length
    : 0

  return (
    <ResponsivePanel open={open} onClose={onClose}>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <PanelHeaderIcon icon={caps.icon} name={collection.name} isEntity={!!smart?.parentId} avatarSrc={avatarSrc} />
          <div className="min-w-0">
            <p className="text-body-0-bold text-foreground truncate flex items-center gap-1.5">
              {collection.name}
            </p>
            <p className="text-body-0-regular text-foreground-dim">{caps.typeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="icon" compact onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Details */}
        {ontologyMeta ? (
          <OntologyDetails meta={ontologyMeta} />
        ) : (
          <section className="space-y-1">
            <div className="flex justify-between text-body-0-regular">
              <span className="text-foreground-dim">Assets</span>
              <span className="text-foreground">{assetCount}</span>
            </div>
            {createdByName && (
              <div className="flex justify-between text-body-0-regular">
                <span className="text-foreground-dim">Created by</span>
                <span className="text-foreground">{createdByName}</span>
              </div>
            )}
            <div className="flex justify-between text-body-0-regular">
              <span className="text-foreground-dim">Created</span>
              <span className="text-foreground">{collection.createdAt.toLocaleDateString()}</span>
            </div>
            {sharedBy && (
              <div className="flex justify-between text-body-0-regular">
                <span className="text-foreground-dim">Shared by</span>
                <span className="text-foreground">{sharedBy}</span>
              </div>
            )}
          </section>
        )}

        {/* Smart collection filters */}
        {smart && (() => {
          const filterItems = describeFilters(smart.filter)
          return filterItems.length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-body-0-bold text-foreground-dim">Filters</h3>
              <div className="flex flex-wrap gap-1.5">
                {filterItems.map((item, i) => (
                  <Chip key={i} size="compact">{item}</Chip>
                ))}
              </div>
            </section>
          ) : null
        })()}

        {/* Connections */}
        {relationships && connectionsCount > 0 && (
          <section className="space-y-2">
            <OntologySection
              dimensions={relationships}
              suppressDimension={suppressDimension}
            />
          </section>
        )}


        <ActivityFeed events={collectionActivity} />
      </div>
    </ResponsivePanel>
  )
}
