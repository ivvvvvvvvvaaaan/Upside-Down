/**
 * facets — count assets in the current result set by each dimension we let
 * the user scope by. Skips dimensions that are already pinned as chips
 * (no point offering "filter by character X" when chip:character=X is active).
 *
 * Returned facets are sorted by count desc, then name asc, then capped to
 * a reasonable display size — UI is free to "show more" beyond the cap.
 */

import type { Asset, AssetType, CutStage, DomainId, MediaAssetType } from '@/lib/data-client'
import type { ParsedChip } from './parse-query'

export type FacetKind =
  | 'character'
  | 'scene'
  | 'location'
  | 'episode'
  | 'stage'
  | 'department'
  | 'mediaAssetType'
  | 'type'
  | 'shootingDay'

export type FacetBucket<V = string> = {
  value: V
  label: string
  count: number
}

export type FacetSet = {
  character: FacetBucket<string>[]
  scene: FacetBucket<string>[]
  location: FacetBucket<string>[]
  episode: FacetBucket<string>[]
  stage: FacetBucket<CutStage>[]
  department: FacetBucket<DomainId>[]
  mediaAssetType: FacetBucket<MediaAssetType>[]
  type: FacetBucket<AssetType>[]
  shootingDay: FacetBucket<string>[]
}

const DEFAULT_CAP = 12

/**
 * Build all facets over a result set. Dimensions already pinned via chips
 * collapse to an empty bucket list — the UI can read this signal to hide
 * the section entirely.
 */
export function buildFacets(
  results: Asset[],
  pinnedChips: ParsedChip[] = [],
  cap = DEFAULT_CAP,
): FacetSet {
  const pinned = new Set(pinnedChips.map(c => c.kind))

  const facets: FacetSet = {
    character: [],
    scene: [],
    location: [],
    episode: [],
    stage: [],
    department: [],
    mediaAssetType: [],
    type: [],
    shootingDay: [],
  }

  // Tally each dimension in a single pass per result.
  const charCounts = new Map<string, number>()
  const sceneCounts = new Map<string, number>()
  const locationCounts = new Map<string, number>()
  const episodeCounts = new Map<string, number>()
  const stageCounts = new Map<CutStage, number>()
  const departmentCounts = new Map<DomainId, number>()
  const matCounts = new Map<MediaAssetType, number>()
  const typeCounts = new Map<AssetType, number>()
  const shootingDayCounts = new Map<string, number>()

  for (const a of results) {
    if (a.aiMeta?.characters) {
      for (const c of a.aiMeta.characters) charCounts.set(c, (charCounts.get(c) ?? 0) + 1)
    }
    if (a.aiMeta?.scene) sceneCounts.set(a.aiMeta.scene, (sceneCounts.get(a.aiMeta.scene) ?? 0) + 1)
    if (a.aiMeta?.location) {
      locationCounts.set(a.aiMeta.location, (locationCounts.get(a.aiMeta.location) ?? 0) + 1)
    }
    if (a.episode) episodeCounts.set(a.episode, (episodeCounts.get(a.episode) ?? 0) + 1)
    if (a.stage) stageCounts.set(a.stage, (stageCounts.get(a.stage) ?? 0) + 1)
    if (a.department) {
      departmentCounts.set(a.department, (departmentCounts.get(a.department) ?? 0) + 1)
    }
    if (a.mediaAssetType) {
      matCounts.set(a.mediaAssetType, (matCounts.get(a.mediaAssetType) ?? 0) + 1)
    }
    if (a.type) typeCounts.set(a.type, (typeCounts.get(a.type) ?? 0) + 1)
    if (a.shootingDay != null) {
      const k = String(a.shootingDay)
      shootingDayCounts.set(k, (shootingDayCounts.get(k) ?? 0) + 1)
    }
  }

  if (!pinned.has('character')) facets.character = bucketsFromMap(charCounts, cap)
  if (!pinned.has('scene')) facets.scene = bucketsFromMap(sceneCounts, cap)
  if (!pinned.has('location')) facets.location = bucketsFromMap(locationCounts, cap)
  if (!pinned.has('episode')) facets.episode = bucketsFromMap(episodeCounts, cap)
  if (!pinned.has('stage')) facets.stage = bucketsFromMap(stageCounts, cap, stageLabel)
  if (!pinned.has('department')) {
    facets.department = bucketsFromMap(departmentCounts, cap, departmentLabel)
  }
  if (!pinned.has('mediaAssetType')) {
    facets.mediaAssetType = bucketsFromMap(matCounts, cap, mediaAssetTypeLabel)
  }
  if (!pinned.has('type')) facets.type = bucketsFromMap(typeCounts, cap, assetTypeLabel)
  if (!pinned.has('shootingDay')) {
    const dayBuckets: FacetBucket<string>[] = []
    shootingDayCounts.forEach((count, value) => dayBuckets.push({ value, label: `Day ${value}`, count }))
    // Sort numerically (by day number) then cap
    dayBuckets.sort((a, b) => parseInt(a.value) - parseInt(b.value))
    facets.shootingDay = dayBuckets.slice(0, cap)
  }

  return facets
}

function bucketsFromMap<V extends string>(
  m: Map<V, number>,
  cap: number,
  toLabel: (v: V) => string = v => v,
): FacetBucket<V>[] {
  const arr: FacetBucket<V>[] = []
  m.forEach((count, value) => arr.push({ value, label: toLabel(value), count }))
  arr.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  return arr.slice(0, cap)
}

// === Display label helpers ===
// Match the human-readable forms used elsewhere (department/avatar copy, type chips).

function stageLabel(s: CutStage): string {
  switch (s) {
    case 'locked-cut': return 'Locked cut'
    case 'final-cut': return 'Final cut'
    case 'emf': return 'EMF'
  }
}

function departmentLabel(id: DomainId): string {
  switch (id) {
    case 'art-design': return 'Art & Design'
    case 'vfx': return 'VFX'
    case 'camera': return 'Camera'
    case 'editorial': return 'Editorial'
    case 'audio-sound': return 'Audio & Sound'
    case 'marketing': return 'Marketing'
    case 'legal': return 'Legal'
    case 'globalization': return 'Globalization'
  }
}

function mediaAssetTypeLabel(t: MediaAssetType): string {
  // Title-case from kebab-case, with a few hand-tuned overrides.
  const overrides: Partial<Record<MediaAssetType, string>> = {
    'adr': 'ADR',
    'edl': 'EDL',
    'vfx-comp': 'VFX comp',
    'vfx-plate': 'VFX plate',
    'closed-captions': 'Closed captions',
  }
  if (overrides[t]) return overrides[t]!
  return t.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

function assetTypeLabel(t: AssetType): string {
  return t.charAt(0).toUpperCase() + t.slice(1)
}
