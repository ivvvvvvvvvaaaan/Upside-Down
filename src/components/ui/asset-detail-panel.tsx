'use client'

import { useMemo } from 'react'
import { X, LayoutGrid, FileText, ExternalLink, Clapperboard } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { AccessPanel } from './access-panel'
import { Tag } from './tag'
import { cn } from '@/lib/utils'
import type { Asset, DepartmentId } from '@/lib/data'
import type { ResourceRef } from '@/lib/grants'
import { useAccess } from '@/hooks'
import type { UserCollection } from '@/hooks'
import type { RelatedAssetGroup } from '@/lib/context-relationships'
import type { ReviewNoteSummary } from '@/lib/review-notes'
import { PERSONAS } from '@/lib/personas'
import { slugify } from '@/lib/smart-collection-filters'

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
  relatedGroups?: RelatedAssetGroup[]
  reviewNoteSummary?: ReviewNoteSummary | null
  /** ID of the collection this asset is currently being viewed from */
  activeCollectionId?: string
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
  relatedGroups = [],
  reviewNoteSummary = null,
  activeCollectionId,
}: AssetDetailPanelProps) {
  const { getInheritedGrants, getCollectionRippleGrants } = useAccess()

  const resourceRef: ResourceRef | undefined = asset ? {
    id: asset.id,
    type: 'asset',
    departmentId: asset.department,
  } : undefined

  const inheritedGrants = useMemo(() => {
    if (!asset) return []
    const folderGrants = getInheritedGrants(asset.id)
    const collectionGrants = getCollectionRippleGrants(asset.id)
    return [...folderGrants, ...collectionGrants]
  }, [asset, getInheritedGrants, getCollectionRippleGrants])

  if (!asset) return <ResponsivePanel open={false} onClose={onClose}><div /></ResponsivePanel>

  const duration = getDuration(asset)
  const typeTag = getTypeTag(asset)

  const assetCollections = collections.filter(c =>
    c.assetIds.includes(asset.id)
  )

  return (
    <ResponsivePanel open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
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
          <div className="space-y-2">
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
            {asset.modifiedBy && (
              <div>
                <p className="text-label-0-regular text-foreground-dim">Modified by</p>
                <p className="text-body-1-regular text-foreground">
                  {PERSONAS.find(p => p.email === asset.modifiedBy)?.name ?? asset.modifiedBy}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Tags */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            <Tag size="compact" variant="border">{typeTag}</Tag>
            {asset.isKeyArt && <Tag size="compact" type="announcement" variant="border">Key Art</Tag>}
            {asset.isFinal && <Tag size="compact" type="positive" variant="border">Final</Tag>}
            {asset.department && (
              <Tag size="compact" type="neutral" variant="border">
                {DEPARTMENT_NAMES[asset.department]}
              </Tag>
            )}
            {asset.aiMeta?.keywords?.map(k => (
              <Tag key={k} size="compact" type="neutral" variant="border">{k}</Tag>
            ))}
          </div>
        </section>

        {/* Collections — user collections + smart collection relationships */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Appears in</h3>
          <div className="space-y-1">
            {assetCollections.map(collection => {
              const isActive = collection.id === activeCollectionId
              const row = (
                <span className="flex items-center justify-between gap-2 py-1 text-body-0-regular w-full">
                  <span className="flex items-center gap-2 min-w-0">
                    <LayoutGrid className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
                    <span className={cn('truncate', isActive && 'text-foreground-dim')}>{collection.name}</span>
                  </span>
                  <span className="text-label-0-regular text-foreground-dim flex-shrink-0">Collection</span>
                </span>
              )
              return isActive ? (
                <div key={collection.id} className="text-foreground">{row}</div>
              ) : (
                <Link key={collection.id} href={`/nextgen/collections/${collection.id}`} className="text-foreground hover:text-foreground-system-link transition-colors">{row}</Link>
              )
            })}
            {asset.aiMeta?.characters?.map(c => {
              const id = `smart-character--${slugify(c)}`
              const isActive = id === activeCollectionId
              const row = (
                <span className="flex items-center justify-between gap-2 py-1 text-body-0-regular w-full">
                  <span className="flex items-center gap-2 min-w-0">
                    <LayoutGrid className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
                    <span className={cn('truncate', isActive && 'text-foreground-dim')}>{c}</span>
                  </span>
                  <span className="text-label-0-regular text-foreground-dim flex-shrink-0">Character</span>
                </span>
              )
              return isActive ? (
                <div key={c} className="text-foreground">{row}</div>
              ) : (
                <Link key={c} href={`/nextgen/smart-collections/${id}`} className="text-foreground hover:text-foreground-system-link transition-colors">{row}</Link>
              )
            })}
            {asset.aiMeta?.scene && (() => {
              const id = `smart-scene--${slugify(asset.aiMeta!.scene!)}`
              const isActive = id === activeCollectionId
              const row = (
                <span className="flex items-center justify-between gap-2 py-1 text-body-0-regular w-full">
                  <span className="flex items-center gap-2 min-w-0">
                    <LayoutGrid className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
                    <span className={cn('truncate', isActive && 'text-foreground-dim')}>{asset.aiMeta!.scene}</span>
                  </span>
                  <span className="text-label-0-regular text-foreground-dim flex-shrink-0">Scene</span>
                </span>
              )
              return isActive ? (
                <div className="text-foreground">{row}</div>
              ) : (
                <Link href={`/nextgen/smart-collections/${id}`} className="text-foreground hover:text-foreground-system-link transition-colors">{row}</Link>
              )
            })()}
            {asset.aiMeta?.location && (() => {
              const id = `smart-location--${slugify(asset.aiMeta!.location!)}`
              const isActive = id === activeCollectionId
              const row = (
                <span className="flex items-center justify-between gap-2 py-1 text-body-0-regular w-full">
                  <span className="flex items-center gap-2 min-w-0">
                    <LayoutGrid className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
                    <span className={cn('truncate', isActive && 'text-foreground-dim')}>{asset.aiMeta!.location}</span>
                  </span>
                  <span className="text-label-0-regular text-foreground-dim flex-shrink-0">Location</span>
                </span>
              )
              return isActive ? (
                <div className="text-foreground">{row}</div>
              ) : (
                <Link href={`/nextgen/smart-collections/${id}`} className="text-foreground hover:text-foreground-system-link transition-colors">{row}</Link>
              )
            })()}
            {assetCollections.length === 0 && !asset.aiMeta?.characters?.length && !asset.aiMeta?.scene && !asset.aiMeta?.location && (
              <p className="text-label-1-regular text-foreground-dim">None</p>
            )}
          </div>
        </section>

        {reviewNoteSummary && (
          <section className="space-y-2">
            <h3 className="text-label-0-bold uppercase text-foreground-dim">Creative Review</h3>
            <div className="space-y-3">
              <div>
                <p className="text-label-0-regular text-foreground-dim">Latest</p>
                <p className="text-body-1-regular text-foreground">{reviewNoteSummary.latestSummary}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Tag type="announcement">{reviewNoteSummary.totalNotes} notes</Tag>
                <Tag type={reviewNoteSummary.unresolvedCount > 0 ? 'notice' : 'positive'}>
                  {reviewNoteSummary.unresolvedCount} unresolved
                </Tag>
              </div>
              <div>
                <p className="text-label-0-regular text-foreground-dim">Updated</p>
                <p className="text-body-1-regular text-foreground">
                  {new Date(reviewNoteSummary.updatedAt).toLocaleDateString()}
                </p>
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
          </section>
        )}

        {relatedGroups.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-label-0-bold uppercase text-foreground-dim">Explore Context</h3>
            <div className="space-y-4">
              {relatedGroups.map((group) => (
                <div key={group.type} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clapperboard className="w-4 h-4 text-foreground-dim flex-shrink-0" />
                    <p className="text-body-0-bold text-foreground">{group.label}</p>
                  </div>
                  <div className="space-y-1">
                    {group.assets.map((relatedAsset) => (
                      <Link
                        key={`${group.type}-${relatedAsset.id}`}
                        href={`/nextgen/assets/${relatedAsset.id}`}
                        className="block text-body-1-regular text-foreground hover:text-foreground-system-link transition-colors"
                      >
                        {relatedAsset.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        <AccessPanel
          resourceId={asset.id}
          resourceRef={resourceRef}
          inheritedGrants={inheritedGrants}
        />

        {/* Workspace Path */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Workspace</h3>
          <div>
            <div className="flex items-center gap-2 text-label-1-regular text-foreground-dim">
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {asset.workspacePath ?? `/project/assets/${asset.type}/${asset.name}`}
              </span>
            </div>
          </div>
        </section>
      </div>
    </ResponsivePanel>
  )
}
