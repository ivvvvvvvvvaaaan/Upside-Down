'use client'

import { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Info, Download, PanelRight, MessageCircle, Film, Sparkles } from 'lucide-react'
import {
  AssetCard,
  CardGrid,
  Stack,
  ContextualActionBar,
  Text,
  MobileToolbar,
  FilterBar,
  SearchSuggestions,
  AssetDetailPanel,
  DropdownMenuItem,
  DropdownMenuDivider,
  Button,
} from '@/components/ui'
import type { SearchInputConfig } from '@/components/ui/filter-bar'
import { SelectAllRow } from '@/components/ui/select-all-row'
import { cn } from '@/lib/utils'
import { getGridColumns, useAccess, useAssetSelection, useSmartCollections, useViewPreferences, useMobilePanel } from '@/hooks'
import type { Asset } from '@/lib/data'
import type { AssetFilter, AssetType } from '@/lib/data-client'
import { assetToSelectionEntity } from '@/lib/selection-actions'
import { getContextAssetGroups } from '@/lib/context-relationships'
import {
  executeSearch,
  parseQuery,
  getSuggestions,
  removeChipFromQuery,
  addPhraseToQuery,
  replaceTrailingFreeText,
  SEMANTIC_MODE_ASSET_TYPES,
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
// Direct drills open a text-input panel (select → type → Enter) rather than a
// sub-list. `mode` scopes the resulting semantic search: dialogue → audio,
// visual → visual media, semantic → unscoped. Icons mirror the browse dropdown.
type SemanticMode = 'dialogue' | 'visual' | 'semantic'
type DirectDrillMeta = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  mode: SemanticMode
}
const DIRECT_DRILL_META: Record<string, DirectDrillMeta> = {
  dialogue: { label: 'Dialogue', icon: MessageCircle, mode: 'dialogue' },
  visual: { label: 'Visual', icon: Film, mode: 'visual' },
  semantic: { label: 'Anything', icon: Sparkles, mode: 'semantic' },
}

