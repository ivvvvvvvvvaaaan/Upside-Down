'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
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
}

type BrowseCategory = {
  kind: Suggestion['kind']
  label: string
  wildcardLabel?: string
  wildcardCanonical?: string
}

const BROWSE_CATEGORIES: BrowseCategory[] = [
  { kind: 'character',      label: 'Characters',    wildcardLabel: 'All characters',    wildcardCanonical: 'all characters' },
  { kind: 'scene',          label: 'Scenes',         wildcardLabel: 'All scenes',        wildcardCanonical: 'all scenes' },
  { kind: 'location',       label: 'Locations',      wildcardLabel: 'All locations',     wildcardCanonical: 'all locations' },
  { kind: 'episode',        label: 'Episodes',       wildcardLabel: 'All episodes',      wildcardCanonical: 'all episodes' },
  { kind: 'shootingDay',    label: 'Shooting Days',  wildcardLabel: 'All shooting days', wildcardCanonical: 'all shooting days' },
  { kind: 'stage',          label: 'Cuts',           wildcardLabel: 'All cuts',          wildcardCanonical: 'all cuts' },
  { kind: 'department',     label: 'Departments' },
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
}: SearchSuggestionsProps) {
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Derive drillCat from controlled drillKind prop
  const drillCat = useMemo(
    () => (drillKind ? BROWSE_CATEGORIES.find(c => c.kind === drillKind) ?? null : null),
    [drillKind],
  )

  // Reset highlight when closed or item list changes
  useEffect(() => { if (!open) setHighlight(0) }, [open])
  useEffect(() => { setHighlight(0) }, [browseMode, drillKind, suggestions])

  // ── Navigation items ────────────────────────────────────────────────────────
  const navItems = useMemo<NavItem[]>(() => {
    if (!browseMode) {
      // Text-search mode — flatten grouped suggestions
      let fi = 0
      return groupSuggestions(suggestions).flatMap(g =>
        g.items.map(s => ({ _t: 'suggestion' as const, s, flatIdx: fi++ }))
      )
    }
    if (drillCat) {
      return getDrillItems(drillCat, facets).map((s, i) => ({ _t: 'suggestion' as const, s, flatIdx: i }))
    }
    // Browse categories — filter to ones with facet data (if available)
    const cats = facets
      ? BROWSE_CATEGORIES.filter(c => {
          const buckets = facets[c.kind as keyof FacetSet]
          return Array.isArray(buckets) && buckets.length > 0
        })
      : BROWSE_CATEGORIES
    return cats.map(cat => ({ _t: 'category' as const, cat }))
  }, [browseMode, drillCat, facets, suggestions])

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
        if (item._t === 'category') {
          onDrillKindChange?.(item.cat.kind)
        } else if (drillCat) {
          // Drill mode: toggle selection, stay open
          const chip = findActiveChip(item.s, activeChips)
          if (chip) onDeselect?.(chip)
          else onPinFacet?.(item.s.canonical)
        } else {
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
  if (!browseMode && suggestions.length === 0) return null
  if (browseMode && !drillCat && navItems.length === 0) return null

  return (
    <div
      ref={containerRef}
      style={{ left: leftOffset ?? 0 }}
      className={cn(
        'absolute top-full mt-1 z-40 w-72',
        'rounded-md bg-surface-2 shadow-mid',
        'ring-1 ring-inset ring-border-subtle dark:ring-border-inverse-subtle',
        'overflow-hidden',
      )}
      role="listbox"
    >
      <div className="max-h-72 overflow-auto py-1">
        {browseMode ? (
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
                if (item._t === 'category') return null
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
                      'text-body-0-regular text-foreground',
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
            navItems.map((item, i) => {
              if (item._t === 'suggestion') return null
              const isHighlighted = i === highlight
              const buckets = facets?.[item.cat.kind as keyof FacetSet]
              const totalCount = Array.isArray(buckets)
                ? buckets.reduce((s, b) => s + (b.count ?? 0), 0)
                : undefined

              return (
                <div
                  key={item.cat.kind}
                  data-item={i}
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => { e.preventDefault(); onDrillKindChange?.(item.cat.kind); setHighlight(0) }}
                  className={cn(
                    'flex items-center justify-between gap-3 px-3 py-2 cursor-pointer select-none',
                    'text-body-0-regular text-foreground',
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
              )
            })
          )
        ) : (
          // ── Text-search: grouped suggestions ────────────────────────────────
          (() => {
            const groups = groupSuggestions(suggestions)
            let baseIdx = 0
            return groups.map(group => {
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
                          'text-body-0-regular text-foreground',
                          fi === highlight ? 'bg-surface-highlight' : '',
                        )}
                      >
                        <span className="truncate">{s.label}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })
          })()
        )}
      </div>
    </div>
  )
}
