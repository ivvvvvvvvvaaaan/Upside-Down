'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Download, MoreVertical, PanelRight, Info, Trash2 } from 'lucide-react'
import { ShareIcon } from '@/components/ui/share-icon'
import { useRouter } from 'next/navigation'
import {
  Stack,
  Button,
  CardGrid,
  AssetCard,
  ContextualActionBar,
  EmptyState,
  CollectionSidePanel,
  AssetDetailPanel,
  MobileToolbar,
  Dropdown,
  DropdownMenuItem,
  DropdownMenuDivider,
  SortDropdown,
  AppearanceDropdown,
  HawkinsSearch,
  PageHeader,
} from '@/components/ui'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import { getGridColumns, useAccess, useAssetSelection, usePersona, useViewPreferences, useUserCollections, useSmartCollections, useMobilePanel, useFileTree } from '@/hooks'
import type { Asset } from '@/lib/data'
import { PERSONAS } from '@/lib/personas'
import { assetToSelectionEntity } from '@/lib/selection-actions'
import { getContextAssetGroups } from '@/lib/context-relationships'
import { AccessModal } from '@/components/ui/access-modal'
import type { ResourceRef } from '@/lib/grants'
import { useToast } from '@/components/ui/toast'

interface UserCollectionDetailViewProps {
  collectionId: string
}

