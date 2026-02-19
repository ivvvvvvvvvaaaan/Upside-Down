'use client'

import { X, Trash2, Share2, Shield, Users, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { SettingToggle } from './settings-panel'
import type { UserCollection } from '@/hooks'

interface CollectionSidePanelProps {
  collection: UserCollection
  open: boolean
  onClose: () => void
  onDelete: () => void
  onShare: () => void
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
}: CollectionSidePanelProps) {
  if (!open) return null

  return (
    <div className="w-[360px] flex-shrink-0 border-l border-border bg-surface-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
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
          <div className="bg-surface-2 rounded p-3 space-y-1">
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
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Actions</h3>
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-start"
              icon={<Share2 className="w-4 h-4" />}
              onClick={onShare}
            >
              Share Collection
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={onDelete}
            >
              Delete Collection
            </Button>
          </div>
        </section>

        {/* Sharing Settings (placeholder) */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Sharing</h3>
          <div className="bg-surface-2 rounded p-3 space-y-3">
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

        {/* Access Control (placeholder) */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Access</h3>
          <div className="bg-surface-2 rounded p-3 space-y-3">
            <SettingToggle
              label="Require approval"
              checked={false}
              onChange={() => console.log('Toggle approval')}
            />
            <div className="flex items-center gap-2 text-label-1-regular text-foreground-dim">
              <Shield className="w-3 h-3" />
              <span>Approve access requests</span>
            </div>
          </div>
        </section>

        {/* Members (placeholder) */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Members</h3>
          <div className="bg-surface-2 rounded p-3">
            <div className="flex items-center gap-2 text-label-1-regular text-foreground-dim">
              <Users className="w-3 h-3" />
              <span>Only you have access</span>
            </div>
            <Button variant="tertiary" compact className="mt-2">
              Manage members
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
