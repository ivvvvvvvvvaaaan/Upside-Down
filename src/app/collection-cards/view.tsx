'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Stack, Text, CollectionCard, AssetCard, SettingsPanel, SettingGroup, SettingOption } from '@/components/ui'
import type { Asset, Collection } from '@/lib/data'
import type { CollectionCardAssetCount } from '@/components/ui/collection-card'

interface CollectionCardsViewProps {
  title: string
  initialCollections: Collection[]
}

export function CollectionCardsView({ title, initialCollections }: CollectionCardsViewProps) {
  const [collections] = useState<Collection[]>(initialCollections)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedCollectionAssets, setSelectedCollectionAssets] = useState<Asset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [assetCount, setAssetCount] = useState<CollectionCardAssetCount>('Many')

  // Handle collection click - fetch assets via API route
  const handleCollectionClick = async (collectionId: string) => {
    if (selectedId === collectionId) {
      // Deselect
      setSelectedId(null)
      setSelectedCollectionAssets([])
    } else {
      // Select and load assets via API
      setSelectedId(collectionId)
      setLoadingAssets(true)
      try {
        const response = await fetch(`/api/collections/${collectionId}/assets`)
        const assets = await response.json()
        setSelectedCollectionAssets(assets)
      } catch (error) {
        console.error('Failed to load assets:', error)
        setSelectedCollectionAssets([])
      }
      setLoadingAssets(false)
    }
  }

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  return (
    <div className="min-h-screen bg-surface-flat flex">
      {/* Left vertical nav placeholder */}
      <div className="w-20 bg-surface-3 flex-shrink-0 flex flex-col items-center px-4 py-6">
        {/* Logo */}
        <Image
          src="/assets/Vertical/Lockup/Logo/Professional.svg"
          alt="Logo"
          width={120}
          height={40}
          className="h-10 w-auto"
        />
      </div>

      <div className="flex-1 p-6">
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
                state={selectedId === collection.id ? 'Selected' : 'Normal'}
                numberOfAssets={assetCount}
                onClick={() => handleCollectionClick(collection.id)}
              />
            ))}
          </div>

          {/* Assets Section - shown when collection is selected */}
          {selectedId && (
            <div className="border-t border-border-subtle pt-8">
              <div className="mb-6">
                <Text variant="headline-2" weight="semibold" className="mb-2">
                  Assets in {collections.find(c => c.id === selectedId)?.name}
                </Text>
                <Text variant="body-2" color="secondary">
                  {loadingAssets
                    ? 'Loading assets...'
                    : `${selectedCollectionAssets.length} asset${selectedCollectionAssets.length !== 1 ? 's' : ''}`
                  }
                </Text>
              </div>

              {loadingAssets ? (
                <div className="py-12 text-center">
                  <Text variant="body-1" color="secondary">Loading...</Text>
                </div>
              ) : selectedCollectionAssets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {selectedCollectionAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onMenuClick={handleMenuClick}
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
            </div>
          )}

        </Stack>
        </div>

        {/* Settings Panel */}
      <SettingsPanel>
        <SettingGroup label="Asset Count">
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
    </div>
  )
}
