'use client'

import { useState } from 'react'
import {
  Stack,
  AssetCard,
  SettingsPanel,
  SettingGroup,
  SettingOption,
  CardGrid,
  PageHeader,
  EmptyState,
} from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import { useAssetSelection } from '@/hooks'
import type { Asset, Collection, AssetType } from '@/lib/data'

const ASSET_TYPE_OPTIONS = [
  { label: 'All Types', value: 'all' },
  { label: 'Shot', value: 'shot' },
  { label: 'Video', value: 'video' },
  { label: 'Image', value: 'image' },
  { label: 'Text', value: 'text' },
] as const

interface AssetsViewProps {
  assets: Asset[]
  collections: Collection[]
}

export function AssetsView({ assets, collections }: AssetsViewProps) {
  const [selectedCollection, setSelectedCollection] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<AssetType | 'all'>('all')

  const { selectedIds, primaryId, handleAssetClick } = useAssetSelection()

  const filteredAssets = assets.filter(asset => {
    if (selectedType !== 'all' && asset.type !== selectedType) return false
    if (selectedCollection !== 'all') {
      return asset.collectionIds?.includes(selectedCollection)
    }
    return true
  })

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Stack spacing="lg">
            <PageHeader
              title="Assets"
              description="Browse shots, videos, images, and documents"
            />

            {filteredAssets.length > 0 ? (
              <CardGrid>
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    selected={selectedIds.has(asset.id)}
                    primary={primaryId === asset.id}
                    onClick={(a, e) => handleAssetClick(a, e, filteredAssets)}
                    onMenuClick={handleMenuClick}
                  />
                ))}
              </CardGrid>
            ) : (
              <EmptyState
                title="No assets found"
                message="Try adjusting your filters"
              />
            )}
          </Stack>
        </div>

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
            {ASSET_TYPE_OPTIONS.map(option => (
              <SettingOption
                key={option.value}
                label={option.label}
                value={option.value}
                checked={selectedType === option.value}
                onChange={(val) => setSelectedType(val as AssetType | 'all')}
              />
            ))}
          </SettingGroup>
        </SettingsPanel>
      </div>
    </AppLayout>
  )
}
