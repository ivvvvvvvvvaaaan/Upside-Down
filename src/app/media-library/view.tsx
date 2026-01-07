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
import { ArrowLeft } from 'lucide-react'
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

            {/* Collections Section */}
            <div>
              <Text variant="headline-2" weight="semibold" className="mb-4">
                Collections ({collections.length})
              </Text>
              <CardGrid gap="4">
                {collections.map((collection) => (
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
