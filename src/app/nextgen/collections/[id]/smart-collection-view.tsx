'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PanelRight, Info, Link2, Download, Plus, Trash2, Pencil, Layers as LayersIcon, Film } from 'lucide-react'
import { ShareIcon } from '@/components/ui/share-icon'
import { PERSONAS } from '@/lib/personas'
import { SelectAllRow } from '@/components/ui/select-all-row'
import { useRouter } from 'next/navigation'
import {
  Stack,
  PageHeader,
  Button,
  CardGrid,
  AssetCard,
  CollectionCard,
  ContextualActionBar,
  InlineActionBar,
  EmptyState,
  CollectionSidePanel,
  AssetDetailPanel,
  SearchTriggerButton,
  SortDropdown,
  AppearanceDropdown,
  MobileToolbar,
  Modal,
  Card,
  SmartCollectionFilterBuilder,
} from '@/components/ui'
import type { CollectionCardType } from '@/components/ui/collection-card'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import { getGridColumns, useAssetSelection, useViewPreferences, useResourceSelection, useSmartCollections, usePersona, useMobilePanel, useUserCollections } from '@/hooks'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { matchesFilter } from '@/hooks/useSmartCollections'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import { OntologyHero } from '@/components/ui/ontology-hero'
import { getOntologyMeta, getNarrativeCharacter, getNarrativeScene } from '@/lib/ontology-meta'
import type { NarrativeCharacterMeta } from '@/lib/ontology-meta'
import type { CardSize } from '@/components/ui/appearance-dropdown'
import { CharacterCastingCard } from '@/components/ui/character-casting-card'
import type { CharacterCastingCardSize } from '@/components/ui/character-casting-card'
import { SceneScriptCard } from '@/components/ui/scene-script-card'
import type { SceneScriptCardSize } from '@/components/ui/scene-script-card'
import { LocationCard } from '@/components/ui/location-card'
import type { LocationCardSize } from '@/components/ui/location-card'
import { getCollectionImagesByName } from '@/lib/data-client'
import type { Asset, AssetFilter } from '@/lib/data'
import { assetToSelectionEntity, assetToResourceRef, collectionToSelectionEntity } from '@/lib/selection-actions'
import { getContextAssetGroups } from '@/lib/context-relationships'
import { useAccess } from '@/hooks'
import { AccessModal } from '@/components/ui/access-modal'
import { CollectionMembershipModal } from '@/components/ui/collection-membership-modal'
import { ContextMenu } from '@/components/ui/context-menu'
import type { ResourceRef } from '@/lib/grants'
import { useToast } from '@/components/ui/toast'
import { Dropdown, DropdownMenuItem, DropdownMenuDivider } from '@/components/ui'
import { getCollectionCapabilities } from '@/lib/collection-types'

interface SmartCollectionDetailViewProps {
  collectionId: string
}

type GroupByMode = 'none' | 'kind' | 'episode' | 'time-of-day'

type CastingGroup = {
  role: NarrativeCharacterMeta['role']
  label: string
  cardSize: CardSize
  columns: 3 | 4 | 6
}

const CASTING_GROUP_ORDER: ReadonlyArray<CastingGroup> = [
  { role: 'lead', label: 'Lead', cardSize: 'lg', columns: 3 },
  { role: 'supporting', label: 'Supporting', cardSize: 'md', columns: 4 },
  { role: 'recurring', label: 'Recurring', cardSize: 'sm', columns: 6 },
  { role: 'guest', label: 'Guest', cardSize: 'sm', columns: 6 },
]

interface GroupingToolbarProps {
  collectionIcon: string | undefined
  isParentWithChildren: boolean
  groupBy: GroupByMode
  onGroupByChange: (mode: GroupByMode) => void
  episodeFilter: string
  onEpisodeFilterChange: (ep: string) => void
  availableEpisodes: string[]
}

/**
 * The Episode filter + Group dropdown pair. Both controls only render when
 * the current view has something meaningful to filter or group by — scene
 * parents get all four options, asset grids get type+episode, character /
 * location parents get nothing (homogeneous children).
 */
function GroupingToolbar({
  collectionIcon,
  isParentWithChildren,
  groupBy,
  onGroupByChange,
  episodeFilter,
  onEpisodeFilterChange,
  availableEpisodes,
}: GroupingToolbarProps) {
  const isSceneParent = collectionIcon === 'scene'
  const showGroupDropdown = isSceneParent || !isParentWithChildren
  const showEpisodeFilter = isSceneParent && availableEpisodes.length > 0
  if (!showGroupDropdown && !showEpisodeFilter) return null
  return (
    <>
      {showEpisodeFilter && (
        <Dropdown
          label={episodeFilter === 'all' ? 'All episodes' : episodeFilter}
          icon={<Film />}
          size="standard"
          align="end"
          width="sm"
          ghost
        >
          <div className="py-1">
            <DropdownMenuItem
              selected={episodeFilter === 'all'}
              label="All episodes"
              onClick={() => onEpisodeFilterChange('all')}
            />
            {availableEpisodes.map((ep) => (
              <DropdownMenuItem
                key={ep}
                selected={episodeFilter === ep}
                label={ep}
                onClick={() => onEpisodeFilterChange(ep)}
              />
            ))}
          </div>
        </Dropdown>
      )}
      {showGroupDropdown && (
        <Dropdown
          label="Group"
          icon={<LayersIcon />}
          size="standard"
          align="end"
          width="sm"
          iconOnly
          ghost={false}
        >
          <div className="py-1">
            <DropdownMenuItem
              selected={groupBy === 'none'}
              label="None"
              onClick={() => onGroupByChange('none')}
            />
            {!isParentWithChildren && (
              <DropdownMenuItem
                selected={groupBy === 'kind'}
                label="Type"
                onClick={() => onGroupByChange('kind')}
              />
            )}
            <DropdownMenuItem
              selected={groupBy === 'episode'}
              label="Episode"
              onClick={() => onGroupByChange('episode')}
            />
            {isSceneParent && (
              <DropdownMenuItem
                selected={groupBy === 'time-of-day'}
                label="Time of day"
                onClick={() => onGroupByChange('time-of-day')}
              />
            )}
          </div>
        </Dropdown>
      )}
    </>
  )
}

