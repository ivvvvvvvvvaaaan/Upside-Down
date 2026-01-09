'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Stack,
  Text,
  CollectionCard,
  AssetCard,
  SettingsPanel,
  SettingGroup,
  SettingSegmented,
  Button,
  CardGrid,
  PageHeader,
  EmptyState,
  AppearanceDropdown,
  CollectionsListView,
  CollectionsGalleryView,
} from '@/components/ui'
import type { GalleryThumbnailMode } from '@/components/ui/collections-gallery-view'
import type { CollectionCardAssetCount } from '@/components/ui/collection-card'
import { AppLayout } from '@/components/layouts'
import { ArrowLeft } from 'lucide-react'
import { useAssetSelection, useCollectionAssets, useViewPreferences } from '@/hooks'
import type { Asset, Collection } from '@/lib/data'

// Collection card states: loading, real data (asis), or fake thumbnail variants
type CollectionCardState = 'loading' | 'asis' | 'many' | 'two' | 'one' | 'none'

// Asset card states: loading, real data, or no preview placeholder
type AssetCardState = 'loading' | 'asis' | 'no-preview'

interface AllCollectionsViewProps {
  collections: Collection[]
}

export function AllCollectionsView({ collections }: AllCollectionsViewProps) {
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const {
    selectedCollection,
    assets: collectionAssets,
    loading: loadingAssets,
    loadCollection,
    goBack,
  } = useCollectionAssets({ onNavigate: clearSelection })

  // Appearance settings - persisted globally
  const { layout, setLayout, cardSize, setCardSize } = useViewPreferences()

  // Card state controls
  const [collectionCardState, setCollectionCardState] = useState<CollectionCardState>('asis')
  const [assetCardState, setAssetCardState] = useState<AssetCardState>('asis')

  // Derive loading flags from state
  const showCollectionLoading = collectionCardState === 'loading'
  const showAssetLoading = assetCardState === 'loading'
  const forceEmptyPreview = assetCardState === 'no-preview'
  const thumbnailMode: GalleryThumbnailMode = collectionCardState === 'loading' ? 'asis' : collectionCardState

  // Pre-loaded asset data for accurate counts
  const [loadedAssets, setLoadedAssets] = useState<Record<string, Asset[]>>({})
  const [isPreloading, setIsPreloading] = useState(true)

  // Pre-fetch all collection assets on mount
  useEffect(() => {
    const fetchAllAssets = async () => {
      setIsPreloading(true)
      const fetchPromises = collections.map(async (collection) => {
        try {
          const response = await fetch(`/api/collections/${collection.id}/assets`)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const assets = await response.json()
          return { id: collection.id, assets }
        } catch (error) {
          console.error('Failed to pre-fetch assets:', error)
          return { id: collection.id, assets: [] }
        }
      })

      const results = await Promise.all(fetchPromises)
      const assetsMap: Record<string, Asset[]> = {}
      for (const result of results) {
        assetsMap[result.id] = result.assets
      }
      setLoadedAssets(assetsMap)
      setIsPreloading(false)
    }

    fetchAllAssets()
  }, [collections])

  // Enrich collections with real or fake data based on thumbnail mode
  const enrichedCollections = useMemo(() => {
    if (isPreloading) return collections

    return collections.map((collection) => {
      const assets = loadedAssets[collection.id] || []
      const realAssetCount = assets.length

      // "As Is" mode: use real thumbnails from loaded assets
      if (thumbnailMode === 'asis') {
        const assetThumbnails = assets
          .map((a) => a.thumbnail)
          .filter((t): t is string => !!t)

        return {
          ...collection,
          assetCount: realAssetCount,
          mainImage: assetThumbnails[0] || undefined,
          thumbnailImages: assetThumbnails.slice(1, 3),
        }
      }

      // Other modes: use original fake data but with real asset count
      return {
        ...collection,
        assetCount: realAssetCount,
      }
    })
  }, [collections, loadedAssets, isPreloading, thumbnailMode])

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  // Derive numberOfAssets based on collectionCardState
  const getNumberOfAssets = (collection: Collection): CollectionCardAssetCount => {
    if (collectionCardState === 'asis' || collectionCardState === 'loading') {
      const count = collection.assetCount
      if (count === 0) return 'None'
      if (count === 1) return 'One'
      if (count === 2) return 'Two'
      return 'Many'
    }
    const modeMap: Record<string, CollectionCardAssetCount> = {
      many: 'Many',
      two: 'Two',
      one: 'One',
      none: 'None',
    }
    return modeMap[collectionCardState] || 'Many'
  }

  // Determine grid columns based on card size
  const getColumns = () => {
    switch (cardSize) {
      case 'sm': return 6
      case 'lg': return 3
      default: return 4
    }
  }

  // Collection detail view
  if (selectedCollection) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <Stack spacing="lg">
              <div>
                <Button
                  variant="tertiary"
                  compact
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={goBack}
                  className="mb-4"
                >
                  Back to All Collections
                </Button>
                <Text variant="headline-1" weight="bold" className="mb-2">
                  {selectedCollection.name}
                </Text>
                <Text variant="body-2" color="secondary">
                  {loadingAssets
                    ? 'Loading assets...'
                    : `${collectionAssets.length} asset${collectionAssets.length !== 1 ? 's' : ''}`
                  }
                </Text>
              </div>

              {loadingAssets ? (
                <CardGrid columns={getColumns()} gap="4">
                  {[...Array(8)].map((_, i) => (
                    <AssetCard key={i} loading />
                  ))}
                </CardGrid>
              ) : collectionAssets.length > 0 ? (
                <CardGrid columns={getColumns()} gap="4">
                  {collectionAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      selected={selectedIds.has(asset.id)}
                      primary={primaryId === asset.id}
                      onClick={(a, e) => handleAssetClick(a, e, collectionAssets)}
                      onMenuClick={handleMenuClick}
                      loading={showAssetLoading}
                      forceEmptyPreview={forceEmptyPreview}
                    />
                  ))}
                </CardGrid>
              ) : (
                <EmptyState
                  title="No assets found"
                  message="This collection doesn't have any assets yet"
                />
              )}
            </Stack>
          </div>

          <SettingsPanel>
            <SettingGroup label="Asset Cards">
              <SettingSegmented
                options={[
                  { value: 'loading' as const, label: 'Loading' },
                  { value: 'asis' as const, label: 'As Is' },
                  { value: 'no-preview' as const, label: 'No Preview' },
                ]}
                value={assetCardState}
                onChange={(val) => setAssetCardState(val as AssetCardState)}
              />
            </SettingGroup>
          </SettingsPanel>
        </div>
      </AppLayout>
    )
  }

  // Main All Collections view
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Stack spacing="lg">
            <div className="flex items-start justify-between">
              <PageHeader
                title="All Collections"
                description={`${collections.length} collection${collections.length !== 1 ? 's' : ''}`}
              />
              <AppearanceDropdown
                layout={layout}
                onLayoutChange={setLayout}
                cardSize={cardSize}
                onCardSizeChange={setCardSize}
              />
            </div>

            {layout === 'list' ? (
              <CollectionsListView
                collections={enrichedCollections}
                onCollectionClick={loadCollection}
                loading={isPreloading}
              />
            ) : layout === 'gallery' ? (
              <CollectionsGalleryView
                collections={enrichedCollections}
                selectedIds={selectedIds}
                primaryId={primaryId}
                onAssetClick={handleAssetClick}
                onAssetMenuClick={handleMenuClick}
                showAssetLoading={showAssetLoading}
                showCollectionLoading={showCollectionLoading}
                thumbnailMode={thumbnailMode}
                loadedAssets={loadedAssets}
                isPreloading={isPreloading}
                forceEmptyPreview={forceEmptyPreview}
              />
            ) : isPreloading ? (
              <CardGrid gap="4" columns={getColumns()}>
                {[...Array(8)].map((_, i) => (
                  <CollectionCard
                    key={i}
                    title=""
                    assetCount={0}
                    type="character"
                    state="Loading"
                    numberOfAssets="None"
                    size={cardSize}
                  />
                ))}
              </CardGrid>
            ) : (
              <CardGrid gap="4" columns={getColumns()}>
                {enrichedCollections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    title={collection.name}
                    assetCount={collection.assetCount}
                    type={collection.type}
                    mainImage={collection.mainImage}
                    thumbnailImages={collection.thumbnailImages}
                    avatarSrc={collection.avatarSrc}
                    avatarName={collection.name}
                    state={showCollectionLoading ? 'Loading' : 'Normal'}
                    numberOfAssets={getNumberOfAssets(collection)}
                    size={cardSize}
                    onClick={() => loadCollection(collection)}
                  />
                ))}
              </CardGrid>
            )}
          </Stack>
        </div>

        <SettingsPanel>
          {(layout === 'grid' || layout === 'gallery') && (
            <SettingGroup label="Collection Cards">
              <SettingSegmented
                options={[
                  { value: 'loading' as const, label: 'Loading' },
                  { value: 'asis' as const, label: 'As Is' },
                  { value: 'many' as const, label: '3+ imgs' },
                  { value: 'two' as const, label: '2 imgs' },
                  { value: 'one' as const, label: '1 img' },
                  { value: 'none' as const, label: 'None' },
                ]}
                value={collectionCardState}
                onChange={(val) => setCollectionCardState(val as CollectionCardState)}
              />
            </SettingGroup>
          )}

          {layout === 'gallery' && (
            <SettingGroup label="Asset Cards">
              <SettingSegmented
                options={[
                  { value: 'loading' as const, label: 'Loading' },
                  { value: 'asis' as const, label: 'As Is' },
                  { value: 'no-preview' as const, label: 'No Preview' },
                ]}
                value={assetCardState}
                onChange={(val) => setAssetCardState(val as AssetCardState)}
              />
            </SettingGroup>
          )}
        </SettingsPanel>
      </div>
    </AppLayout>
  )
}

// Keep the old export name for backwards compatibility
export { AllCollectionsView as MediaLibraryView }
