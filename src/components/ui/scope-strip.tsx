'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Chip } from './chip'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'
import type { ParsedChip } from '@/lib/search'
import type { FacetBucket, FacetSet } from '@/lib/search'

/**
 * ScopeStrip — one row that unifies pinned scope chips and the
 * available-to-pin facet dimensions. Lives directly under the search input.
 *
 *   [Marco Vitale ×] [EP303 ×]   ·   + Scene   + Department   + Asset type   + Location
 *   ── pinned ─────────────────       ── add a scope ──────────────────────────
 *
 * Dimensions whose chip kind is already pinned drop off the right side — no
 * point offering "+ Character" when there's already a Character chip.
 * Popovers list the top buckets *over the current result set* with counts,
 * so values reflect what would actually narrow the result.
 */

type Dimension = {
  /** The chip.kind this dimension produces when pinned. */
  kind: ParsedChip['kind']
  /** Trigger label shown next to the + icon. */
  label: string
  /** Buckets to offer (typically the matching facet array). */
  buckets: FacetBucket<string>[]
  /** Canonical phrase for the wildcard "All X" row, if this dimension supports it. */
  wildcard?: string
}

export interface ScopeStripProps {
  /** Pinned chips. Render leftmost, with × dismiss. */
  chips: ParsedChip[]
  /** Facet counts over the current result set. */
  facets: FacetSet
  /** Remove a chip from the query (parent edits the input string). */
  onDismissChip: (chip: ParsedChip) => void
  /** Pin a facet bucket — parent appends the canonical phrase to the query. */
  onPinFacet: (canonicalText: string) => void
  /** Clear all pinned chips at once. */
  onClearAll?: () => void
}

// Maps a wildcard chip value to the dimension kind it replaces.
const WILDCARD_DIMENSION: Partial<Record<string, ParsedChip['kind']>> = {
  'has-character': 'character',
  'has-scene': 'scene',
  'has-location': 'location',
  'has-episode': 'episode',
  'has-stage': 'stage',
}

// Kinds that support multiple selected values — + button stays visible after first pin.
const MULTI_VALUE_KINDS = new Set<ParsedChip['kind']>(['character', 'scene', 'location', 'episode', 'stage'])

export function ScopeStrip({ chips, facets, onDismissChip, onPinFacet, onClearAll }: ScopeStripProps) {
  const pinnedKinds = new Set(chips.map(c => c.kind))
  const wildcardPinnedKinds = new Set<ParsedChip['kind']>()
  // A wildcard chip (e.g. "All Characters") also suppresses its dimension picker.
  for (const chip of chips) {
    if (chip.kind === 'wildcard') {
      const dimKind = WILDCARD_DIMENSION[chip.value]
      if (dimKind) {
        pinnedKinds.add(dimKind)
        wildcardPinnedKinds.add(dimKind)
      }
    }
  }

  // Already-pinned values per kind — filter these out of the popover buckets.
  const pinnedValues = new Map<ParsedChip['kind'], Set<string>>()
  for (const chip of chips) {
    if (!pinnedValues.has(chip.kind)) pinnedValues.set(chip.kind, new Set())
    pinnedValues.get(chip.kind)!.add(chip.value.toLowerCase())
  }

  // Order matches a rough "narrative → production" hierarchy.
  const dimensions: Dimension[] = [
    { kind: 'character', label: 'Character', buckets: facets.character, wildcard: 'all characters' },
    { kind: 'episode', label: 'Episode', buckets: facets.episode, wildcard: 'all episodes' },
    { kind: 'scene', label: 'Scene', buckets: facets.scene, wildcard: 'all scenes' },
    { kind: 'location', label: 'Location', buckets: facets.location, wildcard: 'all locations' },
    { kind: 'stage', label: 'Cut', buckets: facets.stage as FacetBucket<string>[], wildcard: 'all cuts' },
    { kind: 'department', label: 'Department', buckets: facets.department as FacetBucket<string>[] },
    { kind: 'mediaAssetType', label: 'Asset type', buckets: facets.mediaAssetType as FacetBucket<string>[] },
  ]

  // Single-value dims hide once pinned. Multi-value dims stay visible but with
  // already-selected values removed from the popover bucket list.
  const available = dimensions
    .filter(d => {
      if (wildcardPinnedKinds.has(d.kind)) return false
      if (pinnedKinds.has(d.kind) && !MULTI_VALUE_KINDS.has(d.kind)) return false
      const selected = pinnedValues.get(d.kind) ?? new Set()
      const remaining = d.buckets.filter(b => !selected.has(b.value.toLowerCase()))
      return remaining.length > 0
    })
    .map(d => {
      if (!MULTI_VALUE_KINDS.has(d.kind)) return d
      const selected = pinnedValues.get(d.kind) ?? new Set()
      return { ...d, buckets: d.buckets.filter(b => !selected.has(b.value.toLowerCase())) }
    })

  if (chips.length === 0 && available.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {/* Pinned chips */}
      {chips.map((chip, i) => (
        <Chip
          key={`${chip.kind}-${chip.value}-${i}`}
          size="compact"
          onDismiss={() => onDismissChip(chip)}
          dismissLabel={`Remove ${chip.label}`}
        >
          {chip.kind !== 'wildcard' && (
            <span className="text-foreground-inverse-subtle dark:text-foreground-subtle">
              {KIND_LABEL[chip.kind]}:
            </span>
          )}
          {chip.label}
        </Chip>
      ))}

      {/* Faint divider between pinned + available (only when both have content) */}
      {chips.length > 0 && available.length > 0 && (
        <span aria-hidden className="h-4 w-px bg-border-subtle dark:bg-border-inverse-subtle" />
      )}

      {/* Add-a-dimension pills */}
      {available.map(dim => (
        <DimensionPicker key={dim.kind} dim={dim} onPinFacet={onPinFacet} />
      ))}

      {/* Clear all — only when chips are active */}
      {chips.length > 0 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className={cn(
            'inline-flex items-center px-2 h-6 rounded',
            'text-label-0-bold text-foreground-subtle',
            'hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus',
          )}
        >
          Clear all
        </button>
      )}
    </div>
  )
}

