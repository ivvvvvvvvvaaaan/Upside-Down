'use client'

import { X, Trash2, ExternalLink, LayoutGrid } from 'lucide-react'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { AccessSummary } from './access-summary'
import { Tag } from './tag'
import { CreativeReviewCard } from './creative-review-card'
import type { UserCollection } from '@/hooks'
import { getCollectionReviewSummary } from '@/lib/review-notes'
import type { ResourceRef } from '@/lib/grants'
import { useAccess, usePersona } from '@/hooks'
import { PERSONAS } from '@/lib/personas'

interface CollectionSidePanelProps {
  collection: UserCollection
  open: boolean
  onClose: () => void
  onDelete: () => void
  canDelete?: boolean
}

export function CollectionSidePanel({
  collection,
  open,
  onClose,
  onDelete,
  canDelete = true,
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-2">
          <div className="space-y-1">
            <div className="space-y-1">
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
            </div>
          </div>
        </section>

        <AccessSummary
          resourceId={collection.id}
          resourceRef={resourceRef}
          resourceName={collection.name}
        />

        {reviewNoteSummary && (
          <CreativeReviewCard summary={reviewNoteSummary} />
        )}
      </div>

      {canDelete && (
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
      )}
    </ResponsivePanel>
  )
}
