'use client'

import { useMemo, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { X, Plus, EyeOff, ChevronDown } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { ActivityFeed } from './activity-feed'
import type { ActivityEvent } from './activity-feed'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { AccessModal } from './access-modal'
import { Tag } from './tag'
import { Chip } from './chip'
import { Tooltip } from './tooltip'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import type { Asset, DomainId } from '@/lib/data'
import type { ResourceRef, Grant, RoleGroup } from '@/lib/grants'
import { isGrantActive, RELEASE_DOMAINS } from '@/lib/grants'
import { GrantBadge } from './grant-badge'
import { useAccess, useFileTree, usePersona, useSmartCollections, useCuts } from '@/hooks'
import { getCutStageLabel } from '@/lib/cuts'
import { DOMAIN_FOLDER_MAP } from '@/lib/workspace-data'
import { useUserCollections } from '@/hooks/useUserCollections'
import { PERSONAS } from '@/lib/personas'
import { TEAMS } from '@/lib/teams'
import { slugify } from '@/lib/smart-collection-filters'
import { getCGShot, getCGSequence, getProductionShot, getProductionScene } from '@/lib/ontology-meta'
import { OntologySection } from './ontology-section'
import type { ContainerItem } from './ontology-section'
import type { RelatedAssetGroup } from '@/lib/context-relationships'

import { Modal } from './modal'
import { PrincipalAvatar } from './principal-avatar'
import { CollectionAccessSourceRow, FolderAccessSourceRow, getAccessSourcePeopleLabel } from './collection-access-source-row'
import type { AssetTag } from '@/lib/data'
import {
  normalizeUserTagLabel,
  normalizeUserTagKey,
  readUserTagsMap,
  writeUserTagsMap,
} from '@/lib/user-tags'

const HIDDEN_ASSET_TAGS_STORAGE_KEY = 'asset-hidden-tags'

type HiddenAssetTagsMap = Record<string, string[]>

function readHiddenAssetTagsMap(): HiddenAssetTagsMap {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(HIDDEN_ASSET_TAGS_STORAGE_KEY)
    return stored ? JSON.parse(stored) as HiddenAssetTagsMap : {}
  } catch {
    return {}
  }
}

function writeHiddenAssetTagsMap(hiddenTags: HiddenAssetTagsMap) {
  localStorage.setItem(HIDDEN_ASSET_TAGS_STORAGE_KEY, JSON.stringify(hiddenTags))
}