export function UserCollectionDetailView({ collectionId }: UserCollectionDetailViewProps) {
  const router = useRouter()

  const { activePersona, isAdmin, hydrated } = usePersona()
  const {
    filterByAccess,
    sharesReceivedByMe,
    allProjectShares,
    getVisibleCollection,
    canShare,
    canDownload,
    getResourceGrants,
    isSensitiveAsset,
  } = useAccess()
  const { getCollection, deleteCollection, removeAssetFromCollection } = useUserCollections()
  const { resolveCollectionAssets } = useFileTree()
  const { showToast } = useToast()
  const { getRelatedCollectionsForAssets, scopedAssets, ensureAssetsLoaded } = useSmartCollections()
  const { selectedIds, primaryId, handleAssetClick, selectOnly, clearSelection } = useAssetSelection()
  const { cardSize, setCardSize, sidePanelOpen, setSidePanelOpen, showTags, setShowTags, metadataFields, setMetadataField } = useViewPreferences()
  const [sortCriteria, setSortCriteria] = useState<import('@/components/ui').SortCriterion[]>([{ field: 'name', direction: 'asc' as const }])
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(sidePanelOpen, setSidePanelOpen)
  const { setBreadcrumbExtras, clearBreadcrumbExtras } = useBreadcrumbExtras()

  // Panel toggle is now inline in row 1, no breadcrumb action needed

  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  const rawCollection = getCollection(collectionId)
  const collection = getVisibleCollection(collectionId)
  const isOwner = hydrated && (isAdmin || (!!rawCollection && rawCollection.createdBy === activePersona?.email))
  const hasCollectionAccess = hydrated && !!collection
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const collectionResourceRef: ResourceRef = { id: collectionId, type: 'collection' }
  const showShareButton = hasCollectionAccess && canShare(collectionResourceRef)
  const canDownloadCollection = hasCollectionAccess && canDownload(collectionResourceRef)

  const [searchQuery, setSearchQuery] = useState('')

  const displayAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets
    const q = searchQuery.toLowerCase()
    return assets.filter(a => a.name.toLowerCase().includes(q))
  }, [assets, searchQuery])

  useEffect(() => {
    void ensureAssetsLoaded()
  }, [ensureAssetsLoaded])

  useEffect(() => {
    clearSelection()
  }, [collectionId, clearSelection])

  // Find who shared this collection with the current user
  const sharedBy = useMemo(() => {
    const shares = isAdmin ? allProjectShares : sharesReceivedByMe
    const share = shares.find(s => s.resourceId === collectionId)
    if (!share || isOwner) return null
    return PERSONAS.find(p => p.id === share.grantedByUserId)?.name ?? share.grantedByUserId
  }, [collectionId, isOwner, isAdmin, sharesReceivedByMe, allProjectShares])

  // Subtitle: "Shared by X" for received, "Shared with N people" / "Private" for owned
  const subtitle = useMemo(() => {
    if (sharedBy) return `Shared by ${sharedBy}`
    if (!isOwner || !collection) return undefined
    const grants = getResourceGrants(collectionId)
    const directGrants = grants.filter(g => !g.reviewLinkId)
    const linkGrants = grants.filter(g => g.reviewLinkId)
    if (directGrants.length === 0 && linkGrants.length === 0) return 'Private'
    const parts: string[] = []
    if (directGrants.length > 0) parts.push(`Shared with ${directGrants.length} ${directGrants.length === 1 ? 'person' : 'people'}`)
    if (linkGrants.length > 0) parts.push('Link sharing on')
    return parts.join(' · ')
  }, [sharedBy, isOwner, collection, collectionId, getResourceGrants])

  // Sync collection name to top-level breadcrumb
  const displayName = hasCollectionAccess ? collection?.name : undefined
  useEffect(() => {
    if (displayName) {
      setBreadcrumbExtras([{ label: displayName }])
    }
    return () => clearBreadcrumbExtras()
  }, [displayName, setBreadcrumbExtras, clearBreadcrumbExtras])

  const handleDeleteCollection = () => {
    if (collection && isOwner) {
      deleteCollection(collection.id)
      router.push('/nextgen')
    }
  }

  // Resolve assets from the unified tree-derived index
  useEffect(() => {
    if (!hydrated) return
    if (!collection || !hasCollectionAccess) {
      setAssets([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const resolved = resolveCollectionAssets(collection)
      // Collection grant is the access path — assets inside are accessible.
      // Pass asset IDs as additionalIds so filterByAccess allows them through
      // while still applying sensitive media filtering.
      const collectionAssetIds = new Set(resolved.map(a => a.id))
      setAssets(filterByAccess(resolved, collectionAssetIds))
    } catch (error) {
      console.error('Failed to resolve collection assets:', error)
      setAssets([])
    }
    setLoading(false)
  }, [hydrated, collection, hasCollectionAccess, filterByAccess, resolveCollectionAssets])

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }
  const toAssetResourceRef = useCallback((asset: Asset): ResourceRef => ({
    id: asset.id,
    type: asset.kind === 'cut' ? 'cut' : 'asset',
    domainId: asset.department,
  }), [])
  const handlePanelAssetSwitch = (nextAsset: Asset) => {
    if (assets.some((asset) => asset.id === nextAsset.id)) {
      selectOnly(nextAsset)
      setSidePanelOpen(true)
      return
    }
    router.push(`/nextgen/assets/${nextAsset.id}`)
  }

  const selectedAssets = useMemo(() => {
    return assets.filter((asset) => selectedIds.has(asset.id))
  }, [assets, selectedIds])
  const selectedEntities = useMemo(() => selectedAssets.map((asset) => assetToSelectionEntity(asset)), [selectedAssets])
  const canDownloadSelectedAssets = useMemo(() => {
    if (selectedAssets.length === 0) return false
    return selectedAssets.every((asset) => canDownload(toAssetResourceRef(asset)))
  }, [selectedAssets, canDownload, toAssetResourceRef])
  const handleDownloadCollection = useCallback(() => {
    if (!collection) return
    showToast(`Download started for "${collection.name}".`)
  }, [collection, showToast])
  const handleDownloadSelectedAssets = useCallback(() => {
    if (selectedAssets.length === 0) return
    if (selectedAssets.length === 1) {
      showToast(`Download started for "${selectedAssets[0].name}".`)
      return
    }
    showToast(`Download started for ${selectedAssets.length} assets.`)
  }, [selectedAssets, showToast])
  const isCurated = !!collection
  const canRemoveFromCollection = isCurated && isOwner
  const handleRemoveSelectedAssets = useCallback(() => {
    if (!collection || selectedAssets.length === 0) return
    for (const asset of selectedAssets) {
      removeAssetFromCollection(collection.id, asset.id)
    }
    showToast(selectedAssets.length === 1
      ? `Removed "${selectedAssets[0].name}" from ${collection.name}.`
      : `Removed ${selectedAssets.length} assets from ${collection.name}.`)
    clearSelection()
  }, [collection, selectedAssets, removeAssetFromCollection, showToast, clearSelection])
  const primaryAsset = useMemo(() => {
    if (!primaryId) return null
    return assets.find(a => a.id === primaryId) ?? null
  }, [primaryId, assets])
  const primaryAssetContextGroups = useMemo(() => {
    if (!primaryAsset) return undefined
    return getContextAssetGroups(primaryAsset, scopedAssets)
  }, [primaryAsset, scopedAssets])

  const relationships = useMemo(() => {
    if (assets.length === 0) return undefined
    return getRelatedCollectionsForAssets(assets)
  }, [assets, getRelatedCollectionsForAssets])

  // No access — redirect to search
  useEffect(() => {
    if (hydrated && !loading && (!collection || !hasCollectionAccess)) {
      router.replace('/nextgen')
    }
  }, [hydrated, loading, collection, hasCollectionAccess, router])

  if ((!collection || !hasCollectionAccess) && !loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <MobileToolbar title="Collection" />
                <EmptyState
                  title="Collection not found"
                  message="This collection may have been deleted or doesn't exist."
                >
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/nextgen/collections')}
                    className="mt-4"
                  >
                    Back to Collections
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
      <div className="flex-1 min-w-0 flex flex-col relative">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <MobileToolbar title={displayName || 'Collection'} actions={
                  <Button
                    variant="icon"
                    size="icon"
                    onClick={togglePanel}
                    aria-label={panelOpen ? 'Close info' : 'Open info'}

                  >
                    <Info className="w-4 h-4" />
                  </Button>
                } />
                <div className="flex items-center gap-2 md:hidden">
                  <HawkinsSearch
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <SortDropdown
                    fields={[
                      { value: 'name', label: 'Name' },
                      { value: 'date-modified', label: 'Date Modified' },
                      { value: 'kind', label: 'Kind' },
                    ]}
                    value={sortCriteria}
                    onChange={setSortCriteria}
                    iconOnly
                  />
                  <AppearanceDropdown
                    iconOnly
                    layout="grid"
                    onLayoutChange={() => {}}
                    cardSize={cardSize}
                    onCardSizeChange={setCardSize}
                    showLayoutOptions={false}
                    showTags={showTags}
                    onShowTagsChange={setShowTags}
                    metadataFields={metadataFields}
                    onMetadataFieldChange={setMetadataField}
                  />
                </div>

                {/* Row 1: Title + Search + Sort + Appearance + Panel toggle */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <PageHeader
                    title={displayName || 'Loading...'}
                    description={subtitle}
                    hideTitleOnMobile
                  />
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <HawkinsSearch
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <SortDropdown
                      fields={[
                        { value: 'name', label: 'Name' },
                        { value: 'date-modified', label: 'Date Modified' },
                        { value: 'kind', label: 'Kind' },
                      ]}
                      value={sortCriteria}
                      onChange={setSortCriteria}
                      iconOnly
                    />
                    <AppearanceDropdown
                      iconOnly
                      layout="grid"
                      onLayoutChange={() => {}}
                      cardSize={cardSize}
                      onCardSizeChange={setCardSize}
                      showLayoutOptions={false}
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

                {/* Row 2: Item count / Selection actions */}
                <div className="flex items-center justify-between">
                  <span className="text-body-0-regular text-foreground-subtle">
                    {selectedIds.size > 0
                      ? `${selectedIds.size} selected`
                      : !loading ? `${assets.length} asset${assets.length !== 1 ? 's' : ''}` : 'Loading...'}
                  </span>
                  {selectedIds.size > 0 ? (
                    <ContextualActionBar
                      selectedEntities={selectedEntities}
                      onClearSelection={clearSelection}
                      downloadAction={selectedAssets.length > 0 ? {
                        enabled: canDownloadSelectedAssets,
                        onClick: handleDownloadSelectedAssets,
                        reason: canDownloadSelectedAssets ? undefined : "You don't have permission to download all selected assets.",
                      } : undefined}
                      removeAction={selectedAssets.length > 0 && isCurated ? {
                        enabled: canRemoveFromCollection,
                        onClick: handleRemoveSelectedAssets,
                        reason: canRemoveFromCollection ? undefined : "Only the collection owner can remove assets.",
                      } : undefined}
                      inline
                    />
                  ) : (
                    <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                      {(isOwner || canDownloadCollection) && (
                        <Dropdown label="More" icon={<MoreVertical className="w-4 h-4" />} iconOnly compact align="end" width="sm">
                          <div className="py-1">
                            {canDownloadCollection && (
                              <DropdownMenuItem icon={<Download className="w-4 h-4" />} label="Download" onClick={handleDownloadCollection} />
                            )}
                            {isOwner && (
                              <>
                                <DropdownMenuDivider />
                                <DropdownMenuItem icon={<Trash2 className="w-4 h-4" />} label="Delete Collection" onClick={handleDeleteCollection} destructive />
                              </>
                            )}
                          </div>
                        </Dropdown>
                      )}
                      {showShareButton && (
                        <Button
                          variant="primary"
                          compact
                          icon={<ShareIcon />}
                          onClick={() => setShareModalOpen(true)}
                        >
                          Share
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {loading ? (
                  <CardGrid columns={getGridColumns(cardSize)} gap="4">
                    {[...Array(6)].map((_, i) => (
                      <AssetCard key={i} loading />
                    ))}
                  </CardGrid>
                ) : displayAssets.length > 0 ? (
                  <CardGrid columns={getGridColumns(cardSize)} gap="4">
                    {displayAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        selected={selectedIds.has(asset.id)}
                        primary={primaryId === asset.id}
                        onClick={(a, e) => handleAssetClick(a, e, displayAssets)}
                        onMenuClick={handleMenuClick}
                        showDepartment
                        shared={sharedBy ? false : undefined}
                        sensitive={isSensitiveAsset(asset.id)}
                        allSelectedIds={selectedIds}
                      />
                    ))}
                  </CardGrid>
                ) : (
                  <EmptyState
                    title="No assets"
                    message="This collection doesn't have any assets yet"
                  />
                )}

              </Stack>
            </div>
          </div>
        </div>

      </div>

      {/* Side panel - asset detail when selected, collection settings otherwise */}
      <AssetDetailPanel
        asset={primaryAsset!}
        open={panelOpen && !!primaryAsset}
        onClose={() => { clearSelection(); closePanel() }}
        activeCollectionId={collectionId}
        activeContext={{ type: 'collection', id: collectionId }}
        contextGroups={primaryAssetContextGroups}
        onContextAssetClick={handlePanelAssetSwitch}
      />
      {collection && hasCollectionAccess && (
        <CollectionSidePanel
          collection={collection}
          open={panelOpen && !primaryAsset}
          onClose={closePanel}
          onAction={(action) => {
            if (action.type === 'delete') handleDeleteCollection()
          }}
          actionPermissions={{
            canEdit: false,
            canDelete: isOwner,
          }}
          relationships={relationships}
        />
      )}

      <AccessModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        resourceId={collectionId}
        resourceRef={collectionResourceRef}
        title={collection?.name}
      />
    </div>
  )
}
