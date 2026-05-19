/**
 * parse-query — turn a free-form search string into a structured AssetFilter
 * + leftover freeText + an ordered list of chips for the UI.
 *
 * Strategy: greedy ontology-aware matching, longest-first, against the seeded
 * narrative + production vocabulary. Anything not matched falls through as
 * freeText for substring/term-overlap scoring downstream.
 *
 * Design note: we don't invent a parallel filter type. Chips project back to
 * `AssetFilter` keys (`aiCharacters`, `aiLocation`, `aiScene`, `types`,
 * `department`, `typeTags`, `isFinal`, `isCircleTake`, `isKeyArt`, `shotTake`,
 * `shotCamera`) so `matchesFilter()` keeps being the single matcher across
 * smart collections AND search.
 */

import type { AssetFilter, AssetType, MediaAssetType, DomainId } from '@/lib/data-client'
import type { CutStage } from '@/lib/data-client'
import {
  listNarrativeCharacters,
  listNarrativeLocations,
  listNarrativeScenes,
} from '@/lib/ontology-meta'

// === Chip shape ===

/**
 * Each chip carries `source` — the literal substring from the original query
 * that produced it. Dismissing a chip strips this from the input verbatim,
 * keeping the rest of the user's typing intact.
 */
export type ParsedChip =
  | { kind: 'character'; label: string; value: string; source: string }
  | { kind: 'scene'; label: string; value: string; source: string }
  | { kind: 'location'; label: string; value: string; source: string }
  | { kind: 'episode'; label: string; value: string; source: string }
  | { kind: 'type'; label: string; value: AssetType; source: string }
  | { kind: 'mediaAssetType'; label: string; value: MediaAssetType; source: string }
  | { kind: 'department'; label: string; value: DomainId; source: string }
  | { kind: 'stage'; label: string; value: CutStage; source: string }
  | { kind: 'camera'; label: string; value: string; source: string }
  | { kind: 'take'; label: string; value: string; source: string }
  | { kind: 'flag'; label: string; value: 'final' | 'circle-take' | 'key-art'; source: string }
  | { kind: 'wildcard'; label: string; value: 'has-character' | 'has-scene' | 'has-location' | 'has-episode' | 'has-stage'; source: string }

export type ParsedQuery = {
  /** Original input, preserved for display + URL round-trips. */
  raw: string
  /** What was left after structured matching — feeds the scorer. */
  freeText: string
  /** Ordered chips for the input UI (insertion order = match order). */
  chips: ParsedChip[]
  /** Projected filter — combined chips, ready for matchesFilter. */
  filter: AssetFilter
}

// === Static vocabulary (matched literally, plus a few aliases) ===

/**
 * Alias templates omit `source` — it's filled by the consumer from the actual
 * matched text. (Two alternative phrases for the same chip — "art and design"
 * vs "art-design" — share a chip definition but record the source the user typed.)
 */
type ChipTemplate = Omit<ParsedChip, 'source'>
type Alias = { phrase: string; chip: ChipTemplate }

/** AssetType aliases (singular + plural + common synonyms). */
const ASSET_TYPE_ALIASES: Alias[] = [
  // 'shot' is intentionally last (single token) so 'production shot' isn't gobbled here.
  { phrase: 'videos', chip: { kind: 'type', label: 'Video', value: 'video' } },
  { phrase: 'video', chip: { kind: 'type', label: 'Video', value: 'video' } },
  { phrase: 'images', chip: { kind: 'type', label: 'Image', value: 'image' } },
  { phrase: 'image', chip: { kind: 'type', label: 'Image', value: 'image' } },
  { phrase: 'photos', chip: { kind: 'type', label: 'Image', value: 'image' } },
  { phrase: 'photo', chip: { kind: 'type', label: 'Image', value: 'image' } },
  { phrase: 'pictures', chip: { kind: 'type', label: 'Image', value: 'image' } },
  { phrase: 'picture', chip: { kind: 'type', label: 'Image', value: 'image' } },
  { phrase: 'audio', chip: { kind: 'type', label: 'Audio', value: 'audio' } },
  { phrase: 'sounds', chip: { kind: 'type', label: 'Audio', value: 'audio' } },
  { phrase: 'documents', chip: { kind: 'type', label: 'Document', value: 'text' } },
  { phrase: 'document', chip: { kind: 'type', label: 'Document', value: 'text' } },
  { phrase: 'docs', chip: { kind: 'type', label: 'Document', value: 'text' } },
  { phrase: 'shots', chip: { kind: 'type', label: 'Shot', value: 'shot' } },
  { phrase: 'shot', chip: { kind: 'type', label: 'Shot', value: 'shot' } },
]

