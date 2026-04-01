'use client'

import { X, Trash2, Droplets, ExternalLink, LayoutGrid } from 'lucide-react'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { AccessSummary } from './access-summary'
import { Tag } from './tag'
import { SettingToggle } from './settings-panel'
import type { UserCollection } from '@/hooks'
import type { ReviewNoteSummary } from '@/lib/review-notes'
import type { ResourceRef } from '@/lib/grants'
import { useAccess, usePersona } from '@/hooks'
import { PERSONAS } from '@/lib/personas'

interface CollectionSidePanelProps {
  collection: UserCollection
  open: boolean
  onClose: () => void
  onDelete: () => void
  reviewNoteSummary?: ReviewNoteSummary | null
  canDelete?: boolean
}

export function CollectionSidePanel({
  collection,
  open,
  onClose,
  onDelete,
  reviewNoteSummary = null,
  canDelete = true,
}: CollectionSidePanelProps) {
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
      <div className="flex items-center justify-between p-4">
        <span className="text-body-1-bold text-foreground">Collection Settings</span>
        <Button variant="icon" compact onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-2">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-8 h-8 text-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-body-0-bold text-foreground truncate">{collection.name}</p>
                <p className="text-body-0-regular text-foreground-dim">Collection</p>
              </div>
            </div>
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

        <section className="space-y-2">
          <h3 className="text-body-0-bold text-foreground-dim">Sharing</h3>
          <div className="space-y-3">
            <SettingToggle
              label="Apply watermark"
              checked={false}
              onChange={() => console.log('Toggle watermark')}
            />
            <div className="flex items-center gap-2 text-body-0-regular text-foreground-dim">
              <Droplets className="w-3 h-3" />
              <span>Watermark shared downloads</span>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-body-0-bold text-foreground-dim">Creative Review</h3>
          {reviewNoteSummary ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-body-0-regular text-foreground-dim">Latest</p>
                <p className="text-body-0-regular text-foreground">{reviewNoteSummary.latestSummary}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size="compact" type="announcement">{reviewNoteSummary.totalNotes} notes</Tag>
                <Tag size="compact" type={reviewNoteSummary.unresolvedCount > 0 ? 'notice' : 'positive'}>
                  {reviewNoteSummary.unresolvedCount} unresolved
                </Tag>
              </div>
              <a
                href={reviewNoteSummary.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-body-0-regular text-foreground hover:text-foreground-system-link transition-colors"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                Open in Creative Review
              </a>
            </div>
          ) : (
            <p className="text-body-0-regular text-foreground-dim">
              No linked Creative Review activity yet.
            </p>
          )}
        </section>
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
