/**
 * synonyms — hand-curated expansions for free-text search.
 *
 * Approach: every entry maps one "natural" word a user might type to the words
 * the AI-tag vocabulary actually uses (see `ai-tags.ts` keywords inventory).
 * Expansion is one-way; we run it once before scoring so a query for `crash`
 * also scores assets tagged `wreck`, `collision`, or `pile-up`.
 *
 * Keep the map small and high-signal. Adding a noisy synonym is worse than
 * leaving the word alone — the scorer already does substring matching.
 */

const RAW: Record<string, string[]> = {
  // Action / drama
  crash: ['crash', 'wreck', 'collision', 'pile-up', 'accident', 'incident'],
  wreck: ['wreck', 'crash', 'collision'],
  collision: ['collision', 'crash', 'wreck'],

  intense: ['intense', 'tense', 'dramatic', 'heated'],
  tense: ['tense', 'intense', 'dramatic'],
  dramatic: ['dramatic', 'intense', 'tense', 'emotional'],
  emotional: ['emotional', 'intense', 'dramatic'],
  angry: ['angry', 'heated', 'argument', 'confrontation'],
  argument: ['argument', 'confrontation', 'heated'],

  // Racing-specific
  pitstop: ['pit stop', 'pit lane', 'pit crew', 'pit entry', 'pit exit'],
  'pit stop': ['pit stop', 'pit lane', 'pit crew'],
  overtake: ['overtake', 'pass', 'wheel to wheel', 'battle'],
  pass: ['pass', 'overtake'],
  battle: ['battle', 'wheel to wheel', 'overtake', 'duel'],
  lap: ['lap', 'circuit', 'track'],
  podium: ['podium', 'trophy', 'celebration', 'champagne'],
  victory: ['victory', 'podium', 'celebration', 'champagne', 'trophy'],
  celebrate: ['celebrate', 'celebration', 'champagne', 'trophy'],
  celebration: ['celebration', 'celebrate', 'champagne', 'trophy'],

  // Time-of-day / lighting
  night: ['night', 'dark', 'floodlights'],
  dark: ['dark', 'night'],
  day: ['day', 'day exterior', 'daylight'],
  sunset: ['sunset', 'golden hour'],
  dusk: ['dusk', 'sunset', 'golden hour'],
  dawn: ['dawn', 'sunrise'],
  sunrise: ['sunrise', 'dawn'],
  golden: ['golden hour', 'sunset'],

  // Weather / atmosphere
  rain: ['rain', 'wet', 'wet racing'],
  wet: ['wet', 'rain', 'wet racing'],
  fog: ['fog', 'mist'],
  smoke: ['smoke', 'plumes', 'tire smoke', 'orange smoke'],
  dust: ['dust', 'spray'],

  // Camera / framing
  closeup: ['close-up', 'medium shot', 'portrait'],
  'close-up': ['close-up', 'closeup'],
  wide: ['wide', 'wide shot', 'establishing'],
  establishing: ['establishing', 'wide shot', 'wide'],
  hero: ['hero', 'hero moment'],
  reaction: ['reaction', 'two-shot'],

  // Production / pipeline
  comp: ['comp', 'compositing', 'composite', 'vfx comp'],
  composite: ['composite', 'comp', 'compositing'],
  compositing: ['compositing', 'comp', 'composite'],
  plate: ['plate', 'clean plate', 'vfx plate'],
  cleanplate: ['clean plate', 'plate'],
  cg: ['cg', 'cgi', '3d', 'vfx'],
  vfx: ['vfx', 'cg', 'composite', 'comp'],
  cut: ['cut', 'editorial cut', 'final cut', 'locked cut', 'rough cut'],
  reel: ['reel', 'selects reel'],
  dailies: ['dailies', 'dailies-proxy', 'camera original'],
  proxy: ['proxy', 'dailies-proxy', 'dailies'],
  storyboard: ['storyboard', 'board', 'animatic'],
  board: ['board', 'storyboard'],
  animatic: ['animatic', 'storyboard'],
  concept: ['concept', 'concept art', 'mood board'],
  reference: ['reference', 'mood board', 'lookbook', 'inspiration'],
  lookbook: ['lookbook', 'mood board', 'reference'],
  mood: ['mood', 'mood board', 'tone'],

  // Audio
  music: ['music', 'score', 'cue', 'needle drop'],
  sound: ['sound', 'sfx', 'foley', 'ambience'],
  dialogue: ['dialogue', 'adr', 'voice'],
  voice: ['voice', 'dialogue', 'adr'],
  mix: ['mix', 'sound mix', 'final mix', 'delivery mix'],
  ambience: ['ambience', 'atmos', 'atmosphere'],
  atmosphere: ['atmosphere', 'ambience', 'atmos'],

  // Domain words
  car: ['car', 'ar-24', 'vehicle', 'livery'],
  cars: ['cars', 'car', 'vehicle'],
  livery: ['livery', 'car', 'team wear'],
  helmet: ['helmet', 'visor', 'helmet cam', 'helmet on', 'helmet off'],
  garage: ['garage', 'pit wall', 'pit lane'],
  strategy: ['strategy', 'strategy call', 'pit wall'],
  team: ['team', 'crew', 'pit crew', 'team radio'],
  crew: ['crew', 'pit crew', 'team'],
  radio: ['radio', 'team radio', 'radio chatter', 'radio call'],
}

/** Memoized normalized map: lowercase key → lowercase expansion words. */
const SYNONYMS: Map<string, string[]> = new Map()
for (const [k, v] of Object.entries(RAW)) {
  SYNONYMS.set(k.toLowerCase(), v.map(s => s.toLowerCase()))
}

/**
 * Expand a free-text string into a list of search terms.
 * Always includes the original tokens; adds synonym expansions for any token
 * (or two-word phrase) that has a mapping. De-duped, lowercase.
 */
export function expandTerms(freeText: string): string[] {
  if (!freeText.trim()) return []
  const normalized = freeText.toLowerCase().trim()
  const tokens = normalized.split(/\s+/)
  const out = new Set<string>(tokens)

  // Single-token expansions
  for (const t of tokens) {
    const exp = SYNONYMS.get(t)
    if (exp) exp.forEach(e => out.add(e))
  }
  // Two-token phrase expansions ('pit stop', 'close-up' as two tokens, etc.)
  for (let i = 0; i < tokens.length - 1; i++) {
    const phrase = `${tokens[i]} ${tokens[i + 1]}`
    const exp = SYNONYMS.get(phrase)
    if (exp) exp.forEach(e => out.add(e))
  }
  return Array.from(out)
}

/** Exposed for tests / introspection. */
export function getSynonymMap(): ReadonlyMap<string, readonly string[]> {
  return SYNONYMS
}
