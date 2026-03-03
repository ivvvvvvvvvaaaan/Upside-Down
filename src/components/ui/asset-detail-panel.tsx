'use client'

import { X, FolderOpen, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'
import { Tag } from './tag'
import type { Asset, DepartmentId } from '@/lib/data'
import type { UserCollection } from '@/hooks'

const DEPARTMENT_NAMES: Record<DepartmentId, string> = {
  'art-design': 'Art & Design',
  'vfx': 'VFX',
  'camera': 'Camera',
  'editorial': 'Editorial',
  'audio-sound': 'Audio & Sound',
}

function getTypeTag(asset: Asset): string {
  switch (asset.type) {
    case 'shot': return 'Shot'
    case 'video': return asset.videoMeta?.typeTag || 'Video'
    case 'image': return asset.imageMeta?.typeTag || 'Image'
    case 'text': return asset.textMeta?.typeTag || 'Document'
    case 'audio': return asset.audioMeta?.typeTag || 'Audio'
    default: return ''
  }
}

function getDuration(asset: Asset): string | undefined {
  switch (asset.type) {
    case 'shot': return asset.shotMeta?.duration
    case 'video': return asset.videoMeta?.duration
    case 'audio': return asset.audioMeta?.duration
    default: return undefined
  }
}

interface AssetDetailPanelProps {
  asset: Asset
  open: boolean
  onClose: () => void
  collections?: UserCollection[]
}

/**
 * Asset Detail Side Panel
 *
 * Right-side panel for asset metadata, tags, and collection context.
 * Pushes content to the left when open (not overlay).
 * Follows CollectionSidePanel pattern.
 */
export function AssetDetailPanel({
  asset,
  open,
  onClose,
  collections = [],
}: AssetDetailPanelProps) {
  if (!open) return null

  const duration = getDuration(asset)
  const typeTag = getTypeTag(asset)

  // Find collections that contain this asset
  const assetCollections = collections.filter(c =>
    c.assetIds.includes(asset.id)
  )

  return (
    <div className="w-[360px] flex-shrink-0 border-l border-border bg-surface-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span className="text-body-1-bold text-foreground">Asset Info</span>
        <Button variant="icon" compact onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Details Section */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Details</h3>
          <div className="bg-surface-2 rounded p-3 space-y-2">
            <div>
              <p className="text-label-0-regular text-foreground-dim">File name</p>
              <p className="text-body-1-regular text-foreground">{asset.name}</p>
            </div>
            <div>
              <p className="text-label-0-regular text-foreground-dim">Type</p>
              <p className="text-body-1-regular text-foreground capitalize">{asset.type}</p>
            </div>
            {asset.department && (
              <div>
                <p className="text-label-0-regular text-foreground-dim">Department</p>
                <p className="text-body-1-regular text-foreground">
                  {DEPARTMENT_NAMES[asset.department]}
                </p>
              </div>
            )}
            {duration && (
              <div>
                <p className="text-label-0-regular text-foreground-dim">Duration</p>
                <p className="text-body-1-regular text-foreground">{duration}</p>
              </div>
            )}
            {asset.type === 'shot' && asset.shotMeta && (
              <>
                {asset.shotMeta.scene && (
                  <div>
                    <p className="text-label-0-regular text-foreground-dim">Scene</p>
                    <p className="text-body-1-regular text-foreground">{asset.shotMeta.scene}</p>
                  </div>
                )}
                {asset.shotMeta.take && (
                  <div>
                    <p className="text-label-0-regular text-foreground-dim">Take</p>
                    <p className="text-body-1-regular text-foreground">{asset.shotMeta.take}</p>
                  </div>
                )}
                {asset.shotMeta.camera && (
                  <div>
                    <p className="text-label-0-regular text-foreground-dim">Camera</p>
                    <p className="text-body-1-regular text-foreground">{asset.shotMeta.camera}</p>
                  </div>
                )}
              </>
            )}
            {asset.created_at && (
              <div>
                <p className="text-label-0-regular text-foreground-dim">Created</p>
                <p className="text-body-1-regular text-foreground">
                  {new Date(asset.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Tags Section */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Tags</h3>
          <div className="bg-surface-2 rounded p-3">
            <div className="flex flex-wrap gap-2">
              <Tag>{typeTag}</Tag>
              {asset.isKeyArt && <Tag type="announcement">Key Art</Tag>}
              {asset.isFinal && <Tag type="positive">Final</Tag>}
              {asset.department && (
                <Tag type="neutral" variant="border">
                  {DEPARTMENT_NAMES[asset.department]}
                </Tag>
              )}
            </div>
          </div>
        </section>

        {/* Collection Context */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Collections</h3>
          <div className="bg-surface-2 rounded p-3">
            {assetCollections.length > 0 ? (
              <div className="space-y-2">
                {assetCollections.map(collection => (
                  <Link
                    key={collection.id}
                    href={`/nextgen/collections/${collection.id}`}
                    className="flex items-center gap-2 text-body-1-regular text-foreground hover:text-foreground-system-link transition-colors"
                  >
                    <FolderOpen className="w-4 h-4 text-foreground-dim flex-shrink-0" />
                    {collection.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-label-1-regular text-foreground-dim">
                Not in any collections
              </p>
            )}
          </div>
        </section>

        {/* Workspace Path Placeholder */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Workspace</h3>
          <div className="bg-surface-2 rounded p-3">
            <div className="flex items-center gap-2 text-label-1-regular text-foreground-dim">
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">/project/assets/{asset.type}/{asset.name}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
