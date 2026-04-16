'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search } from 'lucide-react'
import { AssetCard, CardGrid, Stack, ContextualActionBar, Text, MobileToolbar } from '@/components/ui'
import { getGridColumns, matchesFilter, useAccess, useAssetSelection, useSmartCollections, useViewPreferences } from '@/hooks'
import type { Asset } from '@/lib/data'
import { assetToSelectionEntity } from '@/lib/selection-actions'

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
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const { cardSize } = useViewPreferences()
  const { filterByAccess, getVisibilityState, requestAccess, isSensitiveAsset } = useAccess()
  const { allAssets, assetsLoaded, assetsLoading, ensureAssetsLoaded } = useSmartCollections()

  useEffect(() => {
    if (!searchQuery.trim() || assetsLoaded || assetsLoading) return
    void ensureAssetsLoaded()
  }, [searchQuery, assetsLoaded, assetsLoading, ensureAssetsLoaded])

  const allSearchableAssets = useMemo(() => {
    return assetsLoaded ? allAssets : []
  }, [allAssets, assetsLoaded])

  const accessibleRecentAssets = useMemo(() => {
    return filterByAccess(recentAssets)
  }, [recentAssets, filterByAccess])

  const visibilityByAssetId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getVisibilityState>>()
    for (const asset of allSearchableAssets) {
      map.set(asset.id, getVisibilityState({
        id: asset.id,
        type: 'asset',
        domainId: asset.department,
      }))
    }
    return map
  }, [allSearchableAssets, getVisibilityState])

  const isRestricted = useCallback((asset: Asset) => {
    return visibilityByAssetId.get(asset.id) === 'discoverable'
  }, [visibilityByAssetId])

  const handleRequestAccess = useCallback((asset: Asset) => {
    requestAccess(asset.id, { id: asset.id, type: 'asset', domainId: asset.department })
  }, [requestAccess])

  // Filter results based on search query — include discoverable restricted assets
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    if (!assetsLoaded) return null
    return allSearchableAssets
      .filter((asset) => matchesFilter(asset, { query: searchQuery }))
      .filter((asset) => {
        const visibility = visibilityByAssetId.get(asset.id)
        return visibility === 'accessible' || visibility === 'discoverable'
      })
  }, [searchQuery, allSearchableAssets, assetsLoaded, visibilityByAssetId])

  const curatedResults = useMemo(() => searchResults?.filter(a => !a.isAutoPromoted) ?? [], [searchResults])
  const workspaceResults = useMemo(() => searchResults?.filter(a => a.isAutoPromoted) ?? [], [searchResults])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  const displayAssets = searchResults ?? accessibleRecentAssets

  const selectedAssets = useMemo(() => {
    return displayAssets.filter((asset) => selectedIds.has(asset.id))
  }, [displayAssets, selectedIds])
  const selectedEntities = useMemo(() => {
    return selectedAssets.map((asset) => assetToSelectionEntity(asset))
  }, [selectedAssets])

  const isSearchActive = searchQuery.trim().length > 0
  const isSearching = isSearchActive && (!assetsLoaded || assetsLoading)

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-6 pb-0">
          <MobileToolbar title="Search" />
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

              <span className="text-body-0-regular text-foreground-subtle min-h-5">
                {isSearchActive && searchResults
                  ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
                  : accessibleRecentAssets.length > 0 ? 'Recent' : '\u00A0'}
              </span>
              <ContextualActionBar
                selectedEntities={selectedEntities}
                onClearSelection={clearSelection}
              />

              {/* Results */}
              {isSearchActive ? (
                <div className="space-y-6">
                  <span className="text-label-1-medium text-foreground-subtle">
                    {isSearching ? 'Searching...' : searchResults ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}` : ''}
                  </span>
                  {curatedResults.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-label-1-medium text-foreground-subtle">Assets</span>
                      <CardGrid columns={getGridColumns(cardSize)} gap="4">
                        {curatedResults.map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            selected={selectedIds.has(asset.id)}
                            primary={primaryId === asset.id}
                            onClick={(a, e) => handleAssetClick(a, e, searchResults!)}
                            onMenuClick={handleMenuClick}
                            showDepartment
                            restricted={isRestricted(asset)}
                            sensitive={isSensitiveAsset(asset.id)}
                            onRequestAccess={handleRequestAccess}
                            allSelectedIds={selectedIds}
                          />
                        ))}
                      </CardGrid>
                    </div>
                  )}
                  {workspaceResults.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-label-1-medium text-foreground-subtle">Workspace files</span>
                      <CardGrid columns={getGridColumns(cardSize)} gap="4">
                        {workspaceResults.map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            selected={selectedIds.has(asset.id)}
                            primary={primaryId === asset.id}
                            onClick={(a, e) => handleAssetClick(a, e, searchResults!)}
                            onMenuClick={handleMenuClick}
                            showDepartment
                            restricted={isRestricted(asset)}
                            sensitive={isSensitiveAsset(asset.id)}
                            onRequestAccess={handleRequestAccess}
                            allSelectedIds={selectedIds}
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
                  <div>
                    <CardGrid columns={getGridColumns(cardSize)} gap="4">
                      {accessibleRecentAssets.map((asset) => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          selected={selectedIds.has(asset.id)}
                          primary={primaryId === asset.id}
                          onClick={(a, e) => handleAssetClick(a, e, accessibleRecentAssets)}
                          onMenuClick={handleMenuClick}
                          showDepartment
                          restricted={isRestricted(asset)}
                            sensitive={isSensitiveAsset(asset.id)}
                          onRequestAccess={handleRequestAccess}
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

    </div>
  )
}