export function MediaLibrarySearchView({ recentAssets }: MediaLibrarySearchViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // inputValue: updates on every keystroke — drives the visible input and cheap
  // parses (chips, free text, suggestions) with zero delay.
  // deferredQuery: React schedules this as low-priority — drives executeSearch
  // so expensive renders are interruptible and never block a keypress.
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') ?? '')
  const deferredQuery = useDeferredValue(inputValue)
  // Prevents iOS autocorrect/predictive-text from racing the controlled input.
  const composingRef = useRef(false)

  // Semantic chips stack: each has a mode (Dialogue → audio, Visual → visual media,
  // Semantic → unscoped) + the text to rank against. Confirming a new one appends —
  // it never replaces an existing chip. Each is individually editable/dismissable.
  const [semanticChips, setSemanticChips] = useState<{ id: number; mode: SemanticMode; text: string }[]>([])
  const semanticIdRef = useRef(0)
  const nextSemanticId = () => ++semanticIdRef.current
  const [inputFocused, setInputFocused] = useState(false)
  const [searchDrillKind, setSearchDrillKind] = useState<string | null>(null)
  const [directDrillText, setDirectDrillText] = useState('')
  const [chipDropdownLeft, setChipDropdownLeft] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { selectedIds, primaryId, handleAssetClick, selectAll, selectOnly, clearSelection } = useAssetSelection()
  const { cardSize, sidePanelOpen, setSidePanelOpen } = useViewPreferences()
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(sidePanelOpen, setSidePanelOpen)
  const { filterByAccess, getVisibilityState, requestAccess, canDownload } = useAccess()
  const { allAssets, assetsLoaded, assetsLoading, ensureAssetsLoaded } = useSmartCollections()

  // Sync the URL once typing pauses. deferredQuery already lags keystrokes via
  // React's scheduler; the extra 300ms timer prevents thrashing history on fast
  // devices where deferred renders resolve quickly.
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(Array.from(searchParams.entries()))
      const current = params.get('q') ?? ''
      if (deferredQuery === current) return
      if (deferredQuery) params.set('q', deferredQuery)
      else params.delete('q')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 300)
    return () => clearTimeout(t)
  // pathname intentionally excluded — replace would loop on its own write.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery])

  // React to external URL changes (back/forward, deep-link, in-app link).
  useEffect(() => {
    const fromUrl = searchParams.get('q') ?? ''
    if (fromUrl !== inputValue) {
      setInputValue(fromUrl)
    }
  // inputValue intentionally excluded — we only mirror inbound changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Kick off asset loading as soon as the user interacts with search — typing
  // OR just focusing the input — so +Dimension popovers are populated by the
  // time they consider clicking one. Deep-linked queries also trigger load.
  useEffect(() => {
    if (assetsLoaded || assetsLoading) return
    if (inputValue.trim() || inputFocused) {
      void ensureAssetsLoaded()
    }
  }, [inputValue, inputFocused, assetsLoaded, assetsLoading, ensureAssetsLoaded])

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

  // Run the engine over whatever's currently accessible. Uses deferredQuery so
  // React can interrupt this render when a new keystroke arrives.
  const search = useMemo(() => {
    const visible = allSearchableAssets.filter((asset) => {
      const visibility = visibilityByAssetId.get(asset.id)
      return visibility === 'accessible' || visibility === 'discoverable'
    })
    // Combine every semantic chip's text for scoring; union the mode type-scopes.
    const semanticText = semanticChips.map(c => c.text).filter(Boolean).join(' ').trim()
    const modes = new Set(semanticChips.map(c => c.mode))
    const types: AssetType[] = []
    if (modes.has('dialogue')) types.push(...SEMANTIC_MODE_ASSET_TYPES.dialogue)
    if (modes.has('visual')) types.push(...SEMANTIC_MODE_ASSET_TYPES.visual)
    const contextFilter: AssetFilter | undefined = types.length ? { types } : undefined
    return executeSearch({ query: deferredQuery, assets: visible, semanticText: semanticText || undefined, contextFilter })
  }, [deferredQuery, allSearchableAssets, visibilityByAssetId, semanticChips])

  // Cheap parse of the *current* input — chips, free text, and suggestions stay
  // in sync with what the user sees without waiting for the deferred render.
  const currentParsed = useMemo(() => parseQuery(inputValue), [inputValue])
  const parsedChips: ParsedChip[] = currentParsed.chips
  const freeText: string = currentParsed.freeText
  // Facets come from the deferred search; the tiny visual lag is imperceptible.
  const facets = search.facets

  const searchResults = useMemo(() => {
    if (!deferredQuery.trim()) return null
    return search.results.map(r => r.asset)
  }, [deferredQuery, search])

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
      .map(c => ({ kind: c.kind, value: String(c.value) }))
    return getSuggestions(freeText, 7, excludeKinds, excludeValues)
  }, [freeText, parsedChips])

  // Keep dropdown open while in any drill mode (incl. direct text drills)
  const showSuggestions = inputFocused || !!DIRECT_DRILL_META[searchDrillKind ?? '']

  // === Handlers that mutate the input string ===

  const handleDismissChip = useCallback((chip: ParsedChip) => {
    setInputValue(prev => removeChipFromQuery(prev, chip))
  }, [])

  const handlePinFacet = useCallback((canonical: string) => {
    setInputValue(prev => addPhraseToQuery(prev, canonical))
  }, [])

  const handleClearAll = useCallback(() => {
    setInputValue(freeText.trim())
    setSemanticChips([])
  }, [freeText])

  const handleDismissSemanticChip = useCallback((id: number) => {
    setSemanticChips(prev => prev.filter(c => c.id !== id))
  }, [])

  const handleSemanticSearch = useCallback((text: string) => {
    if (!text.trim()) return
    setInputValue(prev => replaceTrailingFreeText(prev, freeText, '').trim())
    setSemanticChips(prev => [...prev, { id: nextSemanticId(), mode: 'semantic', text: text.trim() }])
    inputRef.current?.focus()
  }, [freeText])

  const handleDirectDrillConfirm = useCallback((direct: string, text: string) => {
    // Dialogue/Visual/Semantic each APPEND a semantic chip (e.g. "Dialogue: hey") —
    // they never replace an existing one. Anything else pins a plain phrase in the input.
    const meta = DIRECT_DRILL_META[direct]
    if (meta) {
      // Empty text is allowed for Dialogue/Visual (the mode itself is a type filter).
      if (text.trim() || meta.mode !== 'semantic') {
        setSemanticChips(prev => [...prev, { id: nextSemanticId(), mode: meta.mode, text: text.trim() }])
      }
    } else {
      setInputValue(prev => addPhraseToQuery(prev, direct))
    }
    setSearchDrillKind(null)
    setDirectDrillText('')
    inputRef.current?.focus()
  }, [])

  // Click a semantic chip → reopen its drill panel with the text pre-filled for editing.
  // That chip is removed; re-confirming appends it again (at the end).
  const handleEditSemanticChip = useCallback((id: number) => {
    setSemanticChips(prev => {
      const chip = prev.find(c => c.id === id)
      if (chip) {
        setSearchDrillKind(chip.mode)
        setDirectDrillText(chip.text)
      }
      return prev.filter(c => c.id !== id)
    })
    inputRef.current?.focus()
  }, [])

  const handleSelectSuggestion = useCallback((s: Suggestion) => {
    setInputValue(prev => replaceTrailingFreeText(prev, freeText, s.canonical))
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

  const isSearchActive = inputValue.trim().length > 0
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

  // Ref so onChange/onCompositionEnd always see the latest chips, even when
  // multiple keystrokes fire before the next render (stale closure guard).
  const parsedChipsRef = useRef(parsedChips)
  parsedChipsRef.current = parsedChips

  const buildInputValue = (newFreeText: string) => {
    const chipStr = parsedChipsRef.current.map(c => c.source).join(' ').trim()
    return chipStr ? `${chipStr} ${newFreeText}` : newFreeText
  }

  // parseQuery always trims freeText, so a trailing space typed by the user
  // gets eaten on re-render and the next character lands without the space.
  // Track it separately so the input can display the space while freeText is trimmed.
  const [trailingSpace, setTrailingSpace] = useState(false)
  // Reset whenever freeText actually changes (chip added, suggestion selected, etc.)
  useEffect(() => { setTrailingSpace(false) }, [freeText])

  const handleFreeTextChange = (v: string) => {
    setTrailingSpace(v.endsWith(' '))
    setInputValue(buildInputValue(v))
  }

  const searchInputConfig: SearchInputConfig = {
    value: trailingSpace ? freeText + ' ' : freeText,
    onChange: (v) => { if (!composingRef.current) handleFreeTextChange(v) },
    onFocus: () => setInputFocused(true),
    onBlur: () => {
      setInputFocused(false)
      // Don't kill a direct drill — focus is moving to the drill text input inside the panel.
      // Non-direct drills (character, scene, etc.) rely on inputFocused to stay open, so do clear them.
      if (!DIRECT_DRILL_META[searchDrillKind ?? '']) {
        setSearchDrillKind(null)
        setChipDropdownLeft(0)
      }
    },
    onCompositionStart: () => { composingRef.current = true },
    onCompositionEnd: (v) => { composingRef.current = false; handleFreeTextChange(v) },
    inputRef,
    placeholder: parsedChips.length > 0 ? 'Add more…' : 'Filter by character, scene, episode…',
    onSubmit: () => {},
    suggestionsContent: (
      <SearchSuggestions
        suggestions={suggestions}
        open={showSuggestions}
        onSelect={(s) => { handleSelectSuggestion(s) }}
        onDismiss={() => setInputFocused(false)}
        inputRef={inputRef}
        browseMode={!freeText}
        facets={facets}
        activeChips={parsedChips}
        onPinFacet={(canonical) => { handlePinFacet(canonical) }}
        onDeselect={handleDismissChip}
        drillKind={searchDrillKind}
        onDrillKindChange={(kind) => {
          setSearchDrillKind(kind)
          if (!kind) { setChipDropdownLeft(0); setDirectDrillText('') }
        }}
        leftOffset={chipDropdownLeft}
        freeText={freeText}
        onSemanticSearch={handleSemanticSearch}
        directDrillText={directDrillText}
        onDirectDrillTextChange={setDirectDrillText}
        onDirectDrillConfirm={handleDirectDrillConfirm}
      />
    ),
  }

  const searchSection = (
    <div className="w-full space-y-3">
      {/* Always-present title — kept visible so results appearing doesn't shift the layout */}
      <h1 className="truncate text-lg font-bold md:text-2xl text-foreground">Search</h1>

      {/* Combined filter + search bar */}
      <div className="flex items-center justify-between gap-4">
        <FilterBar
          className="flex-1 max-w-2xl"
          chips={parsedChips}
          facets={facets ?? undefined}
          onDismissChip={handleDismissChip}
          onClearAll={handleClearAll}
          semanticChips={semanticChips.map(c => ({
            id: c.id,
            label: DIRECT_DRILL_META[c.mode].label,
            icon: DIRECT_DRILL_META[c.mode].icon,
            text: c.text,
          }))}
          onDismissSemanticChip={handleDismissSemanticChip}
          onEditSemanticChip={handleEditSemanticChip}
          searchInput={searchInputConfig}
          onChipBodyClick={(drillKind, leftPx) => {
            setSearchDrillKind(drillKind)
            inputRef.current?.focus()
            setChipDropdownLeft(leftPx)
          }}
          provisionalChip={searchDrillKind && DIRECT_DRILL_META[searchDrillKind]
            ? { label: DIRECT_DRILL_META[searchDrillKind].label, text: directDrillText, icon: DIRECT_DRILL_META[searchDrillKind].icon }
            : undefined}
          onDismissProvisionalChip={() => { setSearchDrillKind(null); setDirectDrillText('') }}
        />
        <Button variant="icon" onClick={togglePanel} aria-label={panelOpen ? 'Close panel' : 'Open panel'}>
          <PanelRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="h-full flex">
      <div className="flex-1 min-w-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-6 pb-0">
          <MobileToolbar title="Search" />
        </div>

        {/* Search bar — always sticky so it stays in view as results scroll.
            z-30 keeps the bar + its suggestions dropdown above the grid's card-level
            z-10 content (hover action bars), so dropdown clicks aren't stolen by cards. */}
        <div className="px-6 pt-6 pb-3 bg-surface-flat sticky top-0 z-30">
          {searchSection}
        </div>

        <div className="px-6 pb-6">
          <div className="w-full">
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
                        No results for &ldquo;{deferredQuery}&rdquo;
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
