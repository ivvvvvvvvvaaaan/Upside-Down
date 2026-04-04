'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  AppearanceDropdown,
  AssetCard,
  Button,
  CardGrid,
  CollectionsGalleryView,
  CollectionsListView,
  CompactBar,
  EmptyState,
  HawkinsSearch,
  PageHeader,
  SelectionBar,
  SettingGroup,
  SettingSegmented,
  SettingsPanel,
  SortDropdown,
  Stack,
  Text,
  CollectionCard,
  MobileToolbar,
} from '@/components/ui'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import type { GalleryThumbnailMode } from '@/components/ui/collections-gallery-view'
import type { CollectionCardAssetCount } from '@/components/ui/collection-card'
import {
  useAssetSelection,
  useCollectionAssets,
  useCompactBar,
  useResourceSelection,
  useViewPreferences,
} from '@/hooks'
import type { Asset, Collection } from '@/lib/data'
import { assetToSelectionEntity, collectionToSelectionEntity } from '@/lib/selection-actions'
import { getGridColumns } from '@/hooks/useViewPreferences'
import { useIsMobile } from '@/hooks/useMediaQuery'

type CollectionCardState = 'loading' | 'asis' | 'many' | 'two' | 'one' | 'none'
type AssetCardState = 'loading' | 'asis' | 'no-preview' | 'processing'

const SKELETON_ASSET_COUNT = 8

interface CollectionBrowserViewProps {
  title: string
  description: string
  detailBackLabel: string
  collections: Collection[]
  filterOptions: { id: string; label: string }[]
  allowHideEmptyCollections?: boolean
}

function getCollectionCardCountLabel(
  collection: Collection,
  cardState: CollectionCardState,
): CollectionCardAssetCount {
  if (cardState === 'asis' || cardState === 'loading') {
    const count = collection.assetCount
    if (count === 0) return 'None'
    if (count === 1) return 'One'
    if (count === 2) return 'Two'
    return 'Many'
  }

  const modeMap: Record<Exclude<CollectionCardState, 'asis' | 'loading'>, CollectionCardAssetCount> = {
    many: 'Many',
    two: 'Two',
    one: 'One',
    none: 'None',
  }

  return modeMap[cardState]
}

