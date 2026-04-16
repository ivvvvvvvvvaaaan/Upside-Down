'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { X, Plus, EyeOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Button } from './button'
import { Dropdown, DropdownMenuItem } from './dropdown'
import { ResponsivePanel } from './responsive-panel'
import { AccessModal } from './access-modal'
import { Tag } from './tag'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import { CreativeReviewCard } from './creative-review-card'
import type { Asset, DomainId } from '@/lib/data'
import type { ResourceRef, Grant, RoleGroup, PrincipalRef } from '@/lib/grants'
import { isGrantActive, RELEASE_DOMAINS } from '@/lib/grants'
import { GrantBadge } from './grant-badge'
import { useAccess, useFileTree, usePersona, useSmartCollections, useCuts } from '@/hooks'
import { getCutStageLabel } from '@/lib/cuts'
import { DOMAIN_FOLDER_MAP } from '@/lib/workspace-data'
import { useUserCollections } from '@/hooks/useUserCollections'
import { getReviewNoteSummary } from '@/lib/review-notes'
import type { ReviewNoteSummary } from '@/lib/review-notes'
import { PERSONAS } from '@/lib/personas'
import { TEAMS } from '@/lib/teams'
import { slugify } from '@/lib/smart-collection-filters'
import { OntologySection } from './ontology-section'
import type { ContainerItem } from './ontology-section'
import type { RelatedAssetGroup } from '@/lib/context-relationships'

