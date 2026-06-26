/**
 * src/lib/search — public entry for the prototype search engine.
 *
 * Flow: parseQuery → matchesFilter (structured pass) → rankAssets (free-text
 * scoring) → buildFacets (counts over results). All pure functions, no I/O.
 *
 * `matchesFilter` from smart-collection-filters is the single matcher across
 * smart collections AND search — adding a new structured dimension means
 * extending one function, not two.
 */

export {
  parseQuery,
  chipsToFilter,
  removeChipFromQuery,
  addPhraseToQuery,
  replaceTrailingFreeText,
  SEMANTIC_MODE_ASSET_TYPES,
} from './parse-query'
export type { ParsedQuery, ParsedChip } from './parse-query'
export { getSuggestions, KIND_DISPLAY } from './suggestions'
export type { Suggestion } from './suggestions'
export { useSubmitToSearch } from './submit'
export { rankAssets, scoreAsset } from './score'
export type { ScoredAsset, ScoreMatch } from './score'
export { buildFacets } from './facets'
export type { FacetSet, FacetBucket, FacetKind } from './facets'
export { expandTerms, getSynonymMap } from './synonyms'

import type { Asset, AssetFilter } from '@/lib/data-client'
import { matchesFilter } from '@/lib/smart-collection-filters'
import { parseQuery, type ParsedQuery } from './parse-query'
import { rankAssets, type ScoredAsset, type ScoreMatch } from './score'
import { buildFacets, type FacetSet } from './facets'

export type SearchInput = {
  /** Free-form text from the search input. */
  query: string
  /** All assets the caller wants to search over (already access-filtered). */
  assets: Asset[]
  /**
   * Extra filter ANDed with the parsed filter — typically the page-context
   * scope (e.g. "you searched from a character page" pre-applies that chip),
   * or the active facet selections.
   */
  contextFilter?: AssetFilter
  /** Optional facet bucket cap (default 12). */
  facetCap?: number
  /**
   * Semantic query captured from a SemanticFilterChip. Used for scoring when
   * parsed.freeText is empty (the user locked the phrase into a chip and
   * cleared the input).
   */
  semanticText?: string
}

export type SearchResult = {
  /** What the parser saw — chips, freeText, projected filter. */
  parsed: ParsedQuery
  /** The merged filter actually applied (parsed + contextFilter). */
  appliedFilter: AssetFilter
  /** Scored, ranked results. When freeText is empty, score = 0 and order matches input order after the filter pass. */
  results: ScoredAsset[]
  /** Counts over the result set. */
  facets: FacetSet
}

/**
 * Run the full search pipeline. Cheap enough to call on every keystroke for
 * the prototype's seed-set size; debounce at the UI layer if it ever isn't.
 */
