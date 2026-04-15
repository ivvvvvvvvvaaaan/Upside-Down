'use client'

import { useMemo, useState } from 'react'
import { X, LayoutGrid, MoreVertical, Pencil, Trash2, MapPin, Film, Zap, Folder, HardDrive, Import, Users } from 'lucide-react'
import { Button } from './button'
import { Avatar } from './avatar'
import { DepartmentAvatar, ReleaseDomainAvatar } from './department-avatar'
import { PrincipalAvatar } from './principal-avatar'
import { GrantBadge } from './grant-badge'
import { Dropdown, DropdownMenuItem, DropdownMenuDivider } from './dropdown'
import { Modal } from './modal'
import { Card } from './card'
import { ResponsivePanel } from './responsive-panel'
import { AccessModal } from './access-modal'
import { CreativeReviewCard } from './creative-review-card'
import { OntologySection } from './ontology-section'
import { SmartCollectionFilterBuilder } from './smart-collection-filter-builder'
import { Tag } from './tag'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import type { Collection } from '@/lib/collection-types'
import { isSmart, isCollection, getCollectionCapabilities } from '@/lib/collection-types'
import { getCollectionReviewSummary } from '@/lib/review-notes'
import type { ResourceRef, Grant } from '@/lib/grants'
import type { AssetFilter, SmartCollectionGroupBy } from '@/lib/data'
import type { RelatedCollections } from '@/hooks/useSmartCollections'
import { useAccess, useFileTree, usePersona, useUserCollections } from '@/hooks'
import { PERSONAS } from '@/lib/personas'
import { TEAMS, isUserInTeam } from '@/lib/teams'
import { getOntologyMeta } from '@/lib/ontology-meta'
import type { OntologyMeta } from '@/lib/ontology-meta'
import { getSmartShareSnapshotCollections } from '@/lib/smart-collection-share-utils'

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
  | { type: 'mount' }

interface CollectionSidePanelProps {
  collection: Collection
  open: boolean
  onClose: () => void
  /** Single callback for all mutations — panel determines what's available from capabilities */
  onAction?: (action: CollectionAction) => void
  actionPermissions?: {
    canEdit?: boolean
    canDelete?: boolean
    canMount?: boolean
  }
  relationships?: RelatedCollections
  suppressDimension?: SmartCollectionGroupBy
  matchingCount?: number
  avatarSrc?: string
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
  const canMount = Boolean(onAction && (actionPermissions?.canMount ?? true) && caps.canMount)

  const ontologyMeta = smart ? getOntologyMeta(collection.name, smart.icon) : null
  const resolvedAssetIds = useMemo(() => (
    curated ? resolveCollectionAssetIds(curated) : []
  ), [curated])
  const assetCount = matchingCount ?? resolvedAssetIds.length
  const assetIds = resolvedAssetIds
  const reviewNoteSummary = curated ? getCollectionReviewSummary(collection.id, assetIds) : null

  const { collections: userCollections } = useUserCollections()
  const { sharesReceivedByMe, allProjectShares, getResourceGrants, getResourceGuestLinks, roleGroups, canShare } = useAccess()
  const { resolveCollectionAssetIds } = useFileTree()
  const { isAdmin, activePersona } = usePersona()
  const [accessModalOpen, setAccessModalOpen] = useState(false)