/** MediaAssetType aliases — multi-word phrases first so they win over their token parts. */
const MEDIA_ASSET_TYPE_ALIASES: Alias[] = [
  { phrase: 'editorial cut', chip: { kind: 'mediaAssetType', label: 'Editorial cut', value: 'editorial-cut' } },
  { phrase: 'editorial cuts', chip: { kind: 'mediaAssetType', label: 'Editorial cut', value: 'editorial-cut' } },
  { phrase: 'textless master', chip: { kind: 'mediaAssetType', label: 'Textless master', value: 'textless-master' } },
  { phrase: 'reels', chip: { kind: 'mediaAssetType', label: 'Reel', value: 'reel' } },
  { phrase: 'reel', chip: { kind: 'mediaAssetType', label: 'Reel', value: 'reel' } },
  { phrase: 'camera clips', chip: { kind: 'mediaAssetType', label: 'Camera clip', value: 'camera-clip' } },
  { phrase: 'camera clip', chip: { kind: 'mediaAssetType', label: 'Camera clip', value: 'camera-clip' } },
  { phrase: 'dailies proxy', chip: { kind: 'mediaAssetType', label: 'Dailies proxy', value: 'dailies-proxy' } },
  { phrase: 'dailies', chip: { kind: 'mediaAssetType', label: 'Dailies', value: 'dailies-proxy' } },
  { phrase: 'proxies', chip: { kind: 'mediaAssetType', label: 'Proxy', value: 'proxy' } },
  { phrase: 'proxy', chip: { kind: 'mediaAssetType', label: 'Proxy', value: 'proxy' } },
  { phrase: 'audio clips', chip: { kind: 'mediaAssetType', label: 'Audio clip', value: 'audio-clip' } },
  { phrase: 'audio clip', chip: { kind: 'mediaAssetType', label: 'Audio clip', value: 'audio-clip' } },
  { phrase: 'adr', chip: { kind: 'mediaAssetType', label: 'ADR', value: 'adr' } },
  { phrase: 'foley', chip: { kind: 'mediaAssetType', label: 'Foley', value: 'foley' } },
  { phrase: 'score', chip: { kind: 'mediaAssetType', label: 'Score', value: 'score' } },
  { phrase: 'sound mix', chip: { kind: 'mediaAssetType', label: 'Sound mix', value: 'sound-mix' } },
  { phrase: 'concept art', chip: { kind: 'mediaAssetType', label: 'Concept art', value: 'concept-art' } },
  { phrase: 'storyboards', chip: { kind: 'mediaAssetType', label: 'Storyboard', value: 'storyboard' } },
  { phrase: 'storyboard', chip: { kind: 'mediaAssetType', label: 'Storyboard', value: 'storyboard' } },
  { phrase: 'reference images', chip: { kind: 'mediaAssetType', label: 'Reference image', value: 'reference-image' } },
  { phrase: 'reference image', chip: { kind: 'mediaAssetType', label: 'Reference image', value: 'reference-image' } },
  { phrase: 'production photos', chip: { kind: 'mediaAssetType', label: 'Production photo', value: 'production-photo' } },
  { phrase: 'production photo', chip: { kind: 'mediaAssetType', label: 'Production photo', value: 'production-photo' } },
  { phrase: 'lookbooks', chip: { kind: 'mediaAssetType', label: 'Lookbook', value: 'lookbook' } },
  { phrase: 'lookbook', chip: { kind: 'mediaAssetType', label: 'Lookbook', value: 'lookbook' } },
  { phrase: 'vfx plates', chip: { kind: 'mediaAssetType', label: 'VFX plate', value: 'vfx-plate' } },
  { phrase: 'vfx plate', chip: { kind: 'mediaAssetType', label: 'VFX plate', value: 'vfx-plate' } },
  { phrase: 'vfx comps', chip: { kind: 'mediaAssetType', label: 'VFX comp', value: 'vfx-comp' } },
  { phrase: 'vfx comp', chip: { kind: 'mediaAssetType', label: 'VFX comp', value: 'vfx-comp' } },
  { phrase: 'edl', chip: { kind: 'mediaAssetType', label: 'EDL', value: 'edl' } },
  { phrase: 'closed captions', chip: { kind: 'mediaAssetType', label: 'Closed captions', value: 'closed-captions' } },
  { phrase: 'project files', chip: { kind: 'mediaAssetType', label: 'Project file', value: 'project-file' } },
  { phrase: 'project file', chip: { kind: 'mediaAssetType', label: 'Project file', value: 'project-file' } },
]

