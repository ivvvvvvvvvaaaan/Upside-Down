'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { X, Plus, LayoutGrid, Folder, ExternalLink, Clapperboard } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { AccessPanel } from './access-panel'
import { Tag } from './tag'
import { cn } from '@/lib/utils'
import type { Asset, DepartmentId } from '@/lib/data'
import type { ResourceRef } from '@/lib/grants'
import { useAccess, useFileTree } from '@/hooks'
import type { UserCollection } from '@/hooks'
import type { RelatedAssetGroup } from '@/lib/context-relationships'
import type { ReviewNoteSummary } from '@/lib/review-notes'
import { PERSONAS } from '@/lib/personas'
import { slugify } from '@/lib/smart-collection-filters'

function AddTagButton({ onAdd }: { onAdd: (label: string) => void }) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-0.5 px-1 py-0 rounded border border-dashed border-border-dim text-label-0-bold text-foreground-dim hover:text-foreground hover:border-border-subtle transition-colors"
      >
        <Plus className="w-3 h-3" />
        Add
      </button>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Tag name..."
        className="w-32 px-2 py-0.5 rounded text-label-0-regular bg-surface-flat border border-border-dim text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-indigo-500"
        onKeyDown={e => {
          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            onAdd(e.currentTarget.value.trim())
            e.currentTarget.value = ''
            setOpen(false)
          }
          if (e.key === 'Escape') setOpen(false)
        }}
      />
    </div>
  )
}

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
  collections,
  relatedGroups = [],
  reviewNoteSummary = null,
  activeCollectionId,
}: AssetDetailPanelProps) {
  const { getInheritedGrants, getCollectionRippleGrants, visibleCollections } = useAccess()
  const { getDepartmentFiles } = useFileTree()
  const allCollections = collections ?? visibleCollections

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

  // User tags from localStorage
  const [userTagsMap, setUserTagsMap] = useState<Record<string, string[]>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem('user-tags')
      return stored ? JSON.parse(stored) : {}
    } catch { return {} }
  })

  const addUserTag = useCallback((assetId: string, label: string) => {
    setUserTagsMap(prev => {
      const existing = prev[assetId] ?? []
      if (existing.includes(label)) return prev
      const next = { ...prev, [assetId]: [...existing, label] }
      try { localStorage.setItem('user-tags', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const workspaceFolderInfo = useMemo(() => {
    if (!asset) return null
    if (!asset.department || !asset.workspacePath) return null

    const pathParts = asset.workspacePath.split(' / ').filter(Boolean)
    const folderNames = pathParts.slice(0, -1)
    const fullLabel = `/${DEPARTMENT_NAMES[asset.department]}${folderNames.length > 0 ? `/${folderNames.join(' / ')}` : ''}`

    if (folderNames.length === 0) {
      return {
        label: fullLabel,
        href: `/nextgen/workspace/${asset.department}`,
      }
    }

    const folderIds: string[] = []
    let currentNodes = getDepartmentFiles(asset.department)

    for (const folderName of folderNames) {
      const match = currentNodes.find((node) => node.type === 'folder' && node.name === folderName)
      if (!match || match.type !== 'folder') {
        return { label: fullLabel, href: null }
      }
      folderIds.push(match.id)
      currentNodes = match.children ?? []
    }

    return {
      label: fullLabel,
      href: `/nextgen/workspace/${asset.department}/${folderIds.join('/')}`,
    }
  }, [asset, getDepartmentFiles])

  if (!asset) return <ResponsivePanel open={false} onClose={onClose}><div /></ResponsivePanel>

  const duration = getDuration(asset)
  const typeTag = getTypeTag(asset)

  const assetCollections = allCollections.filter(c =>
    c.assetIds.includes(asset.id)
  )

  const appearanceItems = [
    ...(workspaceFolderInfo ? [{
      key: `workspace-${workspaceFolderInfo.label}`,
      label: workspaceFolderInfo.label,
      href: workspaceFolderInfo.href,
      kind: 'Folder' as const,
      icon: 'folder' as const,
      isActive: false,
    }] : []),
    ...assetCollections.map((collection) => ({
      key: collection.id,
      label: collection.name,
      href: collection.id === activeCollectionId ? null : `/nextgen/collections/${collection.id}`,
      kind: 'Collection' as const,
      icon: 'collection' as const,
      isActive: collection.id === activeCollectionId,
    })),
    ...(asset.aiMeta?.characters?.map((character) => {
      const id = `smart-character--${slugify(character)}`
      return {
        key: id,
        label: character,
        href: id === activeCollectionId ? null : `/nextgen/smart-collections/${id}`,
        kind: 'Character' as const,
        icon: 'collection' as const,
        isActive: id === activeCollectionId,
      }
    }) ?? []),
    ...(asset.aiMeta?.scene ? [{
      key: `smart-scene--${slugify(asset.aiMeta.scene)}`,
      label: asset.aiMeta.scene,
      href: `smart-scene--${slugify(asset.aiMeta.scene)}` === activeCollectionId ? null : `/nextgen/smart-collections/smart-scene--${slugify(asset.aiMeta.scene)}`,
      kind: 'Scene' as const,
      icon: 'collection' as const,
      isActive: `smart-scene--${slugify(asset.aiMeta.scene)}` === activeCollectionId,
    }] : []),
    ...(asset.aiMeta?.location ? [{
      key: `smart-location--${slugify(asset.aiMeta.location)}`,
      label: asset.aiMeta.location,
      href: `smart-location--${slugify(asset.aiMeta.location)}` === activeCollectionId ? null : `/nextgen/smart-collections/smart-location--${slugify(asset.aiMeta.location)}`,
      kind: 'Location' as const,
      icon: 'collection' as const,
      isActive: `smart-location--${slugify(asset.aiMeta.location)}` === activeCollectionId,
    }] : []),
  ]

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
        <div className="space-y-4">
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

          {/* Tags — unified from asset.tags + user tags from localStorage */}
          {(() => {
            const assetTags = asset.tags ?? []
            const userTags = (userTagsMap[asset.id] ?? []).map(label => ({ label, source: 'user' as const }))
            const allTags = [...assetTags, ...userTags]
            // Skip type tag (shown in Details) — show only keywords, status, and user tags
            const displayTags = allTags.filter(t => !(t.source === 'system' && t.label !== 'Key Art' && t.label !== 'Final'))
            return (
              <section className="space-y-2">
                <h3 className="text-label-0-bold uppercase text-foreground-dim">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {displayTags.map(tag => (
                    <Tag
                      key={tag.label}
                      size="compact"
                      type={tag.label === 'Key Art' ? 'announcement' : tag.label === 'Final' ? 'positive' : 'neutral'}
                      variant="border"
                    >
                      {tag.label}
                    </Tag>
                  ))}
                  <AddTagButton onAdd={(label) => addUserTag(asset.id, label)} />
                </div>
              </section>
            )
          })()}

          {/* Appears in — workspace folder + visible collection relationships */}
          <section className="space-y-2">
            <h3 className="text-label-0-bold uppercase text-foreground-dim">Appears in</h3>
            <div>
              {appearanceItems.map((item) => {
                const Icon = item.icon === 'folder' ? Folder : LayoutGrid
                const row = (
                  <span className="flex items-center justify-between gap-2 py-1 text-body-0-regular w-full">
                    <span className="flex items-center gap-2 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
                      <span className={cn('truncate', item.isActive && 'text-foreground-dim')}>{item.label}</span>
                    </span>
                    <span className="text-label-0-regular text-foreground-dim flex-shrink-0">{item.kind}</span>
                  </span>
                )

                return item.href ? (
                  <Link key={item.key} href={item.href} className="text-foreground hover:text-foreground-system-link transition-colors">{row}</Link>
                ) : (
                  <div key={item.key} className="text-foreground">{row}</div>
                )
              })}
              {appearanceItems.length === 0 && (
                <p className="text-label-1-regular text-foreground-dim">None</p>
              )}
            </div>
          </section>
        </div>

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

      </div>
    </ResponsivePanel>
  )
}
