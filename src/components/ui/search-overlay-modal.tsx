'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, EyeOff, Search } from 'lucide-react'
import { Button } from './button'
import { Modal } from './modal'
import { ScopeStrip } from './scope-strip'
import { SearchSuggestions } from './search-suggestions'
import { useSearchOverlay } from './search-overlay-context'
import { cn } from '@/lib/utils'
import {
  addPhraseToQuery,
  chipsToFilter,
  executeSearch,
  getSuggestions,
  parseQuery,
  removeChipFromQuery,
  replaceTrailingFreeText,
  type ParsedChip,
  type Suggestion,
} from '@/lib/search'
import { matchesFilter } from '@/lib/smart-collection-filters'
import { useAccess, useSmartCollections } from '@/hooks'
import type { Asset } from '@/lib/data'

/**
 * SearchOverlayModal — spotlight-style search overlay.
 *
 * Opens from anywhere via useSearchOverlay().open({ contextPhrase? }).
 * contextPhrase (e.g. "scenes" from the Scene category page) is parsed into
 * locked chips that scope the search without appearing as editable text in the
 * input. The user types freely; locked chips are shown in the scope strip with
 * × to dismiss, but deleting input text never removes them.
 */

const RESULT_PREVIEW_LIMIT = 5

export function SearchOverlayModal() {
  const { isOpen, contextPhrase, open, close } = useSearchOverlay()
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [lockedChips, setLockedChips] = useState<ParsedChip[]>([])
  const [highlight, setHighlight] = useState(0)
  const [suppressSuggestions, setSuppressSuggestions] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global ⌘K / Ctrl+K shortcut — opens from any page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) close()
        else open()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, open, close])

  // On open: parse contextPhrase into locked chips, start input empty.
  useEffect(() => {
    if (!isOpen) return
    if (contextPhrase) {
      setLockedChips(parseQuery(contextPhrase).chips)
    } else {
      setLockedChips([])
    }
    setQuery('')
    setHighlight(0)
    setSuppressSuggestions(false)
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [isOpen, contextPhrase])

  const { getVisibilityState, requestAccess } = useAccess()
  const { allAssets, assetsLoaded, assetsLoading, ensureAssetsLoaded } = useSmartCollections()

  useEffect(() => {
    if (!isOpen) return
    if (assetsLoaded || assetsLoading) return
    void ensureAssetsLoaded()
  }, [isOpen, assetsLoaded, assetsLoading, ensureAssetsLoaded])

  const visibilityByAssetId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getVisibilityState>>()
    for (const asset of allAssets) {
      map.set(asset.id, getVisibilityState({ id: asset.id, type: 'asset', domainId: asset.department }))
    }
    return map
  }, [allAssets, getVisibilityState])

  const visibleAssets = useMemo(() => {
    return allAssets.filter((a) => {
      const v = visibilityByAssetId.get(a.id)
      return v === 'accessible' || v === 'discoverable'
    })
  }, [allAssets, visibilityByAssetId])

  // Pre-filter by locked chips so search + facets are already scoped.
  const lockedFilter = useMemo(() => chipsToFilter(lockedChips, ''), [lockedChips])
  const scopedAssets = useMemo(
    () => lockedChips.length > 0 ? visibleAssets.filter(a => matchesFilter(a, lockedFilter)) : visibleAssets,
    [lockedChips, lockedFilter, visibleAssets],
  )

  const search = useMemo(() => {
    if (!isOpen) return null
    return executeSearch({ query, assets: scopedAssets })
  }, [isOpen, query, scopedAssets])

  const queryChips: ParsedChip[] = useMemo(() => search?.parsed.chips ?? [], [search])
  const allChips = useMemo(() => [...lockedChips, ...queryChips], [lockedChips, queryChips])
  const freeText: string = search?.parsed.freeText ?? query.trim()
  const facets = search?.facets
  const results = useMemo(() => search?.results.map(r => r.asset) ?? [], [search])
  const hasFacets = useMemo(() => !!facets && hasAnyFacet(facets), [facets])
  const hasActiveScope = Boolean(query.trim() || allChips.length > 0)
  const topResults = hasActiveScope ? results.slice(0, RESULT_PREVIEW_LIMIT) : []
  const totalCount = hasActiveScope ? results.length : 0

  const suggestions: Suggestion[] = useMemo(() => {
    if (!freeText) return []
    return getSuggestions(freeText, 5, allChips.map(c => c.kind))
  }, [freeText, allChips])

  useEffect(() => { setHighlight(0) }, [results.length])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (suggestions.length > 0 && !suppressSuggestions) return
      if (topResults.length === 0) {
        if (e.key === 'Enter' && (query.trim() || lockedChips.length > 0)) {
          e.preventDefault()
          handleViewAll()
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight(h => (h + 1) % topResults.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight(h => (h - 1 + topResults.length) % topResults.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (topResults[highlight]) openAsset(topResults[highlight])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, suggestions.length, suppressSuggestions, topResults, highlight, query, lockedChips.length])

  // === Handlers ===

  const handleDismissChip = useCallback((chip: ParsedChip) => {
    if (lockedChips.some(c => c.source === chip.source)) {
      setLockedChips(prev => prev.filter(c => c.source !== chip.source))
    } else {
      setQuery(prev => removeChipFromQuery(prev, chip))
    }
  }, [lockedChips])

  const handlePinFacet = useCallback((canonical: string) => {
    setQuery(prev => addPhraseToQuery(prev, canonical))
  }, [])

  const handleSelectSuggestion = useCallback((s: Suggestion) => {
    setQuery(prev => {
      return replaceTrailingFreeText(prev, freeText, s.canonical)
    })
    inputRef.current?.focus()
  }, [freeText])

  const handleRequestAccess = useCallback((asset: Asset) => {
    requestAccess(asset.id, { id: asset.id, type: 'asset', domainId: asset.department })
  }, [requestAccess])

  const openAsset = useCallback((asset: Asset) => {
    if (visibilityByAssetId.get(asset.id) === 'discoverable') {
      handleRequestAccess(asset)
      return
    }
    router.push(`/nextgen/assets/${asset.id}`)
    close()
  }, [visibilityByAssetId, handleRequestAccess, router, close])

  const handleViewAll = useCallback(() => {
    const parts = [
      ...lockedChips.map(c => c.source),
      query.trim(),
    ].filter(Boolean)
    const q = parts.join(' ')
    router.push(q ? `/nextgen/search?q=${encodeURIComponent(q)}` : '/nextgen/search')
    close()
  }, [lockedChips, query, router, close])

  return (
    <Modal open={isOpen} onOpenChange={(o) => { if (!o) close() }} width={720}>
      <div className="flex flex-col min-h-0">
        {/* Input row */}
        <div className="p-4 border-b border-border-subtle dark:border-border-inverse-subtle">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-dim pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSuppressSuggestions(false) }}
              onBlur={() => { setSuppressSuggestions(true); setInputFocused(false) }}
              onFocus={() => { setSuppressSuggestions(false); setInputFocused(true) }}
              placeholder="Search — characters, episodes, scenes…"
              className="w-full h-10 pl-9 pr-16 rounded-md bg-surface-flat ring-1 ring-inset ring-border-dim text-body-0-regular text-foreground placeholder:text-foreground-dim transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-border-system-focus"
            />
            {!query && !inputFocused && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-px px-1.5 h-5 rounded border border-border-dim text-[10px] leading-none text-foreground-subtle pointer-events-none select-none">
                ⌘K
              </kbd>
            )}
            <SearchSuggestions
              suggestions={suggestions}
              open={suggestions.length > 0 && !suppressSuggestions}
              onSelect={handleSelectSuggestion}
              onDismiss={() => setSuppressSuggestions(true)}
              inputRef={inputRef}
            />
          </div>

          {/* Scope strip — locked chips + query chips + dimension popovers */}
          {(allChips.length > 0 || hasFacets) && facets && (
            <div className="pt-3">
              <ScopeStrip
                chips={allChips}
                facets={facets}
                onDismissChip={handleDismissChip}
                onPinFacet={handlePinFacet}
              />
            </div>
          )}
        </div>

        {/* Result preview */}
        <div className="max-h-96 overflow-auto p-2">
          {topResults.length > 0 ? (
            <>
              <div className="px-2 py-2 text-label-0-regular text-foreground-subtle">
                Top results
              </div>
              {topResults.map((asset, i) => (
                <ResultRow
                  key={asset.id}
                  asset={asset}
                  highlighted={i === highlight}
                  restricted={visibilityByAssetId.get(asset.id) === 'discoverable'}
                  onClick={() => openAsset(asset)}
                  onMouseEnter={() => setHighlight(i)}
                />
              ))}
            </>
          ) : query.trim() ? (
            <div className="px-3 py-8 text-center text-body-0-regular text-foreground-subtle">
              No results matching this scope
            </div>
          ) : (
            <div className="px-3 py-8 text-center text-body-0-regular text-foreground-subtle">
              Type to search, or pick a scope above
            </div>
          )}
        </div>

        {/* Footer */}
        {hasActiveScope && (
          <div className="border-t border-border-subtle dark:border-border-inverse-subtle p-2">
            <button
              type="button"
              onClick={handleViewAll}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md',
                'text-body-0-regular text-foreground',
                'hover:bg-surface-highlight focus-visible:outline-none focus-visible:bg-surface-highlight',
              )}
            >
              <span>
                View all {totalCount} {totalCount === 1 ? 'result' : 'results'}
              </span>
              <ArrowRight className="w-4 h-4 text-foreground-dim" />
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

