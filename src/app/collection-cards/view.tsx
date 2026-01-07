'use client'

import { useState } from 'react'
import { Stack, Text, CollectionCard, AssetCard, SettingsPanel, SettingGroup, SettingOption, SettingBoolean, Button } from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import { ArrowLeft } from 'lucide-react'
import type { Asset, Collection } from '@/lib/data'
import type { CollectionCardAssetCount } from '@/components/ui/collection-card'

interface CollectionCardsViewProps {
  title: string
  initialCollections: Collection[]
}

export function CollectionCardsView({ title, initialCollections }: CollectionCardsViewProps) {
  const [collections] = useState<Collection[]>(initialCollections)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [selectedCollectionAssets, setSelectedCollectionAssets] = useState<Asset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [assetCount, setAssetCount] = useState<CollectionCardAssetCount>('Many')
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)

  // Loading state controls
  const [showCollectionLoading, setShowCollectionLoading] = useState(false)
  const [showAssetLoading, setShowAssetLoading] = useState(false)

  // Toggle asset selection
  const handleAssetClick = (asset: Asset) => {
    setSelectedAssetId(prev => prev === asset.id ? null : asset.id)
  }

  // Handle collection click - open collection view
  const handleCollectionClick = async (collection: Collection) => {
    setSelectedCollection(collection)
    setLoadingAssets(true)
    try {
      const response = await fetch(`/api/collections/${collection.id}/assets`)
      const assets = await response.json()
      setSelectedCollectionAssets(assets)
    } catch (error) {
      console.error('Failed to load assets:', error)
      setSelectedCollectionAssets([])
    }
    setLoadingAssets(false)
  }

  // Handle back button - return to collections grid
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
                  Back to Collections
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

  // Collections grid view
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Stack spacing="lg">
            {/* Header */}
            <div>
              <Text variant="headline-1" weight="bold" className="mb-2">{title}</Text>
              <Text variant="body-2" color="secondary">
                Browse collections by character, location, or scene
              </Text>
            </div>

            {/* Collection Cards Grid */}
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
                  numberOfAssets={assetCount}
                  onClick={() => handleCollectionClick(collection)}
                />
              ))}
            </div>
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
          </SettingGroup>

          <SettingGroup label="Collection Card Thumbnails">
            <SettingOption
              label="Many (3+ images)"
              value="Many"
              checked={assetCount === 'Many'}
              onChange={(value) => setAssetCount(value as CollectionCardAssetCount)}
            />
            <SettingOption
              label="Two (2 images)"
              value="Two"
              checked={assetCount === 'Two'}
              onChange={(value) => setAssetCount(value as CollectionCardAssetCount)}
            />
            <SettingOption
              label="One (1 image)"
              value="One"
              checked={assetCount === 'One'}
              onChange={(value) => setAssetCount(value as CollectionCardAssetCount)}
            />
            <SettingOption
              label="None (Empty)"
              value="None"
              checked={assetCount === 'None'}
              onChange={(value) => setAssetCount(value as CollectionCardAssetCount)}
            />
          </SettingGroup>
        </SettingsPanel>
      </div>
    </AppLayout>
  )
}