import { Modal } from './modal'
import { Avatar } from './avatar'
import { DepartmentAvatar, ReleaseDomainAvatar } from './department-avatar'
import { PrincipalAvatar } from './principal-avatar'
import type { AssetTag } from '@/lib/data'

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
    <div className="flex-shrink-0">
      <GrantBadge grant={grant} roleGroups={roleGroups} />
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
  const { getResourceGrants, roleGroups, canShare, revokeGrant, getResourceGuestLinks, revokeGuestLink } = useAccess()
  const { collections, getCollection, removeAssetFromCollection } = useUserCollections()
  const { activePersona, isAdmin } = usePersona()
  const { resolveCollectionAssetIds } = useFileTree()
  const [modalOpen, setModalOpen] = useState(false)

  // Domain/inherited access (structural — not revocable from here)
  const domainEntries = useMemo(() => {
    return inheritedGrants.map(({ grant, fromResourceName }) => {
      const name = resolvePrincipalName(grant.principal)
      return { grant, name, source: fromResourceName }
    })
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
  }, [collections, assetId, getResourceGrants])

  const hasAnything = domainEntries.length > 0 || directGrants.length > 0 || sharedCollections.length > 0
  const canManageAccess = isAdmin || (resourceRef ? canShare(resourceRef) : false)

  return (
    <section className="space-y-3">
      {/* Department access */}
      {domainEntries.length > 0 && (
        <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-body-0-regular text-foreground-dim">Group</span>
          </div>
          {domainEntries.map(({ grant, name }) => (
            <div key={grant.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PrincipalAvatar principal={grant.principal} />
                <span className="text-body-0-regular text-foreground truncate">{name}</span>
              </div>
              <CapabilityLabels grant={grant} roleGroups={roleGroups} />
            </div>
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
        return (
        <div key={collection.id} className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-body-0-regular text-foreground">
              {collection.id === currentCollectionId
                ? <span className="text-foreground-dim">This collection</span>
                : <a href={`/nextgen/collections/${collection.id}`} className="text-foreground hover:text-foreground-subtle transition-colors">{collection.name}</a>
              }
            </span>
            {collection.id !== currentCollectionId && getCollection(collection.id) && (
              <button
                onClick={() => removeAssetFromCollection(collection.id, assetId)}
                className="text-body-0-regular text-foreground-system-error hover:opacity-80 transition-colors"
              >
                Revoke
              </button>
            )}
          </div>
          {grants.map(grant => {
            const name = resolvePrincipalName(grant.principal)
            return (
              <div key={grant.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <PrincipalAvatar principal={grant.principal} />
                  <span className="text-body-0-regular text-foreground truncate">{name}</span>
                </div>
                <CapabilityLabels grant={grant} roleGroups={roleGroups} />
              </div>
            )
          })}
          {sharedByName && (
            <span className="text-label-0-regular text-foreground-dim">
              Shared by {sharedByName}{sharedByGrant?.grantedAt ? ` on ${formatDate(sharedByGrant.grantedAt)}` : ''}
            </span>
          )}
        </div>
        )
      })}

      {/* Direct grants on this asset */}
      {directGrants.length > 0 && (
        <div className="bg-surface-low rounded-lg px-3 py-2.5 hover:bg-surface-mid transition-colors space-y-2">
          <span className="text-body-0-regular text-foreground-dim">Shared directly</span>
          {directGrants.map(grant => {
            const name = resolvePrincipalName(grant.principal)
            const grantSharedBy = PERSONAS.find(p => p.id === grant.grantedByUserId)?.name
            return (
              <div key={grant.id} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <PrincipalAvatar principal={grant.principal} />
                    <span className="text-body-0-regular text-foreground truncate">{name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <CapabilityLabels grant={grant} roleGroups={roleGroups} />
                  <button
                    onClick={() => revokeGrant(grant.id)}
                    className="text-body-0-regular text-foreground-system-error hover:opacity-80 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
              {grantSharedBy && (
                <span className="text-label-0-regular text-foreground-subtle pl-8">
                  by {grantSharedBy}{grant.grantedAt ? ` on ${grant.grantedAt}` : ''}
                </span>
              )}
              </div>
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
                  Revoke
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
          <Button variant="icon" compact onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
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
  const { getInheritedGrants, getCollectionRippleGrants, visibleCollections, canEdit, canAccess, canShare, isSensitiveAsset } = useAccess()
  const { activePersona } = usePersona()
  const { getDomainFiles, resolveCollectionAssetIds } = useFileTree()
  const { getCollection, scopedAssets } = useSmartCollections()
  const { getCutsForAsset, getVersionsForGroup } = useCuts()

  // For cuts: all versions in this group for the version switcher
  const allVersions = useMemo(() => {
    if (asset.kind !== 'cut' || !asset.versionGroupId) return []
    return getVersionsForGroup(asset.versionGroupId)
  }, [asset, getVersionsForGroup])

  // Auto-resolve review note summary if not passed as prop
  const resolvedReviewNoteSummary = useMemo(() => {
    if (reviewNoteSummary !== undefined && reviewNoteSummary !== null) return reviewNoteSummary
    if (!asset) return null
    // Check by asset ID, then by source file IDs
    return getReviewNoteSummary(asset.id)
      ?? (asset.sourceFolderIds?.map(id => getReviewNoteSummary(id)).find(Boolean) ?? null)
  }, [reviewNoteSummary, asset])

  const resourceRef: ResourceRef | undefined = asset ? {
    id: asset.id,
    type: asset.kind === 'cut' ? 'cut' : 'asset',
    domainId: asset.department,
  } : undefined

  const folderInheritedGrants = useMemo(() => {
    if (!asset) return []
    return getInheritedGrants(asset.id)
  }, [asset, getInheritedGrants])

  // Combined for the Manage Access modal (needs full picture)
  const allInheritedGrants = useMemo(() => {
    if (!asset) return []
    const collectionGrants = getCollectionRippleGrants(asset.id)
    return [...folderInheritedGrants, ...collectionGrants]
  }, [asset, folderInheritedGrants, getCollectionRippleGrants])

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

  // For cuts: resolve constituent assets and aggregate their AI metadata for dimensions
  const constituentAssets = useMemo(() => {
    if (!asset || asset.kind !== 'cut' || !asset.constituents) return []
    return asset.constituents
      .map(cid => scopedAssets.find(a => a.id === cid))
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
    asset ? c.assetIds.includes(asset.id) : false
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
                {isSensitiveAsset(asset.id) && (
                  <div className="flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-foreground-dim" />
                    <Tag size="compact" type="notice" variant="fill">Sensitive</Tag>
                  </div>
                )}
                {asset.department && (
                  <div>
                    <p className="text-body-0-regular text-foreground-dim">Department</p>
                    <p className="text-body-0-regular text-foreground">
                      {DOMAIN_NAMES[asset.department]}
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
                    {asset.department ? `${DOMAIN_NAMES[asset.department]} / ` : ''}{asset.workspacePath}
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
            {allVersions.length > 1 && (
              <section className="space-y-2">
                <h3 className="text-body-0-bold text-foreground-dim">Version History</h3>
                <div className="space-y-1">
                  {allVersions.map(v => {
                    const isCurrent = v.id === asset.id
                    return isCurrent ? (
                      <div key={v.id} className="flex items-center justify-between py-1 text-body-0-regular">
                        <span className="text-foreground">V{v.version} <span className="text-foreground-dim">(current)</span></span>
                        {v.created_at && <span className="text-label-0-regular text-foreground-dim">{formatDate(v.created_at)}</span>}
                      </div>
                    ) : (
                      <button
                        key={v.id}
                        onClick={() => onVersionSelect?.(v)}
                        className="flex items-center justify-between py-1 text-body-0-regular text-foreground-dim hover:text-foreground-system-link transition-colors w-full text-left"
                      >
                        <span>V{v.version}</span>
                        {v.created_at && <span className="text-label-0-regular">{formatDate(v.created_at)}</span>}
                      </button>
                    )
                  })}
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

            {resolvedReviewNoteSummary && (
              <CreativeReviewCard summary={resolvedReviewNoteSummary} />
            )}
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