/** Department aliases — short forms users actually type. */
const DEPARTMENT_ALIASES: Alias[] = [
  { phrase: 'art & design', chip: { kind: 'department', label: 'Art & Design', value: 'art-design' } },
  { phrase: 'art and design', chip: { kind: 'department', label: 'Art & Design', value: 'art-design' } },
  { phrase: 'art design', chip: { kind: 'department', label: 'Art & Design', value: 'art-design' } },
  { phrase: 'art-design', chip: { kind: 'department', label: 'Art & Design', value: 'art-design' } },
  { phrase: 'art dept', chip: { kind: 'department', label: 'Art & Design', value: 'art-design' } },
  { phrase: 'audio & sound', chip: { kind: 'department', label: 'Audio & Sound', value: 'audio-sound' } },
  { phrase: 'audio and sound', chip: { kind: 'department', label: 'Audio & Sound', value: 'audio-sound' } },
  { phrase: 'audio sound', chip: { kind: 'department', label: 'Audio & Sound', value: 'audio-sound' } },
  { phrase: 'sound dept', chip: { kind: 'department', label: 'Audio & Sound', value: 'audio-sound' } },
  { phrase: 'vfx', chip: { kind: 'department', label: 'VFX', value: 'vfx' } },
  { phrase: 'editorial', chip: { kind: 'department', label: 'Editorial', value: 'editorial' } },
  { phrase: 'marketing', chip: { kind: 'department', label: 'Marketing', value: 'marketing' } },
  { phrase: 'legal', chip: { kind: 'department', label: 'Legal', value: 'legal' } },
  { phrase: 'globalization', chip: { kind: 'department', label: 'Globalization', value: 'globalization' } },
  // 'art' and 'camera' are single tokens that collide with content words ("art deco", "camera A").
  // We handle them later, after camera-letter and "art &" phrases are eaten.
  { phrase: 'art', chip: { kind: 'department', label: 'Art & Design', value: 'art-design' } },
  { phrase: 'camera', chip: { kind: 'department', label: 'Camera', value: 'camera' } },
]

/** Cut stage aliases. Note 'final cut' overrides the 'final' flag and the 'editorial cut' alias when matched. */
const STAGE_ALIASES: Alias[] = [
  { phrase: 'locked cut', chip: { kind: 'stage', label: 'Locked cut', value: 'locked-cut' } },
  { phrase: 'final cut', chip: { kind: 'stage', label: 'Final cut', value: 'final-cut' } },
  { phrase: 'emf', chip: { kind: 'stage', label: 'EMF', value: 'emf' } },
]

/** Flag aliases. Order matters — 'circle take' before 'circled'. */
const FLAG_ALIASES: Alias[] = [
  { phrase: 'circle take', chip: { kind: 'flag', label: 'Circle take', value: 'circle-take' } },
  { phrase: 'circle takes', chip: { kind: 'flag', label: 'Circle take', value: 'circle-take' } },
  { phrase: 'circled', chip: { kind: 'flag', label: 'Circle take', value: 'circle-take' } },
  { phrase: 'key art', chip: { kind: 'flag', label: 'Key art', value: 'key-art' } },
  { phrase: 'keyart', chip: { kind: 'flag', label: 'Key art', value: 'key-art' } },
  { phrase: 'is final', chip: { kind: 'flag', label: 'Final', value: 'final' } },
  // Bare 'final' is matched LAST, after 'final cut' and 'is final' have had a chance.
  { phrase: 'final', chip: { kind: 'flag', label: 'Final', value: 'final' } },
]

/** Wildcard dimension aliases — matches bare plurals and "all X" forms. */
const HAS_ALIASES: Alias[] = [
  { phrase: 'all characters', chip: { kind: 'wildcard', label: 'All Characters', value: 'has-character' } },
  { phrase: 'characters', chip: { kind: 'wildcard', label: 'All Characters', value: 'has-character' } },
  { phrase: 'all scenes', chip: { kind: 'wildcard', label: 'All Scenes', value: 'has-scene' } },
  { phrase: 'scenes', chip: { kind: 'wildcard', label: 'All Scenes', value: 'has-scene' } },
  { phrase: 'all locations', chip: { kind: 'wildcard', label: 'All Locations', value: 'has-location' } },
  { phrase: 'locations', chip: { kind: 'wildcard', label: 'All Locations', value: 'has-location' } },
  { phrase: 'all episodes', chip: { kind: 'wildcard', label: 'All Episodes', value: 'has-episode' } },
  { phrase: 'episodes', chip: { kind: 'wildcard', label: 'All Episodes', value: 'has-episode' } },
  { phrase: 'all cuts', chip: { kind: 'wildcard', label: 'All Cuts', value: 'has-stage' } },
  { phrase: 'cuts', chip: { kind: 'wildcard', label: 'All Cuts', value: 'has-stage' } },
]

