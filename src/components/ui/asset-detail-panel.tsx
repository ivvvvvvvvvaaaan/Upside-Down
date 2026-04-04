'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { AccessSummary } from './access-summary'
import { Tag } from './tag'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import { CreativeReviewCard } from './creative-review-card'
import type { Asset, DepartmentId } from '@/lib/data'
import { getAssetIdVariants } from '@/lib/data'
import type { ResourceRef } from '@/lib/grants'
import { useAccess, useFileTree, usePersona, useSmartCollections, useCuts } from '@/hooks'
import type { ReviewNoteSummary } from '@/lib/review-notes'
import { PERSONAS } from '@/lib/personas'
import { slugify } from '@/lib/smart-collection-filters'
import { OntologySection } from './ontology-section'
import type { ContainerItem } from './ontology-section'
import type { RelatedAssetGroup } from '@/lib/context-relationships'

import { Modal } from './modal'
import type { AssetTag } from '@/lib/data'

function TagManagerModal({
  open,
  onClose,
  tags,
  userTags,
  onAddTag,
  onRemoveTag,
}: {
  open: boolean
  onClose: () => void
  tags: AssetTag[]
  userTags: string[]
  onAddTag: (label: string) => void
  onRemoveTag: (label: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const systemTags = tags.filter(t => t.source === 'system')
  const aiTags = tags.filter(t => t.source === 'ai')

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} size="xs">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-body-1-bold text-foreground">Manage Tags</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-3 text-foreground-dim hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {systemTags.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-body-0-regular text-foreground-dim">System</p>
            <div className="flex flex-wrap gap-1.5">
              {systemTags.map(t => (
                <Tag key={t.label} size="compact" type={t.label === 'Key Art' ? 'announcement' : t.label === 'Final' ? 'positive' : 'neutral'} variant="border">
                  {t.label}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {aiTags.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-body-0-regular text-foreground-dim">AI</p>
            <div className="flex flex-wrap gap-1.5">
              {aiTags.map(t => (
                <Tag key={t.label} size="compact" type="neutral" variant="border">{t.label}</Tag>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-body-0-regular text-foreground-dim">Custom</p>
          <div className="flex flex-wrap gap-1.5">
            {userTags.map(label => (
              <span key={label} className="inline-flex items-center gap-1 px-1 rounded border border-border-dim text-body-0-bold text-foreground">
                {label}
                <button onClick={() => onRemoveTag(label)} className="hover:text-foreground-system-error transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {userTags.length === 0 && <span className="text-body-0-regular text-foreground-dim">None yet</span>}
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="Type a tag and press Enter..."
          className="w-full px-2 py-1.5 rounded text-body-0-regular bg-surface-flat border border-border-dim text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-indigo-500"
          onKeyDown={e => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              onAddTag(e.currentTarget.value.trim())
              e.currentTarget.value = ''
            }
          }}
        />
      </div>
    </Modal>
  )
}

const DEPARTMENT_NAMES: Record<DepartmentId, string> = {
  'art-design': 'Art & Design',
  'vfx': 'VFX',
  'camera': 'Camera',
  'editorial': 'Editorial',
  'audio-sound': 'Audio & Sound',
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
  asset: Asset | null
  open: boolean
  onClose: () => void
  reviewNoteSummary?: ReviewNoteSummary | null
  /** ID of the collection this asset is currently being viewed from */
  activeCollectionId?: string
  /** The context the panel was opened from — suppresses that item in "Found in" */
  activeContext?: { type: 'workspace' } | { type: 'collection'; id: string }
  /** Shot-level context groups (adjacent takes, alternate angles, etc.) */
  contextGroups?: RelatedAssetGroup[]
  /** Callback when a context-related asset is clicked */
  onContextAssetClick?: (asset: Asset) => void
  /** Cuts this asset appears in */
  cuts?: Asset[]
  /** Older versions of this asset (for version history display) */
  olderVersions?: Asset[]
  /** Callback when user switches to an older version */
  onVersionSelect?: (asset: Asset) => void
}

export type AssetDetailPanelContentProps = Omit<AssetDetailPanelProps, 'open' | 'asset'> & {
  asset: Asset
}

/**
 * Asset Detail Side Panel
 *
 * Right-side panel for asset metadata, tags, and collection context.
 * Pushes content to the left when open (not overlay).
 * Follows CollectionSidePanel pattern.
 */
export function AssetDetailPanelContent({
  asset,
  onClose,
  reviewNoteSummary = null,
  activeCollectionId,
  activeContext,
  contextGroups,
  onContextAssetClick,
  cuts,
  olderVersions,
  onVersionSelect,
}: AssetDetailPanelContentProps) {
  const { getInheritedGrants, getCollectionRippleGrants, visibleCollections, canEdit } = useAccess()
  const { activePersona } = usePersona()
  const { getDepartmentFiles } = useFileTree()
  const { getCollection, scopedAssets } = useSmartCollections()
  const { getCutsForAsset } = useCuts()

  const resourceRef: ResourceRef | undefined = asset ? {
    id: asset.id,
    type: asset.kind === 'cut' ? 'cut' : 'asset',
    departmentId: asset.department,
  } : undefined

  const inheritedGrants = useMemo(() => {
    if (!asset) return []
    const folderGrants = getInheritedGrants(asset.id)
    const collectionGrants = getCollectionRippleGrants(asset.id)
    return [...folderGrants, ...collectionGrants]
  }, [asset, getInheritedGrants, getCollectionRippleGrants])

  // User tags from localStorage
  const [userTagsMap, setUserTagsMap] = useState<Record<string, string[]>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user-tags')
      setUserTagsMap(stored ? JSON.parse(stored) : {})
    } catch {
      setUserTagsMap({})
    }
  }, [])

  const addUserTag = useCallback((assetId: string, rawLabel: string) => {
    const label = rawLabel.replace(/\b\w/g, c => c.toUpperCase())
    setUserTagsMap(prev => {
      const existing = prev[assetId] ?? []
      if (existing.includes(label)) return prev
      const next = { ...prev, [assetId]: [...existing, label] }
      try { localStorage.setItem('user-tags', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const removeUserTag = useCallback((assetId: string, label: string) => {
    setUserTagsMap(prev => {
      const existing = prev[assetId] ?? []
      const next = { ...prev, [assetId]: existing.filter(t => t !== label) }
      try { localStorage.setItem('user-tags', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const [tagModalOpen, setTagModalOpen] = useState(false)

  const workspaceFolderInfo = useMemo(() => {
    if (!asset) return null
    if (!asset.department || !asset.workspacePath) return null

    const pathParts = asset.workspacePath.split(' / ').filter(Boolean)
    const folderNames = pathParts.slice(0, -1)
    const fullLabel = `/Apex S1/${DEPARTMENT_NAMES[asset.department]}${folderNames.length > 0 ? `/${folderNames.join('/')}` : ''}`

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

  const assetIdVariants = useMemo(() => asset ? new Set(getAssetIdVariants(asset.id)) : new Set<string>(), [asset])

  // Determine the active collection's dimension (for suppressing redundant context groups)
  const activeCollectionDimension = useMemo(() => {
    if (!activeCollectionId) return undefined
    const coll = getCollection(activeCollectionId)
    if (coll?.groupBy) return coll.groupBy // parent collection
    if (coll?.parentId) {
      const parent = getCollection(coll.parentId)
      return parent?.groupBy
    }
    return undefined
  }, [activeCollectionId, getCollection])

  // Cuts this asset appears in (from the external prop or computed here)
  const assetCuts = useMemo(() => {
    if (cuts) return cuts
    if (!asset) return []
    return getCutsForAsset(asset.id)
  }, [cuts, asset, getCutsForAsset])

  // For cuts: resolve constituent assets and aggregate their AI metadata for dimensions
  const constituentAssets = useMemo(() => {
    if (!asset || asset.kind !== 'cut' || !asset.constituents) return []
    return asset.constituents
      .map(cid => scopedAssets.find(a => a.id === cid || a.id === `inst-${cid}`))
      .filter((a): a is Asset => !!a)
  }, [asset, scopedAssets])

  // Aggregate AI metadata from constituents (for cuts that don't have their own aiMeta)
  const aggregatedAiMeta = useMemo(() => {
    if (!asset || asset.aiMeta || constituentAssets.length === 0) return null
    const characters = new Set<string>()
    const scenes = new Set<string>()
    const locations = new Set<string>()
    for (const ca of constituentAssets) {
      ca.aiMeta?.characters?.forEach(c => characters.add(c))
      if (ca.aiMeta?.scene) scenes.add(ca.aiMeta.scene)
      if (ca.aiMeta?.location) locations.add(ca.aiMeta.location)
    }
    return {
      characters: Array.from(characters),
      scenes: Array.from(scenes),
      locations: Array.from(locations),
    }
  }, [asset, constituentAssets])

  const duration = getDuration(asset)

  const assetCollections = visibleCollections.filter(c =>
    c.assetIds.some(aid => assetIdVariants.has(aid))
  )

  const orderedCollectionItems = [...assetCollections]
    .map((collection, index) => ({ collection, index }))
    .sort((left, right) => {
      const leftIsCurrent = left.collection.id === activeCollectionId
      const rightIsCurrent = right.collection.id === activeCollectionId

      if (leftIsCurrent !== rightIsCurrent) {
        return leftIsCurrent ? -1 : 1
      }

      const createdAtDiff = right.collection.createdAt.getTime() - left.collection.createdAt.getTime()
      if (createdAtDiff !== 0) return createdAtDiff

      return left.index - right.index
    })
    .map(({ collection }) => ({
      key: collection.id,
      label: collection.name,
      href: collection.id === activeCollectionId ? null : `/nextgen/collections/${collection.id}`,
      kind: 'Collection' as const,
      icon: 'collection' as const,
      isActive: collection.id === activeCollectionId,
    }))

  // Build smart collection dimension arrays for OntologySection
  // For cuts without their own aiMeta, use aggregated metadata from constituents
  const effectiveCharacters = asset.aiMeta?.characters ?? aggregatedAiMeta?.characters ?? []
  const effectiveScenes = asset.aiMeta?.scene ? [asset.aiMeta.scene] : aggregatedAiMeta?.scenes ?? []
  const effectiveLocations = asset.aiMeta?.location ? [asset.aiMeta.location] : aggregatedAiMeta?.locations ?? []

  const characterCollections = effectiveCharacters
    .map(c => getCollection(`smart-character--${slugify(c)}`))
    .filter((c): c is NonNullable<typeof c> => !!c && c.id !== activeCollectionId)

  const sceneCollections = effectiveScenes
    .map(s => getCollection(`smart-scene--${slugify(s)}`))
    .filter((c): c is NonNullable<typeof c> => !!c && c.id !== activeCollectionId)

  const locationCollections = effectiveLocations
    .map(l => getCollection(`smart-location--${slugify(l)}`))
    .filter((c): c is NonNullable<typeof c> => !!c && c.id !== activeCollectionId)

  // Build container items for OntologySection (workspace folder + user collections)
  // Suppress the current context: hide workspace folder when browsing workspace, hide active collection
  const suppressWorkspace = activeContext?.type === 'workspace'
  const containerItems: ContainerItem[] = [
    ...(!suppressWorkspace && workspaceFolderInfo ? [{
      key: `workspace-${workspaceFolderInfo.label}`,
      label: workspaceFolderInfo.label,
      href: workspaceFolderInfo.href,
      kind: 'Folder',
      icon: 'folder' as const,
    }] : []),
    ...orderedCollectionItems
      .filter(item => !item.isActive)
      .map(item => ({
        key: item.key,
        label: item.label,
        href: item.href,
        kind: item.kind,
        icon: item.icon,
        isShared: (() => {
          const coll = visibleCollections.find(c => c.id === item.key)
          return !!(coll && coll.createdBy !== activePersona?.email)
        })(),
      })),
  ]

  const connectionsCount =
    characterCollections.length +
    sceneCollections.length +
    locationCollections.length +
    (contextGroups ?? []).length +
    assetCuts.length +
    constituentAssets.length +
    containerItems.length

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <span className="text-body-0-bold text-foreground">Asset Info</span>
        <Button variant="icon" compact onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="flex-1 min-h-0 flex flex-col">
        <TabsList className="px-4 shrink-0">
          <Tab value="details">Details</Tab>
          <Tab value="connections"><span className="flex items-center gap-1.5">Connections{connectionsCount > 0 && <Tag size="compact" type="neutral" variant="border">{connectionsCount}</Tag>}</span></Tab>
          <Tab value="access">Access</Tab>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="details" className="px-4 pb-4 space-y-4">
            {/* Metadata */}
            <section className="space-y-2">
              <div className="space-y-2">
                <div>
                  <p className="text-body-0-regular text-foreground-dim">File name</p>
                  <p className="text-body-0-regular text-foreground">{asset.name}</p>
                </div>
                <div>
                  <p className="text-body-0-regular text-foreground-dim">Type</p>
                  <p className="text-body-0-regular text-foreground capitalize">{asset.type}</p>
                </div>
                {asset.department && (
                  <div>
                    <p className="text-body-0-regular text-foreground-dim">Department</p>
                    <p className="text-body-0-regular text-foreground">
                      {DEPARTMENT_NAMES[asset.department]}
                    </p>
                  </div>
                )}
                {duration && (
                  <div>
                    <p className="text-body-0-regular text-foreground-dim">Duration</p>
                    <p className="text-body-0-regular text-foreground">{duration}</p>
                  </div>
                )}
                {asset.version != null && (
                  <div>
                    <p className="text-body-0-regular text-foreground-dim">Version</p>
                    <p className="text-body-0-regular text-foreground">V{asset.version}</p>
                  </div>
                )}
                {asset.extension && (
                  <div>
                    <p className="text-body-0-regular text-foreground-dim">Format</p>
                    <p className="text-body-0-regular text-foreground">{asset.extension.toUpperCase()}</p>
                  </div>
                )}
                {asset.type === 'shot' && asset.shotMeta && (
                  <>
                    {asset.shotMeta.scene && (
                      <div>
                        <p className="text-body-0-regular text-foreground-dim">Scene</p>
                        <p className="text-body-0-regular text-foreground">{asset.shotMeta.scene}</p>
                      </div>
                    )}
                    {asset.shotMeta.take && (
                      <div>
                        <p className="text-body-0-regular text-foreground-dim">Take</p>
                        <p className="text-body-0-regular text-foreground">{asset.shotMeta.take}</p>
                      </div>
                    )}
                    {asset.shotMeta.camera && (
                      <div>
                        <p className="text-body-0-regular text-foreground-dim">Camera</p>
                        <p className="text-body-0-regular text-foreground">{asset.shotMeta.camera}</p>
                      </div>
                    )}
                  </>
                )}
                {asset.workspacePath && (
                <div>
                  <p className="text-body-0-regular text-foreground-dim">Location</p>
                  <p className="text-body-0-regular text-foreground">
                    {asset.department ? `${DEPARTMENT_NAMES[asset.department]} / ` : ''}{asset.workspacePath}
                  </p>
                </div>
              )}
              {asset.created_at && (
                  <div>
                    <p className="text-body-0-regular text-foreground-dim">Created</p>
                    <p className="text-body-0-regular text-foreground">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {asset.modifiedBy && (
                  <div>
                    <p className="text-body-0-regular text-foreground-dim">Modified by</p>
                    <p className="text-body-0-regular text-foreground">
                      {PERSONAS.find(p => p.email === asset.modifiedBy)?.name ?? asset.modifiedBy}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Version History */}
            {olderVersions && olderVersions.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-body-0-bold text-foreground-dim">Version History</h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-1 text-body-0-regular">
                    <span className="text-foreground">V{asset.version} <span className="text-foreground-dim">(current)</span></span>
                  </div>
                  {olderVersions.map(v => (
                    <button
                      key={v.id}
                      onClick={() => onVersionSelect?.(v)}
                      className="flex items-center justify-between py-1 text-body-0-regular text-foreground-dim hover:text-foreground-system-link transition-colors w-full text-left"
                    >
                      <span>V{v.version}</span>
                      {v.created_at && <span className="text-label-0-regular">{new Date(v.created_at).toLocaleDateString()}</span>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {(() => {
              const assetTags = asset.tags ?? []
              const userTags = (userTagsMap[asset.id] ?? []).map(label => ({ label, source: 'user' as const }))
              const allTags = [...assetTags, ...userTags]
              // Get the typeTag (first system tag that isn't a status) to filter duplicate keywords
              const typeTagLabel = assetTags.find(t => t.source === 'system' && t.label !== 'Key Art' && t.label !== 'Final')?.label?.toLowerCase()
              const displayTags = allTags.filter(t => {
                // Remove system tags except Key Art / Final
                if (t.source === 'system' && t.label !== 'Key Art' && t.label !== 'Final') return false
                // Remove AI keywords that are part of the typeTag (e.g. "Plate" when typeTag is "VFX Plate")
                if (t.source === 'ai' && typeTagLabel && typeTagLabel.includes(t.label.toLowerCase())) return false
                return true
              })
              return (
                <section className="space-y-2">
                  <h3 className="text-body-0-bold text-foreground-dim">Tags</h3>
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
                    {canEdit(asset.id) && (
                      <>
                        <button
                          onClick={() => setTagModalOpen(true)}
                          className="inline-flex items-center gap-0.5 px-1 py-0 rounded border border-border-dim text-label-0-bold text-foreground-dim hover:text-foreground hover:border-border-subtle transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                        <TagManagerModal
                          open={tagModalOpen}
                          onClose={() => setTagModalOpen(false)}
                          tags={asset.tags ?? []}
                          userTags={userTagsMap[asset.id] ?? []}
                          onAddTag={(label) => addUserTag(asset.id, label)}
                          onRemoveTag={(label) => removeUserTag(asset.id, label)}
                        />
                      </>
                    )}
                  </div>
                </section>
              )
            })()}
          </TabsContent>

          <TabsContent value="connections" className="px-4 pb-4 space-y-4">
            <OntologySection
              dimensions={{
                characters: characterCollections,
                scenes: sceneCollections,
                locations: locationCollections,
              }}
              suppressDimension={activeCollectionDimension}
              contextGroups={contextGroups}
              onAssetClick={onContextAssetClick}
              cuts={assetCuts}
              constituents={constituentAssets.length > 0 ? constituentAssets : undefined}
              containers={containerItems}
            />
            {reviewNoteSummary && (
              <CreativeReviewCard summary={reviewNoteSummary} />
            )}
          </TabsContent>

          <TabsContent value="access" className="px-4 pb-4">
            <AccessSummary
              resourceId={asset.id}
              resourceRef={resourceRef}
              inheritedGrants={inheritedGrants}
              resourceName={asset.name}
            />
          </TabsContent>
        </div>
      </Tabs>
    </>
  )
}

export function AssetDetailPanel({ asset, open, ...contentProps }: AssetDetailPanelProps) {
  if (!asset) {
    return <ResponsivePanel open={false} onClose={contentProps.onClose}><div /></ResponsivePanel>
  }

  return (
    <ResponsivePanel open={open} onClose={contentProps.onClose}>
      <AssetDetailPanelContent asset={asset} {...contentProps} />
    </ResponsivePanel>
  )
}
