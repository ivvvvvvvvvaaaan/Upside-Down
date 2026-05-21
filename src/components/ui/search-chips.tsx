'use client'

import { Chip } from './chip'
import type { ParsedChip } from '@/lib/search'

/**
 * SearchChips — renders an ordered list of parsed chips above (or near) the
 * search input. Each chip shows its kind as a small caption above the value
 * so users can see WHY the parser pulled it out.
 *
 * v1: display-only. Dismissal follow-up will edit the input string by
 * stripping the chip's source phrase (requires the parser to record source
 * spans — punt for now).
 */

export interface SearchChipsProps {
  chips: ParsedChip[]
  size?: 'compact' | 'standard'
}

const KIND_LABEL: Record<ParsedChip['kind'], string> = {
  character: 'Character',
  scene: 'Scene',
  location: 'Location',
  episode: 'Episode',
  shootingDay: 'Day',
  type: 'Type',
  mediaAssetType: 'Asset type',
  department: 'Department',
  stage: 'Cut',
  camera: 'Camera',
  take: 'Take',
  flag: 'Tag',
  wildcard: 'Scope',
}

export function SearchChips({ chips, size = 'compact' }: SearchChipsProps) {
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, i) => (
        <div
          key={`${chip.kind}-${chip.value}-${i}`}
          className="inline-flex items-center gap-1"
        >
          <span className="text-label-0-regular text-foreground-subtle">
            {KIND_LABEL[chip.kind]}:
          </span>
          <Chip size={size}>{chip.label}</Chip>
        </div>
      ))}
    </div>
  )
}