export function executeSearch(input: SearchInput): SearchResult {
  const { query, assets, contextFilter, facetCap } = input
  const parsed = parseQuery(query)

  // The structured pass uses chips ONLY — freeText is for scoring, not for
  // matchesFilter's strict-substring query slot. That way synonym expansion
  // (in the scorer) can surface assets that don't literally contain the typed
  // word but do match its meaning ("victory" → podium/celebration/trophy).
  const structuralFilter: AssetFilter = { ...parsed.filter }
  delete structuralFilter.query
  const appliedFilter = mergeFilters(structuralFilter, contextFilter)

  const filtered = assets.filter(a => matchesFilter(a, appliedFilter))

  // freeText in the input takes priority; semantic chip text is the fallback
  // scorer when the user locked a phrase into a chip and cleared the input.
  const freeTextForScoring = parsed.freeText.trim() || input.semanticText?.trim() || ''

  let results: ScoredAsset[]
  if (freeTextForScoring) {
    // Primary pass: synonym-expanded term scoring. Ranked results that hit at
    // least one field come first.
    const scored = rankAssets(filtered, freeTextForScoring)
    const scoredAboveZero = scored.filter(r => r.score > 0)
    const scoredIds = new Set<string>()
    for (const r of scoredAboveZero) scoredIds.add(r.asset.id)

    // Natural-language fallback: any asset whose combined metadata contains the
    // raw freeText as a literal substring — the old behavior. Appended after
    // scored results so ranking is preserved, but nothing disappears because
    // a word isn't in the synonym map.
    const needle = freeTextForScoring.toLowerCase()
    const substringFallback = filtered
      .filter(a => !scoredIds.has(a.id) && substringMatchesAsset(a, needle))
      .map(a => ({ asset: a, score: 0 as number, matches: [] as ScoreMatch[] }))

    results = [...scoredAboveZero, ...substringFallback]
  } else {
    // No freeText → structured filter alone defines the set; preserve input order.
    results = filtered.map(a => ({ asset: a, score: 0, matches: [] }))
  }

  // For multi-value dimensions (character/scene/location/episode/stage), use
  // disjunctive faceting: compute counts over assets that match everything EXCEPT
  // those dims so the picker always shows remaining options even after one is
  // pinned and the result set is narrowed to only that value.
  const disjunctiveFilter: AssetFilter = {
    ...appliedFilter,
    aiCharacters: undefined,
    aiScene: undefined,
    aiLocation: undefined,
    episode: undefined,
    stage: undefined,
    shootingDay: undefined,
    aiHasCharacters: undefined,
    aiHasScene: undefined,
    aiHasLocation: undefined,
    hasEpisode: undefined,
    hasStage: undefined,
    hasShootingDay: undefined,
  }
  const disjunctiveAssets = assets.filter(a => matchesFilter(a, disjunctiveFilter))
  const disjunctiveFacets = buildFacets(disjunctiveAssets, [], facetCap)

  const facets = buildFacets(results.map(r => r.asset), parsed.chips, facetCap)
  facets.character = disjunctiveFacets.character
  facets.scene = disjunctiveFacets.scene
  facets.location = disjunctiveFacets.location
  facets.episode = disjunctiveFacets.episode
  facets.stage = disjunctiveFacets.stage
  facets.shootingDay = disjunctiveFacets.shootingDay

  return { parsed, appliedFilter, results, facets }
}

/**
 * Returns true if the needle appears as a literal substring in any searchable
 * metadata field on the asset. Mirrors the old matchesFilter(asset, { query })
 * behavior so it can serve as a recall fallback when term-based scoring finds
 * nothing.
 */
function substringMatchesAsset(asset: Asset, needle: string): boolean {
  return [
    asset.name,
    asset.episode,
    asset.mediaAssetType,
    asset.department,
    asset.aiMeta?.location,
    asset.aiMeta?.scene,
    ...(asset.tags ?? []).map(t => t.label),
    ...(asset.aiMeta?.characters ?? []),
    ...(asset.aiMeta?.keywords ?? []),
  ].some(s => !!s && s.toLowerCase().includes(needle))
}

/**
 * AND-merge two AssetFilters. Multi-value fields combine via set-union; scalar
 * fields prefer the parsed (user-typed) value over the context default — the
 * user's explicit chip wins.
 */
function mergeFilters(parsed: AssetFilter, context?: AssetFilter): AssetFilter {
  if (!context) return parsed
  const merged: AssetFilter = { ...context, ...parsed }

  if (parsed.aiCharacters && context.aiCharacters) {
    merged.aiCharacters = unionUnique(parsed.aiCharacters, context.aiCharacters)
  }
  if (parsed.types && context.types) {
    merged.types = unionUnique(parsed.types, context.types)
  }
  if (parsed.typeTags && context.typeTags) {
    merged.typeTags = unionUnique(parsed.typeTags, context.typeTags)
  }
  if (parsed.query && context.query) {
    merged.query = `${context.query} ${parsed.query}`.trim()
  }
  return merged
}

function unionUnique<T>(a: T[], b: T[]): T[] {
  const seen = new Set<T>()
  const out: T[] = []
  for (const x of [...a, ...b]) {
    if (!seen.has(x)) {
      seen.add(x)
      out.push(x)
    }
  }
  return out
}
