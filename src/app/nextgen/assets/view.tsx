'use client'

import { useState } from 'react'
import {
  Stack,
  AssetCard,
  SettingsPanel,
  SettingGroup,
  SettingSegmented,
  Button,
  CardGrid,
  PageHeader,
  EmptyState,
  AppearanceDropdown,
  SortDropdown,
  HawkinsSearch,
  CompactBar,
} from '@/components/ui'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import { AppLayout } from '@/components/layouts'
import { useAssetSelection, useViewPreferences, useCompactBar } from '@/hooks'
import type { Asset } from '@/lib/data'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Asset card states: loading, real data, no preview placeholder, or processing
type AssetCardState = 'loading' | 'asis' | 'no-preview' | 'processing'

interface AssetsViewProps {
  assets: Asset[]
}

export function AssetsView({ assets }: AssetsViewProps) {
  const pathname = usePathname()
  const menuHref = `/nextgen/menu?return=${encodeURIComponent(pathname)}`

  const { selectedIds, primaryId, handleAssetClick } = useAssetSelection()
  const { layout, setLayout, cardSize, setCardSize } = useViewPreferences()
  const { scrollRef, headerRef, showCompactBar } = useCompactBar()

  // Sort settings
  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date Modified' },
    { value: 'type', label: 'Type' },
    { value: 'size', label: 'Size' },
  ]
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' }
  ])
  const [searchQuery, setSearchQuery] = useState('')

  // Filter chips for assets view
  const filterOptions = [
    { id: 'file-type', label: 'File Type' },
    { id: 'scene', label: 'Scene' },
    { id: 'location', label: 'Location' },
  ]

  // Asset card state
  const [assetCardState, setAssetCardState] = useState<AssetCardState>('asis')
  const showAssetLoading = assetCardState === 'loading'
  const forceEmptyPreview = assetCardState === 'no-preview'
  const showProcessing = assetCardState === 'processing'

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
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
          <CompactBar
            visible={showCompactBar}
            title="All Assets"
            count={assets.length}
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
                <div ref={headerRef} className="flex flex-col gap-3">
                  <PageHeader
                    title="All Assets"
                    description="Browse shots, videos, images, and documents"
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

                {assets.length > 0 ? (
                  <CardGrid columns={getColumns()} gap="4">
                    {assets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        selected={selectedIds.has(asset.id)}
                        primary={primaryId === asset.id}
                        onClick={(a, e) => handleAssetClick(a, e, assets)}
                        onMenuClick={handleMenuClick}
                        loading={showAssetLoading}
                        forceEmptyPreview={forceEmptyPreview}
                        processing={showProcessing}
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
                { value: 'processing' as const, label: 'Processing' },
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
