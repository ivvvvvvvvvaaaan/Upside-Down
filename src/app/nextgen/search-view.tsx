'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button, AssetCard, CardGrid, Stack, SelectionBar, Text } from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import { useAccess, useAssetSelection, useViewPreferences, useUserCollections, matchesFilter } from '@/hooks'
import type { Asset } from '@/lib/data'
import { mergePrototypeAssets } from '@/lib/prototype-assets'

interface MediaLibrarySearchViewProps {
  recentAssets: Asset[]
}

/**
 * Media Library Search View
 *
 * Search bar at top, recent assets gallery at bottom.
 * Searches across curated + workspace-promoted assets when query is non-empty.
 */
export function MediaLibrarySearchView({ recentAssets }: MediaLibrarySearchViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const menuHref = `/nextgen/menu?return=${encodeURIComponent(pathname)}`

  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const { cardSize } = useViewPreferences()
  const { createCollection } = useUserCollections()
  const { filterByAccess } = useAccess()

  // Lazy-load all department assets only when user has a search query
  const [apiAssets, setApiAssets] = useState<Asset[]>([])
  const [hasLoadedAll, setHasLoadedAll] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Fetch all department assets when user starts typing (deferred)
  useEffect(() => {
    if (!searchQuery.trim() || hasLoadedAll) return

    const fetchAll = async () => {
      setIsSearching(true)
      try {
        const response = await fetch('/api/assets')
        const assets: Asset[] = response.ok ? await response.json() : []
        setApiAssets(assets)
        setHasLoadedAll(true)
      } catch (error) {
        console.error('Failed to fetch assets for search:', error)
      } finally {
        setIsSearching(false)
      }
    }

    fetchAll()
  }, [searchQuery, hasLoadedAll])

  const allSearchableAssets = useMemo(() => {
    if (!hasLoadedAll) return []
    return mergePrototypeAssets(apiAssets)
  }, [apiAssets, hasLoadedAll])

  const accessibleSearchAssets = useMemo(() => {
    return filterByAccess(allSearchableAssets)
  }, [allSearchableAssets, filterByAccess])

  const accessibleRecentAssets = useMemo(() => {
    return filterByAccess(recentAssets)
  }, [recentAssets, filterByAccess])

  // Filter results based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    if (!hasLoadedAll) return null
    return accessibleSearchAssets.filter((asset) => matchesFilter(asset, { query: searchQuery }))
  }, [searchQuery, accessibleSearchAssets, hasLoadedAll])

  const curatedResults = useMemo(() => searchResults?.filter(a => !a.isAutoPromoted) ?? [], [searchResults])
  const workspaceResults = useMemo(() => searchResults?.filter(a => a.isAutoPromoted) ?? [], [searchResults])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

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

  const displayAssets = searchResults ?? accessibleRecentAssets

  const selectedAssets = useMemo(() => {
    return displayAssets.filter((asset) => selectedIds.has(asset.id))
  }, [displayAssets, selectedIds])

  const handleCreateCollection = (name: string) => {
    createCollection(name, selectedAssets.map(a => a.id))
    clearSelection()
  }

  const isSearchActive = searchQuery.trim().length > 0

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          {/* Mobile back button */}
          <div className="p-6 pb-0 md:hidden">
            <Button asChild variant="icon" size="icon" aria-label="Menu">
              <Link href={menuHref}>
                <ArrowLeft className="w-4 h-4" />
                <span className="sr-only">Menu</span>
              </Link>
            </Button>
          </div>

          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                {/* Search Section */}
                <div className="flex flex-col items-center pt-8 pb-4">
                  <div className="w-full max-w-2xl space-y-4">
                    {/* Title */}
                    <div className="text-center">
                      <h1 className="text-heading-4 text-foreground mb-2">
                        Media Library
                      </h1>
                      <p className="text-body-1-regular text-foreground-subtle">
                        Search across all collections and assets
                      </p>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="w-full">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-dim" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search collections, assets, characters..."
                          className="w-full h-14 pl-12 pr-4 bg-surface-low border border-border rounded text-body-1-regular text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-border-selected focus:ring-1 focus:ring-border-selected transition-colors"
                        />
                      </div>
                    </form>
                  </div>
                </div>

                {/* Results */}
                {isSearchActive ? (
                  <div className="space-y-6">
                    <span className="text-label-1-medium text-foreground-subtle">
                      {isSearching ? 'Searching...' : searchResults ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}` : ''}
                    </span>
                    {curatedResults.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-label-1-medium text-foreground-subtle">Assets</span>
                        <CardGrid columns={getColumns()} gap="4">
                          {curatedResults.map((asset) => (
                            <AssetCard
                              key={asset.id}
                              asset={asset}
                              selected={selectedIds.has(asset.id)}
                              primary={primaryId === asset.id}
                              onClick={(a, e) => handleAssetClick(a, e, searchResults!)}
                              onMenuClick={handleMenuClick}
                              showDepartment
                            />
                          ))}
                        </CardGrid>
                      </div>
                    )}
                    {workspaceResults.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-label-1-medium text-foreground-subtle">Workspace files</span>
                        <CardGrid columns={getColumns()} gap="4">
                          {workspaceResults.map((asset) => (
                            <AssetCard
                              key={asset.id}
                              asset={asset}
                              selected={selectedIds.has(asset.id)}
                              primary={primaryId === asset.id}
                              onClick={(a, e) => handleAssetClick(a, e, searchResults!)}
                              onMenuClick={handleMenuClick}
                              showDepartment
                            />
                          ))}
                        </CardGrid>
                      </div>
                    )}
                    {searchResults && searchResults.length === 0 && (
                      <div className="text-center py-12">
                        <Text variant="body-1" color="secondary">
                          No results for &ldquo;{searchQuery}&rdquo;
                        </Text>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Recent Section */
                  accessibleRecentAssets.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-label-1-medium text-foreground-subtle">Recent</span>
                      </div>
                      <CardGrid columns={getColumns()} gap="4">
                        {accessibleRecentAssets.map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            selected={selectedIds.has(asset.id)}
                            primary={primaryId === asset.id}
                            onClick={(a, e) => handleAssetClick(a, e, accessibleRecentAssets)}
                            onMenuClick={handleMenuClick}
                            showDepartment
                          />
                        ))}
                      </CardGrid>
                    </div>
                  )
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
    </AppLayout>
  )
}
