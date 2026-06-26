'use client'

import { useRef } from 'react'
import { Search, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ParsedChip } from '@/lib/search'
import type { FacetSet } from '@/lib/search'

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
  onPinFacet?: (canonicalText: string) => void
  onClearAll?: () => void
  /** Semantic searches (Dialogue/Visual/Semantic), each rendered as "{label}: {text}". */
  semanticChips?: SemanticChipSpec[]
  /** Remove a semantic chip by id. */
  onDismissSemanticChip?: (id: number) => void
  /** Click a semantic chip body to reopen its drill panel for editing. */
  onEditSemanticChip?: (id: number) => void
  searchInput?: SearchInputConfig
  /** Called when a chip body (not the X) is clicked — provides the drill kind and left offset (px from chips area left edge) */
  onChipBodyClick?: (drillKind: string, leftPx: number) => void
  /** In-progress chip shown while the user is typing inside a direct drill panel. */
  provisionalChip?: { label: string; text: string; icon?: React.ComponentType<{ className?: string }> }
  onDismissProvisionalChip?: () => void
  className?: string
}

const EMPTY_FACETS: FacetSet = {
  character: [], scene: [], location: [], episode: [],
  stage: [], department: [], mediaAssetType: [], type: [], shootingDay: [],
}

export type SemanticChipSpec = {
  id: number
  label: string
  text: string
  icon?: React.ComponentType<{ className?: string }>
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
    } else if (chip.kind === 'flag') {
      // Each flag chip gets its own pill (dialogue, visual, final, etc. are distinct modes)
      groups.push({ kind: 'flag', chips: [chip], drillKind: 'flag' })
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
  onClearAll,
  semanticChips,
  onDismissSemanticChip,
  onEditSemanticChip,
  searchInput,
  onChipBodyClick,
  provisionalChip,
  onDismissProvisionalChip,
  className,
}: FilterBarProps) {
  const chipsWrapperRef = useRef<HTMLDivElement>(null)
  // Preserves insertion order across structured groups + semantic chips: keys are
  // appended as they first appear and never reordered, so chips stay where added.
  const orderRef = useRef<string[]>([])

  const chipGroups = buildChipGroups(chips)
  const sems = semanticChips ?? []

  // Build a merged, insertion-ordered render list. A structured group keys off its
  // first chip's source (stable across re-parses); a semantic chip keys off its id.
  const groupKey = (g: ChipGroup) => `g:${g.drillKind}:${g.chips[0]?.source ?? ''}`
  const present = new Map<string, { _t: 'group'; g: ChipGroup } | { _t: 'sem'; s: SemanticChipSpec }>()
  for (const g of chipGroups) present.set(groupKey(g), { _t: 'group', g })
  for (const s of sems) present.set(`m:${s.id}`, { _t: 'sem', s })

  const kept = orderRef.current.filter(k => present.has(k))
  const known = new Set(kept)
  for (const k of Array.from(present.keys())) if (!known.has(k)) kept.push(k)
  orderRef.current = kept
  const orderedEntries = kept.map(k => present.get(k)!)

  const hasSemantic = sems.length > 0
  const anyActive = chips.length > 0 || hasSemantic

  // Without searchInput, hide when there's nothing to show
  const f = facets ?? EMPTY_FACETS
  const anyBuckets = Object.values(f).some(arr => Array.isArray(arr) && arr.length > 0)
  if (!searchInput && !anyBuckets && !hasSemantic) return null

  return (
    <div className={cn(
      'flex items-center gap-1 pl-1.5 pr-1.5 min-h-10 py-1',
      'rounded ring-1 ring-inset ring-border-dim bg-surface-low shadow-md',
      'focus-within:ring-2 focus-within:ring-border-system-focus',
      className,
    )}>
      {/* Search icon */}
      <Search className="w-4 h-4 text-foreground-dim shrink-0 mx-1" />

      {/* Separator */}
      <div className="w-px h-5 shrink-0 bg-border-dim" />

      {/* Chips + inline search input — rendered in insertion order */}
      <div ref={chipsWrapperRef} className="relative flex-1 min-w-0 flex flex-wrap items-center gap-1 px-0.5">
        {orderedEntries.map((entry) => (
          entry._t === 'group' ? (
            <FilterChip
              key={groupKey(entry.g)}
              kind={entry.g.kind}
              chips={entry.g.chips}
              onDismiss={() => entry.g.chips.forEach(c => onDismissChip(c))}
              onBodyClick={onChipBodyClick ? (rect) => {
                const wrapperRect = chipsWrapperRef.current?.getBoundingClientRect()
                const leftPx = wrapperRect ? rect.left - wrapperRect.left : 0
                onChipBodyClick(entry.g.drillKind, leftPx)
              } : undefined}
            />
          ) : (
            <SemanticFilterChip
              key={`m:${entry.s.id}`}
              text={entry.s.text}
              modeLabel={entry.s.label}
              icon={entry.s.icon}
              onDismiss={onDismissSemanticChip ? () => onDismissSemanticChip(entry.s.id) : undefined}
              onBodyClick={onEditSemanticChip ? () => onEditSemanticChip(entry.s.id) : undefined}
            />
          )
        ))}
        {provisionalChip && (
          <ProvisionalChip
            label={provisionalChip.label}
            text={provisionalChip.text}
            icon={provisionalChip.icon}
            onDismiss={onDismissProvisionalChip}
          />
        )}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') { searchInput.onSubmit?.(); return }
                // Backspace on an empty input removes the last chip (in visual order).
                if (e.key === 'Backspace' && e.currentTarget.value === '' && orderedEntries.length > 0) {
                  e.preventDefault()
                  const last = orderedEntries[orderedEntries.length - 1]
                  if (last._t === 'group') last.g.chips.forEach(c => onDismissChip(c))
                  else onDismissSemanticChip?.(last.s.id)
                }
              }}
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