// Group order for asset grids when "group by type" is on. The first block is
// Composite Concept kinds (the ontology layer); the rest are Media Asset Types
// (the work-product layer). Ordering walks the production timeline: raw inputs
// → VFX → editorial outputs → side-cars → untyped catch-all.
type AssetGroupKey = NonNullable<Asset['kind']> | NonNullable<Asset['mediaAssetType']> | 'file'

const ASSET_GROUP_ORDER: ReadonlyArray<{ key: AssetGroupKey; label: string }> = [
  // Composite Concepts (kind-based)
  { key: 'production-shot', label: 'Production Shots' },
  { key: 'cg-sequence', label: 'CG Sequences' },
  { key: 'cg-shot', label: 'CG Shots' },
  { key: 'cut', label: 'Cuts' },
  // Footage (Media Asset Type)
  { key: 'camera-clip', label: 'Camera Clips' },
  { key: 'dailies-proxy', label: 'Dailies Proxies' },
  { key: 'proxy', label: 'Proxies' },
  // VFX
  { key: 'vfx-plate', label: 'VFX Plates' },
  { key: 'vfx-comp', label: 'VFX Comps' },
  // Editorial / picture
  { key: 'editorial-cut', label: 'Editorial Cuts' },
  { key: 'textless-master', label: 'Textless Masters' },
  { key: 'reel', label: 'Reels' },
  // Audio
  { key: 'sound-mix', label: 'Sound Mixes' },
  { key: 'audio-clip', label: 'Audio Clips' },
  { key: 'adr', label: 'ADR' },
  { key: 'foley', label: 'Foley' },
  { key: 'score', label: 'Score' },
  // Art / pre-production
  { key: 'concept-art', label: 'Concept Art' },
  { key: 'storyboard', label: 'Storyboards' },
  { key: 'reference-image', label: 'References' },
  { key: 'production-photo', label: 'Production Photos' },
  { key: 'lookbook', label: 'Lookbooks' },
  // Side-cars
  { key: 'edl', label: 'EDLs' },
  { key: 'closed-captions', label: 'Captions' },
  { key: 'project-file', label: 'Edit Projects' },
  { key: 'document', label: 'Documents' },
  // Fallback for untyped assets
  { key: 'file', label: 'Other' },
]

// Decide the group an asset belongs to. Composite Concept kind takes priority
// over Media Asset Type — a Production Shot Asset has both `kind: 'production-shot'`
// and (potentially) no `mediaAssetType`, but should always group as a Production Shot.
function getAssetGroupKey(asset: Asset): AssetGroupKey {
  if (asset.kind === 'cut' || asset.kind === 'production-shot' || asset.kind === 'cg-shot' || asset.kind === 'cg-sequence') {
    return asset.kind
  }
  if (asset.mediaAssetType) return asset.mediaAssetType
  return 'file'
}

