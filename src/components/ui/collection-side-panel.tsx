'use client'

import { X, Trash2, LayoutGrid } from 'lucide-react'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { AccessSummary } from './access-summary'
import { CreativeReviewCard } from './creative-review-card'
import { OntologySection } from './ontology-section'
import { Tag } from './tag'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import type { UserCollection } from '@/hooks'
import { getCollectionReviewSummary } from '@/lib/review-notes'
import type { ResourceRef } from '@/lib/grants'
import type { RelatedCollections } from '@/hooks/useSmartCollections'
import { useAccess, usePersona } from '@/hooks'
import { PERSONAS } from '@/lib/personas'

interface CollectionSidePanelProps {
  collection: UserCollection
  open: boolean
  onClose: () => void
  onDelete: () => void
  canDelete?: boolean
  relationships?: RelatedCollections
}

export function CollectionSidePanel({
  collection,
  open,
  onClose,
  onDelete,
  canDelete = true,
  relationships,
}: CollectionSidePanelProps) {
  const reviewNoteSummary = getCollectionReviewSummary(collection.id, collection.assetIds)
  const { sharesReceivedByMe, allProjectShares } = useAccess()
  const { isAdmin } = usePersona()

  const resourceRef: ResourceRef = {
    id: collection.id,
    type: 'collection',
  }

  // Find who shared this collection
  const shares = isAdmin ? allProjectShares : sharesReceivedByMe
  const share = shares.find(s => s.resourceId === collection.id)
  const sharedBy = share ? (PERSONAS.find(p => p.id === share.grantedByUserId)?.name ?? null) : null

  const connectionsCount = relationships
    ? relationships.characters.length + relationships.scenes.length + relationships.locations.length + relationships.takes.length + relationships.cameras.length
    : 0

  return (
    <ResponsivePanel open={open} onClose={onClose}>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <LayoutGrid className="w-8 h-8 text-foreground flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-body-0-bold text-foreground truncate">{collection.name}</p>
            <p className="text-body-0-regular text-foreground-dim">Collection</p>
          </div>
        </div>
        <Button variant="icon" compact onClick={onClose} className="flex-shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="details" className="flex-1 min-h-0 flex flex-col">
        <TabsList className="px-4 shrink-0">
          <Tab value="details">Details</Tab>
          <Tab value="connections"><span className="flex items-center gap-1.5">Connections{connectionsCount > 0 && <Tag size="compact" type="neutral" variant="border">{connectionsCount}</Tag>}</span></Tab>
          <Tab value="access">Access</Tab>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="details" className="px-4 pb-4 space-y-2">
            <div className="flex justify-between text-body-0-regular">
              <span className="text-foreground-dim">Assets</span>
              <span className="text-foreground">{collection.assetIds.length}</span>
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
            {canDelete && (
              <div className="pt-4">
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

          <TabsContent value="connections" className="px-4 pb-4 space-y-4">
            {relationships && (
              <OntologySection dimensions={relationships} />
            )}
            {reviewNoteSummary && (
              <CreativeReviewCard summary={reviewNoteSummary} />
            )}
          </TabsContent>

          <TabsContent value="access" className="px-4 pb-4">
            <AccessSummary
              resourceId={collection.id}
              resourceRef={resourceRef}
              resourceName={collection.name}
            />
          </TabsContent>
        </div>
      </Tabs>
    </ResponsivePanel>
  )
}
