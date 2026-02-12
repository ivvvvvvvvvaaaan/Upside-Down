'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Stack,
  Text,
  CollectionCard,
  AssetCard,
  Button,
  CardGrid,
  PageHeader,
  EmptyState,
  AppearanceDropdown,
  SortDropdown,
  HawkinsSearch,
  CompactBar,
  SelectionBar,
} from '@/components/ui'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import { AppLayout } from '@/components/layouts'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAssetSelection, useCollectionAssets, useViewPreferences, useCompactBar } from '@/hooks'
import type { Asset, Collection } from '@/lib/data'
import type { CollectionCardAssetCount } from '@/components/ui/collection-card'
import type { DepartmentConfig, EnrichedCollection } from './types'

interface DepartmentHomeViewProps {
  config: DepartmentConfig
  initialCollections: Collection[]
}

const SKELETON_ASSET_COUNT = 12

export function DepartmentHomeView({ config, initialCollections }: DepartmentHomeViewProps) {
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
  } = useCollectionAssets({ onNavigate: () => {} })
  const { scrollRef, headerRef, showCompactBar } = useCompactBar()

  // Appearance settings
  const { layout, setLayout, cardSize, setCardSize } = useViewPreferences()

  // Sort settings
  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date Modified' },
    { value: 'type', label: 'Type' },
  ]
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' }
  ])
  const [searchQuery, setSearchQuery] = useState('')

  const filterOptions = [
    { id: 'type', label: 'Type' },
    { id: 'modified', label: 'Modified' },
  ]

  // Pre-loaded asset data
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
          return { id: collection.id, assets, failed: false }
        } catch (error) {
          console.error('Failed to pre-fetch assets:', error)
          return { id: collection.id, assets: [], failed: true }
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

  // Flatten all assets (deduplicated)
  const flattenedAssets = useMemo(() => {
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

  // Enrich collections with thumbnails
  const enrichedCollections = useMemo((): EnrichedCollection[] => {
    if (isPreloading) return collections

    return collections.map((collection) => {
      const assets = loadedAssets[collection.id] || []
      const realAssetCount = assets.length
      const assetThumbnails = assets
        .map((a) => a.thumbnail)
        .filter((t): t is string => !!t)

      return {
        ...collection,
        assetCount: realAssetCount,
        mainImage: assetThumbnails[0] || undefined,
        thumbnailImages: assetThumbnails.slice(1, 3),
      }
    })
  }, [collections, loadedAssets, isPreloading])

  // Group collections by type
  const collectionsByType = useMemo(() => {
    const grouped: Record<string, EnrichedCollection[]> = {}
    for (const type of config.smartCollectionTypes) {
      grouped[type] = enrichedCollections.filter(c => c.type === type)
    }
    // User collections
    grouped['user'] = enrichedCollections.filter(c => c.type === config.userCollectionType)
    return grouped
  }, [enrichedCollections, config.smartCollectionTypes, config.userCollectionType])

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  // Get selected assets
  const selectedAssets = useMemo(() => {
    const sourceAssets = selectedCollection ? collectionAssets : flattenedAssets
    return sourceAssets.filter((asset) => selectedIds.has(asset.id))
  }, [flattenedAssets, collectionAssets, selectedCollection, selectedIds])

  const isCompactBarVisible = !selectedCollection && showCompactBar

  const getNumberOfAssets = (count: number): CollectionCardAssetCount => {
    if (count === 0) return 'None'
    if (count === 1) return 'One'
    if (count === 2) return 'Two'
    return 'Many'
  }

  const typeLabels: Record<string, string> = {
    character: 'Characters',
    location: 'Locations',
    scene: 'Scenes',
    user: 'My Collections',
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
                      icon={<ArrowLeft className="w-4 h-4" />}
                      onClick={goBack}
                      className="mb-4"
                    >
                      Back to {config.shortName}
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
                    <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
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
                    <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                      {collectionAssets.map((asset) => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          selected={selectedIds.has(asset.id)}
                          primary={primaryId === asset.id}
                          onClick={(a, e) => handleAssetClick(a, e, collectionAssets)}
                          onMenuClick={handleMenuClick}
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

          <SelectionBar
            selectedCount={selectedIds.size}
            selectedAssets={selectedAssets}
            onClear={clearSelection}
            onCreateCollection={(name) => console.log('Create collection:', name, 'with assets:', Array.from(selectedIds))}
            onShare={() => console.log('Share:', Array.from(selectedIds))}
          />
        </div>
      </AppLayout>
    )
  }

  // Main view - all assets
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
          <CompactBar
            visible={isCompactBarVisible}
            title={config.name}
            count={flattenedAssets.length}
            countLabel="asset"
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
          />

          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                {/* Mobile menu button */}
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
                    />
                  </div>
                </div>

                {/* Header */}
                <div ref={headerRef} className="flex flex-col gap-3">
                  <PageHeader
                    title={config.name}
                    description={config.description}
                  />
                  <div className="hidden md:flex items-center gap-2">
                    <HawkinsSearch
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      filters={filterOptions}
                    />
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
                    />
                  </div>
                </div>

                {/* Recent Assets */}
                <section>
                  <Text variant="headline-2" weight="bold" className="mb-4">
                    Recent
                  </Text>
                  {isPreloading ? (
                    <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                      {[...Array(6)].map((_, i) => (
                        <AssetCard key={i} loading />
                      ))}
                    </CardGrid>
                  ) : recentAssets.length > 0 ? (
                    <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                      {recentAssets.map((asset) => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          selected={selectedIds.has(asset.id)}
                          primary={primaryId === asset.id}
                          onClick={(a, e) => handleAssetClick(a, e, flattenedAssets)}
                          onMenuClick={handleMenuClick}
                        />
                      ))}
                    </CardGrid>
                  ) : (
                    <Text variant="body-1" color="secondary">No recent assets</Text>
                  )}
                </section>

                {/* Collections grouped by type */}
                {config.smartCollectionTypes.map((type) => {
                  const typeCollections = collectionsByType[type] || []
                  if (typeCollections.length === 0 && !isPreloading) return null

                  return (
                    <section key={type}>
                      <Text variant="headline-2" weight="bold" className="mb-4">
                        {typeLabels[type]}
                      </Text>
                      {isPreloading ? (
                        <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                          {[...Array(4)].map((_, i) => (
                            <CollectionCard
                              key={i}
                              title=""
                              assetCount={0}
                              type={type}
                              state="Loading"
                              numberOfAssets="None"
                              size={cardSize}
                            />
                          ))}
                        </CardGrid>
                      ) : (
                        <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                          {typeCollections.map((collection) => (
                            <CollectionCard
                              key={collection.id}
                              title={collection.name}
                              assetCount={collection.assetCount}
                              type={collection.type}
                              mainImage={collection.mainImage}
                              thumbnailImages={collection.thumbnailImages}
                              avatarSrc={collection.avatarSrc}
                              avatarName={collection.name}
                              state="Normal"
                              numberOfAssets={getNumberOfAssets(collection.assetCount)}
                              size={cardSize}
                              onClick={() => loadCollection(collection)}
                            />
                          ))}
                        </CardGrid>
                      )}
                    </section>
                  )
                })}

                {/* User collections */}
                {(collectionsByType['user']?.length > 0 || isPreloading) && (
                  <section>
                    <Text variant="headline-2" weight="bold" className="mb-4">
                      {typeLabels['user']}
                    </Text>
                    {isPreloading ? (
                      <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                        {[...Array(4)].map((_, i) => (
                          <CollectionCard
                            key={i}
                            title=""
                            assetCount={0}
                            type={config.userCollectionType}
                            state="Loading"
                            numberOfAssets="None"
                            size={cardSize}
                          />
                        ))}
                      </CardGrid>
                    ) : (
                      <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                        {collectionsByType['user'].map((collection) => (
                          <CollectionCard
                            key={collection.id}
                            title={collection.name}
                            assetCount={collection.assetCount}
                            type={collection.type}
                            mainImage={collection.mainImage}
                            thumbnailImages={collection.thumbnailImages}
                            state="Normal"
                            numberOfAssets={getNumberOfAssets(collection.assetCount)}
                            size={cardSize}
                            onClick={() => loadCollection(collection)}
                          />
                        ))}
                      </CardGrid>
                    )}
                  </section>
                )}

                {/* Empty state if no collections */}
                {!isPreloading && enrichedCollections.length === 0 && (
                  <EmptyState
                    title="No collections found"
                    message={`No collections available in ${config.name}`}
                  />
                )}
              </Stack>
            </div>
          </div>
        </div>

        <SelectionBar
          selectedCount={selectedIds.size}
          selectedAssets={selectedAssets}
          onClear={clearSelection}
          onCreateCollection={(name) => console.log('Create collection:', name, 'with assets:', Array.from(selectedIds))}
          onShare={() => console.log('Share:', Array.from(selectedIds))}
        />
      </div>
    </AppLayout>
  )
}
