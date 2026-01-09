'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { AssetCard } from './asset-card'
import { Avatar } from './avatar'
import { CardGrid } from './card-grid'
import { EmptyState } from './empty-state'
import Image from 'next/image'
import type { Collection, Asset } from '@/lib/data'

// Skeleton placeholder count for loading states
const SKELETON_ASSET_COUNT = 6
const EMPTY_COLLECTION_PLACEHOLDER = '/assets/clapper-img.png'

// Custom collection type icons
const LocationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M16.9995 11C16.9995 12.48 16.1695 14.02 14.9495 15.44C14.0654 16.4517 13.0766 17.3669 11.9995 18.17C10.9224 17.3669 9.93351 16.4517 9.04947 15.44C7.82947 14.02 6.99947 12.48 6.99947 11C6.97126 10.324 7.07944 9.64931 7.31755 9.01604C7.55567 8.38277 7.91884 7.80393 8.38543 7.31401C8.85202 6.82409 9.41247 6.43313 10.0334 6.16443C10.6543 5.89572 11.3229 5.75478 11.9995 5.75C14.7295 5.75 16.9995 7.93 16.9995 11ZM18.4995 11C18.4995 15.02 14.0595 18.54 12.5195 19.64C12.3674 19.7476 12.1857 19.8054 11.9995 19.8054C11.8132 19.8054 11.6315 19.7476 11.4795 19.64C9.93947 18.54 5.49947 15.02 5.49947 11C5.47141 10.127 5.61851 9.25723 5.93208 8.44201C6.24565 7.62679 6.71934 6.88264 7.3252 6.25348C7.93106 5.62432 8.65681 5.12289 9.45962 4.77879C10.2624 4.43469 11.126 4.25489 11.9995 4.25C15.5895 4.25 18.4995 7.13 18.4995 11ZM13.4995 11C13.4995 11.3978 13.3414 11.7794 13.0601 12.0607C12.7788 12.342 12.3973 12.5 11.9995 12.5C11.6016 12.5 11.2201 12.342 10.9388 12.0607C10.6575 11.7794 10.4995 11.3978 10.4995 11C10.4995 10.6022 10.6575 10.2206 10.9388 9.93934C11.2201 9.65804 11.6016 9.5 11.9995 9.5C12.3973 9.5 12.7788 9.65804 13.0601 9.93934C13.3414 10.2206 13.4995 10.6022 13.4995 11ZM14.9995 11C14.9995 11.7956 14.6834 12.5587 14.1208 13.1213C13.5582 13.6839 12.7951 14 11.9995 14C11.2038 14 10.4408 13.6839 9.87815 13.1213C9.31554 12.5587 8.99947 11.7956 8.99947 11C8.99947 10.2044 9.31554 9.44129 9.87815 8.87868C10.4408 8.31607 11.2038 8 11.9995 8C12.7951 8 13.5582 8.31607 14.1208 8.87868C14.6834 9.44129 14.9995 10.2044 14.9995 11Z" fill="currentColor"/>
  </svg>
)

const SceneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M5.94011 8.55023L6.20011 9.52023L8.88011 8.80023L7.90011 8.03023L5.94011 8.55023ZM9.51011 7.60023L10.4901 8.37023L13.3901 7.60023L12.4001 6.82023L9.51011 7.60023ZM14.0001 6.40023L15.0001 7.17023L16.4601 6.77023L16.2001 5.80023L14.0001 6.40023ZM5.04011 10.7202C4.96577 10.618 4.91148 10.5027 4.88011 10.3802L4.36011 8.46023C4.32521 8.3335 4.31564 8.20114 4.33194 8.07071C4.34824 7.94028 4.39009 7.81434 4.45511 7.7001C4.52012 7.58586 4.60702 7.48556 4.71083 7.40494C4.81464 7.32431 4.93333 7.26494 5.06011 7.23023L16.3001 4.23023C16.4268 4.19533 16.5592 4.18575 16.6896 4.20206C16.8201 4.21836 16.946 4.26021 17.0602 4.32522C17.1745 4.39024 17.2748 4.47714 17.3554 4.58095C17.436 4.68476 17.4954 4.80345 17.5301 4.93023L18.0501 6.87023C18.1172 7.12614 18.0802 7.39822 17.9471 7.62688C17.814 7.85555 17.5958 8.02216 17.3401 8.09023L10.2201 10.0002H18.0001C18.2653 10.0002 18.5197 10.1056 18.7072 10.2931C18.8948 10.4807 19.0001 10.735 19.0001 11.0002V18.0002C19.0001 18.2654 18.8948 18.5198 18.7072 18.7073C18.5197 18.8949 18.2653 19.0002 18.0001 19.0002H6.00011C5.73489 19.0002 5.48054 18.8949 5.293 18.7073C5.10547 18.5198 5.00011 18.2654 5.00011 18.0002V11.0002L5.04011 10.7202ZM6.50011 17.5002V14.0002H17.5001V17.5002H6.50011ZM8.66011 12.5002H6.50011V11.5002H9.16011L8.66011 12.5002ZM10.3401 12.5002H13.1601L13.6601 11.5002H10.8401L10.3401 12.5002ZM17.5001 12.5002H14.8401L15.3401 11.5002H17.5001V12.5002Z" fill="currentColor"/>
  </svg>
)

