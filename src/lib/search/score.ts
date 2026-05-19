/**
 * score — relevance ranking for assets that already passed the structured
 * filter pass. Pure term-overlap, weighted by where the match landed.
 *
 * Why not embeddings: the prototype has a finite, authored vocabulary
 * (16 characters, 18 scenes, 7 locations, ~30 mediaAssetTypes, ~440 unique
 * AI keywords). Substring + synonym expansion + field weighting captures
 * ~80% of "semantic" feel for the queries this app actually sees, with zero
 * infra cost and full debuggability.
 */

import type { Asset } from '@/lib/data-client'
import { expandTerms } from './synonyms'

export type ScoredAsset = {
  asset: Asset
  score: number
  /** Which terms contributed and where — kept for "Why this result?" debug UI later. */
  matches: ScoreMatch[]
}

export type ScoreMatch = {
  term: string
  field: ScoreField
  weight: number
}

type ScoreField =
  | 'name'
  | 'character'
  | 'scene'
  | 'location'
  | 'keyword'
  | 'tag'
  | 'episode'
  | 'mediaAssetType'
  | 'department'

/** Field weights. Tweak before scaling — these are calibrated for the seed set. */
const FIELD_WEIGHTS: Record<ScoreField, number> = {
  name: 10,           // strongest signal — user typed it, asset is literally named it
  character: 6,       // narrative identity
  scene: 6,
  location: 5,
  mediaAssetType: 4,
  keyword: 3,         // AI keyword tags
  tag: 3,             // user/system tags
  episode: 2,
  department: 1,
}

/**
 * Score a single asset against an array of expanded query terms.
 * Returns 0 if no term matched (the caller can drop those).
 */
export function scoreAsset(asset: Asset, terms: string[]): ScoredAsset {
  const matches: ScoreMatch[] = []
  if (terms.length === 0) {
    return { asset, score: 0, matches }
  }

  const name = asset.name?.toLowerCase() ?? ''
  const ai = asset.aiMeta
  const aiChars = (ai?.characters ?? []).map(s => s.toLowerCase())
  const aiScene = ai?.scene?.toLowerCase() ?? ''
  const aiLocation = ai?.location?.toLowerCase() ?? ''
  const aiKeywords = (ai?.keywords ?? []).map(s => s.toLowerCase())
  const tags = (asset.tags ?? []).map(t => t.label.toLowerCase())
  const episode = asset.episode?.toLowerCase() ?? ''
  const mediaAssetType = asset.mediaAssetType?.toLowerCase() ?? ''
  const department = asset.department?.toLowerCase() ?? ''

  let total = 0
  for (const term of terms) {
    if (name.includes(term)) {
      matches.push({ term, field: 'name', weight: FIELD_WEIGHTS.name })
      total += FIELD_WEIGHTS.name
    }
    if (aiChars.some(c => c.includes(term))) {
      matches.push({ term, field: 'character', weight: FIELD_WEIGHTS.character })
      total += FIELD_WEIGHTS.character
    }
    if (aiScene.includes(term)) {
      matches.push({ term, field: 'scene', weight: FIELD_WEIGHTS.scene })
      total += FIELD_WEIGHTS.scene
    }
    if (aiLocation.includes(term)) {
      matches.push({ term, field: 'location', weight: FIELD_WEIGHTS.location })
      total += FIELD_WEIGHTS.location
    }
    if (mediaAssetType.includes(term)) {
      matches.push({ term, field: 'mediaAssetType', weight: FIELD_WEIGHTS.mediaAssetType })
      total += FIELD_WEIGHTS.mediaAssetType
    }
    if (aiKeywords.some(k => k.includes(term))) {
      matches.push({ term, field: 'keyword', weight: FIELD_WEIGHTS.keyword })
      total += FIELD_WEIGHTS.keyword
    }
    if (tags.some(t => t.includes(term))) {
      matches.push({ term, field: 'tag', weight: FIELD_WEIGHTS.tag })
      total += FIELD_WEIGHTS.tag
    }
    if (episode && term === episode) {
      matches.push({ term, field: 'episode', weight: FIELD_WEIGHTS.episode })
      total += FIELD_WEIGHTS.episode
    }
    if (department.includes(term)) {
      matches.push({ term, field: 'department', weight: FIELD_WEIGHTS.department })
      total += FIELD_WEIGHTS.department
    }
  }

  // Tiny tie-breaker so newer assets edge out older ones at equal score.
  if (asset.created_at) {
    const t = Date.parse(asset.created_at)
    if (!Number.isNaN(t)) total += t / 1e15 // negligible vs weights, deterministic
  }

  return { asset, score: total, matches }
}

/**
 * Rank an asset list against the freeText remainder. Empty freeText returns
 * the input unchanged (score = 0; caller orders by its existing rules).
 */
export function rankAssets(assets: Asset[], freeText: string): ScoredAsset[] {
  const terms = expandTerms(freeText)
  if (terms.length === 0) {
    return assets.map(a => ({ asset: a, score: 0, matches: [] }))
  }
  const scored = assets.map(a => scoreAsset(a, terms))
  return scored.sort((a, b) => b.score - a.score)
}
