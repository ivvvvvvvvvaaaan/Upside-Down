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
  SortDropdown,
  CollectionsListView,
  CollectionsGalleryView,
  HawkinsSearch,
  CompactBar,
  SelectionBar,
} from '@/components/ui'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import type { GalleryThumbnailMode } from '@/components/ui/collections-gallery-view'
import { AppLayout } from '@/components/layouts'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAssetSelection, useCollectionAssets, useViewPreferences, useCompactBar, useUserCollections } from '@/hooks'
import type { CollectionViewType } from '@/hooks'
import type { Asset, Collection } from '@/lib/data'
import type { CollectionCardAssetCount } from '@/components/ui/collection-card'

interface CollectionCardsViewProps {
  title: string
  initialCollections: Collection[]
  collectionType?: CollectionViewType
}

// Collection card states: loading, real data (asis), or fake thumbnail variants
type CollectionCardState = 'loading' | 'asis' | 'many' | 'two' | 'one' | 'none'

// Asset card states: loading, real data, no preview placeholder, or processing
type AssetCardState = 'loading' | 'asis' | 'no-preview' | 'processing'

// Skeleton placeholder counts for loading states
const SKELETON_COLLECTION_COUNT = 8
const SKELETON_ASSET_COUNT = 8

export function CollectionCardsView({ title, initialCollections, collectionType = 'all' }: CollectionCardsViewProps) {
  const [collections] = useState<Collection[]>(initialCollections)
  const pathname = usePathname()
  const menuHref = `/nextgen/menu?return=${encodeURIComponent(pathname)}`
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const {
    selectedCollection,
    assets: collectionAssets,
    loading: loadingAssets,
    error: loadError,
    loadCollection,
    retry: retryLoad,
    goBack,
  } = useCollectionAssets({ onNavigate: clearSelection })
  const { scrollRef, headerRef, showCompactBar } = useCompactBar()
  const { createCollection } = useUserCollections()
  const isCompactBarVisible = !selectedCollection && showCompactBar

  // Appearance settings - persisted globally
  const { layout, setLayout, cardSize, setCardSize, hideEmptyCollections, setHideEmptyCollections } = useViewPreferences()

  // Sort settings
  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date Modified' },
    { value: 'type', label: 'Type' },
    { value: 'size', label: 'Size' },
  ]
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' }
  ])
  const [searchQuery, setSearchQuery] = useState('')

  // Contextual filter chips based on collection type
  const filterOptions = useMemo(() => {
    switch (collectionType) {
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
      default: // 'all', 'location', and other types
        return [
          { id: 'type', label: 'Type' },
          { id: 'modified', label: 'Modified' },
        ]
    }
  }, [collectionType])

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)

  // Separate display states for collection and asset cards
  const [collectionCardState, setCollectionCardState] = useState<CollectionCardState>('asis')
  const [assetCardState, setAssetCardState] = useState<AssetCardState>('asis')

  // Derive loading flags and thumbnail mode from state
  const showCollectionLoading = collectionCardState === 'loading'
  const showAssetLoading = assetCardState === 'loading'
  const forceEmptyPreview = assetCardState === 'no-preview'
  const showProcessing = assetCardState === 'processing'
  const thumbnailMode: GalleryThumbnailMode = collectionCardState === 'loading' ? 'asis' : collectionCardState

  // Pre-loaded asset data for accurate counts
  const [loadedAssets, setLoadedAssets] = useState<Record<string, Asset[]>>({})
  const [isPreloading, setIsPreloading] = useState(true)
  const [preloadFailures, setPreloadFailures] = useState<Set<string>>(new Set())

  // Pre-fetch all collection assets on mount
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
        // Keep original fake thumbnails - CollectionCard will handle display mode
      }
    })
  }, [collections, loadedAssets, isPreloading, thumbnailMode])

  // Filter out empty collections if preference is enabled
  const filteredCollections = useMemo(() => {
    if (!hideEmptyCollections) return enrichedCollections
    return enrichedCollections.filter((collection) => collection.assetCount > 0)
  }, [enrichedCollections, hideEmptyCollections])

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  // Get all flattened assets for selection
  const allAssets = useMemo(() => {
    const seen = new Set<string>()
    const assets: Asset[] = []
    for (const collectionAssets of Object.values(loadedAssets)) {
      for (const asset of collectionAssets) {
        if (!seen.has(asset.id)) {
          seen.add(asset.id)
          assets.push(asset)
        }
      }
    }
    return assets
  }, [loadedAssets])

  // Get selected assets for the modal (from either all assets or collection assets)
  const selectedAssets = useMemo(() => {
    const sourceAssets = selectedCollection ? collectionAssets : allAssets
    return sourceAssets.filter((asset) => selectedIds.has(asset.id))
  }, [allAssets, collectionAssets, selectedCollection, selectedIds])

  const handleCreateCollection = (name: string) => {
    createCollection(name, selectedAssets.map(a => a.id))
    clearSelection()
  }

  // Collection detail view
  if (selectedCollection) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col">
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
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
                    <Button
                      variant="tertiary"
                      compact
                      icon={<ArrowLeft />}
                      onClick={goBack}
                      className="mb-4"
                    >
                      Back to Collections
                    </Button>
                    <Text variant="headline-1" weight="bold" className="mb-2">
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
                    <CardGrid>
                      {[...Array(SKELETON_ASSET_COUNT)].map((_, i) => (
                        <AssetCard key={i} loading />
                      ))}
                    </CardGrid>
                  ) : loadError ? (
                    <EmptyState
                      title="Failed to load assets"
                      message={loadError.message}
                    >
                      <Button variant="secondary" onClick={retryLoad} className="mt-4">
                        Try Again
                      </Button>
                    </EmptyState>
                  ) : collectionAssets.length > 0 ? (
                    <CardGrid>
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
                onChange={(val) => setAssetCardState(val as AssetCardState)}
              />
            </SettingGroup>
          </SettingsPanel>

          <SelectionBar
            selectedCount={selectedIds.size}
            selectedAssets={selectedAssets}
            onClear={clearSelection}
            onCreateCollection={handleCreateCollection}
            onShare={() => console.log('Share:', Array.from(selectedIds))}
          />
        </div>
      </AppLayout>
    )
  }

  // Collections grid view
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
          <CompactBar
            visible={isCompactBarVisible}
            title={title}
            count={filteredCollections.length}
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
            hideEmptyCollections={hideEmptyCollections}
            onHideEmptyCollectionsChange={setHideEmptyCollections}
          />

          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <div className="flex items-center justify-between w-full md:hidden">
                  <Button asChild variant="icon" size="icon" aria-label="Menu">
                    <Link href={menuHref}>
                      <ArrowLeft className="w-4 h-4" />
                      <span className="sr-only">Menu</span>
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2">
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
                    <AppearanceDropdown iconOnly
                      layout={layout}
                      onLayoutChange={setLayout}
                      cardSize={cardSize}
                      onCardSizeChange={setCardSize}
                      hideEmptyCollections={hideEmptyCollections}
                      onHideEmptyCollectionsChange={setHideEmptyCollections}
                    />
                  </div>
                </div>
                <div ref={headerRef} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <PageHeader
                      title={title}
                      description="Browse collections by character, location, or scene"
                    />
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
                        hideEmptyCollections={hideEmptyCollections}
                        onHideEmptyCollectionsChange={setHideEmptyCollections}
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
                    collections={filteredCollections}
                    loading={isPreloading}
                    preloadedAssets={loadedAssets}
                    preloadFailures={preloadFailures}
                  />
                ) : layout === 'gallery' ? (
                  <CollectionsGalleryView
                    collections={filteredCollections}
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
                    showProcessing={showProcessing}
                  />
                ) : isPreloading ? (
                  <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                    {[...Array(SKELETON_ASSET_COUNT)].map((_, i) => (
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
                  <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                    {filteredCollections.map((collection) => {
                      // Derive numberOfAssets based on thumbnailMode and real asset count
                      const getNumberOfAssets = (): CollectionCardAssetCount => {
                        if (thumbnailMode === 'asis') {
                          // Real data mode - derive from actual asset count
                          const count = collection.assetCount
                          if (count === 0) return 'None'
                          if (count === 1) return 'One'
                          if (count === 2) return 'Two'
                          return 'Many'
                        }
                        // Override mode - use the selected display mode
                        const modeMap: Record<string, CollectionCardAssetCount> = {
                          many: 'Many',
                          two: 'Two',
                          one: 'One',
                          none: 'None',
                        }
                        return modeMap[thumbnailMode] || 'Many'
                      }

                      return (
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
                          numberOfAssets={getNumberOfAssets()}
                          size={cardSize}
                          isSelected={selectedCollectionId === collection.id}
                          onClick={() => setSelectedCollectionId(selectedCollectionId === collection.id ? null : collection.id)}
                          onDoubleClick={() => loadCollection(collection)}
                        />
                      )
                    })}
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
                  { value: 'processing' as const, label: 'Processing' },
                ]}
                value={assetCardState}
                onChange={(val) => setAssetCardState(val as AssetCardState)}
              />
            </SettingGroup>
          )}
        </SettingsPanel>

        <SelectionBar
          selectedCount={selectedIds.size}
          selectedAssets={selectedAssets}
          onClear={clearSelection}
          onCreateCollection={handleCreateCollection}
          onShare={() => console.log('Share:', Array.from(selectedIds))}
        />
      </div>
    </AppLayout>
  )
}
