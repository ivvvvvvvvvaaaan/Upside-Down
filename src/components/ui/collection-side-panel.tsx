'use client'

import { useState } from 'react'
import { X, LayoutGrid, MoreVertical, Pencil, Trash2, MapPin, Film, Zap, Folder, HardDrive, Import } from 'lucide-react'
import { Button } from './button'
import { Avatar } from './avatar'
import { Dropdown, DropdownMenuItem, DropdownMenuDivider } from './dropdown'
import { Modal } from './modal'
import { Card } from './card'
import { ResponsivePanel } from './responsive-panel'
import { AccessSummary } from './access-summary'
import { CreativeReviewCard } from './creative-review-card'
import { OntologySection } from './ontology-section'
import { SmartCollectionFilterBuilder } from './smart-collection-filter-builder'
import { Tag } from './tag'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import type { Collection } from '@/lib/collection-types'
import { isSmart, isCollection, getCollectionCapabilities } from '@/lib/collection-types'
import { getCollectionReviewSummary } from '@/lib/review-notes'
import type { ResourceRef } from '@/lib/grants'
import type { AssetFilter, SmartCollectionGroupBy } from '@/lib/data'
import type { RelatedCollections } from '@/hooks/useSmartCollections'
import { useAccess, usePersona } from '@/hooks'
import { PERSONAS } from '@/lib/personas'

const PANEL_ICONS: Record<string, typeof LayoutGrid> = {
  collection: LayoutGrid,
  smart: Zap,
  location: MapPin,
  scene: Film,
  folder: Folder,
}

function PanelHeaderIcon({ icon, name }: { icon: string; name: string }) {
  if (icon === 'character') return <Avatar name={name} size="lg" />
  const Icon = PANEL_ICONS[icon] ?? LayoutGrid
  return <Icon className="w-8 h-8 text-foreground flex-shrink-0" />
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
}: CollectionSidePanelProps) {
  const smart = isSmart(collection) ? collection : null
  const curated = isCollection(collection) ? collection : null
  const caps = getCollectionCapabilities(collection)
  const canEdit = Boolean(onAction && (actionPermissions?.canEdit ?? true) && (caps.canRename || caps.canEditFilter))
  const canDelete = Boolean(onAction && (actionPermissions?.canDelete ?? true) && caps.canDelete)
  const canMount = Boolean(onAction && (actionPermissions?.canMount ?? true) && caps.canMount)

  const assetCount = matchingCount ?? (curated ? curated.assetIds.length : 0)
  const assetIds = curated ? curated.assetIds : []
  const reviewNoteSummary = curated ? getCollectionReviewSummary(collection.id, assetIds) : null

  const { sharesReceivedByMe, allProjectShares } = useAccess()
  const { isAdmin } = usePersona()

  const resourceRef: ResourceRef = {
    id: collection.id,
    type: smart ? 'smart-collection' : 'collection',
  }

  const shares = isAdmin ? allProjectShares : sharesReceivedByMe
  const share = shares.find(s => s.resourceId === collection.id)
  const sharedBy = share ? (PERSONAS.find(p => p.id === share.grantedByUserId)?.name ?? null) : null

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
          <PanelHeaderIcon icon={caps.icon} name={collection.name} />
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
          <TabsContent value="details" className="px-4 pb-4 space-y-4">
            <section className="space-y-1">
              <div className="flex justify-between text-body-0-regular">
                <span className="text-foreground-dim">Assets</span>
                <span className="text-foreground">{assetCount}</span>
              </div>
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

            {reviewNoteSummary && (
              <CreativeReviewCard summary={reviewNoteSummary} />
            )}
          </TabsContent>

          <TabsContent value="connections" className="px-4 pb-4 space-y-4">
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
            <TabsContent value="access" className="px-4 pb-4">
              <AccessSummary
                resourceId={collection.id}
                resourceRef={resourceRef}
                resourceName={collection.name}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Edit modal */}
      {canEdit && (
        <Modal open={editModalOpen} onOpenChange={setEditModalOpen} size="sm">
          <Modal.Header title={`Edit ${smart ? 'Smart Collection' : 'Collection'}`} />
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