function uniqueTagsByLabel(tags: AssetTag[]): AssetTag[] {
  const seen = new Set<string>()
  return tags.filter((tag) => {
    const key = normalizeUserTagKey(tag.label)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function MetaRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-body-0-regular text-foreground-dim flex-shrink-0">{label}</span>
      <span className={`text-body-0-regular text-foreground text-right truncate ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  )
}

function resolvePrincipalName(principal: Grant['principal']): string {
  if (principal.type === 'user') {
    return PERSONAS.find(p => p.id === principal.userId)?.name ?? principal.userId
  }
  if (principal.type === 'domain') {
    const domain = RELEASE_DOMAINS.find(d => d.id === principal.domainId)
    return domain ? `${domain.name} (${domain.group})` : principal.domainId
  }
  return TEAMS.find(t => t.id === principal.teamId)?.name ?? principal.teamId
}


function CapabilityLabels({ grant, roleGroups }: { grant: Grant; roleGroups: RoleGroup[] }) {
  return (
    <div className="inline-flex h-5 items-center flex-shrink-0 whitespace-nowrap">
      <GrantBadge grant={grant} roleGroups={roleGroups} />
    </div>
  )
}

function formatSharedAt(grantedAt?: string): string | undefined {
  if (!grantedAt) return undefined
  const date = new Date(grantedAt)
  if (Number.isNaN(date.getTime())) return undefined
  const hasTime = /[T ]\d{2}:\d{2}/.test(grantedAt)
  if (!hasTime) return formatDate(grantedAt)

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function AccessGrantRow({
  grant,
  roleGroups,
  name,
  metadata,
  action,
}: {
  grant: Grant
  roleGroups: RoleGroup[]
  name: string
  metadata?: string
  action?: ReactNode
}) {
  const sharedAt = formatSharedAt(grant.grantedAt)
  const sharedBy = PERSONAS.find(p => p.id === grant.grantedByUserId)
  const nameNode = sharedAt ? (
    <Tooltip
      label={`Shared on ${sharedAt}`}
      description={sharedBy ? `by ${sharedBy.name}` : undefined}
      position="top"
      className="min-w-0"
    >
      <span className="text-body-0-regular text-foreground truncate block">{name}</span>
    </Tooltip>
  ) : (
    <span className="text-body-0-regular text-foreground truncate block">{name}</span>
  )

  return (
    <div className="py-0.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <PrincipalAvatar principal={grant.principal} />
          {nameNode}
        </div>
        <div className="flex h-5 items-center justify-end gap-2 flex-shrink-0">
          <CapabilityLabels grant={grant} roleGroups={roleGroups} />
          {action}
        </div>
      </div>
      {metadata && (
        <span className="pl-7 text-body-0-regular text-foreground-dim block">
          {metadata}
        </span>
      )}
    </div>
  )
}

function AssetAccessView({ assetId, inheritedGrants, resourceRef, resourceName, currentCollectionId }: {
  assetId: string
  inheritedGrants: { grant: Grant; fromResourceName: string }[]
  resourceRef?: ResourceRef
  resourceName?: string
  currentCollectionId?: string
}) {
  const { getResourceGrants, roleGroups, revokeGrant, getResourceGuestLinks, revokeGuestLink } = useAccess()
  const { collections } = useUserCollections()
  const { activePersona } = usePersona()
  const { resolveCollectionAssetIds } = useFileTree()
  const [modalOpen, setModalOpen] = useState(false)

  const folderAccessSources = useMemo(() => {
    const sources = new Map<string, { id: string; name: string; grants: Grant[] }>()
    for (const { grant, fromResourceName } of inheritedGrants) {
      if (!isGrantActive(grant)) continue
      const existing = sources.get(grant.resource.id)
      if (existing) {
        existing.grants.push(grant)
      } else {
        sources.set(grant.resource.id, { id: grant.resource.id, name: fromResourceName, grants: [grant] })
      }
    }
    return Array.from(sources.values())
  }, [inheritedGrants])

  // Direct grants on this asset
  const directGrants = useMemo(() => {
    return getResourceGrants(assetId).filter(g => isGrantActive(g))
  }, [assetId, getResourceGrants])

  // Collection-mediated access — every collection containing this asset, with its grants
  const sharedCollections = useMemo(() => {
    const results: { collection: { id: string; name: string }; grants: Grant[] }[] = []
    for (const collection of collections) {
      const collectionAssetIds = new Set(resolveCollectionAssetIds(collection))
      const hasAsset = collectionAssetIds.has(assetId)
      if (!hasAsset) continue
      const grants = getResourceGrants(collection.id)
        .filter(g => isGrantActive(g))
        .filter(g => !(g.principal.type === 'user' && g.principal.userId === g.grantedByUserId))
      if (grants.length === 0) continue
      results.push({ collection: { id: collection.id, name: collection.name }, grants })
    }
    return results
  }, [collections, assetId, getResourceGrants, resolveCollectionAssetIds])

  const hasAnything = folderAccessSources.length > 0 || directGrants.length > 0 || sharedCollections.length > 0

  return (
    <section className="space-y-3">
      {folderAccessSources.length > 0 && (
        <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
          <span className="text-body-0-regular text-foreground-dim">Folder</span>
          {folderAccessSources.map((source) => (
            <FolderAccessSourceRow
              key={source.id}
              name={source.name}
              grants={source.grants}
              roleGroups={roleGroups}
              roleDisplay="text"
            />
          ))}
        </div>
      )}

      {/* Collection-mediated access — each in its own card */}
      {sharedCollections.map(({ collection, grants }) => {
        const sharedByGrant = grants[0]
        const sharedByPersona = sharedByGrant ? PERSONAS.find(p => p.id === sharedByGrant.grantedByUserId) : null
        const sharedByName = sharedByPersona
          ? (sharedByPersona.id === activePersona?.id ? 'you' : sharedByPersona.name)
          : null
        const collectionMetadata = sharedByName
          ? `Shared by ${sharedByName}${sharedByGrant?.grantedAt ? ` on ${formatDate(sharedByGrant.grantedAt)}` : ''}`
          : undefined
        return (
        <div key={collection.id} className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
          <span className="text-body-0-regular text-foreground-dim truncate block">
            {collection.id === currentCollectionId ? 'This collection' : 'Collection'}
          </span>
          <CollectionAccessSourceRow
            name={collection.name}
            grants={grants}
            roleGroups={roleGroups}
            roleDisplay="text"
          />
          {collectionMetadata && (
            <span className="text-body-0-regular text-foreground-dim block">
              {collectionMetadata}
            </span>
          )}
        </div>
        )
      })}

      {/* Released to domains */}
      {directGrants.filter(g => g.principal.type === 'domain').length > 0 && (
        <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
          <span className="text-body-0-regular text-foreground-dim">Released</span>
          {directGrants.filter(g => g.principal.type === 'domain').map(grant => {
            const name = resolvePrincipalName(grant.principal)
            return (
              <AccessGrantRow
                key={grant.id}
                grant={grant}
                roleGroups={roleGroups}
                name={name}
                action={(
                  <button
                    onClick={() => revokeGrant(grant.id)}
                    className="inline-flex h-5 items-center text-body-0-regular text-foreground-system-error hover:opacity-80 transition-colors"
                  >
                    Remove
                  </button>
                )}
              />
            )
          })}
        </div>
      )}

      {/* Shared directly with people/teams */}
      {directGrants.filter(g => g.principal.type !== 'domain').length > 0 && (
        <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
          <span className="text-body-0-regular text-foreground-dim">Shared directly</span>
          {directGrants.filter(g => g.principal.type !== 'domain').map(grant => {
            const name = resolvePrincipalName(grant.principal)
            return (
              <AccessGrantRow
                key={grant.id}
                grant={grant}
                roleGroups={roleGroups}
                name={name}
                action={(
                  <button
                    onClick={() => revokeGrant(grant.id)}
                    className="inline-flex h-5 items-center text-body-0-regular text-foreground-system-error hover:opacity-80 transition-colors"
                  >
                    Remove
                  </button>
                )}
              />
            )
          })}
        </div>
      )}

      {/* Guest links */}
      {(() => {
        const links = getResourceGuestLinks(assetId)
        if (links.length === 0) return null
        return (
          <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
            <span className="text-body-0-regular text-foreground-dim">Guest links</span>
            {links.map(link => (
              <div key={link.id} className="flex items-center justify-between gap-2">
                <span className="text-body-0-regular text-foreground truncate">
                  {link.allowDownload ? 'View + Download' : 'View only'}
                  {link.expiresAt && <span className="text-foreground-dim"> · expires {link.expiresAt}</span>}
                </span>
                <button
                  onClick={() => revokeGuestLink(link.id)}
                  className="text-body-0-regular text-foreground-system-error hover:opacity-80 transition-colors flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )
      })()}

      {!hasAnything && getResourceGuestLinks(assetId).length === 0 && (
        <p className="text-body-0-regular text-foreground-dim">Not shared</p>
      )}


      <AccessModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        resourceId={assetId}
        resourceRef={resourceRef}
        inheritedGrants={inheritedGrants.map(ig => ({ grant: ig.grant, fromResourceName: ig.fromResourceName }))}
        title={resourceName}
      />
    </section>
  )
}

function TagManagerModal({
  open,
  onClose,
  readonlyTags,
  editableTags,
  onAddTag,
  onRemoveTag,
}: {
  open: boolean
  onClose: () => void
  readonlyTags: AssetTag[]
  editableTags: AssetTag[]
  onAddTag: (label: string) => void
  onRemoveTag: (label: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} size="xs">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-body-1-bold text-foreground">Edit Tags</h2>
          <Button variant="icon" compact onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <p className="text-body-0-regular text-foreground-dim">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {readonlyTags.map(t => (
              <Tooltip
                key={t.label}
                label="Read-only"
                description="This tag is assigned from project metadata and cannot be edited here."
              >
                <Chip size="compact">{t.label}</Chip>
              </Tooltip>
            ))}
            {editableTags.map(tag => (
              <Chip
                key={tag.label}
                size="compact"
                onDismiss={() => onRemoveTag(tag.label)}
                dismissLabel={`Remove ${tag.label}`}
              >
                {tag.label}
              </Chip>
            ))}
            {readonlyTags.length === 0 && editableTags.length === 0 && (
              <span className="text-body-0-regular text-foreground-dim">None yet</span>
            )}
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

const DOMAIN_NAMES: Record<DomainId, string> = {
  'art-design': 'Art & Design',
  'vfx': 'VFX',
  'camera': 'Camera',
  'editorial': 'Editorial',
  'audio-sound': 'Audio & Sound',
  'marketing': 'Marketing',
  'legal': 'Legal',
  'globalization': 'Globalization',
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
  activeCollectionId,
  activeContext,
  contextGroups,
  onContextAssetClick,
  cuts,
  onVersionSelect,
}: AssetDetailPanelContentProps) {
  const { getInheritedGrants, visibleCollections, canEdit, canShare, isSensitiveAsset } = useAccess()
  const { activePersona } = usePersona()
  const { getDomainFiles, assetById } = useFileTree()
  const { getCollection } = useSmartCollections()
  const { getCutsForAsset, getVersionsForGroup } = useCuts()

  // For cuts: all versions in this group for the version switcher
  const allVersions = useMemo(() => {
    if (asset.kind !== 'cut' || !asset.versionGroupId) return []
    return getVersionsForGroup(asset.versionGroupId)
  }, [asset, getVersionsForGroup])


  const assetActivity = useMemo((): ActivityEvent[] => {
    if (!asset) return []
    const events: ActivityEvent[] = []
    if (asset.created_at) {
      events.push({
        id: 'created',
        icon: 'file-add',
        text: asset.modifiedBy ? `Created by ${asset.modifiedBy}` : 'File created',
        date: asset.created_at,
      })
    }
    return events.sort((a, b) => b.date.localeCompare(a.date))
  }, [asset])

  const resourceRef: ResourceRef | undefined = asset ? {
    id: asset.id,
    type: asset.kind === 'cut' ? 'cut' : 'asset',
    domainId: asset.department,
  } : undefined

  const folderInheritedGrants = useMemo(() => {
    if (!asset) return []
    return getInheritedGrants(asset.id)
  }, [asset, getInheritedGrants])

  // User tags from localStorage
  const [userTagsMap, setUserTagsMap] = useState<Record<string, string[]>>({})
  const [hiddenTagsMap, setHiddenTagsMap] = useState<HiddenAssetTagsMap>({})

  useEffect(() => {
    try {
      setUserTagsMap(readUserTagsMap())
      setHiddenTagsMap(readHiddenAssetTagsMap())
    } catch {
      setUserTagsMap({})
      setHiddenTagsMap({})
    }
  }, [])

  const addUserTag = useCallback((assetId: string, rawLabel: string) => {
    const label = normalizeUserTagLabel(rawLabel)
    setUserTagsMap(prev => {
      const existing = prev[assetId] ?? []
      if (existing.includes(label)) return prev
      const next = { ...prev, [assetId]: [...existing, label] }
      try {
        writeUserTagsMap(next)
      } catch { /* ignore */ }
      return next
    })
  }, [])

  const removeUserTag = useCallback((assetId: string, label: string) => {
    setUserTagsMap(prev => {
      const existing = prev[assetId] ?? []
      const next = { ...prev, [assetId]: existing.filter(t => t !== label) }
      try {
        writeUserTagsMap(next)
      } catch { /* ignore */ }
      return next
    })
  }, [])

  const hideAssetTag = useCallback((assetId: string, label: string) => {
    const normalizedLabel = normalizeUserTagLabel(label)
    setHiddenTagsMap(prev => {
      const existing = prev[assetId] ?? []
      if (existing.some(candidate => normalizeUserTagKey(candidate) === normalizeUserTagKey(normalizedLabel))) return prev
      const next = { ...prev, [assetId]: [...existing, normalizedLabel] }
      try {
        writeHiddenAssetTagsMap(next)
      } catch { /* ignore */ }
      return next
    })
  }, [])

  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)

  const workspaceFolderInfo = useMemo(() => {
    if (!asset) return null
    if (!asset.department || !asset.workspacePath) return null

    const pathParts = asset.workspacePath.split('/').filter(Boolean)
    const folderNames = pathParts.slice(0, -1)
    const fullLabel = `/Apex S1/${DOMAIN_NAMES[asset.department]}${folderNames.length > 0 ? `/${folderNames.join('/')}` : ''}`

    if (folderNames.length === 0) {
      const domainRootId = DOMAIN_FOLDER_MAP[asset.department]?.id
      return {
        label: fullLabel,
        href: domainRootId ? `/nextgen/workspace/${domainRootId}` : null,
        folderId: domainRootId,
      }
    }

    const folderIds: string[] = []
    let currentNodes = getDomainFiles(asset.department)

    for (const folderName of folderNames) {
      const match = currentNodes.find((node) => node.type === 'folder' && node.name === folderName)
      if (!match || match.type !== 'folder') {
        return { label: fullLabel, href: null, folderId: undefined }
      }
      folderIds.push(match.id)
      currentNodes = match.children ?? []
    }

    const domainRootId = DOMAIN_FOLDER_MAP[asset.department]?.id
    if (!domainRootId) {
      return { label: fullLabel, href: null, folderId: folderIds[folderIds.length - 1] }
    }

    return {
      label: fullLabel,
      href: `/nextgen/workspace/${domainRootId}/${folderIds.join('/')}`,
      folderId: folderIds[folderIds.length - 1],
    }
  }, [asset, getDomainFiles])

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

  // Resolve constituent (source) Media Assets for any Composite Concept Asset.
  // Each Concept kind has a different idea of "what's inside me":
  // - Cut: explicit constituent IDs (set by seedCutToAsset)
  // - Production Shot: Media Asset files tagged with aiMeta.productionShot
  // - CG Shot: Media Asset files tagged with aiMeta.cgShot (plates, comps)
  // - CG Sequence: its CG Shots (structural children; the Shots in turn
  //   carry the Media Asset files)
  const constituentAssets = useMemo(() => {
    if (!asset) return []
    if (asset.kind === 'cut' && asset.constituents) {
      return asset.constituents
        .map(cid => assetById.get(cid))
        .filter((a): a is Asset => !!a)
    }
    if (asset.kind === 'production-shot' || asset.kind === 'cg-shot') {
      const field = asset.kind === 'production-shot' ? 'productionShot' : 'cgShot'
      const out: Asset[] = []
      assetById.forEach((candidate) => {
        if (candidate.id === asset.id) return
        // Skip other Composite Concept projections — they're related entities
        // (e.g., a CG Shot that REPLACES a Production Shot), not file constituents.
        if (candidate.kind && candidate.kind !== 'file') return
        if (candidate.aiMeta?.[field] === asset.id) out.push(candidate)
      })
      return out
    }
    if (asset.kind === 'cg-sequence') {
      const out: Asset[] = []
      assetById.forEach((candidate) => {
        if (candidate.kind === 'cg-shot' && candidate.aiMeta?.cgSequence === asset.id) {
          out.push(candidate)
        }
      })
      return out
    }
    return []
  }, [asset, assetById])

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

  const assetCollections = useMemo(() => visibleCollections.filter(c =>
    asset ? c.assetIds.includes(asset.id) : false
  ), [visibleCollections, asset])

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
      kind: 'Collection',
      icon: 'collection' as const,
      locked: false,
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
        <span className="text-body-0-bold text-foreground truncate">{asset.name}</span>
        <Button variant="icon" compact onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="flex-1 min-h-0 flex flex-col">
        <TabsList className="px-4 shrink-0">
          <Tab value="details">Details</Tab>
          <Tab value="connections">Connections{connectionsCount > 0 && <span className="text-foreground-subtle ml-2">{connectionsCount}</span>}</Tab>
          {(activePersona?.isAdmin || (resourceRef && canShare(resourceRef))) && <Tab value="access">Access</Tab>}
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="details" className="px-4 pb-4 space-y-4">
            {/* Metadata */}
            <section className="space-y-1.5">
              <MetaRow label="File name" value={asset.name} />
              <MetaRow label="Type" value={asset.type} capitalize />
              {isSensitiveAsset(asset.id) && (
                <div className="flex items-center gap-1.5 py-0.5">
                  <EyeOff className="w-3.5 h-3.5 text-foreground-dim" />
                  <Tag size="compact" type="notice" variant="fill">Sensitive</Tag>
                </div>
              )}
              {asset.department && <MetaRow label="Department" value={DOMAIN_NAMES[asset.department]} />}
              {duration && <MetaRow label="Duration" value={duration} />}
              {asset.version != null && <MetaRow label="Version" value={`V${asset.version}`} />}
              {asset.extension && <MetaRow label="Format" value={asset.extension.toUpperCase()} />}
              {asset.type === 'shot' && asset.shotMeta && (
                <>
                  {asset.shotMeta.scene && <MetaRow label="Scene" value={asset.shotMeta.scene} />}
                  {asset.shotMeta.take && <MetaRow label="Take" value={asset.shotMeta.take} />}
                  {asset.shotMeta.camera && <MetaRow label="Camera" value={asset.shotMeta.camera} />}
                </>
              )}
              {/* Production Shot Concept extras — lens, circle take, plus the
                  linked Production Scene's shoot day metadata. */}
              {asset.kind === 'production-shot' && (() => {
                const meta = getProductionShot(asset.id)
                if (!meta) return null
                const scene = getProductionScene(meta.productionScene)
                return (
                  <>
                    {meta.lens && <MetaRow label="Lens" value={meta.lens} />}
                    {meta.circle && <MetaRow label="Circle take" value="Yes" />}
                    {scene?.shootDate && <MetaRow label="Shot on" value={new Date(scene.shootDate).toLocaleDateString()} />}
                    {scene?.unit && <MetaRow label="Unit" value={scene.unit} />}
                    {scene?.shootDay != null && <MetaRow label="Shoot day" value={`Day ${scene.shootDay}`} />}
                  </>
                )
              })()}
              {/* CG Shot Concept extras — vendor, status from the ontology meta */}
              {asset.kind === 'cg-shot' && (() => {
                const meta = getCGShot(asset.id)
                if (!meta) return null
                return (
                  <>
                    {meta.vendor && <MetaRow label="Vendor" value={meta.vendor} />}
                    {meta.status && <MetaRow label="Status" value={meta.status} capitalize />}
                  </>
                )
              })()}
              {/* CG Sequence Concept extras */}
              {asset.kind === 'cg-sequence' && (() => {
                const meta = getCGSequence(asset.id)
                if (!meta) return null
                return (
                  <>
                    {meta.vendor && <MetaRow label="Vendor" value={meta.vendor} />}
                    {meta.status && <MetaRow label="Status" value={meta.status} capitalize />}
                  </>
                )
              })()}
              {asset.workspacePath && (
                <MetaRow label="Location" value={`${asset.department ? `${DOMAIN_NAMES[asset.department]} / ` : ''}${asset.workspacePath}`} />
              )}
              {asset.created_at && <MetaRow label="Created" value={new Date(asset.created_at).toLocaleDateString()} />}
              {asset.modifiedBy && <MetaRow label="Modified by" value={PERSONAS.find(p => p.email === asset.modifiedBy)?.name ?? asset.modifiedBy} />}
            </section>

            {/* Version History — only shown when version switching is available (full asset page) */}
            {allVersions.length > 1 && onVersionSelect && (
              <section>
                <button
                  onClick={() => setVersionHistoryOpen(prev => !prev)}
                  className="flex items-center justify-between w-full py-1 text-left"
                >
                  <span className="text-body-0-bold text-foreground-dim">Version History</span>
                  <span className="flex items-center gap-1">
                    <span className="text-label-0-regular text-foreground-subtle">{allVersions.length}</span>
                    <ChevronDown className={cn('w-3.5 h-3.5 text-foreground-dim transition-transform', !versionHistoryOpen && '-rotate-90')} />
                  </span>
                </button>
                {versionHistoryOpen && (
                  <div className="space-y-0.5 mt-1">
                    {allVersions.map(v => {
                      const isCurrent = v.id === asset.id
                      const stageLabel = v.stage ? getCutStageLabel(v.stage) : null
                      const versionLabel = stageLabel
                        ? `${stageLabel} V${v.version}`
                        : `V${v.version}`
                      return (
                        <button
                          key={v.id}
                          onClick={() => !isCurrent && onVersionSelect?.(v)}
                          disabled={isCurrent}
                          className={cn(
                            'flex items-center justify-between w-full text-left rounded px-2 py-1.5 transition-colors',
                            isCurrent
                              ? 'bg-surface-selected text-foreground'
                              : 'text-foreground-dim hover:text-foreground hover:bg-surface-2',
                          )}
                        >
                          <span className="text-body-0-regular">{versionLabel}</span>
                          {v.created_at && <span className="text-label-0-regular text-foreground-dim">{formatDate(v.created_at)}</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Tags */}
            {(() => {
              const hiddenTagKeys = new Set((hiddenTagsMap[asset.id] ?? []).map(normalizeUserTagKey))
              const assetTags = (asset.tags ?? []).filter(tag => !hiddenTagKeys.has(normalizeUserTagKey(tag.label)))
              const userTagLabels = userTagsMap[asset.id] ?? []
              const userTags = userTagLabels.map(label => ({ label, source: 'user' as const }))
              const allTags = [...assetTags, ...userTags]
              // Get the typeTag (first system tag that isn't a status) to filter duplicate keywords
              const typeTagLabel = assetTags.find(t => t.source === 'system' && t.label !== 'Key Art' && t.label !== 'Final')?.label?.toLowerCase()
              const seen = new Set<string>()
              const displayTags = allTags.filter(t => {
                // Remove system tags except Key Art / Final
                if (t.source === 'system' && t.label !== 'Key Art' && t.label !== 'Final') return false
                // Remove AI keywords that are part of the typeTag (e.g. "Plate" when typeTag is "VFX Plate")
                if (t.source === 'ai' && typeTagLabel && typeTagLabel.includes(t.label.toLowerCase())) return false
                // Deduplicate by label
                if (seen.has(t.label)) return false
                seen.add(t.label)
                return true
              })
              const readonlyTags = assetTags.filter(tag => tag.source === 'system')
              const editableTags = uniqueTagsByLabel([
                ...assetTags.filter(tag => tag.source === 'ai'),
                ...assetTags.filter(tag => tag.source === 'user'),
                ...userTags,
              ])
              const removeEditableTag = (label: string) => {
                const isStoredUserTag = userTagLabels.some(candidate => normalizeUserTagKey(candidate) === normalizeUserTagKey(label))
                if (isStoredUserTag) {
                  removeUserTag(asset.id, label)
                } else {
                  hideAssetTag(asset.id, label)
                }
              }
              return (
                <section className="space-y-2">
                  <h3 className="text-body-0-bold text-foreground-dim">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {displayTags.map(tag => (
                      <Chip
                        key={tag.label}
                        size="compact"
                      >
                        {tag.label}
                      </Chip>
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
                          readonlyTags={readonlyTags}
                          editableTags={editableTags}
                          onAddTag={(label) => addUserTag(asset.id, label)}
                          onRemoveTag={removeEditableTag}
                        />
                      </>
                    )}
                  </div>
                </section>
              )
            })()}

            {!activeCollectionId && <ActivityFeed events={assetActivity} />}
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
          </TabsContent>

          <TabsContent value="access" className="p-4">
            <AssetAccessView
              assetId={asset.id}
              inheritedGrants={folderInheritedGrants}
              resourceRef={resourceRef}
              resourceName={asset.name}
              currentCollectionId={activeCollectionId}
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
