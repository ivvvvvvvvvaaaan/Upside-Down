'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { ChevronRight, ChevronLeft, Check, Sparkles, MessageCircle, Film } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Suggestion, FacetSet, ParsedChip } from '@/lib/search'
import { KIND_DISPLAY } from '@/lib/search'

export interface SearchSuggestionsProps {
  suggestions: Suggestion[]
  open: boolean
  /** Called for text-search mode picks — replaces trailing free text. */
  onSelect: (s: Suggestion) => void
  /** Called when Escape is pressed and we have nothing to go back to. */
  onDismiss: () => void
  inputRef: React.RefObject<HTMLInputElement>
  /** True when no free text is typed — triggers browse-by-category mode. */
  browseMode?: boolean
  /** Facet data to populate drill-down item lists. */
  facets?: FacetSet | null
  /** Currently pinned chips — drives the checkbox checked state in drill mode. */
  activeChips?: ParsedChip[]
  /** Pin a canonical phrase directly (addPhraseToQuery), used for drill-mode selection. */
  onPinFacet?: (canonical: string) => void
  /** Remove an active chip, used for drill-mode deselection. */
  onDeselect?: (chip: ParsedChip) => void
  /** Controlled drill kind — kind string of the category currently drilled into. */
  drillKind?: string | null
  /** Called when the user navigates into or out of a category drill. */
  onDrillKindChange?: (kind: string | null) => void
  /** Left offset in px from the chips wrapper left edge — positions dropdown under the clicked chip. */
  leftOffset?: number
  /** Current free text in the input — drives the "Search for: X" semantic row. */
  freeText?: string
  /** Called when the user selects the semantic search row. */
  onSemanticSearch?: (text: string) => void
  /** Text being typed inside a direct-drill text input (e.g. Dialogue). */
  directDrillText?: string
  /** Called as user types inside the direct-drill panel. */
  onDirectDrillTextChange?: (text: string) => void
  /** Called when user confirms the direct-drill (Enter). */
  onDirectDrillConfirm?: (direct: string, text: string) => void
}

type BrowseCategory = {
  kind: Suggestion['kind']
  label: string
  wildcardLabel?: string
  wildcardCanonical?: string
  /** 'total' sums asset counts across buckets (default); 'buckets' shows number of distinct values */
  countMode?: 'total' | 'buckets'
  /** When set, clicking pins this canonical phrase directly instead of drilling into a sub-list. */
  direct?: string
  /** Optional icon shown to the left of the label. */
  icon?: React.ComponentType<{ className?: string }>
}

const BROWSE_CATEGORIES: BrowseCategory[] = [
  { kind: 'flag',           label: 'Dialogue',       direct: 'dialogue', icon: MessageCircle },
  { kind: 'flag',           label: 'Visual',         direct: 'visual',   icon: Film },
  { kind: 'character',      label: 'Characters',    wildcardLabel: 'All characters',    wildcardCanonical: 'all characters' },
  { kind: 'scene',          label: 'Scenes',         wildcardLabel: 'All scenes',        wildcardCanonical: 'all scenes' },
  { kind: 'location',       label: 'Locations',      wildcardLabel: 'All locations',     wildcardCanonical: 'all locations' },
  { kind: 'episode',        label: 'Episodes',       wildcardLabel: 'All episodes',      wildcardCanonical: 'all episodes' },
  { kind: 'shootingDay',    label: 'Shooting Days',  wildcardLabel: 'All shooting days', wildcardCanonical: 'all shooting days' },
  { kind: 'stage',          label: 'Cuts',           wildcardLabel: 'All cuts',          wildcardCanonical: 'all cuts' },
  { kind: 'department',     label: 'Departments',    countMode: 'buckets' },
  { kind: 'mediaAssetType', label: 'Asset Types' },
]

// Maps category kind → the 'value' string used on a wildcard ParsedChip
const KIND_TO_WILDCARD: Partial<Record<string, string>> = {
  character:   'has-character',
  scene:       'has-scene',
  location:    'has-location',
  episode:     'has-episode',
  stage:       'has-stage',
  shootingDay: 'has-shooting-day',
}

