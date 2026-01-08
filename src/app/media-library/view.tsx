'use client'

import { useState } from 'react'
import {
  Stack,
  Text,
  CollectionCard,
  AssetCard,
  SettingsPanel,
  SettingGroup,
  SettingBoolean,
  Button,
  CardGrid,
  PageHeader,
  EmptyState,
} from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useAssetSelection, useCollectionAssets } from '@/hooks'
import type { Asset, Collection } from '@/lib/data'

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

  // Loading state controls
  const [showCollectionLoading, setShowCollectionLoading] = useState(false)
  const [showAssetLoading, setShowAssetLoading] = useState(false)

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
                <CardGrid>
                  {[...Array(8)].map((_, i) => (
                    <AssetCard key={i} loading />
                  ))}
                </CardGrid>
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
            <SettingGroup label="Loading States">
              <SettingBoolean
                label="Asset Cards"
                value={showAssetLoading}
                onChange={setShowAssetLoading}
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
        <CardGrid gap="4">
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
              numberOfAssets="Many"
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
        <CardGrid gap="4">
          {displayedAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              selected={selectedIds.has(asset.id)}
              primary={primaryId === asset.id}
              onClick={(a, e) => handleAssetClick(a, e, displayedAssets)}
              onMenuClick={handleMenuClick}
              loading={showAssetLoading}
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
            <PageHeader
              title="Media Library"
              description="Browse collections and assets"
            />

            {/* Collections by Type */}
            <CollectionSection title="Characters" collectionList={characterCollections} href="/collections/characters" />
            <CollectionSection title="Locations" collectionList={locationCollections} href="/collections/locations" />
            <CollectionSection title="Scenes" collectionList={sceneCollections} href="/collections/scenes" />

            {/* Assets by Type */}
            <AssetSection title="Shots" assetList={shotAssets} />
            <AssetSection title="Videos" assetList={videoAssets} />
            <AssetSection title="Images" assetList={imageAssets} />
            <AssetSection title="Documents" assetList={textAssets} />
          </Stack>
        </div>

        <SettingsPanel>
          <SettingGroup label="Loading States">
            <SettingBoolean
              label="Collection Cards"
              value={showCollectionLoading}
              onChange={setShowCollectionLoading}
            />
            <SettingBoolean
              label="Asset Cards"
              value={showAssetLoading}
              onChange={setShowAssetLoading}
            />
          </SettingGroup>
        </SettingsPanel>
      </div>
    </AppLayout>
  )
}
