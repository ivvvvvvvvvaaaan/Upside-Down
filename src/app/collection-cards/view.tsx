'use client'

import { useState } from 'react'
import {
  Stack,
  Text,
  CollectionCard,
  AssetCard,
  SettingsPanel,
  SettingGroup,
  SettingOption,
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
import type { CollectionCardAssetCount } from '@/components/ui/collection-card'

interface CollectionCardsViewProps {
  title: string
  initialCollections: Collection[]
}

export function CollectionCardsView({ title, initialCollections }: CollectionCardsViewProps) {
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
            <PageHeader
              title={title}
              description="Browse collections by character, location, or scene"
            />

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
                  numberOfAssets={assetCount}
                  onClick={() => loadCollection(collection)}
                />
              ))}
            </CardGrid>
          </Stack>
        </div>

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