export type GalleryThumbnailMode = 'asis' | 'many' | 'two' | 'one' | 'none'

interface CollectionsGalleryViewProps {
  collections: Collection[]
  className?: string
  /** Set of selected asset IDs */
  selectedIds?: Set<string>
  /** Primary selected asset ID */
  primaryId?: string | null
  /** Handler for asset click with shift/meta support */
  onAssetClick?: (asset: Asset, event: React.MouseEvent, allAssets: Asset[]) => void
  /** Handler for asset menu click */
  onAssetMenuClick?: (asset: Asset) => void
  /** Show loading state on asset cards */
  showAssetLoading?: boolean
  /** Show loading state on collection rows */
  showCollectionLoading?: boolean
  /** Thumbnail display mode - 'asis' uses real asset count */
  thumbnailMode?: GalleryThumbnailMode
  /** Pre-loaded assets from parent (keyed by collection ID) */
  loadedAssets?: Record<string, Asset[]>
  /** Whether parent is still preloading assets */
  isPreloading?: boolean
  /** Force showing empty preview placeholder for all assets */
  forceEmptyPreview?: boolean
}

interface ExpandedState {
  [collectionId: string]: {
    assets: Asset[]
    loading: boolean
    error?: string | null
  }
}

export function CollectionsGalleryView({
  collections,
  className,
  selectedIds,
  primaryId,
  onAssetClick,
  onAssetMenuClick,
  showAssetLoading = false,
  showCollectionLoading = false,
  thumbnailMode = 'asis',
  loadedAssets: parentLoadedAssets,
  isPreloading: parentIsPreloading = false,
  forceEmptyPreview = false,
}: CollectionsGalleryViewProps) {
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [localAssetsData, setLocalAssetsData] = useState<ExpandedState>({})

  // Use parent's pre-loaded assets if available, falling back to local state
  const getAssetsForCollection = (collectionId: string): { assets: Asset[], loading: boolean, error?: string | null } | undefined => {
    // Prefer parent's pre-loaded data
    if (parentLoadedAssets && parentLoadedAssets[collectionId]) {
      return { assets: parentLoadedAssets[collectionId], loading: false, error: null }
    }
    // Fall back to local state (for on-demand loading when expanding)
    return localAssetsData[collectionId]
  }

  const fetchCollectionAssets = async (collectionId: string) => {
    setLocalAssetsData((prev) => ({
      ...prev,
      [collectionId]: { assets: [], loading: true, error: null },
    }))

    try {
      const response = await fetch(`/api/collections/${collectionId}/assets`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const assets = await response.json()
      setLocalAssetsData((prev) => ({
        ...prev,
        [collectionId]: { assets, loading: false, error: null },
      }))
    } catch (error) {
      console.error('Failed to load assets:', error)
      setLocalAssetsData((prev) => ({
        ...prev,
        [collectionId]: { assets: [], loading: false, error: 'Failed to load assets' },
      }))
    }
  }

  const toggleCollection = async (collection: Collection) => {
    const isExpanded = expandedCollections.has(collection.id)

    if (isExpanded) {
      // Collapse
      setExpandedCollections((prev) => {
        const next = new Set(prev)
        next.delete(collection.id)
        return next
      })
    } else {
      // Expand and load assets if not already loaded
      setExpandedCollections((prev) => new Set(prev).add(collection.id))

      // Check if we have data from parent or local state
      const existingData = getAssetsForCollection(collection.id)
      if (!existingData) {
        await fetchCollectionAssets(collection.id)
      }
    }
  }

  const retryFetchAssets = async (collectionId: string) => {
    await fetchCollectionAssets(collectionId)
  }

  const renderCollectionIcon = (collection: Collection) => {
    if (collection.type === 'location') {
      return (
        <div className="flex items-center justify-center w-10 h-10 shrink-0 text-foreground-dim">
          <LocationIcon />
        </div>
      )
    }
    if (collection.type === 'scene') {
      return (
        <div className="flex items-center justify-center w-10 h-10 shrink-0 text-foreground-dim">
          <SceneIcon />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center w-10 h-10 shrink-0">
        {collection.assetCount === 0 ? (
          <div className="w-8 h-8 rounded-full bg-surface-2" />
        ) : (
          <Avatar
            src={collection.avatarSrc}
            name={collection.name}
            size="sm"
          />
        )}
      </div>
    )
  }

  // Determine effective display mode based on thumbnailMode and actual available images
  const getEffectiveMode = (collection: Collection): 'many' | 'two' | 'one' | 'none' => {
    if (thumbnailMode !== 'asis') {
      return thumbnailMode as 'many' | 'two' | 'one' | 'none'
    }

    // 'asis' - if we've loaded assets, use actual count
    const loadedData = getAssetsForCollection(collection.id)
    if (loadedData && !loadedData.loading) {
      const count = loadedData.assets.length
      if (count === 0) return 'none'
      if (count === 1) return 'one'
      if (count === 2) return 'two'
      return 'many'
    }

    // Before loading, use 'many' as default (will update after load)
    return 'many'
  }

  // All thumbnail modes use w-20 (80px) total width
  // Single: w-20 directly
  // Multi: w-12 (48px) + gap-1 (4px) + w-7 (28px) = 80px
  const renderThumbnails = (collection: Collection) => {
    const mode = getEffectiveMode(collection)
    const mainImage = collection.mainImage
    const thumbnails = collection.thumbnailImages || []
    const remainingCount = Math.max(0, collection.assetCount - 3)

    // Single image modes ('none'/'one')
    if (mode === 'none' || mode === 'one') {
      return (
        <div className={cn(
          'w-20 h-12 relative rounded overflow-hidden shrink-0 bg-surface-2 isolate',
          mode === 'none' && 'border border-border-dim'
        )}>
          {mainImage && mode === 'one' ? (
            <Image src={mainImage} alt={collection.name} fill className="object-cover" />
          ) : (
            collection.assetCount === 0 && (
              <div className="absolute inset-1">
                <Image
                  src={EMPTY_COLLECTION_PLACEHOLDER}
                  alt={`${collection.name} empty`}
                  fill
                  className="object-contain mix-blend-luminosity"
                />
              </div>
            )
          )}
        </div>
      )
    }

    // Multi-image modes ('two'/'many') - w-12 + gap-1 + w-7 = 80px (same as w-20)
    return (
      <div className="flex gap-1 h-12 shrink-0">
        {/* Main image - w-12 (48px) */}
        <div className="w-12 h-12 relative rounded-l overflow-hidden bg-surface-2">
          {mainImage && (
            <Image src={mainImage} alt={collection.name} fill className="object-cover" />
          )}
        </div>

        {/* Side column - w-7 (28px) */}
        <div className="flex flex-col gap-1 w-7">
          {mode === 'two' ? (
            // Single tall thumbnail
            <div className="w-7 h-12 relative rounded-r overflow-hidden bg-surface-2">
              {thumbnails[0] ? (
                <Image src={thumbnails[0]} alt="" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-surface-3" />
              )}
            </div>
          ) : (
            // Stacked thumbnails for 'many' mode
            <>
              <div className="w-7 flex-1 relative rounded-tr overflow-hidden bg-surface-2">
                {thumbnails[0] ? (
                  <Image src={thumbnails[0]} alt="" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-surface-3" />
                )}
              </div>
              <div className="w-7 flex-1 relative rounded-br overflow-hidden bg-surface-2">
                {thumbnails[1] ? (
                  <>
                    <Image src={thumbnails[1]} alt="" fill className="object-cover" />
                    <div className="absolute inset-0 bg-surface-overlay" />
                    {remainingCount > 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-label-0-bold text-foreground">
                        +{remainingCount}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 bg-surface-3" />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {collections.map((collection) => {
        const isExpanded = expandedCollections.has(collection.id)
        const collectionData = getAssetsForCollection(collection.id)

        return (
          <div
            key={collection.id}
            className={cn(
              'rounded transition-colors',
              isExpanded && 'bg-surface-highlight'
            )}
          >
            {/* Collection Row */}
            {showCollectionLoading || (parentIsPreloading && !collectionData) ? (
              <div className="w-full flex items-center gap-3 p-3 rounded animate-pulse">
                {/* Chevron skeleton */}
                <div className="w-4 h-4 bg-surface-3 rounded" />
                {/* Thumbnail skeleton - w-12 + gap-1 + w-7 = 80px (same as w-20) */}
                <div className="flex gap-1 h-12 shrink-0">
                  <div className="w-12 h-12 bg-surface-3 rounded-l" />
                  <div className="flex flex-col gap-1 w-7">
                    <div className="w-7 flex-1 bg-surface-3 rounded-tr" />
                    <div className="w-7 flex-1 bg-surface-3 rounded-br" />
                  </div>
                </div>
                {/* Avatar skeleton - matches w-10 h-10 icon wrapper */}
                <div className="w-10 h-10 bg-surface-3 rounded-full shrink-0" />
                {/* Text skeleton - matches text-body-1-bold (21px) and text-label-1-regular (18px) */}
                <div className="flex flex-col gap-1 flex-1">
                  <div className="h-5 w-32 bg-surface-3 rounded" />
                  <div className="h-4 w-20 bg-surface-3 rounded" />
                </div>
              </div>
            ) : (
              <button
                onClick={() => toggleCollection(collection)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded transition-colors',
                  !isExpanded && 'hover:bg-surface-highlight'
                )}
              >
                {/* Chevron */}
                <ChevronRight
                  className={cn(
                    'w-4 h-4 text-foreground-dim transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />

                {/* Thumbnail */}
                {renderThumbnails(collection)}

                {/* Icon/Avatar */}
                {renderCollectionIcon(collection)}

                {/* Name and count */}
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-body-1-bold text-foreground truncate w-full text-left">
                    {collection.name}
                  </span>
                  <span className={cn(
                    'text-label-1-regular',
                    (collectionData && !collectionData.loading
                      ? collectionData.assets.length === 0
                      : collection.assetCount === 0)
                      ? 'text-foreground-dim'
                      : 'text-foreground-subtle'
                  )}>
                    {collectionData && !collectionData.loading
                      ? collectionData.assets.length === 0
                        ? 'No assets'
                        : `${collectionData.assets.length} assets`
                      : collection.assetCount === 0
                      ? 'No assets'
                      : `${collection.assetCount} assets`}
                  </span>
                </div>
              </button>
            )}

            {/* Expanded Assets */}
            {isExpanded && !showCollectionLoading && (
              <div className="pl-10 pr-3 pb-4 pt-2">
                {collectionData?.loading ? (
                  <CardGrid columns={6} gap="4">
                    {[...Array(SKELETON_ASSET_COUNT)].map((_, i) => (
                      <AssetCard key={i} loading />
                    ))}
                  </CardGrid>
                ) : collectionData?.error ? (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <span className="text-body-1-regular text-foreground-system-error">{collectionData.error}</span>
                    <button
                      onClick={() => retryFetchAssets(collection.id)}
                      className="text-body-1-regular text-foreground-system-link hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : collectionData?.assets.length ? (
                  <CardGrid columns={6} gap="4">
                    {collectionData.assets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        selected={selectedIds?.has(asset.id)}
                        primary={primaryId === asset.id}
                        onClick={onAssetClick ? (a, e) => onAssetClick(a, e, collectionData.assets) : undefined}
                        onMenuClick={onAssetMenuClick}
                        loading={showAssetLoading}
                        forceEmptyPreview={forceEmptyPreview}
                      />
                    ))}
                  </CardGrid>
                ) : (
                  <EmptyState title="No assets in this collection" compact />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
