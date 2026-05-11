'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PanelRight, Info, Link2, Download, Plus, Trash2, Pencil } from 'lucide-react'
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
  HawkinsSearch,
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
import { getOntologyMeta } from '@/lib/ontology-meta'
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
import { DropdownMenuItem, DropdownMenuDivider } from '@/components/ui'
import { getCollectionCapabilities } from '@/lib/collection-types'

interface SmartCollectionDetailViewProps {
  collectionId: string
}

export function SmartCollectionDetailView({ collectionId }: SmartCollectionDetailViewProps) {
  const router = useRouter()

  const {
    getCollection,
    getChildren,
    getRelatedCollections,
    updateCollection,
    deleteCollection,
    scopedAssets,
    assetsLoaded,
    assetsLoading,
    ensureAssetsLoaded,
  } = useSmartCollections()
  const { collections: userCollections } = useUserCollections()
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
  const { canShare, canEditAcl, getResourceGrants, sharesReceivedByMe, allProjectShares, isSensitiveAsset, createGuestLink } = useAccess()
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const { showToast } = useToast()
  const collectionResourceRef: ResourceRef = { id: collectionId, type: 'smart-collection' }

  const [assetContextMenu, setAssetContextMenu] = useState<{ x: number; y: number; asset: Asset } | null>(null)
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftFilter, setDraftFilter] = useState<AssetFilter>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' },
  ])

  const collection = getCollection(collectionId)
  const collectionCapabilities = collection ? getCollectionCapabilities(collection) : null
  const linkedSnapshotCollections = useMemo(() => {
    if (!collection) return []
    return userCollections
      .filter((userCollection) => userCollection.sourceSmartCollectionId === collection.id)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  }, [collection, userCollections])
  const shareTargetCollection = linkedSnapshotCollections.length === 1
    ? linkedSnapshotCollections[0]
    : null
  const shareResourceRef: ResourceRef = shareTargetCollection
    ? { id: shareTargetCollection.id, type: 'collection' }
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

  type MenuItem = import('@/components/ui/inline-action-bar').ActionMenuItem

  const smartCollectionMenuItems = useMemo((): MenuItem[] => {
    const items: MenuItem[] = []
    if (showShareButton) {
      items.push({ label: 'Share', icon: <ShareIcon className="w-4 h-4" />, onClick: () => setShareModalOpen(true) })
    }
    if (canEditCurrentCollection) {
      items.push({ label: 'Edit', icon: <Pencil className="w-4 h-4" />, onClick: openEditCollectionModal })
    }
    if (canDeleteCurrentCollection) {
      if (items.length > 0) items[items.length - 1].dividerAfter = true
      items.push({ label: 'Delete collection', icon: <Trash2 className="w-4 h-4" />, onClick: () => { if (collection) { deleteCollection(collection.id); router.push('/nextgen') } }, destructive: true })
    }
    return items
  }, [showShareButton, canEditCurrentCollection, canDeleteCurrentCollection, openEditCollectionModal, collection, deleteCollection, router])

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
    return items
  }, [toAssetResourceRef, canShare, createGuestLink, showToast, selectOnlyAsset, setSidePanelOpen])

  const handleAssetCardClick = (asset: typeof filteredAssets[number], event: React.MouseEvent) => {
    clearCollectionSelection()
    handleAssetClick(asset, event, filteredAssets)
  }
  const handleCollectionCardClick = (
    childCollection: typeof childData[number]['collection'],
    event: React.MouseEvent,
  ) => {
    clearAssetSelection()
    handleCollectionSelectionClick(childCollection, event, childData.map((entry) => entry.collection))
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

  // Contextual filter chips based on collection type
  const filterOptions = useMemo(() => {
    if (!collection) return []
    switch (collection.icon) {
      case 'character':
        return [
          { id: 'episode', label: 'Episode' },
          { id: 'role', label: 'Role' },
          { id: 'status', label: 'Status' },
        ]
      case 'scene':
        return [
          { id: 'episode', label: 'Episode' },
          { id: 'location', label: 'Location' },
          { id: 'time-of-day', label: 'Time of Day' },
        ]
      case 'location':
        return [
          { id: 'episode', label: 'Episode' },
          { id: 'scene', label: 'Scene' },
        ]
      default:
        return [
          { id: 'type', label: 'Type' },
          { id: 'modified', label: 'Modified' },
        ]
    }
  }, [collection])

  const pageTitle = collection?.name || 'Loading...'

  // When the collection represents a narrative ontology entity (character/scene/location)
  // and we have rich metadata for it, swap the generic PageHeader for a bespoke hero.
  const ontologyMeta = useMemo(() => {
    if (!collection?.name || !collection?.icon) return null
    return getOntologyMeta(collection.name, collection.icon)
  }, [collection?.name, collection?.icon])
  const showOntologyHero = ontologyMeta !== null
  const itemCount = isParentWithChildren
    ? childCollections.length
    : filteredAssets.length
  const countLabel = isParentWithChildren ? 'collection' : 'asset'



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
                      <HawkinsSearch
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        filters={filterOptions}
                        collapsible
                      />
                      <SortDropdown
                        fields={sortFields}
                        value={sortCriteria}
                        onChange={setSortCriteria}
                        iconOnly
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
                      <HawkinsSearch
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        filters={filterOptions}
                        expandable
                      />
                      <SortDropdown
                        fields={sortFields}
                        value={sortCriteria}
                        onChange={setSortCriteria}
                        iconOnly
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
                      selectedCount={selectedAssetIds.size + selectedCollectionIds.size}
                      totalCount={itemCount}
                      onSelectAll={() => {
                        if (isParentWithChildren) {
                          selectAllCollections(childData.map(c => c.collection))
                        } else {
                          selectAllAssets(filteredAssets)
                        }
                      }}
                      onClearSelection={isParentWithChildren ? clearCollectionSelection : clearAssetSelection}
                      label={!loading ? `${itemCount} ${countLabel}${itemCount !== 1 ? 's' : ''}` : 'Loading...'}
                    />
                    {(selectedAssetIds.size > 0 || selectedCollectionIds.size > 0) ? (
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
                  <div className="min-h-[400px]">
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
                            isSelected={!isMobile && selectedCollectionIds.has(child.collection.id)}
                            primary={!isMobile && selectedCollectionId === child.collection.id}
                            onClick={isMobile
                              ? () => router.push(`/nextgen/collections/${child.collection.id}`)
                              : (event) => handleCollectionCardClick(child.collection, event)
                            }
                            onDoubleClick={isMobile ? undefined : () => router.push(`/nextgen/collections/${child.collection.id}`)}
                          />
                        ))}
                      </CardGrid>
                    ) : filteredAssets.length > 0 ? (
                      <CardGrid
                        columns={getGridColumns(cardSize)}
                        gap="4"
                        onContextMenu={(e) => {
                          const card = (e.target as HTMLElement).closest('[data-asset-id]')
                          if (!card) return
                          const assetId = card.getAttribute('data-asset-id')
                          const asset = assetId ? filteredAssets.find(a => a.id === assetId) : null
                          if (asset) {
                            e.preventDefault()
                            setAssetContextMenu({ x: e.clientX, y: e.clientY, asset })
                          }
                        }}
                      >
                        {filteredAssets.map((asset) => (
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
                              sensitive={isSensitiveAsset(asset.id)}
                              allSelectedIds={selectedAssetIds}
                            />
                          </div>
                        ))}
                      </CardGrid>
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
          avatarSrc={childData.find(c => c.collection.id === selectedCollectionId)?.avatarSrc}
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
          avatarSrc={getCollectionImagesByName(collection.name).avatarSrc}
        />
      )}

      <AccessModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        resourceId={shareResourceRef.id}
        resourceRef={shareResourceRef}
        title={shareTargetCollection?.name ?? collection?.name}
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
