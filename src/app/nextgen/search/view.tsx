'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, Info, Download, PanelRight } from 'lucide-react'
import {
  AssetCard,
  CardGrid,
  Stack,
  ContextualActionBar,
  Text,
  MobileToolbar,
  ScopeStrip,
  SearchSuggestions,
  AssetDetailPanel,
  DropdownMenuItem,
  DropdownMenuDivider,
  Button,
} from '@/components/ui'
import { SelectAllRow } from '@/components/ui/select-all-row'
import { cn } from '@/lib/utils'
import { getGridColumns, useAccess, useAssetSelection, useSmartCollections, useViewPreferences, useMobilePanel } from '@/hooks'
import type { Asset } from '@/lib/data'
import { assetToSelectionEntity } from '@/lib/selection-actions'
import { getContextAssetGroups } from '@/lib/context-relationships'
import {
  executeSearch,
  getSuggestions,
  removeChipFromQuery,
  addPhraseToQuery,
  replaceTrailingFreeText,
  type ParsedChip,
  type Suggestion,
} from '@/lib/search'

interface MediaLibrarySearchViewProps {
  recentAssets: Asset[]
}

const SUGGESTION_MULTI_VALUE_KINDS = new Set<ParsedChip['kind']>([
  'character',
  'scene',
  'location',
  'episode',
  'stage',
])

/**
 * Media Library Search View
 *
 * URL-aware: `?q=…` seeds the initial query and round-trips on edits so
 * deep-links and back-button work.
 */
