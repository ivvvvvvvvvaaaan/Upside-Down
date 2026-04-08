'use client'

import { useState, useEffect, useMemo } from 'react'
import { PanelRight, Info, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  Stack,
  Text,
  Button,
  CardGrid,
  AssetCard,
  SelectionBar,
  EmptyState,
  CollectionSidePanel,
  AssetDetailPanel,
  MobileToolbar,
} from '@/components/ui'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import { getGridColumns, useAccess, useAssetSelection, usePersona, useViewPreferences, useUserCollections, useSmartCollections, useMobilePanel } from '@/hooks'
import type { Asset } from '@/lib/data'
import { PERSONAS } from '@/lib/personas'
import { assetToSelectionEntity } from '@/lib/selection-actions'
import { getContextAssetGroups } from '@/lib/context-relationships'
import { AccessModal } from '@/components/ui/access-modal'
import type { ResourceRef } from '@/lib/grants'

interface UserCollectionDetailViewProps {
  collectionId: string
}

export function UserCollectionDetailView({ collectionId }: UserCollectionDetailViewProps) {
  const router = useRouter()

  const { activePersona, isAdmin, hydrated } = usePersona()
  const { filterByAccess, sharesReceivedByMe, allProjectShares, getVisibleCollection, canShare } = useAccess()
  const { getCollection, deleteCollection } = useUserCollections()
  const { getRelatedCollectionsForAssets, scopedAssets, ensureAssetsLoaded } = useSmartCollections()
  const { selectedIds, primaryId, handleAssetClick, selectOnly, clearSelection } = useAssetSelection()
  const { cardSize, sidePanelOpen, setSidePanelOpen, showTags, metadataFields } = useViewPreferences()
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(sidePanelOpen, setSidePanelOpen)
  const { setBreadcrumbExtras, clearBreadcrumbExtras } = useBreadcrumbExtras()

  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  const rawCollection = getCollection(collectionId)
  const collection = getVisibleCollection(collectionId)
  const isOwner = hydrated && (isAdmin || (!!rawCollection && rawCollection.createdBy === activePersona?.email))
  const hasCollectionAccess = hydrated && !!collection
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const collectionResourceRef: ResourceRef = { id: collectionId, type: 'collection' }
  const showShareButton = hasCollectionAccess && canShare(collectionResourceRef)

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



  // Fetch assets by IDs when collection loads
  useEffect(() => {
    if (!hydrated) return
    if (!collection || !hasCollectionAccess) {
      setAssets([])
      setLoading(false)
      return
    }

    const fetchAssets = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/assets/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: collection.assetIds }),
        })
        if (!response.ok) throw new Error('Failed to fetch assets')
        const fetchedAssets = await response.json()
        setAssets(filterByAccess(fetchedAssets))
      } catch (error) {
        console.error('Failed to fetch assets:', error)
        setAssets([])
      }
      setLoading(false)
    }

    fetchAssets()
  }, [hydrated, collection, hasCollectionAccess, filterByAccess])

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }
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

  // Collection not found
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
      <div className="flex-1 min-w-0 flex flex-col">
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
                    className={cn(panelOpen && 'bg-surface-3')}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                } />

                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Text variant="headline-1" weight="bold" className="mb-2 hidden md:block">
                        {displayName || 'Loading...'}
                      </Text>
                      <Text variant="body-2" color="secondary">
                        {loading
                          ? 'Loading assets...'
                          : assets.length === 0
                          ? 'No assets'
                          : `${assets.length} asset${assets.length !== 1 ? 's' : ''}`
                        }
                        {sharedBy && ` · Shared by ${sharedBy}`}
                      </Text>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      {showShareButton && (
                        <Button
                          variant="icon"
                          onClick={() => setShareModalOpen(true)}
                          aria-label="Share collection"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="icon"
                        onClick={togglePanel}
                        aria-label={panelOpen ? 'Close panel' : 'Open panel'}
                        className={cn(panelOpen && 'bg-surface-3')}
                      >
                        <PanelRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <CardGrid columns={getGridColumns(cardSize)} gap="4">
                    {[...Array(6)].map((_, i) => (
                      <AssetCard key={i} loading />
                    ))}
                  </CardGrid>
                ) : assets.length > 0 ? (
                  <CardGrid columns={getGridColumns(cardSize)} gap="4">
                    {assets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        selected={selectedIds.has(asset.id)}
                        primary={primaryId === asset.id}
                        onClick={(a, e) => handleAssetClick(a, e, assets)}
                        onMenuClick={handleMenuClick}
                        showDepartment
                        shared={sharedBy ? false : undefined}
                        showTags={showTags}
                        metadataFields={metadataFields}
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

        <SelectionBar
          selectedEntities={selectedEntities}
          onClear={clearSelection}
        />
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
          onDelete={handleDeleteCollection}
          canDelete={isOwner}
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