function getDrillItems(cat: BrowseCategory, facets?: FacetSet | null): Suggestion[] {
  const items: Suggestion[] = []
  if (cat.wildcardLabel && cat.wildcardCanonical) {
    items.push({ kind: 'wildcard', label: cat.wildcardLabel, canonical: cat.wildcardCanonical })
  }
  const buckets = facets?.[cat.kind as keyof FacetSet]
  if (Array.isArray(buckets)) {
    for (const b of buckets) {
      items.push({ kind: cat.kind, label: String(b.label), canonical: String(b.label) })
    }
  }
  return items
}

// Lookup from wildcard canonical ("all characters") → wildcard chip value ("has-character")
const CANONICAL_TO_WILDCARD_VALUE: Record<string, string> = {
  'all characters':    'has-character',
  'all scenes':        'has-scene',
  'all locations':     'has-location',
  'all episodes':      'has-episode',
  'all cuts':          'has-stage',
  'all shooting days': 'has-shooting-day',
}

function findActiveChip(s: Suggestion, chips: ParsedChip[]): ParsedChip | undefined {
  if (s.kind === 'wildcard') {
    const wcValue = CANONICAL_TO_WILDCARD_VALUE[s.canonical.toLowerCase()]
    return chips.find(c =>
      c.kind === 'wildcard' && (
        (wcValue && String(c.value) === wcValue) ||
        c.label.toLowerCase() === s.label.toLowerCase()
      )
    )
  }
  return chips.find(c =>
    c.kind === s.kind &&
    c.label.toLowerCase() === s.label.toLowerCase()
  )
}

type NavItem =
  | { _t: 'category'; cat: BrowseCategory }
  | { _t: 'suggestion'; s: Suggestion; flatIdx: number }
  | { _t: 'semantic'; text: string }

type Group = { kind: string; label: string; items: Suggestion[] }

function groupSuggestions(suggestions: Suggestion[]): Group[] {
  const map = new Map<string, Group>()
  const order: string[] = []
  for (const s of suggestions) {
    if (!map.has(s.kind)) {
      map.set(s.kind, { kind: s.kind, label: KIND_DISPLAY[s.kind] ?? s.kind, items: [] })
      order.push(s.kind)
    }
    map.get(s.kind)!.items.push(s)
  }
  return order.map(k => map.get(k)!)
}

