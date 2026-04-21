'use client'

import { useMemo, useState } from 'react'
import { X, LayoutGrid, Pencil, MapPin, Film, Zap, Folder, Users } from 'lucide-react'
import { ActivityFeed } from './activity-feed'
import type { ActivityEvent } from './activity-feed'
import { Button } from './button'
import { Avatar } from './avatar'
import { DepartmentAvatar, ReleaseDomainAvatar } from './department-avatar'
import { PrincipalAvatar } from './principal-avatar'
import { GrantBadge } from './grant-badge'
import { Modal } from './modal'
import { Card } from './card'
import { ResponsivePanel } from './responsive-panel'
import { AccessModal } from './access-modal'
import { OntologySection } from './ontology-section'
import { SmartCollectionFilterBuilder } from './smart-collection-filter-builder'
import { Tag } from './tag'
import type { Collection } from '@/lib/collection-types'
import { isSmart, isCollection, getCollectionCapabilities } from '@/lib/collection-types'
import type { ResourceRef, Grant } from '@/lib/grants'
import type { AssetFilter, SmartCollectionGroupBy } from '@/lib/data'
import type { RelatedCollections } from '@/hooks/useSmartCollections'
import { useAccess, useFileTree, usePersona, useUserCollections } from '@/hooks'
import { PERSONAS } from '@/lib/personas'
import { TEAMS, isUserInTeam } from '@/lib/teams'
import { getOntologyMeta } from '@/lib/ontology-meta'
import type { OntologyMeta } from '@/lib/ontology-meta'

const PANEL_ICONS: Record<string, typeof LayoutGrid> = {
  collection: LayoutGrid,
  smart: Zap,
  location: MapPin,
  scene: Film,
  folder: Folder,
}

function PanelHeaderIcon({ icon, name, isEntity, avatarSrc }: { icon: string; name: string; isEntity?: boolean; avatarSrc?: string }) {
  if (icon === 'character' && isEntity) return <Avatar name={name} src={avatarSrc} size="lg" />
  const Icon = icon === 'character' ? Users : (PANEL_ICONS[icon] ?? LayoutGrid)
  return <Icon className="w-8 h-8 text-foreground flex-shrink-0" />
}

function resolvePrincipalName(principal: Grant['principal']): string {
  if (principal.type === 'user') return PERSONAS.find(p => p.id === principal.userId)?.name ?? principal.userId
  if (principal.type === 'team') return TEAMS.find(t => t.id === principal.teamId)?.name ?? principal.teamId
  return principal.domainId
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
  if (filter.aiCharacters?.length) items.push(`Characters: ${filter.aiCharacters.join(', ')}`)
  if (filter.aiLocation) items.push(`Location: ${filter.aiLocation}`)
  if (filter.aiScene) items.push(`Scene: ${filter.aiScene}`)
  if (filter.aiConfidenceBelow) items.push(`AI confidence below ${Math.round(filter.aiConfidenceBelow * 100)}%`)
  if (filter.query) items.push(`"${filter.query}"`)
  return items
}