export function SmartCollectionDetailView({ collectionId }: SmartCollectionDetailViewProps) {
  const router = useRouter()

  const {
    getCollection,
    getChildren,
    getRelatedCollections,
    updateCollection,
    deleteCollection,
    filterAssets,
    scopedAssets,
    assetsLoaded,
    assetsLoading,
    ensureAssetsLoaded,
  } = useSmartCollections()
  const {
    collections: userCollections,
    createCollection: createUserCollection,
    deleteCollection: deleteUserCollection,
    removeAssetFromCollection,
  } = useUserCollections()
  const { activePersona, isAdmin } = usePersona()
  const {
    selectedIds: selectedAssetIds,
    primaryId: primaryAssetId,
    handleSelectionClick: handleAssetClick,
    selectOnly: selectOnlyAsset,
    selectAll: selectAllAssets,
    clearSelection: clearAssetSelection,
  } = useAssetSelection()
  const {
    selectedIds: selectedCollectionIds,
    primaryId: selectedCollectionId,
    handleSelectionClick: handleCollectionSelectionClick,
    selectAll: selectAllCollections,
    clearSelection: clearCollectionSelection,
  } = useResourceSelection<{ id: string; name: string }>()
  const { layout, setLayout, cardSize, setCardSize, sidePanelOpen, setSidePanelOpen, showTags, setShowTags, metadataFields, setMetadataField } = useViewPreferences()
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(sidePanelOpen, setSidePanelOpen)
  const isMobile = useIsMobile()
  const { setBreadcrumbExtras, clearBreadcrumbExtras } = useBreadcrumbExtras()
  const {
    canShare,
    canEditAcl,
    getResourceGrants,
    getResourceGuestLinks,
    sharesReceivedByMe,
    allProjectShares,
    createGuestLink,
  } = useAccess()
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [draftShareTarget, setDraftShareTarget] = useState<{ id: string; name: string } | null>(null)
  const { showToast } = useToast()
  const collectionResourceRef: ResourceRef = { id: collectionId, type: 'smart-collection' }

  const [assetContextMenu, setAssetContextMenu] = useState<{ x: number; y: number; asset: Asset } | null>(null)
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftFilter, setDraftFilter] = useState<AssetFilter>({})
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' },
  ])

  const collection = getCollection(collectionId)
  const collectionCapabilities = collection ? getCollectionCapabilities(collection) : null

  // For character/scene/location smart collections, the entity name is a
  // parseable chip — pre-pin it when the spotlight overlay opens from here.
  const searchContextPhrase = useMemo(() => {
    if (!collection) return undefined
    if (collection.icon === 'character') return collection.groupBy ? 'characters' : collection.name
    if (collection.icon === 'scene') return collection.groupBy ? 'scenes' : collection.name
    if (collection.icon === 'location') return collection.groupBy ? 'locations' : collection.name
    return undefined
  }, [collection])
  const linkedSnapshotCollections = useMemo(() => {
    if (!collection) return []
    return userCollections
      .filter((userCollection) => userCollection.sourceSmartCollectionId === collection.id)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  }, [collection, userCollections])
  const shareTargetCollection = linkedSnapshotCollections[0] ?? null
  const activeShareTargetCollection = draftShareTarget ?? shareTargetCollection
  const shareResourceRef: ResourceRef = activeShareTargetCollection
    ? { id: activeShareTargetCollection.id, type: 'collection' }
    : collectionResourceRef
  const showShareButton = Boolean(collection) && canShare(shareResourceRef)
  const isOwner = collection?.createdBy === activePersona?.email
  const canManageCurrentCollection = Boolean(collection && (isOwner || isAdmin || canEditAcl(collectionResourceRef)))
  const canEditCurrentCollection = Boolean(
    collection &&
    collectionCapabilities &&
    canManageCurrentCollection &&
    (collectionCapabilities.canRename || collectionCapabilities.canEditFilter)
  )
  const canDeleteCurrentCollection = Boolean(collection && collectionCapabilities?.canDelete && (isOwner || isAdmin))

  const openEditCollectionModal = useCallback(() => {
    if (!collection || !canEditCurrentCollection) return
    setDraftName(collection.name)
    setDraftFilter({ ...collection.filter })
    setEditModalOpen(true)
  }, [canEditCurrentCollection, collection])

  const saveEditedCollection = useCallback(() => {
    if (!collection || !canEditCurrentCollection) return
    const updates: { name?: string; filter?: AssetFilter } = {}
    if (collectionCapabilities?.canRename && draftName !== collection.name) updates.name = draftName
    if (collectionCapabilities?.canEditFilter && JSON.stringify(draftFilter) !== JSON.stringify(collection.filter)) {
      updates.filter = draftFilter
    }
    if (Object.keys(updates).length > 0) updateCollection(collection.id, updates)
    setEditModalOpen(false)
  }, [canEditCurrentCollection, collection, collectionCapabilities, draftFilter, draftName, updateCollection])

  const openShareModal = useCallback(() => {
    if (!collection) return
    if (!shareTargetCollection) {
      const shareTarget = createUserCollection(
        collection.name,
        filterAssets(scopedAssets, collection.id).map(asset => asset.id),
        { sourceSmartCollectionId: collection.id },
      )
      setDraftShareTarget({ id: shareTarget.id, name: shareTarget.name })
    }
    setShareModalOpen(true)
  }, [collection, shareTargetCollection, createUserCollection, filterAssets, scopedAssets])

  const closeShareModal = useCallback(() => {
    if (draftShareTarget) {
      const hasGrants = getResourceGrants(draftShareTarget.id).some(grant => !grant.revokedAt)
      const hasGuestLinks = getResourceGuestLinks(draftShareTarget.id).length > 0
      if (!hasGrants && !hasGuestLinks) {
        deleteUserCollection(draftShareTarget.id)
      }
      setDraftShareTarget(null)
    }
    setShareModalOpen(false)
  }, [draftShareTarget, getResourceGrants, getResourceGuestLinks, deleteUserCollection])

  type MenuItem = import('@/components/ui/inline-action-bar').ActionMenuItem

  const smartCollectionMenuItems = useMemo((): MenuItem[] => {
    const items: MenuItem[] = []
    if (showShareButton) {
      items.push({ label: 'Share', icon: <ShareIcon className="w-4 h-4" />, onClick: openShareModal })
    }
    if (canEditCurrentCollection) {
      items.push({ label: 'Edit', icon: <Pencil className="w-4 h-4" />, onClick: openEditCollectionModal })
    }
    if (canDeleteCurrentCollection) {
      if (items.length > 0) items[items.length - 1].dividerAfter = true
      items.push({ label: 'Delete collection', icon: <Trash2 className="w-4 h-4" />, onClick: () => { if (collection) { deleteCollection(collection.id); router.push('/nextgen') } }, destructive: true })
    }
    return items
  }, [showShareButton, canEditCurrentCollection, canDeleteCurrentCollection, openShareModal, openEditCollectionModal, collection, deleteCollection, router])

  const subtitle = useMemo(() => {
    // Received from someone else
    if (!isOwner && collection) {
      const shares = isAdmin ? allProjectShares : sharesReceivedByMe
      const share = shares.find(s => s.resourceId === collectionId)
      if (share) {
        const grantor = PERSONAS.find(p => p.id === share.grantedByUserId)
        return `Shared by ${grantor?.name ?? share.grantedByUserId}`
      }
    }
    // Owned: show sharing status
    if (isOwner && collection) {
      const grants = getResourceGrants(shareResourceRef.id)
        .filter(g => !(g.principal.type === 'user' && g.principal.userId === g.grantedByUserId))
      const directGrants = grants.filter(g => !g.reviewLinkId)
      const linkGrants = grants.filter(g => g.reviewLinkId)
      if (directGrants.length === 0 && linkGrants.length === 0) return 'Private'
      const parts: string[] = []
      if (directGrants.length > 0) parts.push(`Shared with ${directGrants.length} ${directGrants.length === 1 ? 'person' : 'people'}`)
      if (linkGrants.length > 0) parts.push('Link sharing on')
      return parts.join(' · ')
    }
    return undefined
  }, [isOwner, isAdmin, collection, collectionId, sharesReceivedByMe, allProjectShares, getResourceGrants, shareResourceRef.id])

  useEffect(() => {
    void ensureAssetsLoaded()
  }, [ensureAssetsLoaded])

  useEffect(() => {
    clearAssetSelection()
    clearCollectionSelection()
  }, [collectionId, clearAssetSelection, clearCollectionSelection])

  // For child collections, find the parent
  const parentCollection = useMemo(() => {
    if (!collection?.parentId) return undefined
    return getCollection(collection.parentId)
  }, [collection, getCollection])

  const isAutoGeneratedChild = !!collection?.parentId

  // Connections only for child collections (e.g. "Luca Ferreira" → related scenes/locations).
  // User-created smart collections like "Finals" would just show random metadata — not useful.
  const relationships = useMemo(() => {
    if (!isAutoGeneratedChild) return undefined
    return getRelatedCollections(collectionId)
  }, [isAutoGeneratedChild, collectionId, getRelatedCollections])

  // Sync breadcrumb with collection name
  useEffect(() => {
    if (!collection) return
    const extras: { label: string; href?: string }[] = []
    if (parentCollection) {
      extras.push({ label: parentCollection.name, href: `/nextgen/collections/${parentCollection.id}` })
    }
    extras.push({ label: collection.name })
    setBreadcrumbExtras(extras)
    return () => clearBreadcrumbExtras()
  }, [collection, parentCollection, setBreadcrumbExtras, clearBreadcrumbExtras])

  // Filter assets based on collection's filter rules (scoped by persona access)
  const filteredAssets = useMemo(() => {
    if (!collection) return []
    return scopedAssets.filter(asset => matchesFilter(asset, collection.filter))
  }, [scopedAssets, collection])

  // Parent collections with groupBy show child collection cards
  const childCollections = useMemo(() => {
    if (!collection?.groupBy) return []
    return getChildren(collection.id)
  }, [collection, getChildren])

  const isParentWithChildren = childCollections.length > 0

  // For each child, compute matching assets (for count + thumbnails + avatar)
  const childData = useMemo(() => {
    if (!isParentWithChildren) return []
    return childCollections.map((child) => {
      const assets = scopedAssets.filter(a => matchesFilter(a, child.filter))
      return {
        collection: child,
        assetCount: assets.length,
        mainImage: assets[0]?.thumbnail,
        thumbnailImages: assets.slice(1, 3).map(a => a.thumbnail).filter((t): t is string => t != null),
        avatarSrc: getCollectionImagesByName(child.name).avatarSrc,
      }
    })
  }, [childCollections, isParentWithChildren, scopedAssets])

  // Map SmartCollectionIcon to CollectionCardType
  const cardType: CollectionCardType = collection?.icon === 'character' ? 'character'
    : collection?.icon === 'location' ? 'location'
    : collection?.icon === 'scene' ? 'scene'
    : collection?.icon === 'palette' ? 'art-type'
    : collection?.icon === 'shot' ? 'scene'
    : collection?.icon === 'sequence' ? 'scene'
    : 'character'

  const handleDeleteCollection = () => {
    if (collection && deleteCollection(collection.id)) {
      router.push('/nextgen')
    }
  }

  const handleUpdateCollection = (updates: { name?: string; filter?: AssetFilter }) => {
    if (collection) {
      updateCollection(collection.id, updates)
    }
  }

  const [assetShareTarget, setAssetShareTarget] = useState<{ ref: ResourceRef; title: string } | null>(null)

  const toAssetResourceRef = assetToResourceRef

  const buildAssetMenuItems = useCallback((asset: Asset): MenuItem[] => {
    const ref = toAssetResourceRef(asset)
    const shareable = canShare(ref)
    const canRemoveFromSharedCollection = Boolean(
      shareTargetCollection
        && shareTargetCollection.assetIds.includes(asset.id)
        && canEditAcl({ id: shareTargetCollection.id, type: 'collection' }),
    )
    const items: MenuItem[] = [
      { label: 'Share', icon: <ShareIcon className="w-4 h-4" />, onClick: () => setAssetShareTarget({ ref, title: asset.name }), disabled: !shareable },
      { label: 'Copy link', icon: <Link2 className="w-4 h-4" />, disabled: !shareable, onClick: () => {
        const link = createGuestLink(ref, { allowDownload: false, passcode: false, expiresInDays: 7, label: asset.name })
        if (!link) return
        navigator.clipboard.writeText(`${window.location.origin}/nextgen/share/${link.id}`)
        showToast('Link copied', 'success', { label: 'Share settings', onClick: () => setAssetShareTarget({ ref, title: asset.name }) })
      } },
      { label: 'Download', icon: <Download className="w-4 h-4" />, onClick: () => showToast(`Downloading "${asset.name}"...`), dividerAfter: true },
      { label: 'Add to Collection', icon: <Plus className="w-4 h-4" />, onClick: () => { selectOnlyAsset(asset); setShowAddToCollectionModal(true) } },
      { label: 'View details', icon: <Info className="w-4 h-4" />, onClick: () => { selectOnlyAsset(asset); setSidePanelOpen(true) } },
    ]
    if (shareTargetCollection && canRemoveFromSharedCollection) {
      items.push({
        label: 'Remove from collection',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: () => {
          removeAssetFromCollection(shareTargetCollection.id, asset.id)
          showToast(`Removed "${asset.name}" from ${shareTargetCollection.name}.`)
        },
        destructive: true,
      })
    }
    return items
  }, [
    toAssetResourceRef,
    canShare,
    shareTargetCollection,
    canEditAcl,
    createGuestLink,
    showToast,
    selectOnlyAsset,
    setSidePanelOpen,
    removeAssetFromCollection,
  ])

  const handleAssetCardClick = (asset: typeof filteredAssets[number], event: React.MouseEvent) => {
    clearCollectionSelection()
    handleAssetClick(asset, event, filteredAssets)
  }
  const handleCollectionCardClick = (
    childCollection: typeof childData[number]['collection'],
    event: React.MouseEvent,
  ) => {
    clearAssetSelection()
    // Use the *visual* order of cards for range selection so shift-click
    // selects the contiguous run of cards the user sees on screen, not the
    // arbitrary `childData` insertion order.
    handleCollectionSelectionClick(childCollection, event, visualChildOrder)
  }
  const handlePanelAssetSwitch = (nextAsset: typeof filteredAssets[number]) => {
    clearCollectionSelection()
    if (filteredAssets.some((asset) => asset.id === nextAsset.id)) {
      selectOnlyAsset(nextAsset)
      setSidePanelOpen(true)
      return
    }
    router.push(`/nextgen/assets/${nextAsset.id}`)
  }

  const selectedAssets = useMemo(() => {
    return filteredAssets.filter((asset) => selectedAssetIds.has(asset.id))
  }, [filteredAssets, selectedAssetIds])
  const selectedAssetEntities = useMemo(() => selectedAssets.map((asset) => assetToSelectionEntity(asset)), [selectedAssets])
  const selectedCollectionEntities = useMemo(() => {
    return childData
      .filter((child) => selectedCollectionIds.has(child.collection.id))
      .map((child) => collectionToSelectionEntity(child.collection, 'smart-collection'))
  }, [childData, selectedCollectionIds])
  const activeSelectionEntities = isParentWithChildren ? selectedCollectionEntities : selectedAssetEntities
  const primaryAsset = useMemo(() => {
    if (!primaryAssetId) return null
    return filteredAssets.find(a => a.id === primaryAssetId) ?? null
  }, [primaryAssetId, filteredAssets])
  const primaryAssetContextGroups = useMemo(() => {
    if (!primaryAsset) return undefined
    return getContextAssetGroups(primaryAsset, scopedAssets)
  }, [primaryAsset, scopedAssets])
  const selectedChildCollection = useMemo(() => {
    if (!selectedCollectionId) return null
    return childData.find(c => c.collection.id === selectedCollectionId)?.collection ?? null
  }, [selectedCollectionId, childData])
  const selectedChildRelationships = useMemo(() => {
    if (!selectedCollectionId) return undefined
    return getRelatedCollections(selectedCollectionId)
  }, [selectedCollectionId, getRelatedCollections])

  const loading = !assetsLoaded || assetsLoading

  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date-added', label: 'Date Added' },
    { value: 'date-modified', label: 'Date Modified' },
    { value: 'size', label: 'Size' },
    { value: 'kind', label: 'Kind' },
  ]

  const pageTitle = collection?.name || 'Loading...'

  // When the collection represents a narrative ontology entity (character/scene/location)
  // and we have rich metadata for it, swap the generic PageHeader for a bespoke hero.
  const ontologyMeta = useMemo(() => {
    if (!collection?.name || !collection?.icon) return null
    return getOntologyMeta(collection.name, collection.icon)
  }, [collection?.name, collection?.icon])
  const showOntologyHero = ontologyMeta !== null

  // Grouping mode for the current view. Applies to both asset grids (Kind)
  // and child-collection grids (Episode, Time of Day). 'none' renders flat.
  const [groupBy, setGroupBy] = useState<GroupByMode>('none')

  // One pass over scopedAssets builds the indexes the location/scene cards
  // need — without this the children loop is O(N children * M assets).
  const { scenesByLocation, charactersByScene } = useMemo(() => {
    const byLoc = new Map<string, Set<string>>()
    const byScene = new Map<string, Set<string>>()
    for (const a of scopedAssets) {
      const m = a.aiMeta
      if (!m) continue
      if (m.location && m.scene) {
        let set = byLoc.get(m.location)
        if (!set) { set = new Set(); byLoc.set(m.location, set) }
        set.add(m.scene)
      }
      if (m.scene && m.characters?.length) {
        let set = byScene.get(m.scene)
        if (!set) { set = new Set(); byScene.set(m.scene, set) }
        for (const c of m.characters) set.add(c)
      }
    }
    return { scenesByLocation: byLoc, charactersByScene: byScene }
  }, [scopedAssets])

  // Episode filter (scene parent only). 'all' shows every scene; specific
  // episode key narrows to that one.
  const [episodeFilter, setEpisodeFilter] = useState<string>('all')

  const filteredChildData = useMemo(() => {
    if (collection?.icon !== 'scene' || episodeFilter === 'all') return childData
    return childData.filter((child) => getNarrativeScene(child.collection.name)?.episode === episodeFilter)
  }, [childData, collection?.icon, episodeFilter])
  const visibleChildData = collection?.icon === 'scene' ? filteredChildData : childData

  useEffect(() => {
    if (collection?.icon === 'scene') clearCollectionSelection()
  }, [clearCollectionSelection, collection?.icon, episodeFilter])

  const availableEpisodes = useMemo(() => {
    if (collection?.icon !== 'scene') return [] as string[]
    const set = new Set<string>()
    for (const child of childData) {
      const ep = getNarrativeScene(child.collection.name)?.episode
      if (ep) set.add(ep)
    }
    return Array.from(set).sort()
  }, [collection?.icon, childData])

  // Character parent: group children by narrative role so the page reads as
  // a casting list — leads big, recurring & guest compact.
  const castingGroups = useMemo(() => {
    if (collection?.icon !== 'character' || !isParentWithChildren) return undefined
    const buckets = new Map<NarrativeCharacterMeta['role'] | 'unknown', typeof childData>()
    for (const child of childData) {
      const role = getNarrativeCharacter(child.collection.name)?.role ?? 'unknown'
      const list = buckets.get(role) ?? []
      list.push(child)
      buckets.set(role, list)
    }
    const groups = CASTING_GROUP_ORDER
      .map((g) => ({ ...g, items: buckets.get(g.role) ?? [] }))
      .filter((g) => g.items.length > 0)
    const unknown = buckets.get('unknown') ?? []
    if (unknown.length > 0) {
      groups.push({ role: 'guest', label: 'Other', cardSize: 'sm', columns: 6, items: unknown })
    }
    return groups
  }, [collection?.icon, isParentWithChildren, childData])

  // Asset grouping — handles both Kind and Episode modes. Kind buckets by
  // Composite Concept kind / mediaAssetType; Episode buckets by asset.episode.
  const groupedAssets = useMemo(() => {
    if (groupBy === 'kind') {
      const buckets = new Map<AssetGroupKey, Asset[]>()
      for (const a of filteredAssets) {
        const k = getAssetGroupKey(a)
        const list = buckets.get(k) ?? []
        list.push(a)
        buckets.set(k, list)
      }
      return ASSET_GROUP_ORDER
        .map((g) => ({ label: g.label, items: buckets.get(g.key) ?? [] }))
        .filter((g) => g.items.length > 0)
    }
    if (groupBy === 'episode') {
      const buckets = new Map<string, Asset[]>()
      for (const a of filteredAssets) {
        const key = a.episode ?? 'Other'
        const list = buckets.get(key) ?? []
        list.push(a)
        buckets.set(key, list)
      }
      return Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, items]) => ({ label, items }))
    }
    return null
  }, [groupBy, filteredAssets])

  // For scene parent: groups of child scenes by episode or time of day.
  const sceneGroupedChildren = useMemo(() => {
    if (collection?.icon !== 'scene' || (groupBy !== 'episode' && groupBy !== 'time-of-day')) return null
    const buckets = new Map<string, typeof filteredChildData>()
    for (const child of filteredChildData) {
      const sceneMeta = getNarrativeScene(child.collection.name)
      const key = groupBy === 'episode'
        ? (sceneMeta?.episode ?? 'Unscheduled')
        : (sceneMeta?.timeOfDay ?? 'Unspecified')
      const list = buckets.get(key) ?? []
      list.push(child)
      buckets.set(key, list)
    }
    // Sort by label so episodes / times read in natural order.
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, items]) => ({ label, items }))
  }, [collection?.icon, groupBy, filteredChildData])
  const itemCount = isParentWithChildren
    ? visibleChildData.length
    : filteredAssets.length
  const countLabel = isParentWithChildren ? 'collection' : 'asset'


  // Flattened collection list in the same order the cards are rendered, so
  // shift-click range selection follows what the user sees. Tracks the
  // dispatch in `renderChildren` (location → scene grouped/flat → casting →
  // default).
  const visualChildOrder = useMemo(() => {
    if (collection?.icon === 'location') return childData.map((e) => e.collection)
    if (collection?.icon === 'scene') {
      if (sceneGroupedChildren) return sceneGroupedChildren.flatMap((g) => g.items.map((i) => i.collection))
      return filteredChildData.map((e) => e.collection)
    }
    if (castingGroups) return castingGroups.flatMap((g) => g.items.map((i) => i.collection))
    return childData.map((e) => e.collection)
  }, [collection?.icon, sceneGroupedChildren, filteredChildData, castingGroups, childData])


  // No access — redirect to search
  useEffect(() => {
    if (!collection && !loading) {
      router.replace('/nextgen')
    }
  }, [collection, loading, router])

  if (!collection && !loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <MobileToolbar title="Collection" />
                <EmptyState
                  title="Smart Collection not found"
                  message="This smart collection may have been deleted or doesn't exist."
                >
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/nextgen')}
                    className="mt-4"
                  >
                    Back to Home
                  </Button>
                </EmptyState>
              </Stack>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render helpers — broken out to keep the JSX tree readable. Each owns
  // one branch of the children/assets dispatch and closes over component state.

  const childCardClickHandlers = (child: typeof childData[number]) => ({
    onClick: isMobile
      ? () => router.push(`/nextgen/collections/${child.collection.id}`)
      : (event: React.MouseEvent) => handleCollectionCardClick(child.collection, event),
    onDoubleClick: isMobile ? undefined : () => router.push(`/nextgen/collections/${child.collection.id}`),
  })

  const childSelectionState = (child: typeof childData[number]) => ({
    isSelected: !isMobile && selectedCollectionIds.has(child.collection.id),
    primary: !isMobile && selectedCollectionId === child.collection.id,
  })

  const renderLocationChildren = () => (
    <CardGrid columns={getGridColumns(cardSize)} gap="4">
      {childData.map((child) => {
        const ontology = getOntologyMeta(child.collection.name, 'location')
        const locMeta = ontology?.type === 'location' ? ontology.data : undefined
        const scenes = Array.from(scenesByLocation.get(child.collection.name) ?? []).map((sceneName) => ({
          name: sceneName,
          image: getCollectionImagesByName(sceneName).mainImage,
        }))
        return (
          <LocationCard
            key={child.collection.id}
            name={child.collection.name}
            mainImage={child.mainImage}
            assetCount={child.assetCount}
            meta={locMeta}
            scenes={scenes}
            size={cardSize as LocationCardSize}
            {...childSelectionState(child)}
            {...childCardClickHandlers(child)}
          />
        )
      })}
    </CardGrid>
  )

  const renderSceneChildren = () => {
    const renderSceneCard = (child: typeof filteredChildData[number]) => {
      const sceneMeta = getNarrativeScene(child.collection.name)
      const characters = Array.from(charactersByScene.get(child.collection.name) ?? []).map((charName) => ({
        name: charName,
        avatarSrc: getCollectionImagesByName(charName).avatarSrc,
      }))
      return (
        <SceneScriptCard
          key={child.collection.id}
          name={child.collection.name}
          mainImage={child.mainImage}
          assetCount={child.assetCount}
          meta={sceneMeta}
          characters={characters}
          size={cardSize as SceneScriptCardSize}
          {...childSelectionState(child)}
          {...childCardClickHandlers(child)}
        />
      )
    }
    if (sceneGroupedChildren) {
      return (
        <div className="space-y-6">
          {sceneGroupedChildren.map((group) => (
            <section key={group.label} className="space-y-3">
              <h3 className="text-body-0-regular text-foreground-subtle">
                {group.label}
                <span className="text-foreground-subtle ml-2">{group.items.length}</span>
              </h3>
              <CardGrid columns={getGridColumns(cardSize)} gap="4">
                {group.items.map(renderSceneCard)}
              </CardGrid>
            </section>
          ))}
        </div>
      )
    }
    return (
      <CardGrid columns={getGridColumns(cardSize)} gap="4">
        {filteredChildData.map(renderSceneCard)}
      </CardGrid>
    )
  }

  const renderCastingChildren = () => {
    if (!castingGroups) return null
    return (
      <div className="space-y-6">
        {castingGroups.map((group) => (
          <section key={group.label} className="space-y-3">
            <h3 className="text-body-0-regular text-foreground-subtle">
              {group.label}
              <span className="text-foreground-subtle ml-2">{group.items.length}</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {group.items.map((child) => (
                <CharacterCastingCard
                  key={child.collection.id}
                  name={child.collection.name}
                  avatarSrc={child.avatarSrc}
                  assetCount={child.assetCount}
                  role={getNarrativeCharacter(child.collection.name)?.role}
                  size={group.cardSize as CharacterCastingCardSize}
                  {...childSelectionState(child)}
                  {...childCardClickHandlers(child)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  const renderDefaultChildren = () => (
    <CardGrid columns={getGridColumns(cardSize)} gap="4">
      {childData.map((child) => (
        <CollectionCard
          key={child.collection.id}
          title={child.collection.name}
          assetCount={child.assetCount}
          type={cardType}
          mainImage={child.mainImage}
          thumbnailImages={child.thumbnailImages}
          avatarSrc={child.avatarSrc}
          avatarName={child.collection.name}
          size={cardSize}
          numberOfAssets={
            child.assetCount === 0 ? 'None'
            : child.assetCount === 1 ? 'One'
            : child.assetCount === 2 ? 'Two'
            : 'Many'
          }
          {...childSelectionState(child)}
          {...childCardClickHandlers(child)}
        />
      ))}
    </CardGrid>
  )

  const renderChildren = () => {
    if (collection?.icon === 'location') return renderLocationChildren()
    if (collection?.icon === 'scene') return renderSceneChildren()
    if (castingGroups) return renderCastingChildren()
    return renderDefaultChildren()
  }

  const renderAssets = () => {
    const renderAssetCard = (asset: Asset) => (
      <div key={asset.id} data-asset-id={asset.id}>
        <AssetCard
          asset={asset}
          selected={selectedAssetIds.has(asset.id)}
          primary={primaryAssetId === asset.id}
          onClick={(a, e) => handleAssetCardClick(a, e)}
          menuContent={
            <div className="py-1">
              {buildAssetMenuItems(asset).map((item, i) => (
                <div key={i}>
                  <DropdownMenuItem icon={item.icon} label={item.label} onClick={item.onClick} destructive={item.destructive} />
                  {item.dividerAfter && <DropdownMenuDivider />}
                </div>
              ))}
            </div>
          }
          showDepartment
          shared={asset.department != null && activePersona?.domainId != null && asset.department !== activePersona.domainId}
          sensitive={asset.sensitive}
          allSelectedIds={selectedAssetIds}
          metadataFields={metadataFields}
        />
      </div>
    )
    const handleGridContextMenu = (e: React.MouseEvent) => {
      const card = (e.target as HTMLElement).closest('[data-asset-id]')
      if (!card) return
      const assetId = card.getAttribute('data-asset-id')
      const asset = assetId ? filteredAssets.find((a) => a.id === assetId) : null
      if (asset) {
        e.preventDefault()
        setAssetContextMenu({ x: e.clientX, y: e.clientY, asset })
      }
    }
    if (groupedAssets) {
      return (
        <div className="space-y-6">
          {groupedAssets.map((group) => (
            <section key={group.label} className="space-y-3">
              <h3 className="text-body-0-regular text-foreground-subtle">
                {group.label}
                <span className="text-foreground-subtle ml-2">{group.items.length}</span>
              </h3>
              <CardGrid columns={getGridColumns(cardSize)} gap="4" onContextMenu={handleGridContextMenu}>
                {group.items.map(renderAssetCard)}
              </CardGrid>
            </section>
          ))}
        </div>
      )
    }
    return (
      <CardGrid columns={getGridColumns(cardSize)} gap="4" onContextMenu={handleGridContextMenu}>
        {filteredAssets.map(renderAssetCard)}
      </CardGrid>
    )
  }

  return (
    <div className="h-full flex">
      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <Stack spacing="lg">
                  {/* Mobile nav */}
                  <MobileToolbar title={pageTitle} actions={
                    <>
                      <SearchTriggerButton
                        contextPhrase={searchContextPhrase}
                        collapsible
                      />
                      <SortDropdown
                        fields={sortFields}
                        value={sortCriteria}
                        onChange={setSortCriteria}
                        iconOnly
                      />
                      <GroupingToolbar
                        collectionIcon={collection?.icon}
                        isParentWithChildren={isParentWithChildren}
                        groupBy={groupBy}
                        onGroupByChange={setGroupBy}
                        episodeFilter={episodeFilter}
                        onEpisodeFilterChange={setEpisodeFilter}
                        availableEpisodes={availableEpisodes}
                      />
                      <AppearanceDropdown
                        iconOnly
                        layout={layout}
                        onLayoutChange={setLayout}
                        cardSize={cardSize}
                        onCardSizeChange={setCardSize}
                        showLayoutOptions={false}
                        showTags={showTags}
                        onShowTagsChange={setShowTags}
                        metadataFields={metadataFields}
                        onMetadataFieldChange={setMetadataField}
                      />
                      <Button
                        variant="icon"
                        size="icon"
                        onClick={togglePanel}
                        aria-label={panelOpen ? 'Close panel' : 'Open panel'}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </>
                  } />

                  {/* Bespoke hero for narrative ontology entities. */}
                  {showOntologyHero && collection && (
                    <div className="hidden md:block">
                      <OntologyHero
                        name={collection.name}
                        icon={collection.icon}
                      />
                    </div>
                  )}

                  {/* Row 1: Title + Search + Sort + Appearance + Panel toggle */}
                  <div className={showOntologyHero ? 'flex justify-end' : 'flex flex-wrap items-center justify-between gap-4'}>
                    {!showOntologyHero && (
                      <PageHeader
                        title={pageTitle}
                        description={subtitle}
                        hideTitleOnMobile
                      />
                    )}
                    <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                      <SearchTriggerButton contextPhrase={searchContextPhrase} />
                      <SortDropdown
                        fields={sortFields}
                        value={sortCriteria}
                        onChange={setSortCriteria}
                        iconOnly
                      />
                      <GroupingToolbar
                        collectionIcon={collection?.icon}
                        isParentWithChildren={isParentWithChildren}
                        groupBy={groupBy}
                        onGroupByChange={setGroupBy}
                        episodeFilter={episodeFilter}
                        onEpisodeFilterChange={setEpisodeFilter}
                        availableEpisodes={availableEpisodes}
                      />
                      <AppearanceDropdown
                        layout={layout}
                        onLayoutChange={setLayout}
                        cardSize={cardSize}
                        onCardSizeChange={setCardSize}
                        showLayoutOptions={false}
                        iconOnly
                        showTags={showTags}
                        onShowTagsChange={setShowTags}
                        metadataFields={metadataFields}
                        onMetadataFieldChange={setMetadataField}
                      />
                      <Button variant="icon" onClick={togglePanel} aria-label={panelOpen ? 'Close panel' : 'Open panel'}>
                        <PanelRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between min-h-8">
                    <SelectAllRow
                      selectedCount={isParentWithChildren ? selectedCollectionIds.size : selectedAssetIds.size}
                      totalCount={itemCount}
                      onSelectAll={() => {
                        if (isParentWithChildren) {
                          selectAllCollections(visibleChildData.map(c => c.collection))
                        } else {
                          selectAllAssets(filteredAssets)
                        }
                      }}
                      onClearSelection={isParentWithChildren ? clearCollectionSelection : clearAssetSelection}
                      label={!loading ? `${itemCount} ${countLabel}${itemCount !== 1 ? 's' : ''}` : 'Loading...'}
                    />
                    {activeSelectionEntities.length > 0 ? (
                      <ContextualActionBar
                        selectedEntities={activeSelectionEntities}
                        onClearSelection={isParentWithChildren ? clearCollectionSelection : clearAssetSelection}
                        downloadAction={(() => {
                          if (!isParentWithChildren && selectedAssets.length > 0) {
                            return {
                              enabled: true,
                              onClick: () => showToast(`Downloading ${selectedAssets.length} asset${selectedAssets.length !== 1 ? 's' : ''}...`),
                              label: `Download ${selectedAssets.length} Asset${selectedAssets.length !== 1 ? 's' : ''}`,
                            }
                          }
                          if (isParentWithChildren && selectedCollectionIds.size > 0) {
                            return {
                              enabled: true,
                              onClick: () => showToast(`Downloading ${selectedCollectionIds.size} collection${selectedCollectionIds.size !== 1 ? 's' : ''}...`),
                              label: `Download ${selectedCollectionIds.size} Collection${selectedCollectionIds.size !== 1 ? 's' : ''}`,
                            }
                          }
                          return undefined
                        })()}
                        menuItems={(() => {
                          if (!isParentWithChildren && selectedAssets.length === 1) {
                            const items = buildAssetMenuItems(selectedAssets[0])
                            const countLabels = new Map([['Share', 'Share 1 Asset'], ['Download', 'Download 1 Asset']])
                            return items.map(item => countLabels.has(item.label) ? { ...item, label: countLabels.get(item.label)! } : item)
                          }
                          return undefined
                        })()}
                      />
                    ) : (
                      <InlineActionBar items={smartCollectionMenuItems} maxInline={showShareButton ? 1 : 0} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-h-96">
                    {loading ? (
                      <CardGrid columns={getGridColumns(cardSize)} gap="4">
                        {[...Array(6)].map((_, i) => (
                          <CollectionCard
                            key={i}
                            title=""
                            assetCount={0}
                            state="Loading"
                            numberOfAssets="None"
                            size={cardSize}
                          />
                        ))}
                      </CardGrid>
                    ) : isParentWithChildren ? (
                      renderChildren()
                    ) : filteredAssets.length > 0 ? (
                      renderAssets()
                    ) : (
                      <EmptyState
                        title="No matching assets"
                        message="No assets match the current filter rules. Try adjusting the filters."
                      />
                    )}
                  </div>
                </Stack>
              </div>
            </div>
          </div>

      </div>

      {/* Side panel — priority: selected asset > selected child collection > current collection */}
      <AssetDetailPanel
        asset={primaryAsset!}
        open={panelOpen && !!primaryAsset}
        onClose={() => { clearAssetSelection(); closePanel() }}
        activeCollectionId={collectionId}
        activeContext={{ type: 'collection', id: collectionId }}
        contextGroups={primaryAssetContextGroups}
        onContextAssetClick={handlePanelAssetSwitch}
      />
      {selectedChildCollection && (
        <CollectionSidePanel
          collection={(selectedChildCollection)}
          open={panelOpen && !primaryAsset && !!selectedChildCollection}
          onClose={() => { clearCollectionSelection(); closePanel() }}
          actionPermissions={{
            canEdit: false,
            canDelete: false,
          }}
          matchingCount={childData.find(c => c.collection.id === selectedCollectionId)?.assetCount}
          relationships={selectedChildRelationships}
          suppressDimension={collection?.groupBy}
        />
      )}
      {collection && (
        <CollectionSidePanel
          collection={(collection)}
          open={panelOpen && !primaryAsset && !selectedChildCollection}
          onClose={closePanel}
          onAction={(action) => {
            if (action.type === 'update') handleUpdateCollection(action.updates)
            else if (action.type === 'delete') handleDeleteCollection()
          }}
          actionPermissions={{
            canEdit: canManageCurrentCollection,
            canDelete: canDeleteCurrentCollection,
          }}
          matchingCount={filteredAssets.length}
          relationships={relationships}
          suppressDimension={parentCollection?.groupBy}
        />
      )}

      <AccessModal
        open={shareModalOpen}
        onClose={closeShareModal}
        resourceId={shareResourceRef.id}
        resourceRef={shareResourceRef}
        title={activeShareTargetCollection?.name ?? collection?.name}
      />
      <Modal open={editModalOpen} onOpenChange={setEditModalOpen} size="sm">
        <Modal.Header title="Edit Collection" />
        <Modal.Body>
          {collection && (
            <SmartCollectionFilterBuilder
              name={draftName}
              filter={draftFilter}
              onNameChange={setDraftName}
              onFilterChange={setDraftFilter}
            />
          )}
        </Modal.Body>
        <Card.Footer>
          <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveEditedCollection}>Save</Button>
        </Card.Footer>
      </Modal>
      {assetShareTarget && (
        <AccessModal
          open
          onClose={() => setAssetShareTarget(null)}
          resourceId={assetShareTarget.ref.id}
          resourceRef={assetShareTarget.ref}
          title={assetShareTarget.title}
        />
      )}
      <CollectionMembershipModal
        open={showAddToCollectionModal}
        onClose={() => setShowAddToCollectionModal(false)}
        selectedAssets={selectedAssets}
        onComplete={clearAssetSelection}
      />
      {assetContextMenu && (
        <ContextMenu
          x={assetContextMenu.x}
          y={assetContextMenu.y}
          items={buildAssetMenuItems(assetContextMenu.asset)}
          onClose={() => setAssetContextMenu(null)}
        />
      )}
    </div>
  )
}
