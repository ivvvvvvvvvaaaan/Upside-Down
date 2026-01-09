'use client'

import { useState } from 'react'
import {
  Stack,
  AssetCard,
  SettingsPanel,
  SettingGroup,
  SettingSegmented,
  SettingOption,
  Button,
  CardGrid,
  PageHeader,
  EmptyState,
  AppearanceDropdown,
  AppearanceDropdownIcon,
  ControlGhost,
} from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import { useAssetSelection, useViewPreferences } from '@/hooks'
import type { Asset, Collection, AssetType } from '@/lib/data'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Asset card states: loading, real data, or no preview placeholder
type AssetCardState = 'loading' | 'asis' | 'no-preview'

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
  const pathname = usePathname()
  const menuHref = `/nextgen/menu?return=${encodeURIComponent(pathname)}`

  const { selectedIds, primaryId, handleAssetClick } = useAssetSelection()
  const { layout, setLayout, cardSize, setCardSize } = useViewPreferences()

  // Asset card state
  const [assetCardState, setAssetCardState] = useState<AssetCardState>('asis')
  const showAssetLoading = assetCardState === 'loading'
  const forceEmptyPreview = assetCardState === 'no-preview'

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

  // Determine grid columns based on card size
  const getColumns = () => {
    switch (cardSize) {
      case 'sm': return 6
      case 'lg': return 3
      default: return 4
    }
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
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
                  {/* TODO: Placeholder ghosts for upcoming search/grouping controls; keeps header spacing stable. */}
                  <div className="flex items-center gap-2">
                    <ControlGhost widthClassName="w-48" />
                    <ControlGhost widthClassName="w-10" />
                    <AppearanceDropdownIcon
                      layout={layout}
                      onLayoutChange={setLayout}
                      cardSize={cardSize}
                      onCardSizeChange={setCardSize}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <PageHeader
                    title="Assets"
                    description="Browse shots, videos, images, and documents"
                  />
                  {/* TODO: Placeholder ghosts for upcoming search/grouping controls; keeps header spacing stable. */}
                  <div className="hidden md:flex items-center gap-2">
                    <ControlGhost widthClassName="w-48" />
                    <ControlGhost widthClassName="w-10" />
                    <AppearanceDropdown
                      layout={layout}
                      onLayoutChange={setLayout}
                      cardSize={cardSize}
                      onCardSizeChange={setCardSize}
                    />
                  </div>
                </div>

                {filteredAssets.length > 0 ? (
                  <CardGrid columns={getColumns()} gap="4">
                    {filteredAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        selected={selectedIds.has(asset.id)}
                        primary={primaryId === asset.id}
                        onClick={(a, e) => handleAssetClick(a, e, filteredAssets)}
                        onMenuClick={handleMenuClick}
                        loading={showAssetLoading}
                        forceEmptyPreview={forceEmptyPreview}
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
          </div>
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
