/**
 * suggestions — typeahead candidates for the search input.
 *
 * Returns ranked entity matches against the trailing free-text of a query
 * (what the user is currently typing, after structured chips have been
 * extracted). The list is finite and authored — characters, scenes,
 * locations, episodes, departments, media-asset-types, stages, and flags.
 *
 * Ranking: prefix matches first, then substring matches, then by candidate
 * length (shorter = tighter match), then alphabetical.
 */

import type { ParsedChip } from './parse-query'
import {
  listNarrativeCharacters,
  listNarrativeLocations,
  listNarrativeScenes,
} from '@/lib/ontology-meta'

export type Suggestion = {
  kind: ParsedChip['kind']
  /** Display value shown in the dropdown row. */
  label: string
  /** Text to append to the input so the parser re-chips it canonically. */
  canonical: string
}

// Static vocabulary not derivable from the ontology helpers.

const EPISODES: Suggestion[] = [
  'EP301', 'EP302', 'EP303', 'EP304', 'EP305', 'EP306',
].map(code => ({ kind: 'episode', label: code, canonical: code }))

const DEPARTMENTS: Suggestion[] = [
  ['Art & Design', 'art design'],
  ['VFX', 'vfx'],
  ['Camera', 'camera'],
  ['Editorial', 'editorial'],
  ['Audio & Sound', 'audio sound'],
  ['Marketing', 'marketing'],
  ['Legal', 'legal'],
  ['Globalization', 'globalization'],
].map(([label, canonical]) => ({ kind: 'department', label, canonical }))

const MEDIA_ASSET_TYPES: Suggestion[] = [
  'Editorial cut', 'Textless master', 'Reel',
  'Camera clip', 'Dailies', 'Proxy',
  'Audio clip', 'ADR', 'Foley', 'Score', 'Sound mix',
  'Concept art', 'Storyboard', 'Reference image', 'Production photo', 'Lookbook',
  'VFX plate', 'VFX comp',
  'EDL', 'Closed captions', 'Project file',
].map(label => ({ kind: 'mediaAssetType', label, canonical: label.toLowerCase() }))

const STAGES: Suggestion[] = [
  'Final cut', 'Locked cut', 'EMF',
].map(label => ({ kind: 'stage', label, canonical: label.toLowerCase() }))

const FLAGS: Suggestion[] = [
  { kind: 'flag', label: 'Circle take', canonical: 'circle take' },
  { kind: 'flag', label: 'Key art', canonical: 'key art' },
  { kind: 'flag', label: 'Final', canonical: 'is final' },
  { kind: 'wildcard', label: 'All Characters', canonical: 'all characters' },
  { kind: 'wildcard', label: 'All Scenes', canonical: 'all scenes' },
  { kind: 'wildcard', label: 'All Locations', canonical: 'all locations' },
  { kind: 'wildcard', label: 'All Episodes', canonical: 'all episodes' },
  { kind: 'wildcard', label: 'All Cuts', canonical: 'all cuts' },
]

/** Full candidate pool — built once since the ontology is static per session. */
let _candidateCache: Suggestion[] | null = null
function allCandidates(): Suggestion[] {
  if (_candidateCache) return _candidateCache
  const candidates: Suggestion[] = []
  for (const [name] of listNarrativeCharacters()) {
    candidates.push({ kind: 'character', label: name, canonical: name })
  }
  for (const [name] of listNarrativeScenes()) {
    candidates.push({ kind: 'scene', label: name, canonical: name })
  }
  for (const [name] of listNarrativeLocations()) {
    candidates.push({ kind: 'location', label: name, canonical: name })
  }
  candidates.push(...EPISODES, ...DEPARTMENTS, ...MEDIA_ASSET_TYPES, ...STAGES, ...FLAGS)
  return (_candidateCache = candidates)
}

/**
 * Return suggestions matching `needle` (the trailing free-text of the query).
 * Returns [] for an empty/blank needle — caller should not show the dropdown.
 */
export function getSuggestions(
  needle: string,
  limit = 7,
  excludeKinds: ReadonlyArray<ParsedChip['kind']> = [],
  excludeValues: ReadonlyArray<{ kind: ParsedChip['kind']; value: string }> = [],
): Suggestion[] {
  const q = needle.toLowerCase().trim()
  if (!q) return []
  const excluded = new Set(excludeKinds)
  const excludedValues = new Set(excludeValues.map(v => `${v.kind}:${v.value.toLowerCase()}`))

  const labelMatches: Array<Suggestion & { rank: number }> = []
  const kindMatches: Array<Suggestion & { rank: number }> = []

  for (const c of allCandidates()) {
    if (excluded.has(c.kind)) continue
    if (excludedValues.has(`${c.kind}:${c.canonical.toLowerCase()}`)) continue
    const label = c.label.toLowerCase()
    const kindLabel = KIND_DISPLAY[c.kind].toLowerCase()

    if (label === q) {
      labelMatches.push({ ...c, rank: 0 })
    } else if (label.startsWith(q)) {
      labelMatches.push({ ...c, rank: 1 })
    } else if (label.includes(q)) {
      labelMatches.push({ ...c, rank: 2 })
    } else if (kindLabel.startsWith(q)) {
      // Kind-name prefix match: "cha" → "character" → surface character candidates
      kindMatches.push({ ...c, rank: 3 })
    } else if (kindLabel.includes(q)) {
      kindMatches.push({ ...c, rank: 4 })
    }
  }

  labelMatches.sort((a, b) =>
    a.rank - b.rank
    || a.label.length - b.label.length
    || a.label.localeCompare(b.label),
  )

  // Cap kind-matched results per kind to avoid flooding the list (e.g. "cha" →
  // "character" → 16 names). Alphabetical within kind so results are stable.
  const PER_KIND_CAP = 4
  const perKindCount = new Map<string, number>()
  const trimmedKindMatches = kindMatches
    .sort((a, b) => a.label.localeCompare(b.label))
    .filter(m => {
      const n = perKindCount.get(m.kind) ?? 0
      if (n >= PER_KIND_CAP) return false
      perKindCount.set(m.kind, n + 1)
      return true
    })

  return [...labelMatches, ...trimmedKindMatches].slice(0, limit)
}

/** Kind → human label used in the suggestion-row caption. */
export const KIND_DISPLAY: Record<ParsedChip['kind'], string> = {
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
