'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, PanelRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
} from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import { getGridColumns, useAccess, useAssetSelection, usePersona, useViewPreferences, useUserCollections, useSmartCollections } from '@/hooks'
import type { Asset } from '@/lib/data'
import { PERSONAS } from '@/lib/personas'
import { assetToSelectionEntity } from '@/lib/selection-actions'
import { getContextAssetGroups } from '@/lib/context-relationships'

interface UserCollectionDetailViewProps {
  collectionId: string
}

export function UserCollectionDetailView({ collectionId }: UserCollectionDetailViewProps) {
  const pathname = usePathname()
  const router = useRouter()
  const menuHref = `/nextgen/menu?return=${encodeURIComponent(pathname)}`

  const { activePersona, isAdmin, hydrated } = usePersona()
  const { filterByAccess, sharesReceivedByMe, allProjectShares, getVisibleCollection } = useAccess()
  const { getCollection, deleteCollection } = useUserCollections()
  const { getRelatedCollectionsForAssets, scopedAssets, ensureAssetsLoaded } = useSmartCollections()
  const { selectedIds, primaryId, handleAssetClick, selectOnly, clearSelection } = useAssetSelection()
  const { cardSize, sidePanelOpen, setSidePanelOpen } = useViewPreferences()
  const { setBreadcrumbExtras, clearBreadcrumbExtras } = useBreadcrumbExtras()

  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  const rawCollection = getCollection(collectionId)
  const collection = getVisibleCollection(collectionId)
  const isOwner = hydrated && (isAdmin || (!!rawCollection && rawCollection.createdBy === activePersona?.email))
  const hasCollectionAccess = hydrated && !!collection

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
      <AppLayout>
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <Stack spacing="lg">
                  <div className="md:hidden">
                    <Button asChild variant="icon" size="icon" aria-label="Menu">
                      <Link href={menuHref}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="sr-only">Menu</span>
                      </Link>
                    </Button>
                  </div>
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
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-full flex">
        {/* Main content area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <Stack spacing="lg">
                  <div className="md:hidden">
                    <Button asChild variant="icon" size="icon" aria-label="Menu">
                      <Link href={menuHref}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="sr-only">Menu</span>
                      </Link>
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Text variant="headline-1" weight="bold" className="mb-2">
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
                      <Button
                        variant="icon"
                        onClick={() => setSidePanelOpen(!sidePanelOpen)}
                        aria-label={sidePanelOpen ? 'Close panel' : 'Open panel'}
                        className={cn(sidePanelOpen && 'bg-surface-3')}
                      >
                        <PanelRight className="w-4 h-4" />
                      </Button>
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
          open={sidePanelOpen && !!primaryAsset}
          onClose={() => { clearSelection(); setSidePanelOpen(false) }}
          activeCollectionId={collectionId}
          activeContext={{ type: 'collection', id: collectionId }}
          contextGroups={primaryAssetContextGroups}
          onContextAssetClick={handlePanelAssetSwitch}
        />
        {collection && hasCollectionAccess && (
          <CollectionSidePanel
            collection={collection}
            open={sidePanelOpen && !primaryAsset}
            onClose={() => setSidePanelOpen(false)}
            onDelete={handleDeleteCollection}
            canDelete={isOwner}
            relationships={relationships}
          />
        )}
      </div>
    </AppLayout>
  )
}