// === Chip shell ===
// Shared presentation for all filter chips: a pill with an optional click-to-edit
// body and an optional dismiss button. Variants differ only by content + accent.

function ChipShell({ accent, dismissLabel, onDismiss, onBodyClick, children }: {
  accent?: boolean
  dismissLabel?: string
  onDismiss?: () => void
  /** When set, the body becomes a button; receives its bounding rect (for dropdown positioning). */
  onBodyClick?: (rect: DOMRect) => void
  children: React.ReactNode
}) {
  const bodyClass = 'inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-l text-label-0-bold text-current whitespace-nowrap'
  return (
    <span className={cn(
      'inline-flex items-center shrink-0 rounded transition-colors',
      accent
        ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
        : 'bg-gray-600 hover:bg-gray-500 dark:bg-gray-400 dark:hover:bg-gray-300 text-foreground-inverse dark:text-foreground',
    )}>
      {onBodyClick ? (
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onBodyClick(e.currentTarget.getBoundingClientRect()) }}
          className={cn(bodyClass, 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus')}
        >
          {children}
        </button>
      ) : (
        <span className={bodyClass}>{children}</span>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="inline-flex items-center justify-center size-4 mr-1 rounded text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus"
        >
          <X className="size-4" />
        </button>
      )}
    </span>
  )
}

// === Individual filter chip (structured) ===

function FilterChip({ kind, chips, onDismiss, onBodyClick }: {
  kind: ParsedChip['kind']
  chips: ParsedChip[]
  onDismiss: () => void
  onBodyClick?: (rect: DOMRect) => void
}) {
  const kindLabel = kind !== 'wildcard' ? KIND_LABEL[kind] : undefined
  const valueText = chips.map(c => c.label).join(', ')
  return (
    <ChipShell
      onDismiss={onDismiss}
      dismissLabel={`Remove ${kindLabel ? kindLabel + ': ' : ''}${valueText}`}
      onBodyClick={onBodyClick}
    >
      {kindLabel && <span className="font-normal opacity-60">{kindLabel}:</span>}
      {valueText}
    </ChipShell>
  )
}

// === Provisional (in-progress direct drill) chip ===

function ProvisionalChip({ label, text, icon: Icon, onDismiss }: {
  label: string
  text: string
  icon?: React.ComponentType<{ className?: string }>
  onDismiss?: () => void
}) {
  return (
    <ChipShell accent onDismiss={onDismiss} dismissLabel={`Cancel ${label} filter`}>
      {Icon && <Icon className="w-3 h-3 shrink-0 opacity-70" />}
      {label}{text ? `: ${text}` : ':'}
    </ChipShell>
  )
}

// === Semantic (Dialogue / Visual / Semantic) chip ===

function SemanticFilterChip({ text, modeLabel, icon: Icon = Sparkles, onDismiss, onBodyClick }: {
  text: string
  modeLabel?: string
  icon?: React.ComponentType<{ className?: string }>
  onDismiss?: () => void
  onBodyClick?: () => void
}) {
  const ariaText = modeLabel ? `${modeLabel}${text ? `: ${text}` : ''}` : text
  return (
    <ChipShell
      onDismiss={onDismiss}
      dismissLabel={`Remove semantic filter "${ariaText}"`}
      onBodyClick={onBodyClick}
    >
      <Icon className="w-3 h-3 shrink-0 opacity-70" />
      {modeLabel && <span className="font-normal opacity-60">{modeLabel}{text ? ':' : ''}</span>}
      {text}
    </ChipShell>
  )
}