export function MediaLibrarySearchView({ recentAssets }: MediaLibrarySearchViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize from URL (?q=…). Subsequent edits write back via router.replace,
  // so internal state stays the source of truth between writes.
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { selectedIds, primaryId, handleAssetClick, selectAll, selectOnly, clearSelection } = useAssetSelection()
  const { cardSize, sidePanelOpen, setSidePanelOpen } = useViewPreferences()
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(sidePanelOpen, setSidePanelOpen)
  const { filterByAccess, getVisibilityState, requestAccess, canDownload } = useAccess()
  const { allAssets, assetsLoaded, assetsLoading, ensureAssetsLoaded } = useSmartCollections()

  // Sync the URL with the current query — debounced so each keystroke doesn't
  // hit the history stack. router.replace (not push) so back-button skips the
  // intermediate states.
  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(Array.from(searchParams.entries()))
      const current = params.get('q') ?? ''
      if (searchQuery === current) return // nothing to write
      if (searchQuery) params.set('q', searchQuery)
      else params.delete('q')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 200)
    return () => clearTimeout(handle)
  // pathname intentionally excluded — replace would loop on its own write.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // React to external URL changes (back/forward, deep-link, in-app link).
  useEffect(() => {
    const fromUrl = searchParams.get('q') ?? ''
    if (fromUrl !== searchQuery) {
      setSearchQuery(fromUrl)
    }
  // searchQuery intentionally excluded — we only mirror inbound changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Kick off asset loading as soon as the user interacts with search — typing
  // OR just focusing the input — so +Dimension popovers are populated by the
  // time they consider clicking one. Deep-linked queries also trigger load.
  useEffect(() => {
    if (assetsLoaded || assetsLoading) return
    if (searchQuery.trim() || inputFocused) {
      void ensureAssetsLoaded()
    }
  }, [searchQuery, inputFocused, assetsLoaded, assetsLoading, ensureAssetsLoaded])

  // Workspace (live) assets are present immediately from useFileTree —
  // gating them on /api/assets's `assetsLoaded` makes Character/Scene/Location
  // facets silently empty until the fetch resolves. Use whatever's loaded.
  const allSearchableAssets = allAssets

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

  // Run the engine over whatever's currently accessible. allSearchableAssets
  // changes identity as curated /api/assets fold in, which re-triggers this.
  const search = useMemo(() => {
    const visible = allSearchableAssets.filter((asset) => {
      const visibility = visibilityByAssetId.get(asset.id)
      return visibility === 'accessible' || visibility === 'discoverable'
    })
    return executeSearch({ query: searchQuery, assets: visible })
  }, [searchQuery, allSearchableAssets, visibilityByAssetId])

  const parsedChips: ParsedChip[] = search.parsed.chips
  const freeText: string = search.parsed.freeText
  const facets = search.facets

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    return search.results.map(r => r.asset)
  }, [searchQuery, search])

  const curatedResults = searchResults ?? []
  const workspaceResults: typeof curatedResults = []

  // Typeahead suggestions: derived from the trailing free-text. Single-value
  // kinds are excluded entirely once pinned; multi-value kinds exclude only the
  // already-selected values so additional values remain discoverable.
  const suggestions: Suggestion[] = useMemo(() => {
    if (!freeText) return []
    const excludeKinds = parsedChips
      .filter(c => !SUGGESTION_MULTI_VALUE_KINDS.has(c.kind))
      .map(c => c.kind)
    const excludeValues = parsedChips
      .filter(c => SUGGESTION_MULTI_VALUE_KINDS.has(c.kind))
      .map(c => ({ kind: c.kind, value: c.value }))
    return getSuggestions(freeText, 7, excludeKinds, excludeValues)
  }, [freeText, parsedChips])

  const showSuggestions = inputFocused && suggestions.length > 0

  // === Handlers that mutate the input string ===

  const handleDismissChip = useCallback((chip: ParsedChip) => {
    setSearchQuery(prev => removeChipFromQuery(prev, chip))
  }, [])

  const handlePinFacet = useCallback((canonical: string) => {
    setSearchQuery(prev => addPhraseToQuery(prev, canonical))
  }, [])

  const handleClearAll = useCallback(() => {
    setSearchQuery(freeText.trim())
  }, [freeText])

  const handleSelectSuggestion = useCallback((s: Suggestion) => {
    // Replace the trailing free-text with the canonical phrase so the parser
    // re-chips it. Keeps already-pinned chip spans intact.
    setSearchQuery(prev => {
      return replaceTrailingFreeText(prev, freeText, s.canonical)
    })
    inputRef.current?.focus()
  }, [freeText])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const displayAssets = searchResults ?? accessibleRecentAssets

  const selectedAssets = useMemo(() => {
    return displayAssets.filter((asset) => selectedIds.has(asset.id))
  }, [displayAssets, selectedIds])
  const selectedEntities = useMemo(() => {
    return selectedAssets.map((asset) => assetToSelectionEntity(asset))
  }, [selectedAssets])
  const anySelectedBlocked = useMemo(() => {
    return selectedAssets.some(a => !canDownload({ id: a.id, type: 'asset', domainId: a.department }))
  }, [selectedAssets, canDownload])

  const isSearchActive = searchQuery.trim().length > 0
  const isSearching = isSearchActive && (!assetsLoaded || assetsLoading)

  const primaryAsset = useMemo(() => {
    if (!primaryId) return null
    return displayAssets.find(a => a.id === primaryId) ?? null
  }, [primaryId, displayAssets])

  const primaryAssetContextGroups = useMemo(() => {
    if (!primaryAsset) return undefined
    return getContextAssetGroups(primaryAsset, allSearchableAssets)
  }, [primaryAsset, allSearchableAssets])

  const handlePanelAssetSwitch = useCallback((asset: Asset) => {
    selectOnly(asset)
    setSidePanelOpen(true)
  }, [selectOnly, setSidePanelOpen])

  const buildMenuContent = useCallback((asset: Asset) => (
    <div className="py-1">
      <DropdownMenuItem
        icon={<Info className="w-4 h-4" />}
        label="View details"
        onClick={() => { selectOnly(asset); setSidePanelOpen(true) }}
      />
      <DropdownMenuDivider />
      <DropdownMenuItem
        icon={<Download className="w-4 h-4" />}
        label="Download"
        disabled={!canDownload({ id: asset.id, type: 'asset', domainId: asset.department })}
        onClick={() => {}}
      />
    </div>
  ), [canDownload, selectOnly, setSidePanelOpen])

  // One-way expansion. Triggers: Enter, chip pin, suggestion select, or first result.
  // Not on every keystroke — keeps focus intact during layout shift.
  const [expanded, setExpanded] = useState(
    () => !!(searchParams.get('q') ?? '').trim(),
  )

  // Expand when results appear (async, after assets load)
  useEffect(() => {
    if (!expanded && searchResults && searchResults.length > 0) setExpanded(true)
  }, [searchResults, expanded])

  const searchSection = (
    <div className="w-full space-y-3">
      {/* Title fades out when expanded */}
      <div className={cn(
        'overflow-hidden transition-all duration-200 ease-out',
        expanded ? 'max-h-0 opacity-0 mb-0 pointer-events-none' : 'max-h-32 opacity-100',
      )}>
        <h1 className="truncate text-lg font-bold md:text-2xl text-foreground">Search</h1>
      </div>

      {/* Search bar — always the same input node, focus is preserved */}
      <div className="flex items-center justify-between gap-4">
        <form className="flex-1 max-w-2xl" onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) setExpanded(true) }}>
          <div className="relative">
            <Search className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 text-foreground-dim pointer-events-none transition-all duration-300',
              expanded ? 'w-4 h-4 left-3' : 'w-5 h-5',
            )} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder='Type to filter — characters, episodes, scenes, "final cut"…'
              className={cn(
                'w-full rounded-md bg-surface-flat ring-1 ring-inset ring-border-dim text-foreground placeholder:text-foreground-dim transition-[height,padding,font-size] duration-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-border-system-focus',
                expanded
                  ? 'h-10 pl-9 pr-3 text-body-0-regular'
                  : 'h-14 pl-12 pr-4 text-body-1-regular',
              )}
            />
            <SearchSuggestions
              suggestions={suggestions}
              open={showSuggestions}
              onSelect={(s) => { setExpanded(true); handleSelectSuggestion(s) }}
              onDismiss={() => setInputFocused(false)}
              inputRef={inputRef}
            />
          </div>
        </form>
        <Button variant="icon" onClick={togglePanel} aria-label={panelOpen ? 'Close panel' : 'Open panel'}>
          <PanelRight className="w-4 h-4" />
        </Button>
      </div>

      {facets && (
        <ScopeStrip
          chips={parsedChips}
          facets={facets}
          onDismissChip={handleDismissChip}
          onPinFacet={(canonical) => { setExpanded(true); handlePinFacet(canonical) }}
          onClearAll={handleClearAll}
        />
      )}
    </div>
  )

  return (
    <div className="h-full flex">
      <div className="flex-1 min-w-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-6 pb-0">
          <MobileToolbar title="Search" />
        </div>

        {/* Search bar — sticky in expanded state, hero in default */}
        <div className={cn(
          'px-6 pb-3 bg-surface-flat',
          expanded && 'sticky top-0 z-10',
        )}>
          <div className={cn('transition-[padding] duration-300 ease-out', expanded ? 'pt-1' : 'pt-6 pb-4')}>
            {searchSection}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="max-w-7xl mx-auto">
            <Stack spacing="lg">

              <div className="flex items-center justify-between min-h-8">
                <SelectAllRow
                  selectedCount={selectedIds.size}
                  totalCount={displayAssets.length}
                  onSelectAll={() => selectAll(displayAssets)}
                  onClearSelection={clearSelection}
                  label={isSearchActive && searchResults
                    ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
                    : accessibleRecentAssets.length > 0 ? 'Recent' : ''}
                />
                {selectedIds.size > 0 && (
                  <ContextualActionBar
                    selectedEntities={selectedEntities}
                    onClearSelection={clearSelection}
                    downloadAction={{
                      enabled: !anySelectedBlocked,
                      onClick: () => {},
                      label: `Download ${selectedIds.size} Asset${selectedIds.size !== 1 ? 's' : ''}`,
                    }}
                  />
                )}
              </div>

              {/* Results */}
              {isSearchActive ? (
                <div className="space-y-6">
                  {isSearching && (
                    <span className="text-label-1-medium text-foreground-subtle">Searching…</span>
                  )}
                  {curatedResults.length > 0 && (
                    <div className="space-y-3">
                      {workspaceResults.length > 0 && (
                        <span className="text-label-1-medium text-foreground-subtle">Assets</span>
                      )}
                      <CardGrid columns={getGridColumns(cardSize)} gap="4">
                        {curatedResults.map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            selected={selectedIds.has(asset.id)}
                            primary={primaryId === asset.id}
                            onClick={(a, e) => handleAssetClick(a, e, searchResults!)}
                            menuContent={buildMenuContent(asset)}
                            showDepartment
                            restricted={isRestricted(asset)}
                            sensitive={asset.sensitive}
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
                            menuContent={buildMenuContent(asset)}
                            showDepartment
                            restricted={isRestricted(asset)}
                            sensitive={asset.sensitive}
                            onRequestAccess={handleRequestAccess}
                            allSelectedIds={selectedIds}
                          />
                        ))}
                      </CardGrid>
                    </div>
                  )}
                  {searchResults && searchResults.length === 0 && !isSearching && (
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
                          menuContent={buildMenuContent(asset)}
                          showDepartment
                          restricted={isRestricted(asset)}
                          sensitive={asset.sensitive}
                          onRequestAccess={handleRequestAccess}
                          allSelectedIds={selectedIds}
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

      <AssetDetailPanel
        asset={primaryAsset}
        open={panelOpen}
        onClose={() => { clearSelection(); closePanel() }}
        contextGroups={primaryAssetContextGroups}
        onContextAssetClick={handlePanelAssetSwitch}
      />
    </div>
  )
}
