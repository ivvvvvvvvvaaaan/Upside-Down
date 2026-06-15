'use client'

import { useRef, useState } from 'react'
import { SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'
import type { ParsedChip } from '@/lib/search'
import type { FacetBucket, FacetSet } from '@/lib/search'

type Dimension = {
  kind: ParsedChip['kind']
  label: string
  allBuckets: FacetBucket<string>[]
  remainingBuckets: FacetBucket<string>[]
  activeChips: ParsedChip[]
  wildcardChip?: ParsedChip
  wildcard?: string
  canAddMore: boolean
}

const MULTI_VALUE_KINDS = new Set<ParsedChip['kind']>([
  'character', 'scene', 'location', 'episode', 'stage', 'shootingDay',
])

const WILDCARD_DIMENSION: Partial<Record<string, ParsedChip['kind']>> = {
  'has-character': 'character',
  'has-scene': 'scene',
  'has-location': 'location',
  'has-episode': 'episode',
  'has-stage': 'stage',
  'has-shooting-day': 'shootingDay',
}

const KIND_LABEL: Record<ParsedChip['kind'], string> = {
  character: 'Character',
  scene: 'Scene',
  location: 'Location',
  episode: 'Episode',
  shootingDay: 'Day',
  type: 'Format',
  mediaAssetType: 'Type',
  department: 'Department',
  stage: 'Cut',
  camera: 'Camera',
  take: 'Take',
  flag: 'Tag',
  wildcard: 'Scope',
}

export interface SearchInputConfig {
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  onCompositionStart: () => void
  onCompositionEnd: (value: string) => void
  inputRef: React.RefObject<HTMLInputElement>
  placeholder?: string
  onSubmit?: () => void
  suggestionsContent?: React.ReactNode
}

export interface FilterBarProps {
  chips: ParsedChip[]
  facets?: FacetSet
  onDismissChip: (chip: ParsedChip) => void
  onPinFacet: (canonicalText: string) => void
  onClearAll?: () => void
  semanticText?: string
  onDismissSemanticText?: () => void
  searchInput?: SearchInputConfig
  /** Called when a chip body (not the X) is clicked — provides the drill kind and left offset (px from chips area left edge) */
  onChipBodyClick?: (drillKind: string, leftPx: number) => void
  className?: string
}

const EMPTY_FACETS: FacetSet = {
  character: [], scene: [], location: [], episode: [],
  stage: [], department: [], mediaAssetType: [], type: [], shootingDay: [],
}

type ChipGroup = { kind: ParsedChip['kind']; chips: ParsedChip[]; drillKind: string }

function buildChipGroups(chips: ParsedChip[]): ChipGroup[] {
  const groups: ChipGroup[] = []
  const seen = new Set<ParsedChip['kind']>()
  for (const chip of chips) {
    if (chip.kind === 'wildcard') {
      groups.push({
        kind: 'wildcard',
        chips: [chip],
        drillKind: WILDCARD_DIMENSION[String(chip.value)] ?? chip.kind,
      })
    } else if (!seen.has(chip.kind)) {
      seen.add(chip.kind)
      groups.push({
        kind: chip.kind,
        chips: chips.filter(c => c.kind === chip.kind),
        drillKind: chip.kind,
      })
    }
  }
  return groups
}

export function FilterBar({
  chips,
  facets,
  onDismissChip,
  onPinFacet,
  onClearAll,
  semanticText,
  onDismissSemanticText,
  searchInput,
  onChipBodyClick,
  className,
}: FilterBarProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const chipsWrapperRef = useRef<HTMLDivElement>(null)
  const f = facets ?? EMPTY_FACETS

  const chipGroups = buildChipGroups(chips)

  // Group chips by kind, wildcards separately
  const chipsByKind = new Map<ParsedChip['kind'], ParsedChip[]>()
  const wildcardByDimKind = new Map<ParsedChip['kind'], ParsedChip>()
  for (const chip of chips) {
    if (chip.kind === 'wildcard') {
      const dimKind = WILDCARD_DIMENSION[chip.value]
      if (dimKind) wildcardByDimKind.set(dimKind, chip)
    } else {
      if (!chipsByKind.has(chip.kind)) chipsByKind.set(chip.kind, [])
      chipsByKind.get(chip.kind)!.push(chip)
    }
  }

  const rawDimensions = [
    { kind: 'character' as const, label: 'Character', buckets: f.character, wildcard: 'all characters' },
    { kind: 'episode' as const, label: 'Episode', buckets: f.episode, wildcard: 'all episodes' },
    { kind: 'shootingDay' as const, label: 'Day', buckets: f.shootingDay as FacetBucket<string>[], wildcard: 'all shooting days' },
    { kind: 'scene' as const, label: 'Scene', buckets: f.scene, wildcard: 'all scenes' },
    { kind: 'location' as const, label: 'Location', buckets: f.location, wildcard: 'all locations' },
    { kind: 'stage' as const, label: 'Cut', buckets: f.stage as FacetBucket<string>[], wildcard: 'all cuts' },
    { kind: 'department' as const, label: 'Department', buckets: f.department as FacetBucket<string>[] },
    { kind: 'mediaAssetType' as const, label: 'Type', buckets: f.mediaAssetType as FacetBucket<string>[] },
  ]

  const dimensions: Dimension[] = rawDimensions.map(d => {
    const activeChips = chipsByKind.get(d.kind) ?? []
    const wildcardChip = wildcardByDimKind.get(d.kind)
    const pinnedValues = new Set(activeChips.map(c => String(c.value).toLowerCase()))
    const remainingBuckets = d.buckets.filter(b => !pinnedValues.has(b.value.toLowerCase()))
    const isWildcardActive = !!wildcardChip
    const canAddMore = !isWildcardActive && (
      MULTI_VALUE_KINDS.has(d.kind)
        ? remainingBuckets.length > 0
        : activeChips.length === 0 && remainingBuckets.length > 0
    )
    return { kind: d.kind, label: d.label, allBuckets: d.buckets, remainingBuckets, activeChips, wildcardChip, wildcard: d.wildcard, canAddMore }
  })

  const addableDimensions = dimensions.filter(d => d.canAddMore)
  const hasSemanticText = !!semanticText?.trim()
  const anyActive = chips.length > 0 || hasSemanticText
  const hasFiltersToAdd = addableDimensions.length > 0

  // Without searchInput, hide when there's nothing to show
  if (!searchInput && dimensions.every(d => d.allBuckets.length === 0) && !hasSemanticText) return null

  return (
    <div className={cn(
      'flex items-center gap-1 pl-1.5 pr-1.5 min-h-10 py-1',
      'rounded ring-1 ring-inset ring-border-dim bg-surface-flat',
      'focus-within:ring-2 focus-within:ring-border-system-focus',
      className,
    )}>
      {/* Filter icon — opens add-filter panel */}
      <Popover open={panelOpen} onOpenChange={setPanelOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Add filter"
            disabled={!hasFiltersToAdd}
            className={cn(
              'flex items-center justify-center w-7 h-7 shrink-0 rounded',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus',
              hasFiltersToAdd
                ? 'text-foreground-dim hover:text-foreground hover:bg-surface-highlight cursor-pointer'
                : 'text-foreground-subtle cursor-default',
              panelOpen && 'text-foreground bg-surface-highlight',
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0 w-72">
          <AddFilterPanel dimensions={addableDimensions} onPinFacet={onPinFacet} />
        </PopoverContent>
      </Popover>

      {/* Separator */}
      <div className="w-px h-5 shrink-0 bg-border-dim" />

      {/* Chips + inline search input */}
      <div ref={chipsWrapperRef} className="relative flex-1 min-w-0 flex flex-wrap items-center gap-1 px-0.5">
        {hasSemanticText && (
          <SemanticFilterChip text={semanticText!} onDismiss={onDismissSemanticText} />
        )}
        {chipGroups.map((group, i) => (
          <FilterChip
            key={`${group.drillKind}-${i}`}
            kind={group.kind}
            chips={group.chips}
            onDismiss={() => group.chips.forEach(c => onDismissChip(c))}
            onBodyClick={onChipBodyClick ? (rect) => {
              const wrapperRect = chipsWrapperRef.current?.getBoundingClientRect()
              const leftPx = wrapperRect ? rect.left - wrapperRect.left : 0
              onChipBodyClick(group.drillKind, leftPx)
            } : undefined}
          />
        ))}
        {searchInput && (
          <div className="flex-1 min-w-[140px]">
            <input
              ref={searchInput.inputRef}
              type="text"
              value={searchInput.value}
              placeholder={searchInput.placeholder ?? 'Type to filter…'}
              onChange={(e) => searchInput.onChange(e.target.value)}
              onFocus={searchInput.onFocus}
              onBlur={searchInput.onBlur}
              onCompositionStart={searchInput.onCompositionStart}
              onCompositionEnd={(e) => searchInput.onCompositionEnd(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') searchInput.onSubmit?.() }}
              className="w-full h-8 bg-transparent text-body-0-regular text-foreground placeholder:text-foreground-dim focus:outline-none"
            />
          </div>
        )}
        {searchInput?.suggestionsContent}
        {!searchInput && !anyActive && (
          <span className="text-label-0-regular text-foreground-dim select-none px-1">Add filters</span>
        )}
      </div>

      {/* Reset — only when filters are active */}
      {anyActive && onClearAll && (
        <>
          <div className="w-px h-5 shrink-0 bg-border-dim" />
          <button
            type="button"
            onClick={onClearAll}
            className={cn(
              'shrink-0 px-2 h-7 rounded',
              'text-label-0-bold text-foreground-dim hover:text-foreground transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus',
            )}
          >
            Reset
          </button>
        </>
      )}
    </div>
  )
}

// === Individual filter chip ===

function FilterChip({ kind, chips, onDismiss, onBodyClick }: {
  kind: ParsedChip['kind']
  chips: ParsedChip[]
  onDismiss: () => void
  onBodyClick?: (rect: DOMRect) => void
}) {
  const kindLabel = kind !== 'wildcard' ? KIND_LABEL[kind] : undefined
  const valueText = chips.map(c => c.label).join(', ')

  return (
    <span className="inline-flex items-center shrink-0 rounded bg-gray-600 hover:bg-gray-500 dark:bg-gray-400 dark:hover:bg-gray-300 text-foreground-inverse dark:text-foreground transition-colors">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onBodyClick?.(e.currentTarget.getBoundingClientRect()) }}
        className={cn(
          'inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-l text-label-0-bold text-current whitespace-nowrap',
          onBodyClick
            ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus'
            : 'cursor-default',
        )}
      >
        {kindLabel && <span className="font-normal opacity-60">{kindLabel}:</span>}
        {valueText}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Remove ${kindLabel ? kindLabel + ': ' : ''}${valueText}`}
        className="inline-flex items-center justify-center size-4 mr-1 rounded text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus"
      >
        <X className="size-4" />
      </button>
    </span>
  )
}

// === Semantic (AI-inferred) chip ===

function SemanticFilterChip({ text, onDismiss }: { text: string; onDismiss?: () => void }) {
  return (
    <div className="inline-flex items-center shrink-0 h-7 rounded bg-gray-600 dark:bg-gray-400">
      <span className="pl-2 pr-1 flex items-center gap-1 text-label-0-bold text-foreground-inverse dark:text-foreground whitespace-nowrap">
        <Sparkles className="w-3 h-3 shrink-0 opacity-70" />
        {text}
      </span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Remove semantic filter "${text}"`}
          className="flex items-center justify-center w-6 h-full rounded-r text-foreground-inverse dark:text-foreground hover:bg-gray-500/40 transition-colors focus-visible:outline-none"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// === Add-filter panel ===

function AddFilterPanel({ dimensions, onPinFacet }: { dimensions: Dimension[]; onPinFacet: (canonical: string) => void }) {
  if (dimensions.length === 0) {
    return (
      <div className="px-3 py-4 text-label-0-regular text-foreground-subtle text-center">
        No more filters available
      </div>
    )
  }

  return (
    <div className="max-h-80 overflow-y-auto py-1">
      {dimensions.map(dim => (
        <div key={dim.kind}>
          <div className="px-3 pt-2 pb-1 text-label-0-regular text-foreground-subtle">{dim.label}</div>
          <ul>
            {dim.wildcard && (
              <li>
                <button
                  type="button"
                  onClick={() => onPinFacet(dim.wildcard!)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-body-0-regular text-foreground text-left hover:bg-surface-highlight focus-visible:outline-none focus-visible:bg-surface-highlight"
                >
                  <span>All {dim.label.toLowerCase()}s</span>
                  <span className="text-label-0-regular text-foreground-subtle tabular-nums">
                    {dim.remainingBuckets.reduce((s, b) => s + b.count, 0)}
                  </span>
                </button>
              </li>
            )}
            {dim.remainingBuckets.map(b => (
              <li key={`${dim.kind}-${b.value}`}>
                <button
                  type="button"
                  onClick={() => onPinFacet(b.label)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-body-0-regular text-foreground text-left hover:bg-surface-highlight focus-visible:outline-none focus-visible:bg-surface-highlight"
                >
                  <span className="truncate">{b.label}</span>
                  <span className="text-label-0-regular text-foreground-subtle tabular-nums">{b.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