export function CollectionBrowserView({
  title,
  description,
  detailBackLabel,
  collections,
  filterOptions,
  allowHideEmptyCollections = false,
}: CollectionBrowserViewProps) {
  const {
    selectedIds: selectedAssetIds,
    primaryId: primaryAssetId,
    handleSelectionClick: handleAssetClick,
    clearSelection: clearAssetSelection,
  } = useAssetSelection()
  const {
    selectedIds: selectedCollectionIds,
    primaryId: selectedCollectionId,
    handleSelectionClick: handleCollectionSelectionClick,
    clearSelection: clearCollectionSelection,
  } = useResourceSelection<Collection>()
  const {
    selectedCollection,
    assets: collectionAssets,
    loading: loadingAssets,
    error: loadError,
    loadCollection,
    retry: retryLoad,
    goBack,
  } = useCollectionAssets({ onNavigate: clearAssetSelection })
  const { scrollRef, headerRef, showCompactBar } = useCompactBar()
  const isCompactBarVisible = !selectedCollection && showCompactBar
  const {
    layout,
    setLayout,
    cardSize,
    setCardSize,
    hideEmptyCollections,
    setHideEmptyCollections,
  } = useViewPreferences()
  const isMobile = useIsMobile()

  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date Modified' },
    { value: 'type', label: 'Type' },
    { value: 'size', label: 'Size' },
  ]
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [collectionCardState, setCollectionCardState] = useState<CollectionCardState>('asis')
  const [assetCardState, setAssetCardState] = useState<AssetCardState>('asis')

  const showCollectionLoading = collectionCardState === 'loading'
  const showAssetLoading = assetCardState === 'loading'
  const forceEmptyPreview = assetCardState === 'no-preview'
  const showProcessing = assetCardState === 'processing'
  const thumbnailMode: GalleryThumbnailMode = collectionCardState === 'loading' ? 'asis' : collectionCardState

  const [loadedAssets, setLoadedAssets] = useState<Record<string, Asset[]>>({})
  const [isPreloading, setIsPreloading] = useState(true)
  const [preloadFailures, setPreloadFailures] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchAllAssets = async () => {
      setIsPreloading(true)
      setPreloadFailures(new Set())

      const fetchPromises = collections.map(async (collection) => {
        try {
          const response = await fetch(`/api/collections/${collection.id}/assets`)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const assets = await response.json()
          return { id: collection.id, assets, failed: false }
        } catch (error) {
          console.error('Failed to pre-fetch assets:', error)
          return { id: collection.id, assets: [], failed: true }
        }
      })

      const results = await Promise.all(fetchPromises)
      const assetsMap: Record<string, Asset[]> = {}
      const failures = new Set<string>()

      for (const result of results) {
        assetsMap[result.id] = result.assets
        if (result.failed) {
          failures.add(result.id)
        }
      }

      setLoadedAssets(assetsMap)
      setPreloadFailures(failures)
      setIsPreloading(false)
    }

    fetchAllAssets()
  }, [collections])

  const enrichedCollections = useMemo(() => {
    if (isPreloading) return collections

    return collections.map((collection) => {
      const assets = loadedAssets[collection.id] || []
      const realAssetCount = assets.length

      if (thumbnailMode === 'asis') {
        const assetThumbnails = assets
          .map((asset) => asset.thumbnail)
          .filter((thumbnail): thumbnail is string => Boolean(thumbnail))

        return {
          ...collection,
          assetCount: realAssetCount,
          mainImage: assetThumbnails[0] || undefined,
          thumbnailImages: assetThumbnails.slice(1, 3),
        }
      }

      return {
        ...collection,
        assetCount: realAssetCount,
      }
    })
  }, [collections, loadedAssets, isPreloading, thumbnailMode])

  const visibleCollections = useMemo(() => {
    if (!allowHideEmptyCollections || !hideEmptyCollections) return enrichedCollections
    return enrichedCollections.filter((collection) => collection.assetCount > 0)
  }, [allowHideEmptyCollections, enrichedCollections, hideEmptyCollections])

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  const allAssets = useMemo(() => {
    const seen = new Set<string>()
    const assets: Asset[] = []
    for (const collectionAssets of Object.values(loadedAssets)) {
      for (const asset of collectionAssets) {
        if (seen.has(asset.id)) continue
        seen.add(asset.id)
        assets.push(asset)
      }
    }
    return assets
  }, [loadedAssets])

  const selectedAssets = useMemo(() => {
    const sourceAssets = selectedCollection ? collectionAssets : allAssets
    return sourceAssets.filter((asset) => selectedAssetIds.has(asset.id))
  }, [allAssets, collectionAssets, selectedCollection, selectedAssetIds])
  const selectedAssetEntities = useMemo(
    () => selectedAssets.map((asset) => assetToSelectionEntity(asset)),
    [selectedAssets],
  )
  const selectedCollectionEntities = useMemo(() => {
    return visibleCollections
      .filter((collection) => selectedCollectionIds.has(collection.id))
      .map((collection) => collectionToSelectionEntity(collection, 'collection'))
  }, [visibleCollections, selectedCollectionIds])
  const activeSelectionEntities = selectedCollection
    ? selectedAssetEntities
    : layout === 'grid'
      ? selectedCollectionEntities
      : selectedAssetEntities

  const hideEmptyProps = allowHideEmptyCollections
    ? {
        hideEmptyCollections,
        onHideEmptyCollectionsChange: setHideEmptyCollections,
      }
    : {}

  if (selectedCollection) {
    return (
      <div className="h-full flex flex-col">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <MobileToolbar title={selectedCollection.name} />
                <div>
                  <Button
                    variant="tertiary"
                    icon={<ArrowLeft />}
                    onClick={goBack}
                    className="mb-4 hidden md:inline-flex"
                  >
                    {detailBackLabel}
                  </Button>
                  <Text variant="headline-1" weight="bold" className="mb-2 hidden md:block">
                    {selectedCollection.name}
                  </Text>
                  <Text variant="body-2" color="secondary">
                    {loadingAssets
                      ? 'Loading assets...'
                      : collectionAssets.length === 0
                        ? 'No assets'
                        : `${collectionAssets.length} asset${collectionAssets.length !== 1 ? 's' : ''}`
                    }
                  </Text>
                </div>

                {loadingAssets ? (
                  <CardGrid columns={getGridColumns(cardSize)} gap="4">
                    {Array.from({ length: SKELETON_ASSET_COUNT }, (_, index) => (
                      <AssetCard key={index} loading />
                    ))}
                  </CardGrid>
                ) : loadError ? (
                  <EmptyState title="Failed to load assets" message={loadError.message}>
                    <Button variant="secondary" onClick={retryLoad} className="mt-4">
                      Try Again
                    </Button>
                  </EmptyState>
                ) : collectionAssets.length > 0 ? (
                  <CardGrid columns={getGridColumns(cardSize)} gap="4">
                    {collectionAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        selected={selectedAssetIds.has(asset.id)}
                        primary={primaryAssetId === asset.id}
                        onClick={(nextAsset, event) => handleAssetClick(nextAsset, event, collectionAssets)}
                        onMenuClick={handleMenuClick}
                        loading={showAssetLoading}
                        forceEmptyPreview={forceEmptyPreview}
                        processing={showProcessing}
                        showDepartment
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
          </div>
        </div>

        <SettingsPanel>
          <SettingGroup label="Asset Cards">
            <SettingSegmented
              options={[
                { value: 'loading' as const, label: 'Loading' },
                { value: 'asis' as const, label: 'As Is' },
                { value: 'no-preview' as const, label: 'No Preview' },
                { value: 'processing' as const, label: 'Processing' },
              ]}
              value={assetCardState}
              onChange={(value) => setAssetCardState(value as AssetCardState)}
            />
          </SettingGroup>
        </SettingsPanel>

        <SelectionBar
          selectedEntities={activeSelectionEntities}
          onClear={selectedCollection ? clearAssetSelection : clearCollectionSelection}
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
        <CompactBar
          visible={isCompactBarVisible}
          title={title}
          count={visibleCollections.length}
          countLabel="collection"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterOptions={filterOptions}
          sortFields={sortFields}
          sortCriteria={sortCriteria}
          onSortChange={setSortCriteria}
          layout={layout}
          onLayoutChange={setLayout}
          cardSize={cardSize}
          onCardSizeChange={setCardSize}
          {...hideEmptyProps}
        />

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <Stack spacing="lg">
              <MobileToolbar title={title} />
              <div className="flex items-center gap-2 md:hidden">
                <HawkinsSearch
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  filters={filterOptions}
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
                  {...hideEmptyProps}
                />
              </div>
              <div ref={headerRef} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <PageHeader title={title} description={description} hideTitleOnMobile />
                  <div className="hidden md:flex items-center gap-2">
                    <SortDropdown
                      fields={sortFields}
                      value={sortCriteria}
                      onChange={setSortCriteria}
                    />
                    <AppearanceDropdown
                      layout={layout}
                      onLayoutChange={setLayout}
                      cardSize={cardSize}
                      onCardSizeChange={setCardSize}
                      {...hideEmptyProps}
                    />
                  </div>
                </div>
                <div className="hidden md:block">
                  <HawkinsSearch
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    filters={filterOptions}
                  />
                </div>
              </div>

              {layout === 'list' ? (
                <CollectionsListView
                  collections={visibleCollections}
                  loading={isPreloading}
                  preloadedAssets={loadedAssets}
                  preloadFailures={preloadFailures}
                />
              ) : layout === 'gallery' ? (
                <CollectionsGalleryView
                  collections={visibleCollections}
                  selectedIds={selectedAssetIds}
                  primaryId={primaryAssetId}
                  onAssetClick={handleAssetClick}
                  onAssetMenuClick={handleMenuClick}
                  showAssetLoading={showAssetLoading}
                  showCollectionLoading={showCollectionLoading}
                  thumbnailMode={thumbnailMode}
                  loadedAssets={loadedAssets}
                  isPreloading={isPreloading}
                  forceEmptyPreview={forceEmptyPreview}
                  showProcessing={showProcessing}
                />
              ) : isPreloading ? (
                <CardGrid gap="4" columns={getGridColumns(cardSize)}>
                  {Array.from({ length: SKELETON_ASSET_COUNT }, (_, index) => (
                    <CollectionCard
                      key={index}
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
                <CardGrid gap="4" columns={getGridColumns(cardSize)}>
                  {visibleCollections.map((collection) => (
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
                      numberOfAssets={getCollectionCardCountLabel(collection, collectionCardState)}
                      size={cardSize}
                      isSelected={!isMobile && selectedCollectionId === collection.id}
                      onClick={isMobile
                        ? () => loadCollection(collection)
                        : (event) => handleCollectionSelectionClick(collection, event, visibleCollections)
                      }
                      onDoubleClick={isMobile ? undefined : () => loadCollection(collection)}
                    />
                  ))}
                </CardGrid>
              )}
            </Stack>
          </div>
        </div>
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
              onChange={(value) => setCollectionCardState(value as CollectionCardState)}
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
                { value: 'processing' as const, label: 'Processing' },
              ]}
              value={assetCardState}
              onChange={(value) => setAssetCardState(value as AssetCardState)}
            />
          </SettingGroup>
        )}
      </SettingsPanel>

      <SelectionBar
        selectedEntities={activeSelectionEntities}
        onClear={layout === 'grid' ? clearCollectionSelection : clearAssetSelection}
      />
    </div>
  )
}