// === Core matching helpers ===

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function phrasePattern(phrase: string): RegExp {
  const tokens = phrase.toLowerCase().split(/\s+/).map(escapeRegex)
  return new RegExp(`(^|[^\\w])(${tokens.join('\\s+')})(?=[^\\w]|$)`, 'i')
}

/** Alias with its pattern pre-compiled and phrase sorted longest-first. */
type AliasWithPattern = Alias & { re: RegExp }

function prepareAliases(aliases: Alias[]): AliasWithPattern[] {
  return [...aliases]
    .sort((a, b) => b.phrase.length - a.phrase.length)
    .map(a => ({ ...a, re: phrasePattern(a.phrase) }))
}

// Pre-compiled at module load — sorting and regex compilation happen once, not per keystroke.
const COMPILED_STAGE = prepareAliases(STAGE_ALIASES)
const COMPILED_FLAGS = prepareAliases(FLAG_ALIASES.filter(a => a.phrase !== 'final'))
const COMPILED_BARE_FINAL = prepareAliases([FLAG_ALIASES[FLAG_ALIASES.length - 1]])
const COMPILED_HAS = prepareAliases(HAS_ALIASES)
const COMPILED_MEDIA_ASSET_TYPES = prepareAliases(MEDIA_ASSET_TYPE_ALIASES)
const COMPILED_DEPARTMENTS = prepareAliases(DEPARTMENT_ALIASES)
const COMPILED_ASSET_TYPES = prepareAliases(ASSET_TYPE_ALIASES)

/**
 * Try each (longest-first) alias in order. On the first hit, append the chip
 * and remove that span from the working string. Loops until no phrase matches,
 * so a query like 'Marco Vitale James Ashworth' picks up both characters.
 */
function consumeAliases(work: string, aliases: AliasWithPattern[], out: ParsedChip[]): string {
  let changed = true
  while (changed) {
    changed = false
    for (const alias of aliases) {
      const m = alias.re.exec(work)
      if (m) {
        // m[1] is the leading boundary char (possibly empty), m[2] is the
        // matched phrase exactly as the user typed it. Source = m[2] so chip
        // dismiss strips precisely what the user wrote.
        const source = m[2]
        work = work.slice(0, m.index + m[1].length) + ' ' + work.slice(m.index + m[0].length)
        out.push({ ...alias.chip, source } as ParsedChip)
        changed = true
        break
      }
    }
  }
  return work
}

/** Ontology aliases compiled once — character/scene/location names are stable per session. */
let _ontologyCache: AliasWithPattern[] | null = null
function ontologyAliases(): AliasWithPattern[] {
  if (_ontologyCache) return _ontologyCache
  const aliases: Alias[] = []
  for (const [name] of listNarrativeCharacters()) {
    aliases.push({ phrase: name, chip: { kind: 'character', label: name, value: name } })
  }
  for (const [name] of listNarrativeScenes()) {
    aliases.push({ phrase: name, chip: { kind: 'scene', label: name, value: name } })
  }
  for (const [name] of listNarrativeLocations()) {
    aliases.push({ phrase: name, chip: { kind: 'location', label: name, value: name } })
  }
  return (_ontologyCache = prepareAliases(aliases))
}

// === Pattern-based extraction (episode / camera / take) ===

