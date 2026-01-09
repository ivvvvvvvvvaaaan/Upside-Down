'use client'

import { useState } from 'react'
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
} from '@/components/ui'
import type { CollectionCardAssetCount } from '@/components/ui/collection-card'
import { AppLayout } from '@/components/layouts'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useAssetSelection, useCollectionAssets, useViewPreferences } from '@/hooks'
import type { Asset, Collection } from '@/lib/data'

// Collection card states: loading, real data (asis), or fake thumbnail variants
type CollectionCardState = 'loading' | 'asis' | 'many' | 'two' | 'one' | 'none'

// Asset card states: loading, real data, or no preview placeholder
type AssetCardState = 'loading' | 'asis' | 'no-preview'

interface MediaLibraryViewProps {
  collections: Collection[]
  assets: Asset[]
}

export function MediaLibraryView({ collections, assets }: MediaLibraryViewProps) {
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const {
    selectedCollection,
    assets: collectionAssets,
    loading: loadingAssets,
    loadCollection,
    goBack,
  } = useCollectionAssets({ onNavigate: clearSelection })

  // Appearance settings - persisted globally
  const { cardSize, setCardSize } = useViewPreferences()

  // Card state controls
  const [collectionCardState, setCollectionCardState] = useState<CollectionCardState>('asis')
  const [assetCardState, setAssetCardState] = useState<AssetCardState>('asis')

  // Derive loading flags from state
  const showCollectionLoading = collectionCardState === 'loading'
  const showAssetLoading = assetCardState === 'loading'
  const forceEmptyPreview = assetCardState === 'no-preview'

  // Group collections by type
  const characterCollections = collections.filter(c => c.type === 'character')
  const locationCollections = collections.filter(c => c.type === 'location')
  const sceneCollections = collections.filter(c => c.type === 'scene')

  // Group assets by type
  const shotAssets = assets.filter(a => a.type === 'shot')
  const videoAssets = assets.filter(a => a.type === 'video')
  const imageAssets = assets.filter(a => a.type === 'image')
  const textAssets = assets.filter(a => a.type === 'text')

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
                  Back to Media Library
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

  // Collection section component
  const CollectionSection = ({ title, collectionList, href }: { title: string; collectionList: Collection[]; href: string }) => {
    if (collectionList.length === 0) return null
    const displayedCollections = collectionList.slice(0, 4)
    const hasMore = collectionList.length > 4
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <Text variant="headline-3" weight="semibold">
            {title} ({collectionList.length})
          </Text>
          {hasMore && (
            <Link
              href={href}
              className="flex items-center gap-1 text-body-0-bold text-foreground-subtle hover:text-foreground transition-colors"
            >
              See all
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <CardGrid columns={getColumns()} gap="4">
          {displayedCollections.map((collection) => (
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
      </div>
    )
  }

  // Asset section component
  const AssetSection = ({ title, assetList }: { title: string; assetList: Asset[] }) => {
    if (assetList.length === 0) return null
    const displayedAssets = assetList.slice(0, 4)
    return (
      <div>
        <Text variant="headline-3" weight="semibold" className="mb-4">
          {title} ({assetList.length})
        </Text>
        <CardGrid columns={getColumns()} gap="4">
          {displayedAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              selected={selectedIds.has(asset.id)}
              primary={primaryId === asset.id}
              onClick={(a, e) => handleAssetClick(a, e, displayedAssets)}
              onMenuClick={handleMenuClick}
              loading={showAssetLoading}
              forceEmptyPreview={forceEmptyPreview}
            />
          ))}
        </CardGrid>
      </div>
    )
  }

  // Main Media Library view
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Stack spacing="lg">
            <div className="flex items-start justify-between">
              <PageHeader
                title="Media Library"
                description="Browse collections and assets"
              />
              <AppearanceDropdown
                layout="grid"
                onLayoutChange={() => {}}
                cardSize={cardSize}
                onCardSizeChange={setCardSize}
                showLayoutOptions={false}
              />
            </div>

            {/* Collections by Type */}
            <CollectionSection title="Characters" collectionList={characterCollections} href="/nextgen/collections/characters" />
            <CollectionSection title="Locations" collectionList={locationCollections} href="/nextgen/collections/locations" />
            <CollectionSection title="Scenes" collectionList={sceneCollections} href="/nextgen/collections/scenes" />

            {/* Assets by Type */}
            <AssetSection title="Shots" assetList={shotAssets} />
            <AssetSection title="Videos" assetList={videoAssets} />
            <AssetSection title="Images" assetList={imageAssets} />
            <AssetSection title="Documents" assetList={textAssets} />
          </Stack>
        </div>

        <SettingsPanel>
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