// === Result row ===

function ResultRow({
  asset,
  highlighted,
  restricted,
  onClick,
  onMouseEnter,
}: {
  asset: Asset
  highlighted: boolean
  restricted: boolean
  onClick: () => void
  onMouseEnter: () => void
}) {
  const subtitle = [asset.mediaAssetType, asset.episode]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      onMouseEnter={onMouseEnter}
      className={cn(
        'w-full flex items-center gap-3 px-2 py-2 rounded-md text-left',
        highlighted ? 'bg-surface-highlight' : 'hover:bg-surface-highlight',
      )}
    >
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick() }}
        className="min-w-0 flex flex-1 items-center gap-3 text-left focus-visible:outline-none"
      >
        <div className="relative w-10 h-10 flex-shrink-0 rounded bg-surface-selected-subtle overflow-hidden">
          {asset.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.thumbnail}
              alt=""
              className={cn('w-full h-full object-cover', restricted && 'blur-sm scale-110 opacity-60')}
            />
          )}
          {restricted && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-overlay">
              <EyeOff className="w-4 h-4 text-foreground-inverse dark:text-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-body-0-regular text-foreground">{asset.name}</div>
          {subtitle && (
            <div className="truncate text-label-0-regular text-foreground-subtle">{subtitle}</div>
          )}
        </div>
      </button>
      {restricted && (
        <Button
          type="button"
          variant="secondary"
          compact
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClick()
          }}
        >
          Request access
        </Button>
      )}
    </div>
  )
}

function hasAnyFacet(facets: NonNullable<ReturnType<typeof executeSearch>['facets']>) {
  return (
    facets.character.length > 0
    || facets.episode.length > 0
    || facets.scene.length > 0
    || facets.location.length > 0
    || facets.stage.length > 0
    || facets.department.length > 0
    || facets.mediaAssetType.length > 0
  )
}