/** Pull EP301-style and ep3/season patterns. Returns updated `work` + side-effects on `out`. */
function consumeEpisode(work: string, out: ParsedChip[]): string {
  // Explicit codes: EP301, EP3, EP 301 (case-insensitive)
  work = work.replace(/\b(ep)\s*(\d{1,3})\b/gi, (m0, _ep, num) => {
    const padded = num.length < 3 ? `EP3${num.padStart(2, '0')}` : `EP${num}`
    out.push({ kind: 'episode', label: padded, value: padded, source: m0 })
    return ' '
  })
  // 's3 e1' / 'season 3 episode 1' → EP301
  work = work.replace(/\bs(?:eason)?\s*(\d{1,2})\s*(?:[xe.]|ep(?:isode)?)\s*(\d{1,3})\b/gi, (m0, s, e) => {
    const code = `EP${s}${String(e).padStart(2, '0')}`
    out.push({ kind: 'episode', label: code, value: code, source: m0 })
    return ' '
  })
  // 'episode 3' (standalone — assume current season 3 in this prototype)
  work = work.replace(/\bepisode\s*(\d{1,3})\b/gi, (m0, e) => {
    const code = `EP3${String(e).padStart(2, '0')}`
    out.push({ kind: 'episode', label: code, value: code, source: m0 })
    return ' '
  })
  return work
}

/** Pull 'cam A' / 'camera B' / 'a-cam' / 'b cam' — letter A-Z. */
function consumeCamera(work: string, out: ParsedChip[]): string {
  // 'cam A' / 'camera A'
  work = work.replace(/\b(?:cam|camera)\s+([a-z])\b/gi, (m0, letter) => {
    const up = letter.toUpperCase()
    out.push({ kind: 'camera', label: `Camera ${up}`, value: up, source: m0 })
    return ' '
  })
  // 'A-cam' / 'A cam'
  work = work.replace(/\b([a-z])[-\s]+cam\b/gi, (m0, letter) => {
    const up = letter.toUpperCase()
    out.push({ kind: 'camera', label: `Camera ${up}`, value: up, source: m0 })
    return ' '
  })
  return work
}

/** Pull 'take 3' / 'take B' / 't3'. */
function consumeTake(work: string, out: ParsedChip[]): string {
  work = work.replace(/\btake\s+(\d+|[a-z])\b/gi, (m0, v) => {
    const value = isNaN(Number(v)) ? String(v).toUpperCase() : String(v)
    out.push({ kind: 'take', label: `Take ${value}`, value, source: m0 })
    return ' '
  })
  return work
}

// === Chip → AssetFilter projection ===

/**
 * Collapse chips into a single AssetFilter. Multiple chips of the same kind
 * combine per AssetFilter's existing semantics:
 *   - character chips → aiCharacters (intersection OR within the field)
 *   - type chips → types[] (OR within field, but AND with other filters)
 *   - scene/location/department: AssetFilter only supports one; later chip wins
 *     (UI should de-dup at chip-add time).
 */
export function chipsToFilter(chips: ParsedChip[], freeText: string): AssetFilter {
  const filter: AssetFilter = {}
  if (freeText.trim()) filter.query = freeText.trim()

  const characters: string[] = []
  const locations: string[] = []
  const scenes: string[] = []
  const episodes: string[] = []
  const stages: string[] = []
  const types: AssetType[] = []
  const typeTags: string[] = []

  for (const chip of chips) {
    switch (chip.kind) {
      case 'character':
        characters.push(chip.value)
        break
      case 'scene':
        scenes.push(chip.value)
        break
      case 'location':
        locations.push(chip.value)
        break
      case 'episode':
        episodes.push(chip.value)
        break
      case 'type':
        if (!types.includes(chip.value)) types.push(chip.value)
        break
      case 'mediaAssetType':
        // Stored as typeTag for matchesFilter (typeTags whitelist hits the
        // per-format typeTag fields). When asset.mediaAssetType is set
        // directly, the query corpus picks it up too.
        if (!typeTags.includes(chip.value)) typeTags.push(chip.value)
        break
      case 'department':
        filter.department = chip.value
        break
      case 'stage':
        stages.push(chip.value)
        break
      case 'camera':
        filter.shotCamera = chip.value
        break
      case 'take':
        filter.shotTake = chip.value
        break
      case 'flag':
        if (chip.value === 'final') filter.isFinal = true
        else if (chip.value === 'circle-take') filter.isCircleTake = true
        else if (chip.value === 'key-art') filter.isKeyArt = true
        break
      case 'wildcard':
        if (chip.value === 'has-character') filter.aiHasCharacters = true
        else if (chip.value === 'has-scene') filter.aiHasScene = true
        else if (chip.value === 'has-location') filter.aiHasLocation = true
        else if (chip.value === 'has-episode') filter.hasEpisode = true
        else if (chip.value === 'has-stage') filter.hasStage = true
        break
    }
  }

  if (characters.length > 0) filter.aiCharacters = characters
  if (locations.length === 1) filter.aiLocation = locations[0]
  else if (locations.length > 1) filter.aiLocation = locations
  if (scenes.length === 1) filter.aiScene = scenes[0]
  else if (scenes.length > 1) filter.aiScene = scenes
  if (episodes.length === 1) filter.episode = episodes[0]
  else if (episodes.length > 1) filter.episode = episodes
  if (stages.length === 1) filter.stage = stages[0] as import('@/lib/data-client').CutStage
  else if (stages.length > 1) filter.stage = stages as import('@/lib/data-client').CutStage[]
  if (types.length > 0) filter.types = types
  if (typeTags.length > 0) filter.typeTags = typeTags

  return filter
}