// === Add-dimension trigger + popover ===

function DimensionPicker({
  dim,
  onPinFacet,
}: {
  dim: Dimension
  onPinFacet: (canonicalText: string) => void
}) {
  const [open, setOpen] = useState(false)

  const handlePick = (bucket: FacetBucket<string>) => {
    onPinFacet(bucket.label)
    setOpen(false)
  }

  const handleWildcard = () => {
    if (dim.wildcard) onPinFacet(dim.wildcard)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 px-2 h-6 rounded',
            'text-label-0-bold text-foreground-dim',
            'ring-1 ring-inset ring-border-subtle dark:ring-border-inverse-subtle',
            'hover:bg-surface-highlight hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus',
            open && 'bg-surface-highlight text-foreground',
          )}
        >
          <Plus className="w-3 h-3" />
          {dim.label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-1 w-64">
        <div className="px-2 pt-1 pb-2 text-label-0-regular text-foreground-subtle">
          {dim.label}
        </div>
        <ul className="max-h-72 overflow-auto">
          {dim.wildcard && (
            <li key={`${dim.kind}-wildcard`}>
              <button
                type="button"
                onClick={handleWildcard}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded',
                  'text-body-0-regular text-foreground text-left',
                  'hover:bg-surface-highlight',
                  'focus-visible:outline-none focus-visible:bg-surface-highlight',
                )}
              >
                <span>All {dim.label.toLowerCase()}s</span>
                <span className="text-label-0-regular text-foreground-subtle tabular-nums">
                  {dim.buckets.reduce((sum, b) => sum + b.count, 0)}
                </span>
              </button>
            </li>
          )}
          {dim.buckets.map(b => (
            <li key={`${dim.kind}-${b.value}`}>
              <button
                type="button"
                onClick={() => handlePick(b)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded',
                  'text-body-0-regular text-foreground text-left',
                  'hover:bg-surface-highlight',
                  'focus-visible:outline-none focus-visible:bg-surface-highlight',
                )}
              >
                <span className="truncate">{b.label}</span>
                <span className="text-label-0-regular text-foreground-subtle tabular-nums">
                  {b.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

// === Display labels per chip kind (matches SearchChips for consistency) ===

const KIND_LABEL: Record<ParsedChip['kind'], string> = {
  character: 'Character',
  scene: 'Scene',
  location: 'Location',
  episode: 'Episode',
  type: 'Format',
  mediaAssetType: 'Asset type',
  department: 'Department',
  stage: 'Cut',
  camera: 'Camera',
  take: 'Take',
  flag: 'Tag',
  wildcard: 'Scope',
}
