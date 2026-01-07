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
  Button
} from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import { ArrowLeft } from 'lucide-react'
import type { Asset, Collection } from '@/lib/data'
import type { CollectionCardAssetCount } from '@/components/ui/collection-card'

interface MediaLibraryViewProps {
  collections: Collection[]
  assets: Asset[]
}

export function MediaLibraryView({ collections, assets }: MediaLibraryViewProps) {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [selectedCollectionAssets, setSelectedCollectionAssets] = useState<Asset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)

  // Loading state controls
  const [showCollectionLoading, setShowCollectionLoading] = useState(false)
  const [showAssetLoading, setShowAssetLoading] = useState(false)

  // Toggle asset selection
  const handleAssetClick = (asset: Asset) => {
    setSelectedAssetId(prev => prev === asset.id ? null : asset.id)
  }

  // Group assets by type
  const shotAssets = assets.filter(a => a.type === 'shot')
  const videoAssets = assets.filter(a => a.type === 'video')
  const imageAssets = assets.filter(a => a.type === 'image')
  const textAssets = assets.filter(a => a.type === 'text')

  // Handle collection click - open collection view
  const handleCollectionClick = async (collection: Collection) => {
    setSelectedCollection(collection)
    setLoadingAssets(true)
    try {
      const response = await fetch(`/api/collections/${collection.id}/assets`)
      const fetchedAssets = await response.json()
      setSelectedCollectionAssets(fetchedAssets)
    } catch (error) {
      console.error('Failed to load assets:', error)
      setSelectedCollectionAssets([])
    }
    setLoadingAssets(false)
  }

  // Handle back button
  const handleBack = () => {
    setSelectedCollection(null)
    setSelectedCollectionAssets([])
  }

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
              {/* Back button + Header */}
              <div>
                <Button
                  variant="tertiary"
                  compact
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={handleBack}
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
                    : `${selectedCollectionAssets.length} asset${selectedCollectionAssets.length !== 1 ? 's' : ''}`
                  }
                </Text>
              </div>

              {/* Assets Grid */}
              {loadingAssets ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <AssetCard key={i} loading />
                  ))}
                </div>
              ) : selectedCollectionAssets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {selectedCollectionAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      selected={selectedAssetId === asset.id}
                      onClick={handleAssetClick}
                      onMenuClick={handleMenuClick}
                      loading={showAssetLoading}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Text variant="headline-3" className="mb-2">No assets found</Text>
                  <Text variant="body-2" color="secondary">
                    This collection doesn't have any assets yet
                  </Text>
                </div>
              )}
            </Stack>
          </div>

          {/* Settings Panel */}
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
    return (
      <div>
        <Text variant="headline-3" weight="semibold" className="mb-4">
          {title} ({assetList.length})
        </Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assetList.slice(0, 4).map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              selected={selectedAssetId === asset.id}
              onClick={handleAssetClick}
              onMenuClick={handleMenuClick}
              loading={showAssetLoading}
            />
          ))}
        </div>
      </div>
    )
  }

  // Main Media Library view
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Stack spacing="lg">
            {/* Header */}
            <div>
              <Text variant="headline-1" weight="bold" className="mb-2">Media Library</Text>
              <Text variant="body-2" color="secondary">
                Browse collections and assets
              </Text>
            </div>

            {/* Collections Section */}
            <div>
              <Text variant="headline-2" weight="semibold" className="mb-4">
                Collections ({collections.length})
              </Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    onClick={() => handleCollectionClick(collection)}
                  />
                ))}
              </div>
            </div>

            {/* Assets by Type */}
            <AssetSection title="Shots" assetList={shotAssets} />
            <AssetSection title="Videos" assetList={videoAssets} />
            <AssetSection title="Images" assetList={imageAssets} />
            <AssetSection title="Documents" assetList={textAssets} />

          </Stack>
        </div>

        {/* Settings Panel */}
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
