'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Download, PanelRight, Info, Plus, Trash2, Link2 } from 'lucide-react'
import { ShareIcon } from '@/components/ui/share-icon'
import { SelectAllRow } from '@/components/ui/select-all-row'
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
  DropdownMenuItem,
  DropdownMenuDivider,
  InlineActionBar,
  SortDropdown,
  AppearanceDropdown,
  SearchTriggerButton,
  PageHeader,
} from '@/components/ui'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import { getGridColumns, useAccess, useAssetSelection, usePersona, useViewPreferences, useUserCollections, useSmartCollections, useMobilePanel, useFileTree } from '@/hooks'
import type { Asset } from '@/lib/data'
import { PERSONAS } from '@/lib/personas'
import { assetToSelectionEntity, assetToResourceRef } from '@/lib/selection-actions'
import { getContextAssetGroups } from '@/lib/context-relationships'
import { AccessModal } from '@/components/ui/access-modal'
import { CollectionMembershipModal } from '@/components/ui/collection-membership-modal'
import { ContextMenu } from '@/components/ui/context-menu'
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
    createGuestLink,
  } = useAccess()
  const { getCollection, deleteCollection, removeAssetFromCollection } = useUserCollections()
  const { resolveCollectionAssets } = useFileTree()
  const { showToast } = useToast()
  const { getRelatedCollectionsForAssets, scopedAssets, ensureAssetsLoaded } = useSmartCollections()
  const { selectedIds, primaryId, handleAssetClick, selectOnly, selectAll, clearSelection } = useAssetSelection()
  const { cardSize, setCardSize, sidePanelOpen, setSidePanelOpen, showTags, setShowTags, metadataFields, setMetadataField } = useViewPreferences()
  const [sortCriteria, setSortCriteria] = useState<import('@/components/ui').SortCriterion[]>([{ field: 'name', direction: 'asc' as const }])
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(sidePanelOpen, setSidePanelOpen)
  const { setBreadcrumbExtras, clearBreadcrumbExtras } = useBreadcrumbExtras()

  // Panel toggle is now inline in row 1, no breadcrumb action needed

  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; asset: Asset } | null>(null)
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false)

  const rawCollection = getCollection(collectionId)
  const collection = getVisibleCollection(collectionId)
  const isOwner = hydrated && (isAdmin || (!!rawCollection && rawCollection.createdBy === activePersona?.email))
  const hasCollectionAccess = hydrated && !!collection
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const collectionResourceRef: ResourceRef = useMemo(() => ({ id: collectionId, type: 'collection' }), [collectionId])
  const showShareButton = hasCollectionAccess && canShare(collectionResourceRef)

  // Local searchbox filtering removed — spotlight overlay owns search now.
  const displayAssets = assets

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

  // Subtitle: "Shared by X" for received, "Shared with N people" / "Private" for owned.
  // Gated on `hydrated` so SSR and the first client render both produce `undefined`,
  // avoiding a hydration mismatch when localStorage-backed persona/access state arrives.
  const subtitle = useMemo(() => {
    if (!hydrated) return undefined
    if (sharedBy) return `Shared by ${sharedBy}`
    if (!isOwner || !collection) return undefined
    const grants = getResourceGrants(collectionId)
      .filter(g => !(g.principal.type === 'user' && g.principal.userId === g.grantedByUserId))
    const directGrants = grants.filter(g => !g.reviewLinkId)
    const linkGrants = grants.filter(g => g.reviewLinkId)
    if (directGrants.length === 0 && linkGrants.length === 0) return 'Private'
    const parts: string[] = []
    if (directGrants.length > 0) parts.push(`Shared with ${directGrants.length} ${directGrants.length === 1 ? 'person' : 'people'}`)
    if (linkGrants.length > 0) parts.push('Link sharing on')
    return parts.join(' · ')
  }, [hydrated, sharedBy, isOwner, collection, collectionId, getResourceGrants])

  // Sync collection name to top-level breadcrumb
  const displayName = hasCollectionAccess ? collection?.name : undefined
  useEffect(() => {
    if (displayName) {
      setBreadcrumbExtras([{ label: displayName }])
    }
    return () => clearBreadcrumbExtras()
  }, [displayName, setBreadcrumbExtras, clearBreadcrumbExtras])

  const handleDeleteCollection = useCallback(() => {
    if (collection && isOwner) {
      deleteCollection(collection.id)
      router.push('/nextgen')
    }
  }, [collection, isOwner, deleteCollection, router])

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
      setAssets(filterByAccess(resolved))
    } catch (error) {
      console.error('Failed to resolve collection assets:', error)
      setAssets([])
    }
    setLoading(false)
  }, [hydrated, collection, hasCollectionAccess, filterByAccess, resolveCollectionAssets])

  const [assetShareTarget, setAssetShareTarget] = useState<{ ref: ResourceRef; title: string } | null>(null)

  const toAssetResourceRef = assetToResourceRef
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
  type MenuItem = import('@/components/ui/inline-action-bar').ActionMenuItem

  const collectionShareable = showShareButton
  const collectionMenuItems = useMemo((): MenuItem[] => {
    const items: MenuItem[] = [
      { label: 'Share', icon: <ShareIcon className="w-4 h-4" />, onClick: () => setShareModalOpen(true), disabled: !collectionShareable },
      { label: 'Copy link', icon: <Link2 className="w-4 h-4" />, disabled: !collectionShareable, onClick: () => {
        const link = createGuestLink(collectionResourceRef, { allowDownload: false, passcode: false, expiresInDays: 7, label: collection?.name ?? collectionId })
        if (!link) return
        navigator.clipboard.writeText(`${window.location.origin}/nextgen/share/${link.id}`)
        showToast('Link copied', 'success', { label: 'Share settings', onClick: () => setShareModalOpen(true) })
      } },
      { label: 'Download', icon: <Download className="w-4 h-4" />, onClick: handleDownloadCollection },
    ]
    if (isOwner) {
      items.push(
        { label: 'Delete collection', icon: <Trash2 className="w-4 h-4" />, onClick: handleDeleteCollection, destructive: true },
      )
    }
    return items
  }, [isOwner, collectionShareable, collectionResourceRef, createGuestLink, showToast, handleDownloadCollection, handleDeleteCollection, collection?.name, collectionId])

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
      { label: 'Add to Collection', icon: <Plus className="w-4 h-4" />, onClick: () => { selectOnly(asset); setShowAddToCollectionModal(true) } },
      { label: 'View details', icon: <Info className="w-4 h-4" />, onClick: () => { selectOnly(asset); setSidePanelOpen(true) } },
    ]
    if (isOwner && collection) {
      items.push({ label: 'Remove from collection', icon: <Trash2 className="w-4 h-4" />, onClick: () => { removeAssetFromCollection(collection.id, asset.id); showToast(`Removed "${asset.name}" from ${collection.name}.`) }, destructive: true })
    }
    return items
  }, [toAssetResourceRef, canShare, createGuestLink, showToast, selectOnly, setSidePanelOpen, isOwner, collection, removeAssetFromCollection])

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
                  <>
                    <SearchTriggerButton collapsible />
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
                    <Button
                      variant="icon"
                      size="icon"
                      onClick={togglePanel}
                      aria-label={panelOpen ? 'Close info' : 'Open info'}
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </>
                } />

                {/* Row 1: Title + Search + Sort + Appearance + Panel toggle */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <PageHeader
                    title={displayName || 'Loading...'}
                    description={subtitle}
                    hideTitleOnMobile
                  />
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <SearchTriggerButton />
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

                <div className="flex items-center justify-between min-h-8">
                  <SelectAllRow
                    selectedCount={selectedIds.size}
                    totalCount={displayAssets.length}
                    onSelectAll={() => selectAll(displayAssets)}
                    onClearSelection={clearSelection}
                    label={!loading ? `${assets.length} asset${assets.length !== 1 ? 's' : ''}` : 'Loading...'}
                  />
                  {selectedIds.size > 0 ? (
                    <ContextualActionBar
                      selectedEntities={selectedEntities}
                      onClearSelection={clearSelection}
                      downloadAction={selectedAssets.length > 0 ? {
                        enabled: canDownloadSelectedAssets,
                        onClick: handleDownloadSelectedAssets,
                        reason: canDownloadSelectedAssets ? undefined : "You don't have permission to download all selected assets.",
                        label: `Download ${selectedAssets.length} Asset${selectedAssets.length !== 1 ? 's' : ''}`,
                      } : undefined}
                      removeAction={selectedAssets.length > 0 && isCurated ? {
                        enabled: canRemoveFromCollection,
                        onClick: handleRemoveSelectedAssets,
                        reason: canRemoveFromCollection ? undefined : "Only the collection owner can remove assets.",
                      } : undefined}
                      menuItems={(() => {
                        if (selectedAssets.length === 1) {
                          const items = buildAssetMenuItems(selectedAssets[0])
                          const countLabels = new Map([['Share', 'Share 1 Asset'], ['Download', 'Download 1 Asset']])
                          return items.map(item => countLabels.has(item.label) ? { ...item, label: countLabels.get(item.label)! } : item)
                        }
                        return collectionMenuItems
                      })()}
                    />
                  ) : (
                    <InlineActionBar items={collectionMenuItems} />
                  )}
                </div>

                {loading ? (
                  <CardGrid columns={getGridColumns(cardSize)} gap="4">
                    {[...Array(6)].map((_, i) => (
                      <AssetCard key={i} loading />
                    ))}
                  </CardGrid>
                ) : displayAssets.length > 0 ? (
                  <CardGrid
                    columns={getGridColumns(cardSize)}
                    gap="4"
                    onContextMenu={(e) => {
                      const card = (e.target as HTMLElement).closest('[data-asset-id]')
                      if (!card) return
                      const assetId = card.getAttribute('data-asset-id')
                      const asset = assetId ? displayAssets.find(a => a.id === assetId) : null
                      if (asset) {
                        e.preventDefault()
                        setContextMenu({ x: e.clientX, y: e.clientY, asset })
                      }
                    }}
                  >
                    {displayAssets.map((asset) => (
                      <div key={asset.id} data-asset-id={asset.id}>
                        <AssetCard
                          asset={asset}
                          selected={selectedIds.has(asset.id)}
                          primary={primaryId === asset.id}
                          onClick={(a, e) => handleAssetClick(a, e, displayAssets)}
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
                          shared={sharedBy ? false : undefined}
                          sensitive={asset.sensitive}
                          allSelectedIds={selectedIds}
                        />
                      </div>
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
        onComplete={clearSelection}
      />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildAssetMenuItems(contextMenu.asset)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
