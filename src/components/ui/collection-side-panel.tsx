'use client'

import { X, Trash2, Share2, Users, Droplets, ExternalLink } from 'lucide-react'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { Tag } from './tag'
import { SettingToggle } from './settings-panel'
import type { UserCollection } from '@/hooks'
import type { ReviewNoteSummary } from '@/lib/review-notes'

interface CollectionSidePanelProps {
  collection: UserCollection
  open: boolean
  onClose: () => void
  onDelete: () => void
  onShare: () => void
  reviewNoteSummary?: ReviewNoteSummary | null
  canDelete?: boolean
  canShare?: boolean
}

/**
 * Collection Side Panel
 *
 * Right-side panel for collection settings and actions.
 * Pushes content to the left when open (not overlay).
 */
export function CollectionSidePanel({
  collection,
  open,
  onClose,
  onDelete,
  onShare,
  reviewNoteSummary = null,
  canDelete = true,
  canShare = true,
}: CollectionSidePanelProps) {
  return (
    <ResponsivePanel open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <span className="text-body-1-bold text-foreground">Collection Settings</span>
        <Button variant="icon" compact onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Collection Info */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Collection</h3>
          <div className="space-y-1">
            <p className="text-body-1-bold text-foreground">{collection.name}</p>
            <p className="text-label-1-regular text-foreground-subtle">
              {collection.assetIds.length} asset{collection.assetIds.length !== 1 ? 's' : ''}
            </p>
            <p className="text-label-0-regular text-foreground-dim">
              Created {collection.createdAt.toLocaleDateString()}
            </p>
          </div>
        </section>

        {/* Actions */}
        {canShare && (
          <section className="space-y-2">
            <h3 className="text-label-0-bold uppercase text-foreground-dim">Actions</h3>
            <div className="space-y-1">
              <Button
                variant="tertiary"
                className="w-full justify-start"
                icon={<Share2 />}
                onClick={onShare}
              >
                Share Collection
              </Button>
            </div>
          </section>
        )}

        {/* Sharing Settings (placeholder) */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Sharing</h3>
          <div className="space-y-3">
            <SettingToggle
              label="Apply watermark"
              checked={false}
              onChange={() => console.log('Toggle watermark')}
            />
            <div className="flex items-center gap-2 text-label-1-regular text-foreground-dim">
              <Droplets className="w-3 h-3" />
              <span>Watermark shared downloads</span>
            </div>
          </div>
        </section>

        {/* Creative Review */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Creative Review</h3>
          {reviewNoteSummary ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-label-0-regular text-foreground-dim">Latest</p>
                <p className="text-body-1-regular text-foreground">{reviewNoteSummary.latestSummary}</p>
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
                className="inline-flex items-center gap-2 text-body-1-regular text-foreground hover:text-foreground-system-link transition-colors"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                Open in Creative Review
              </a>
            </div>
          ) : (
            <p className="text-label-1-regular text-foreground-dim">
              No linked Creative Review activity yet.
            </p>
          )}
        </section>

        {/* Members (placeholder) */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Members</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-label-1-regular text-foreground-dim">
              <Users className="w-3 h-3" />
              <span>{canDelete ? 'Only you manage access here' : 'Access is managed by the owner'}</span>
            </div>
            {canShare && (
              <Button variant="tertiary" compact>
                Manage members
              </Button>
            )}
          </div>
        </section>
      </div>

      {/* Footer with delete */}
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
