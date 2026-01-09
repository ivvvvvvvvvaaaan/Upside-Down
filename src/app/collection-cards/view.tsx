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
  SettingSegmented,
  Button,
  CardGrid,
  PageHeader,
  EmptyState,
  AppearanceDropdown,
  CollectionsListView,
  CollectionsGalleryView,
} from '@/components/ui'
import type { LayoutType, CardSize } from '@/components/ui/appearance-dropdown'
import { AppLayout } from '@/components/layouts'
import { ArrowLeft } from 'lucide-react'
import { useAssetSelection, useCollectionAssets, useViewPreferences } from '@/hooks'
import type { CollectionViewType } from '@/hooks'
import type { Asset, Collection } from '@/lib/data'
import type { CollectionCardAssetCount } from '@/components/ui/collection-card'

interface CollectionCardsViewProps {
  title: string
  initialCollections: Collection[]
  collectionType?: CollectionViewType
}

export function CollectionCardsView({ title, initialCollections, collectionType = 'all' }: CollectionCardsViewProps) {
  const [collections] = useState<Collection[]>(initialCollections)
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const {
    selectedCollection,
    assets: collectionAssets,
    loading: loadingAssets,
    loadCollection,
    goBack,
  } = useCollectionAssets({ onNavigate: clearSelection })

  const [assetCount, setAssetCount] = useState<CollectionCardAssetCount>('Many')

  // Appearance settings - persisted per collection type
  const { layout, setLayout, cardSize, setCardSize } = useViewPreferences(collectionType)

  // Loading state controls
  const [showCollectionLoading, setShowCollectionLoading] = useState(false)
  const [showAssetLoading, setShowAssetLoading] = useState(false)

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
                  Back to Collections
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

  // Collections grid view
  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Stack spacing="lg">
            <div className="flex items-start justify-between">
              <PageHeader
                title={title}
                description="Browse collections by character, location, or scene"
              />
              <AppearanceDropdown
                layout={layout}
                onLayoutChange={setLayout}
                cardSize={cardSize}
                onCardSizeChange={setCardSize}
              />
            </div>

            {layout === 'list' ? (
              <CollectionsListView
                collections={collections}
                onCollectionClick={loadCollection}
              />
            ) : layout === 'gallery' ? (
              <CollectionsGalleryView
                collections={collections}
                selectedIds={selectedIds}
                primaryId={primaryId}
                onAssetClick={handleAssetClick}
                onAssetMenuClick={handleMenuClick}
                showAssetLoading={showAssetLoading}
                showCollectionLoading={showCollectionLoading}
              />
            ) : (
              <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
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
                    size={cardSize}
                    onClick={() => loadCollection(collection)}
                  />
                ))}
              </CardGrid>
            )}
          </Stack>
        </div>

        <SettingsPanel>
          <SettingGroup label="Loading States">
            <SettingBoolean
              label="Collection Cards"
              value={showCollectionLoading}
              onChange={setShowCollectionLoading}
            />
            {layout === 'gallery' && (
              <SettingBoolean
                label="Asset Cards"
                value={showAssetLoading}
                onChange={setShowAssetLoading}
              />
            )}
          </SettingGroup>

          <SettingGroup label="Collection Card Thumbnails">
            <SettingSegmented
              options={[
                { value: 'Many' as const, label: 'Many' },
                { value: 'Two' as const, label: 'Two' },
                { value: 'One' as const, label: 'One' },
                { value: 'None' as const, label: 'None' },
              ]}
              value={assetCount}
              onChange={(val) => setAssetCount(val as CollectionCardAssetCount)}
            />
          </SettingGroup>
        </SettingsPanel>
      </div>
    </AppLayout>
  )
}
