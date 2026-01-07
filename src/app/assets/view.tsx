'use client'

import { useState } from 'react'
import {
  Stack,
  Text,
  AssetCard,
  SettingsPanel,
  SettingGroup,
  SettingOption
} from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import type { Asset, Collection, AssetType } from '@/lib/data'

interface AssetsViewProps {
  assets: Asset[]
  collections: Collection[]
}

export function AssetsView({ assets, collections }: AssetsViewProps) {
  const [selectedCollection, setSelectedCollection] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<AssetType | 'all'>('all')

  const filteredAssets = assets.filter(asset => {
    if (selectedType !== 'all' && asset.type !== selectedType) return false
    if (selectedCollection !== 'all') {
      return asset.collectionIds?.includes(selectedCollection)
    }
    return true
  })

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
    // Add menu logic here
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Stack spacing="lg">

          {/* Header */}
          <div>
            <Text variant="headline-1" weight="bold" className="mb-2">Assets</Text>
            <Text variant="body-2" color="secondary">
              Browse shots, videos, images, and documents
            </Text>
          </div>

          {/* Asset Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onMenuClick={handleMenuClick}
              />
            ))}
          </div>

          {/* Empty state */}
          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Text variant="headline-3" className="mb-2">No assets found</Text>
              <Text variant="body-2" color="secondary">
                Try adjusting your filters
              </Text>
            </div>
          )}

          </Stack>
        </div>

        {/* Settings Panel */}
        <SettingsPanel>
        <SettingGroup label="Collection">
          <SettingOption
            label="All Collections"
            value="all"
            checked={selectedCollection === 'all'}
            onChange={setSelectedCollection}
          />
          {collections.map((collection) => (
            <SettingOption
              key={collection.id}
              label={collection.name}
              value={collection.id}
              checked={selectedCollection === collection.id}
              onChange={setSelectedCollection}
            />
          ))}
        </SettingGroup>

        <SettingGroup label="Asset Type">
          <SettingOption
            label="All Types"
            value="all"
            checked={selectedType === 'all'}
            onChange={(val) => setSelectedType(val as AssetType | 'all')}
          />
          <SettingOption
            label="Shot"
            value="shot"
            checked={selectedType === 'shot'}
            onChange={(val) => setSelectedType(val as AssetType)}
          />
          <SettingOption
            label="Video"
            value="video"
            checked={selectedType === 'video'}
            onChange={(val) => setSelectedType(val as AssetType)}
          />
          <SettingOption
            label="Image"
            value="image"
            checked={selectedType === 'image'}
            onChange={(val) => setSelectedType(val as AssetType)}
          />
          <SettingOption
            label="Text"
            value="text"
            checked={selectedType === 'text'}
            onChange={(val) => setSelectedType(val as AssetType)}
          />
        </SettingGroup>
        </SettingsPanel>
      </div>
    </AppLayout>
  )
}