function filtersEqual(a: AssetFilter, b: AssetFilter): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function CollectionSidePanel({
  collection,
  open,
  onClose,
  onAction,
  actionPermissions,
  relationships,
  suppressDimension,
  matchingCount,
  avatarSrc,
}: CollectionSidePanelProps) {
  const smart = isSmart(collection) ? collection : null
  const curated = isCollection(collection) ? collection : null
  const caps = getCollectionCapabilities(collection)
  const canEdit = Boolean(onAction && (actionPermissions?.canEdit ?? true) && (caps.canRename || caps.canEditFilter))
  const canDelete = Boolean(onAction && (actionPermissions?.canDelete ?? true) && caps.canDelete)

  const ontologyMeta = smart ? getOntologyMeta(collection.name, smart.icon) : null

  const { collections: userCollections } = useUserCollections()
  const { sharesReceivedByMe, allProjectShares, getResourceGrants, getResourceGuestLinks, roleGroups, canShare } = useAccess()
  const { resolveCollectionAssetIds } = useFileTree()
  const { isAdmin, activePersona } = usePersona()

  const resolvedAssetIds = useMemo(() => (
    curated ? resolveCollectionAssetIds(curated) : []
  ), [curated, resolveCollectionAssetIds])
  const assetCount = matchingCount ?? resolvedAssetIds.length
  const assetIds = resolvedAssetIds
  const [accessModalOpen, setAccessModalOpen] = useState(false)

  const linkedSnapshotCollections = useMemo(() => {
    if (!smart) return []
    return userCollections
      .filter((collection) => collection.sourceSmartCollectionId === smart.id)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  }, [smart, userCollections])

  const accessCollection = smart && linkedSnapshotCollections.length === 1
    ? linkedSnapshotCollections[0]
    : curated
  const accessResourceRef: ResourceRef = accessCollection
    ? { id: accessCollection.id, type: 'collection' }
    : { id: collection.id, type: smart ? 'smart-collection' : 'collection' }
  const accessResourceId = accessCollection?.id ?? collection.id

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
    const seen = new Set<string>()
    for (const grant of collGrants) {
      // Skip self-shares (grantor is also the recipient)
      if (grant.principal.type === 'user' && grant.principal.userId === grant.grantedByUserId) continue

      const key = `${grant.grantedByUserId}:${grant.grantedAt}`
      if (seen.has(key)) continue
      seen.add(key)
      const sharer = PERSONAS.find(p => p.id === grant.grantedByUserId)
      const p = grant.principal
      const recipientName = p.type === 'user'
        ? PERSONAS.find(persona => persona.id === p.userId)?.name ?? 'someone'
        : p.type === 'team'
        ? TEAMS.find(t => t.id === p.teamId)?.name ?? 'a team'
        : 'a group'
      events.push({
        id: `share-${grant.id}`,
        icon: 'share',
        text: `${sharer?.name ?? 'Someone'} shared with ${recipientName}`,
        date: grant.grantedAt,
        detail: grant.note ?? undefined,
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
  }, [accessResourceId, getResourceGrants, collection.createdAt, createdByName])

  const grants = useMemo(() => {
    if (!smart || linkedSnapshotCollections.length <= 1) {
      return getResourceGrants(accessResourceId)
    }
    return linkedSnapshotCollections.flatMap((snapshotCollection) => getResourceGrants(snapshotCollection.id))
  }, [smart, linkedSnapshotCollections, getResourceGrants, accessResourceId])

  const guestLinks = useMemo(() => {
    if (!smart || linkedSnapshotCollections.length <= 1) {
      return getResourceGuestLinks(accessResourceId)
    }
    return linkedSnapshotCollections.flatMap((snapshotCollection) => getResourceGuestLinks(snapshotCollection.id))
  }, [smart, linkedSnapshotCollections, getResourceGuestLinks, accessResourceId])

  const canManageAccess = linkedSnapshotCollections.length > 1
    ? false
    : (isAdmin || canShare(accessResourceRef))

  const connectionsCount = relationships
    ? relationships.characters.length + relationships.scenes.length + relationships.locations.length
    : 0

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [draftName, setDraftName] = useState(collection.name)
  const [draftFilter, setDraftFilter] = useState<AssetFilter>(smart?.filter ?? {})

  const openEditModal = () => {
    setDraftName(collection.name)
    if (smart) setDraftFilter({ ...smart.filter })
    setEditModalOpen(true)
  }

  const handleEditSave = () => {
    if (!onAction) return
    const updates: { name?: string; filter?: AssetFilter } = {}
    if (caps.canRename && draftName !== collection.name) updates.name = draftName
    if (caps.canEditFilter && smart && !filtersEqual(draftFilter, smart.filter)) updates.filter = draftFilter
    if (Object.keys(updates).length > 0) onAction({ type: 'update', updates })
    setEditModalOpen(false)
  }

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
                  <Tag key={i} size="compact" type="neutral" variant="border">{item}</Tag>
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

      <AccessModal
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        resourceId={accessResourceId}
        resourceRef={accessResourceRef}
        title={accessCollection?.name ?? collection.name}
      />

      {/* Edit modal */}
      {canEdit && (
        <Modal open={editModalOpen} onOpenChange={setEditModalOpen} size="sm">
          <Modal.Header title="Edit Collection" />
          <Modal.Body>
            {smart && caps.canEditFilter ? (
              <SmartCollectionFilterBuilder
                name={draftName}
                filter={draftFilter}
                onNameChange={setDraftName}
                onFilterChange={setDraftFilter}
              />
            ) : (
              <div>
                <label className="text-label-1-bold text-foreground-dim block mb-1">Name</label>
                <input
                  type="text"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  className="w-full h-10 px-3 rounded border border-border-dim bg-surface-highlight text-body-0-regular text-foreground focus:border-border-subtle outline-none transition-colors"
                />
              </div>
            )}
          </Modal.Body>
          <Card.Footer>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSave}>Save</Button>
          </Card.Footer>
        </Modal>
      )}
    </ResponsivePanel>
  )
}
