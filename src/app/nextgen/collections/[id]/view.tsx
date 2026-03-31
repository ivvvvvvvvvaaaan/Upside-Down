'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, PanelRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Stack,
  Text,
  Button,
  CardGrid,
  AssetCard,
  SelectionBar,
  EmptyState,
  CollectionSidePanel,
  AssetDetailPanel,
} from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import { useAccess, useAssetSelection, usePersona, useViewPreferences, useUserCollections } from '@/hooks'
import type { Asset } from '@/lib/data'
import { PERSONAS } from '@/lib/personas'
import { getReviewNoteSummary } from '@/lib/review-notes'

interface UserCollectionDetailViewProps {
  collectionId: string
}

export function UserCollectionDetailView({ collectionId }: UserCollectionDetailViewProps) {
  const pathname = usePathname()
  const router = useRouter()
  const menuHref = `/nextgen/menu?return=${encodeURIComponent(pathname)}`

  const { activePersona, isAdmin, hydrated } = usePersona()
  const { canAccess, filterByAccess, sharesReceivedByMe, allProjectShares } = useAccess()
  const { getCollection, createCollection, deleteCollection } = useUserCollections()
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const { cardSize, sidePanelOpen, setSidePanelOpen } = useViewPreferences()
  const { setBreadcrumbExtras, clearBreadcrumbExtras } = useBreadcrumbExtras()

  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  const collection = getCollection(collectionId)
  const isOwner = hydrated && (isAdmin || (!!collection && collection.createdBy === activePersona?.email))
  const hasCollectionAccess = hydrated && !!collection && (isOwner || canAccess(collection.id))

  // Find who shared this collection with the current user
  const sharedBy = useMemo(() => {
    const shares = isAdmin ? allProjectShares : sharesReceivedByMe
    const share = shares.find(s => s.resourceId === collectionId)
    if (!share || isOwner) return null
    return PERSONAS.find(p => p.id === share.grantedByUserId)?.name ?? share.grantedByUserId
  }, [collectionId, isOwner, isAdmin, sharesReceivedByMe, allProjectShares])

  // Sync collection name to top-level breadcrumb
  const displayName = hasCollectionAccess ? collection?.name : undefined
  useEffect(() => {
    if (displayName) {
      setBreadcrumbExtras([{ label: displayName }])
    }
    return () => clearBreadcrumbExtras()
  }, [displayName, setBreadcrumbExtras, clearBreadcrumbExtras])

  const handleDeleteCollection = () => {
    if (collection && isOwner) {
      deleteCollection(collection.id)
      router.push('/nextgen')
    }
  }

  const handleShareCollection = () => {
    console.log('Share collection:', collection?.id ?? collectionId)
  }

  // Fetch assets by IDs when collection loads
  useEffect(() => {
    if (!hydrated) return
    if (!collection || !hasCollectionAccess) {
      setAssets([])
      setLoading(false)
      return
    }

    const fetchAssets = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/assets/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: collection.assetIds }),
        })
        if (!response.ok) throw new Error('Failed to fetch assets')
        const fetchedAssets = await response.json()
        setAssets(filterByAccess(fetchedAssets))
      } catch (error) {
        console.error('Failed to fetch assets:', error)
        setAssets([])
      }
      setLoading(false)
    }

    fetchAssets()
  }, [hydrated, collection, hasCollectionAccess, filterByAccess])

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  const getColumns = () => {
    switch (cardSize) {
      case 'sm': return 6
      case 'lg': return 3
      default: return 4
    }
  }

  const selectedAssets = useMemo(() => {
    return assets.filter((asset) => selectedIds.has(asset.id))
  }, [assets, selectedIds])
  const primaryAsset = useMemo(() => {
    if (!primaryId) return null
    return assets.find(a => a.id === primaryId) ?? null
  }, [primaryId, assets])
  const reviewNoteSummary = useMemo(() => getReviewNoteSummary(collectionId), [collectionId])

  const handleCreateCollection = (name: string) => {
    createCollection(name, selectedAssets.map(a => a.id))
    clearSelection()
  }

  // Collection not found
  if ((!collection || !hasCollectionAccess) && !loading) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <Stack spacing="lg">
                  <div className="md:hidden">
                    <Button asChild variant="icon" size="icon" aria-label="Menu">
                      <Link href={menuHref}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="sr-only">Menu</span>
                      </Link>
                    </Button>
                  </div>
                  <EmptyState
                    title="Collection not found"
                    message="This collection may have been deleted or doesn't exist."
                  >
                    <Button
                      variant="secondary"
                      onClick={() => router.push('/nextgen/collections')}
                      className="mt-4"
                    >
                      Back to Collections
                    </Button>
                  </EmptyState>
                </Stack>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-full flex">
        {/* Main content area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <Stack spacing="lg">
                  <div className="md:hidden">
                    <Button asChild variant="icon" size="icon" aria-label="Menu">
                      <Link href={menuHref}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="sr-only">Menu</span>
                      </Link>
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Text variant="headline-1" weight="bold" className="mb-2">
                          {displayName || 'Loading...'}
                        </Text>
                        <Text variant="body-2" color="secondary">
                          {loading
                            ? 'Loading assets...'
                            : assets.length === 0
                            ? 'No assets'
                            : `${assets.length} asset${assets.length !== 1 ? 's' : ''}`
                          }
                          {sharedBy && ` · Shared by ${sharedBy}`}
                        </Text>
                      </div>
                      <Button
                        variant="icon"
                        compact
                        onClick={() => setSidePanelOpen(!sidePanelOpen)}
                        aria-label={sidePanelOpen ? 'Close panel' : 'Open panel'}
                        className={cn(sidePanelOpen && 'bg-surface-3')}
                      >
                        <PanelRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {loading ? (
                    <CardGrid columns={getColumns()} gap="4">
                      {[...Array(6)].map((_, i) => (
                        <AssetCard key={i} loading />
                      ))}
                    </CardGrid>
                  ) : assets.length > 0 ? (
                    <CardGrid columns={getColumns()} gap="4">
                      {assets.map((asset) => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          selected={selectedIds.has(asset.id)}
                          primary={primaryId === asset.id}
                          onClick={(a, e) => handleAssetClick(a, e, assets)}
                          onMenuClick={handleMenuClick}
                          showDepartment
                        />
                      ))}
                    </CardGrid>
                  ) : (
                    <EmptyState
                      title="No assets"
                      message="This collection doesn't have any assets yet"
                    />
                  )}
                </Stack>
              </div>
            </div>
          </div>

          <SelectionBar
            selectedCount={selectedIds.size}
            selectedAssets={selectedAssets}
            onClear={clearSelection}
            onCreateCollection={handleCreateCollection}
            onShare={() => console.log('Share:', Array.from(selectedIds))}
          />
        </div>

        {/* Side panel - asset detail when selected, collection settings otherwise */}
        <AssetDetailPanel
          asset={primaryAsset!}
          open={sidePanelOpen && !!primaryAsset}
          onClose={() => { clearSelection(); setSidePanelOpen(false) }}
          activeCollectionId={collectionId}
        />
        {collection && hasCollectionAccess && (
          <CollectionSidePanel
            collection={collection}
            open={sidePanelOpen && !primaryAsset}
            onClose={() => setSidePanelOpen(false)}
            onDelete={handleDeleteCollection}
            onShare={handleShareCollection}
            reviewNoteSummary={reviewNoteSummary}
            canDelete={isOwner}
            canShare={isOwner}
          />
        )}
      </div>
    </AppLayout>
  )
}