// === Public entry ===

/**
 * Parse a raw query into chips + freeText + projected AssetFilter.
 * The parse is deterministic and self-contained — no I/O, no DOM.
 */
export function parseQuery(raw: string): ParsedQuery {
  const chips: ParsedChip[] = []
  let work = ` ${raw} ` // pad so leading/trailing word boundaries work

  // Order matters: longest, most-specific phrases first.
  // 1. Ontology entities (full names — e.g. 'Marco Vitale', 'INT. APEX GARAGE - RACE DAY', 'Pit Lane')
  work = consumeAliases(work, ontologyAliases(), chips)
  // 2. Multi-word stage + flag phrases ('final cut' / 'circle take' / 'key art' / 'is final')
  work = consumeAliases(work, COMPILED_STAGE, chips)
  work = consumeAliases(work, COMPILED_FLAGS, chips)
  // 2b. Wildcard dimension phrases ('any character', 'any episode', etc.)
  work = consumeAliases(work, COMPILED_HAS, chips)
  // 3. Patterns
  work = consumeEpisode(work, chips)
  work = consumeCamera(work, chips)
  work = consumeTake(work, chips)
  // 4. Media-asset-type phrases (sorted longest-first)
  work = consumeAliases(work, COMPILED_MEDIA_ASSET_TYPES, chips)
  // 5. Departments (multi-word forms win over ambiguous single tokens)
  work = consumeAliases(work, COMPILED_DEPARTMENTS, chips)
  // 6. Asset types (after media-asset-type so 'storyboard' isn't lost)
  work = consumeAliases(work, COMPILED_ASSET_TYPES, chips)
  // 7. Bare 'final' — only fires if 'final cut' / 'is final' didn't claim it.
  work = consumeAliases(work, COMPILED_BARE_FINAL, chips)

  const freeText = work.replace(/\s+/g, ' ').trim()
  const filter = chipsToFilter(chips, freeText)
  return { raw, freeText, chips, filter }
}

// === Input-string helpers (for chip dismiss + click-to-pin) ===

/**
 * Remove a chip's source span from a query string, preserving the surrounding
 * text. Tolerant of extra whitespace produced by the strip. Case-insensitive
 * because the user may have typed in any case.
 */
export function removeChipFromQuery(query: string, chip: ParsedChip): string {
  if (!chip.source) return query
  const re = new RegExp(`\\s*${escapeRegex(chip.source)}\\s*`, 'i')
  return query.replace(re, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Append a canonical phrase to a query, ensuring a single space separator and
 * idempotency (no-op if the canonical phrase is already a substring).
 */
export function addPhraseToQuery(query: string, phrase: string): string {
  const trimmed = query.trim()
  // Idempotent: if the phrase is already present (case-insensitive whole match), bail.
  const haystack = ` ${trimmed.toLowerCase()} `
  const needle = ` ${phrase.toLowerCase()} `
  if (haystack.includes(needle)) return trimmed
  return trimmed.length === 0 ? phrase : `${trimmed} ${phrase}`
}

/**
 * Replace the trailing unparsed text with a canonical suggestion. If the parsed
 * free text is not actually at the end anymore, append the suggestion instead
 * of removing a matching substring from an earlier chip/source phrase.
 */
export function replaceTrailingFreeText(query: string, freeText: string, phrase: string): string {
  const trimmed = query.trim()
  const trailing = freeText.trim()
  if (!trailing) return addPhraseToQuery(trimmed, phrase)

  const lower = trimmed.toLowerCase()
  const trailingLower = trailing.toLowerCase()
  if (!lower.endsWith(trailingLower)) {
    return addPhraseToQuery(trimmed, phrase)
  }

  const base = trimmed.slice(0, trimmed.length - trailing.length).trim()
  return base ? `${base} ${phrase}` : phrase
}