export function SearchSuggestions({
  suggestions,
  open,
  onSelect,
  onDismiss,
  inputRef,
  browseMode = false,
  facets,
  activeChips = [],
  onPinFacet,
  onDeselect,
  drillKind,
  onDrillKindChange,
  leftOffset,
  freeText,
  onSemanticSearch,
  directDrillText = '',
  onDirectDrillTextChange,
  onDirectDrillConfirm,
}: SearchSuggestionsProps) {
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const drillInputRef = useRef<HTMLInputElement>(null)

  // Match by kind OR by direct value so Dialogue/Visual (both kind='flag') resolve correctly.
  // 'semantic' is a synthetic direct drill (free-text semantic search) with no browse category.
  const drillCat = useMemo<BrowseCategory | null>(() => {
    if (!drillKind) return null
    if (drillKind === 'semantic') {
      return { kind: 'semantic' as Suggestion['kind'], label: 'Semantic', direct: 'semantic', icon: Sparkles }
    }
    return BROWSE_CATEGORIES.find(c => c.kind === drillKind || c.direct === drillKind) ?? null
  }, [drillKind])

  // Auto-focus the text input when entering a direct drill
  useEffect(() => {
    if (drillCat?.direct) {
      setTimeout(() => drillInputRef.current?.focus(), 0)
    }
  }, [drillCat?.direct])

  // Reset highlight when closed or item list changes
  useEffect(() => { if (!open) setHighlight(0) }, [open])
  useEffect(() => { setHighlight(0) }, [browseMode, drillKind, suggestions])

  // ── Navigation items ────────────────────────────────────────────────────────
  const navItems = useMemo<NavItem[]>(() => {
    // Direct drill has its own text input — no nav items needed
    if (drillCat?.direct) return []
    if (!browseMode) {
      // Text-search mode — flatten grouped suggestions, then append semantic row
      let fi = 0
      const items: NavItem[] = groupSuggestions(suggestions).flatMap(g =>
        g.items.map(s => ({ _t: 'suggestion' as const, s, flatIdx: fi++ }))
      )
      if (freeText && freeText.length >= 1 && onSemanticSearch) {
        items.push({ _t: 'semantic' as const, text: freeText })
      }
      return items
    }
    if (drillCat) {
      return getDrillItems(drillCat, facets).map((s, i) => ({ _t: 'suggestion' as const, s, flatIdx: i }))
    }
    // Browse categories — filter to ones with facet data (if available); always include direct-toggle entries
    const cats = facets
      ? BROWSE_CATEGORIES.filter(c => {
          if (c.direct) return true
          const buckets = facets[c.kind as keyof FacetSet]
          return Array.isArray(buckets) && buckets.length > 0
        })
      : BROWSE_CATEGORIES
    const items: NavItem[] = cats.map(cat => ({ _t: 'category' as const, cat }))
    if (onSemanticSearch) {
      items.unshift({ _t: 'semantic' as const, text: '' })
    }
    return items
  }, [browseMode, drillCat, facets, suggestions, freeText, onSemanticSearch])

  // ── Keyboard handler ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const input = inputRef.current
    if (!input) return

    const onKey = (e: KeyboardEvent) => {
      if (navItems.length === 0) {
        if (e.key === 'Escape') onDismiss()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight(h => (h + 1) % navItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight(h => (h - 1 + navItems.length) % navItems.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = navItems[highlight]
        if (item._t === 'semantic') {
          // With text, confirm it; in browse mode (no text), open the semantic drill.
          if (item.text) onSemanticSearch?.(item.text)
          else onDrillKindChange?.('semantic')
        } else if (item._t === 'category' && item.cat.direct) {
          onDrillKindChange?.(item.cat.direct)
        } else if (item._t === 'category') {
          onDrillKindChange?.(item.cat.kind)
        } else if (item._t === 'suggestion' && drillCat) {
          // Drill mode: toggle selection, stay open
          const chip = findActiveChip(item.s, activeChips)
          if (chip) onDeselect?.(chip)
          else onPinFacet?.(item.s.canonical)
        } else if (item._t === 'suggestion') {
          onSelect(item.s)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (drillCat) onDrillKindChange?.(null)
        else onDismiss()
      } else if (e.key === 'ArrowLeft' && drillCat) {
        e.preventDefault()
        onDrillKindChange?.(null)
      }
    }

    input.addEventListener('keydown', onKey)
    return () => input.removeEventListener('keydown', onKey)
  }, [open, navItems, highlight, drillCat, activeChips, onSelect, onDismiss, onPinFacet, onDeselect, inputRef])

  // Scroll highlighted item into view
  useEffect(() => {
    containerRef.current?.querySelector<HTMLElement>(`[data-item="${highlight}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  if (!open) return null
  if (!drillCat?.direct && !browseMode && navItems.length === 0) return null
  if (!drillCat?.direct && browseMode && !drillCat && navItems.length === 0) return null

  return (
    <div
      ref={containerRef}
      style={{ left: leftOffset ?? 0 }}
      className={cn(
        'absolute top-full mt-1 z-40 w-72',
        'rounded-md bg-surface-low shadow-mid',
        'ring-1 ring-inset ring-border-subtle dark:ring-border-inverse-subtle',
        'overflow-hidden',
      )}
      role="listbox"
    >
      <div className="max-h-72 overflow-auto py-1">
        {drillCat?.direct ? (
          // ── Direct drill: text input panel ──────────────────────────────────
          <>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onDrillKindChange?.(null); onDirectDrillTextChange?.('') }}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-label-0-bold text-foreground-dim hover:text-foreground hover:bg-surface-highlight transition-colors focus-visible:outline-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {drillCat.label}
            </button>
            <div className="h-px bg-border-dim" />
            <div className="px-3 py-2.5">
              <input
                ref={drillInputRef}
                type="text"
                value={directDrillText}
                onChange={(e) => onDirectDrillTextChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onDirectDrillConfirm?.(drillCat.direct!, directDrillText)
                  } else if (e.key === 'Escape' || (e.key === 'ArrowLeft' && !directDrillText)) {
                    e.preventDefault()
                    onDrillKindChange?.(null)
                    onDirectDrillTextChange?.('')
                    inputRef.current?.focus()
                  }
                }}
                onBlur={(e) => {
                  // Cancel drill if focus leaves to neither main input nor the container
                  if (e.relatedTarget !== inputRef.current && !containerRef.current?.contains(e.relatedTarget as Node)) {
                    onDrillKindChange?.(null)
                    onDirectDrillTextChange?.('')
                  }
                }}
                placeholder={`Type ${drillCat.label.toLowerCase()} keywords…`}
                className="w-full bg-transparent text-body-1-regular text-foreground placeholder:text-foreground-dim focus:outline-none"
              />
              <p className="text-label-0-regular text-foreground-subtle mt-1.5">Press Enter to confirm</p>
            </div>
          </>
        ) : browseMode ? (
          drillCat ? (
            // ── Drill-down: multi-select list ──────────────────────────────────
            <>
              {/* Back header */}
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onDrillKindChange?.(null); setHighlight(0) }}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-label-0-bold text-foreground-dim hover:text-foreground hover:bg-surface-highlight transition-colors focus-visible:outline-none"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {drillCat.label}
              </button>
              <div className="h-px bg-border-dim mb-1" />

              {navItems.map((item, i) => {
                if (item._t !== 'suggestion') return null
                const isHighlighted = i === highlight
                const activeChip = findActiveChip(item.s, activeChips)
                const isChecked = !!activeChip
                const buckets = facets?.[item.s.kind as keyof FacetSet]
                const bucket = Array.isArray(buckets)
                  ? buckets.find(b => String(b.label).toLowerCase() === item.s.label.toLowerCase())
                  : undefined
                const count = bucket?.count

                return (
                  <div
                    key={`${item.s.kind}-${item.s.canonical}`}
                    data-item={i}
                    role="option"
                    aria-selected={isChecked}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (isChecked) onDeselect?.(activeChip!)
                      else onPinFacet?.(item.s.canonical)
                      // Stay in drill mode — don't dismiss
                    }}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none',
                      'text-body-1-regular text-foreground',
                      isHighlighted ? 'bg-surface-highlight' : '',
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      'w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors',
                      isChecked
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-border-dim bg-surface-flat',
                    )}>
                      {isChecked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className="flex-1 truncate">{item.s.label}</span>
                    {count !== undefined && (
                      <span className="text-label-0-regular text-foreground-subtle tabular-nums shrink-0">{count}</span>
                    )}
                  </div>
                )
              })}
            </>
          ) : (
            // ── Browse: top-level category list ───────────────────────────────
            <>
              <div className="px-3 pt-2 pb-1 text-label-0-regular text-foreground-subtle select-none">Filters</div>
              {navItems.map((item, i) => {
              const isHighlighted = i === highlight
              const prevItem = navItems[i - 1]
              const isQuickFilter = (n: NavItem) => n._t === 'semantic' || (n._t === 'category' && !!n.cat.direct)
              const showDivider = i > 0 && !isQuickFilter(item) && isQuickFilter(prevItem)
              const divider = showDivider ? <div className="h-px bg-border-dim mx-3 my-1" /> : null

              // ── Semantic Search row ────────────────────────────────────────────
              if (item._t === 'semantic') {
                // With existing free text, confirm it directly. In browse mode (no text),
                // open the semantic drill so the user can type their query, like Dialogue/Visual.
                const handleClick = item.text
                  ? (e: React.MouseEvent) => { e.preventDefault(); onSemanticSearch?.(item.text) }
                  : (e: React.MouseEvent) => { e.preventDefault(); onDrillKindChange?.('semantic') }
                return (
                  <div
                    key="semantic"
                    data-item={i}
                    role="option"
                    aria-selected={false}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={handleClick}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 cursor-pointer select-none',
                      'text-body-1-regular text-foreground',
                      isHighlighted ? 'bg-surface-highlight' : '',
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Semantic Search</span>
                  </div>
                )
              }

              if (item._t !== 'category') return null

              // ── Direct-toggle row (Dialogue, Visual) ──────────────────────────
              if (item.cat.direct) {
                const activeChip = findActiveChip(
                  { kind: item.cat.kind, label: item.cat.label, canonical: item.cat.direct },
                  activeChips,
                )
                const isActive = !!activeChip
                const Icon = item.cat.icon
                return (
                  <React.Fragment key={item.cat.kind}>
                    {divider}
                    <div
                      data-item={i}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setHighlight(i)}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        if (isActive) onDeselect?.(activeChip!)
                        else onDrillKindChange?.(item.cat.direct!)
                      }}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 cursor-pointer select-none',
                        'text-body-1-regular text-foreground',
                        isHighlighted ? 'bg-surface-highlight' : '',
                      )}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                      <span>{item.cat.label}</span>
                    </div>
                  </React.Fragment>
                )
              }

              // ── Drill-down category row ────────────────────────────────────────
              const buckets = facets?.[item.cat.kind as keyof FacetSet]
              const totalCount = Array.isArray(buckets)
                ? item.cat.countMode === 'buckets'
                  ? buckets.length
                  : buckets.reduce((s, b) => s + (b.count ?? 0), 0)
                : undefined

              return (
                <React.Fragment key={item.cat.kind}>
                  {divider}
                  <div
                    data-item={i}
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => { e.preventDefault(); onDrillKindChange?.(item.cat.kind); setHighlight(0) }}
                    className={cn(
                      'flex items-center justify-between gap-3 px-3 py-2 cursor-pointer select-none',
                      'text-body-1-regular text-foreground',
                      isHighlighted ? 'bg-surface-highlight' : '',
                    )}
                  >
                    <span>{item.cat.label}</span>
                    <div className="flex items-center gap-2 text-foreground-subtle">
                      {totalCount !== undefined && (
                        <span className="text-label-0-regular tabular-nums">{totalCount}</span>
                      )}
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
            </>
          )
        ) : (
          // ── Text-search: grouped suggestions ────────────────────────────────
          (() => {
            const groups = groupSuggestions(suggestions)
            let baseIdx = 0
            const semanticIdx = navItems.findIndex(n => n._t === 'semantic')
            return (
              <>
                {groups.map(group => {
                  const groupBase = baseIdx
                  baseIdx += group.items.length
                  return (
                    <div key={group.kind}>
                      <div className="px-3 pt-2 pb-1 text-label-0-regular text-foreground-subtle select-none">
                        {group.label}
                      </div>
                      {group.items.map((s, i) => {
                        const fi = groupBase + i
                        return (
                          <div
                            key={`${s.kind}-${s.canonical}`}
                            data-item={fi}
                            role="option"
                            aria-selected={fi === highlight}
                            onMouseEnter={() => setHighlight(fi)}
                            onMouseDown={(e) => { e.preventDefault(); onSelect(s) }}
                            className={cn(
                              'flex items-center px-3 py-1.5 cursor-pointer',
                              'text-body-1-regular text-foreground',
                              fi === highlight ? 'bg-surface-highlight' : '',
                            )}
                          >
                            <span className="truncate">{s.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
                {semanticIdx !== -1 && freeText && (
                  <div
                    data-item={semanticIdx}
                    role="option"
                    aria-selected={semanticIdx === highlight}
                    onMouseEnter={() => setHighlight(semanticIdx)}
                    onMouseDown={(e) => { e.preventDefault(); onSemanticSearch?.(freeText) }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 cursor-pointer select-none',
                      'text-body-1-regular text-foreground-dim',
                      semanticIdx === highlight ? 'bg-surface-highlight text-foreground' : '',
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Search for: <span className="text-foreground font-medium">&ldquo;{freeText}&rdquo;</span></span>
                  </div>
                )}
              </>
            )
          })()
        )}
      </div>
    </div>
  )
}