  const linkedSnapshotCollections = useMemo(() => {
    if (!smart) return []
    return getSmartShareSnapshotCollections(userCollections, smart)
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

  const hasDropdown = canEdit || canDelete || canMount

  return (
    <ResponsivePanel open={open} onClose={onClose}>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <PanelHeaderIcon icon={caps.icon} name={collection.name} isEntity={!!smart?.parentId} avatarSrc={avatarSrc} />
          <div className="min-w-0">
            <p className="text-body-0-bold text-foreground truncate flex items-center gap-1.5">
              {collection.name}
              {sharedBy && <Import className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />}
            </p>
            <p className="text-body-0-regular text-foreground-dim">{caps.typeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasDropdown && (
            <Dropdown label="More" icon={<MoreVertical className="w-4 h-4" />} iconOnly compact align="end" width="sm">
              <div className="py-1">
                {canEdit && (
                  <DropdownMenuItem icon={<Pencil className="w-4 h-4" />} label="Edit" onClick={openEditModal} />
                )}
                {canMount && (
                  <DropdownMenuItem icon={<HardDrive className="w-4 h-4" />} label="Mount to Drive" onClick={() => onAction!({ type: 'mount' })} />
                )}
                {(canEdit || canMount) && canDelete && <DropdownMenuDivider />}
                {canDelete && (
                  <DropdownMenuItem icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={() => onAction!({ type: 'delete' })} destructive />
                )}
              </div>
            </Dropdown>
          )}
          <Button variant="icon" compact onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="flex-1 min-h-0 flex flex-col">
        <TabsList className="px-4 shrink-0">
          <Tab value="details">Details</Tab>
          <Tab value="connections">
            <span className="flex items-center gap-1.5">
              Connections
              {connectionsCount > 0 && <Tag size="compact" type="neutral" variant="border">{connectionsCount}</Tag>}
            </span>
          </Tab>
          {caps.showAccessTab && <Tab value="access">Access</Tab>}
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="details" className="p-4 space-y-4">
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

            {reviewNoteSummary && (
              <CreativeReviewCard summary={reviewNoteSummary} />
            )}
          </TabsContent>

          <TabsContent value="connections" className="p-4 space-y-4">
            {relationships && connectionsCount > 0 ? (
              <OntologySection
                dimensions={relationships}
                suppressDimension={suppressDimension}
              />
            ) : (
              <p className="text-body-0-regular text-foreground-dim py-4">No connections found for this collection.</p>
            )}
          </TabsContent>

          {caps.showAccessTab && (
            <TabsContent value="access" className="p-4 space-y-3">
              {canManageAccess ? (
                /* ── Coordinator/owner view: full grant list ── */
                <>
                  {createdByName && (
                    <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
                      <span className="text-body-0-regular text-foreground-dim">Created by</span>
                      <div className="flex items-center gap-2">
                        <Avatar name={createdByName} size="compact" />
                        <span className="text-body-0-regular text-foreground">{createdByName}</span>
                      </div>
                    </div>
                  )}

                  {smart && linkedSnapshotCollections.length > 1 && (
                    <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-1">
                      <span className="text-body-0-regular text-foreground-dim">Sharing</span>
                      <p className="text-body-0-regular text-foreground">
                        Shared as {linkedSnapshotCollections.length} separate snapshot collections. Open a generated shared collection to manage or version a specific handoff.
                      </p>
                    </div>
                  )}

                  {grants.length > 0 && (
                    <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
                      <span className="text-body-0-regular text-foreground-dim">Shared with</span>
                      {grants.map(grant => {
                        const name = resolvePrincipalName(grant.principal)
                        return (
                          <div key={grant.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <PrincipalAvatar principal={grant.principal} />
                              <span className="text-body-0-regular text-foreground truncate">{name}</span>
                            </div>
                            <div className="flex-shrink-0">
                              <GrantBadge grant={grant} roleGroups={roleGroups} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {guestLinks.length > 0 && (
                    <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
                      <span className="text-body-0-regular text-foreground-dim">Guest links</span>
                      {guestLinks.map(link => (
                        <div key={link.id} className="flex items-center justify-between gap-2">
                          <span className="text-body-0-regular text-foreground truncate">
                            {link.allowDownload ? 'View + Download' : 'View only'}
                            {link.expiresAt && <span className="text-foreground-dim"> · expires {link.expiresAt}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {grants.length === 0 && guestLinks.length === 0 && !createdByName && (
                    <p className="text-body-0-regular text-foreground-dim">Not shared</p>
                  )}

                  <Button variant="secondary" compact onClick={() => setAccessModalOpen(true)}>
                    Manage Access
                  </Button>
                </>
              ) : (
                /* ── Recipient view: your access + sharer info ── */
                <>
                  {sharedBy && (
                    <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
                      <span className="text-body-0-regular text-foreground-dim">Shared by</span>
                      <div className="flex items-center gap-2">
                        <Avatar name={sharedBy} size="compact" />
                        <span className="text-body-0-regular text-foreground">{sharedBy}</span>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const myGrant = activePersona ? grants.find(g =>
                      (g.principal.type === 'user' && g.principal.userId === activePersona.id) ||
                      (g.principal.type === 'team' && isUserInTeam(activePersona.id, g.principal.teamId))
                    ) : undefined
                    if (!myGrant) return null
                    const capabilities: string[] = []
                    capabilities.push('Preview')
                    if (myGrant.allowDownload) capabilities.push('Download')
                    if (myGrant.allowComment) capabilities.push('Comment')
                    if (myGrant.allowUpload) capabilities.push('Upload')
                    return (
                      <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-1">
                        <span className="text-body-0-regular text-foreground-dim">Your access</span>
                        <p className="text-body-0-regular text-foreground">{capabilities.join(', ')}</p>
                      </div>
                    )
                  })()}

                  {(() => {
                    const myGrant = grants.find(g =>
                      (g.principal.type === 'user' && g.principal.userId === activePersona?.id)
                    )
                    if (!myGrant?.note) return null
                    return (
                      <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-1">
                        <span className="text-body-0-regular text-foreground-dim">Note</span>
                        <p className="text-body-0-regular text-foreground">{myGrant.note}</p>
                      </div>
                    )
                  })()}
                </>
              )}
            </TabsContent>
          )}
        </div>
      </Tabs>

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
