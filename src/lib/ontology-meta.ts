/**
 * Ontology metadata — enriched context for the entities that make up a production.
 *
 * Three layers, each modeling a different stage of the production pipeline:
 *
 *   Narrative   — abstractions from the script (Character, Scene, Location)
 *   Production  — what was actually shot (Shot, Scene)
 *   CG          — what was built in VFX (Shot, Sequence)
 *   Edit        — what was assembled in post (Shot, Scene, Sequence)
 *
 * Cross-layer references stitch the graph together: a Narrative Scene can have
 * multiple Production Scenes (shoot days), each with several Production Shots,
 * some replaced by CG Shots, eventually assembled into an Edit Scene that sits
 * in an Edit Sequence (the episode-as-deliverable).
 *
 * In production this would come from script breakdowns, production databases,
 * VFX pipelines, and edit decision lists. Here we seed representative data.
 */

// === NARRATIVE LAYER ===

export type NarrativeCharacterMeta = {
  bio: string
  role: 'lead' | 'supporting' | 'recurring' | 'guest'
  episodes: string[]
  notes?: string
}

export type NarrativeSceneMeta = {
  description: string
  episode: string
  pageRange?: string
  timeOfDay?: string
  mood?: string
  notes?: string
}

export type NarrativeLocationMeta = {
  description: string
  setting: 'interior' | 'exterior' | 'mixed'
  episodes: string[]
  notes?: string
}

// === PRODUCTION LAYER ===

export type ProductionSceneMeta = {
  /** Parent narrative scene (key into NARRATIVE_SCENES). */
  narrativeScene: string
  episode: string
  shootDay?: number
  shootDate?: string
  unit?: '1st unit' | '2nd unit' | 'splinter' | 'visual effects' | string
  /** Brief description of this shoot setup. */
  description?: string
  notes?: string
}

export type ProductionShotMeta = {
  /** Parent production scene key. */
  productionScene: string
  /** Convenience: parent narrative scene (denormalized for fast lookups). */
  narrativeScene: string
  episode: string
  /** Take number within this setup. */
  take: number
  /** Camera designation, e.g. 'A', 'B', 'C'. */
  camera: string
  /** Circled (best) take. */
  circle?: boolean
  lens?: string
  description?: string
  notes?: string
}

// === CG LAYER ===

export type CGSequenceMeta = {
  /** Parent narrative scene this CG sequence belongs to. */
  narrativeScene: string
  episode: string
  vendor?: string
  description?: string
  status?: 'concept' | 'previs' | 'in-progress' | 'final'
  notes?: string
}

export type CGShotMeta = {
  /** Parent narrative scene. */
  narrativeScene: string
  /** Parent CG sequence (optional — not every CG shot is part of a sequence). */
  cgSequence?: string
  /** If this CG shot replaces or augments a production shot. */
  replacesProductionShot?: string
  episode: string
  status: 'concept' | 'previs' | 'in-progress' | 'final'
  version: number
  vendor?: string
  description?: string
  notes?: string
}

// === EDIT LAYER ===

export type EditSequenceMeta = {
  /** The episode this sequence is the assembly for. */
  episode: string
  /** Friendly display name, e.g. "EP301 Locked Cut 3". Falls back to the key. */
  name?: string
  /** Cut stage in the editorial progression (matches prototype CutStage values). */
  stage?: 'locked-cut' | 'final-cut' | 'emf'
  /** Cut authorship type — orthogonal to stage. */
  cutType?: 'editor' | 'directors' | 'producers' | 'network' | 'final' | string
  version?: number
  description?: string
  notes?: string
}

export type EditSceneMeta = {
  /** Parent narrative scene. */
  narrativeScene: string
  /** Parent edit sequence (the cut this scene is part of). */
  editSequence?: string
  episode: string
  description?: string
  notes?: string
}

export type EditShotMeta = {
  /** Parent edit scene. */
  editScene?: string
  /** Source: production shot OR CG shot. */
  productionShot?: string
  cgShot?: string
  /** Convenience: parent narrative scene (denormalized). */
  narrativeScene: string
  episode: string
  /** Timecode in/out within the assembly. */
  inPoint?: string
  outPoint?: string
  description?: string
  notes?: string
}

// === DISCRIMINATED UNION ===

export type OntologyMeta =
  // Narrative layer — short discriminators match existing seed icon strings.
  | { type: 'character'; data: NarrativeCharacterMeta }
  | { type: 'scene'; data: NarrativeSceneMeta }
  | { type: 'location'; data: NarrativeLocationMeta }
  // Production
  | { type: 'production-scene'; data: ProductionSceneMeta }
  | { type: 'production-shot'; data: ProductionShotMeta }
  // CG
  | { type: 'cg-sequence'; data: CGSequenceMeta }
  | { type: 'cg-shot'; data: CGShotMeta }
  // Edit
  | { type: 'edit-sequence'; data: EditSequenceMeta }
  | { type: 'edit-scene'; data: EditSceneMeta }
  | { type: 'edit-shot'; data: EditShotMeta }

// Characters

const CHARACTERS: Record<string, NarrativeCharacterMeta> = {
  'Luca Ferreira': {
    bio: 'Second-year driver for Apex Racing, fighting to prove he belongs at the front of the grid. Brazilian-Italian heritage, intensely competitive but privately struggling with the pressure of replacing a fan-favorite driver mid-season.',
    role: 'lead',
    episodes: ['EP301', 'EP302', 'EP303', 'EP304', 'EP305', 'EP306'],
    notes: 'Helmet cam rig required for cockpit POV sequences. Stunt double cleared for Ep305 crash.',
  },
  'Marco Vitale': {
    bio: 'Veteran team principal of Apex Racing, navigating the politics of a title fight while managing a volatile driver pairing. Italian, mid-50s, old-school racing mentality clashing with modern corporate ownership.',
    role: 'lead',
    episodes: ['EP301', 'EP302', 'EP303', 'EP304', 'EP305', 'EP306'],
  },
  'James Ashworth': {
    bio: 'Reigning world champion and Apex Racing\'s number-one driver. British, calm under pressure, but increasingly threatened by his new teammate\'s raw pace. His controlled exterior hides a ruthless competitor.',
    role: 'lead',
    episodes: ['EP301', 'EP302', 'EP303', 'EP305', 'EP306'],
  },
  'Elena Richter': {
    bio: 'Chief strategist at Apex Racing. German-Austrian, data-driven and politically savvy. Caught between loyalty to Ashworth and the team\'s best interests as Ferreira outperforms expectations.',
    role: 'supporting',
    episodes: ['EP301', 'EP302', 'EP303', 'EP304', 'EP306'],
    notes: 'War room monitors need real telemetry graphics overlay — coordinate with VFX.',
  },
  'Frank Castellano': {
    bio: 'CEO of Castellano Motors, the parent company bankrolling Apex Racing. American-Italian, a disruptive tech billionaire who treats the team like a Silicon Valley startup. His interference threatens the racing operation.',
    role: 'supporting',
    episodes: ['EP301', 'EP303', 'EP304', 'EP306'],
  },
  'Viktor Dragan': {
    bio: 'Lead driver for rival team Titan Motorsport. Serbian, cold and calculating on track, known for aggressive defensive driving that walks the line of legality. Has unfinished business with Ashworth from last season.',
    role: 'recurring',
    episodes: ['EP302', 'EP305', 'EP306'],
  },
  'AR-24': {
    bio: 'Apex Racing\'s 2024 challenger — the car itself, designated AR-24. A carbon fiber protagonist in its own right, tagged by the AI pipeline whenever the livery is identifiable on screen regardless of driver.',
    role: 'recurring',
    episodes: ['EP301', 'EP302', 'EP303', 'EP305', 'EP306'],
    notes: 'AI identifies car by livery pattern, not driver. Multiple hero car builds exist — confirm which chassis for continuity.',
  },
}

// Scenes

const SCENES: Record<string, NarrativeSceneMeta> = {
  'EXT. GRID WALK - PRE-RACE': {
    description: 'The electric atmosphere of the grid 30 minutes before lights out. Drivers navigate through journalists, celebrities, and team personnel. Key character introductions and tension-setting through overheard radio checks.',
    episode: 'EP301',
    pageRange: 'pp. 1–8',
    timeOfDay: 'Day',
    mood: 'Anticipation, controlled chaos',
  },
  'INT. APEX GARAGE - RACE DAY': {
    description: 'The nerve center of the team during a race weekend. Banks of monitors, strategy screens, and the deafening sound of engines bleeding through the walls. Where the real decisions are made under extreme time pressure.',
    episode: 'EP301',
    pageRange: 'pp. 12–18',
    timeOfDay: 'Day',
    mood: 'High tension, clinical focus',
    notes: 'Practical lighting from monitor screens. Need clearance for smoke/haze in background.',
  },
  'EXT. PADDOCK - POST-RACE': {
    description: 'The decompression zone after the checkered flag. A mix of celebration and devastation, media scrums and private moments. The paddock reveals character through how each person handles the result.',
    episode: 'EP301',
    pageRange: 'pp. 42–48',
    timeOfDay: 'Golden hour',
    mood: 'Emotional release, exhaustion',
  },
  'INT. MERCEDES MOTORHOME - DEBRIEF': {
    description: 'A sterile, corporate meeting room where the team dissects what went wrong. Glass walls, fluorescent light, uncomfortable silences. The politics of blame unfold behind closed doors.',
    episode: 'EP302',
    pageRange: 'pp. 3–7',
    timeOfDay: 'Night',
    mood: 'Confrontational, claustrophobic',
  },
  'EXT. CIRCUIT - LAP 52': {
    description: 'The decisive moment of the race. High-speed wheel-to-wheel combat through a technical section. The outcome reshapes the championship and relationships within the team.',
    episode: 'EP303',
    pageRange: 'pp. 28–34',
    timeOfDay: 'Day',
    mood: 'Maximum intensity, danger',
    notes: 'Requires full VFX car compositing. Plate shots at Silverstone.',
  },
  'INT. FIA STEWARDS ROOM - PENALTY HEARING - RACE DAY': {
    description: 'A windowless room where three stewards review onboard footage and telemetry data to adjudicate a controversial racing incident. The accused driver and team representative present their case.',
    episode: 'EP303',
    pageRange: 'pp. 35–39',
    timeOfDay: 'Day',
    mood: 'Judicial, tense',
  },
  'EXT. SILVERSTONE CIRCUIT PIT STRAIGHT GRANDSTAND - CONTINUOUS': {
    description: 'The roar of a home crowd as cars blast past the main grandstand. Union flags, air horns, the visceral experience of speed from the spectator\'s perspective.',
    episode: 'EP305',
    pageRange: 'pp. 14–16',
    timeOfDay: 'Day',
    mood: 'Euphoric, patriotic',
  },
  'INT. PADDOCK CLUB VIP HOSPITALITY - DRIVERS PARADE LOUNGE - RACE DAY': {
    description: 'The gilded cage of F1\'s upper echelon. Sponsors, celebrities, and team owners circulate with champagne while the real power plays happen in quiet corners.',
    episode: 'EP304',
    pageRange: 'pp. 8–14',
    timeOfDay: 'Day',
    mood: 'Performative luxury, undercurrents',
  },
  'EXT. ABU DHABI MARINA CIRCUIT - CHAMPIONSHIP DECIDER - SUNSET': {
    description: 'The season finale under fading desert light. The circuit transforms from daylight to floodlit as the championship hangs in the balance. Every lap carries the weight of an entire season.',
    episode: 'EP306',
    pageRange: 'pp. 22–45',
    timeOfDay: 'Day to night',
    mood: 'Epic, decisive, bittersweet',
    notes: 'Day-to-night transition is critical. VFX sky replacement for continuity.',
  },
}

// Locations

const LOCATIONS: Record<string, NarrativeLocationMeta> = {
  'Pit Lane': {
    description: 'The narrow corridor of controlled chaos where pit stops happen in under two seconds. A place of mechanical precision and human error, separated from the track by a low wall and a world of consequences.',
    setting: 'exterior',
    episodes: ['EP301', 'EP302', 'EP303', 'EP305', 'EP306'],
    notes: 'Practical pit equipment rented from working F1 teams. Safety crew on standby.',
  },
  'Apex Garage': {
    description: 'Apex Racing\'s mobile headquarters — a pristine, white-walled workspace filled with carbon fiber, screens, and the low hum of data analysis. Each race weekend it transforms into a pressure cooker.',
    setting: 'interior',
    episodes: ['EP301', 'EP302', 'EP303', 'EP304', 'EP305', 'EP306'],
  },
  'Paddock Club': {
    description: 'The exclusive hospitality area behind the pit buildings. Corporate suites, champagne bars, and the best view money can buy. Where business deals and personal betrayals happen at 200mph.',
    setting: 'interior',
    episodes: ['EP301', 'EP304', 'EP306'],
  },
  'FIA Stewards Office': {
    description: 'A deliberately austere room designed to strip away the glamour. Functional furniture, multiple screens for replay analysis, and the weight of regulations that govern the sport.',
    setting: 'interior',
    episodes: ['EP303', 'EP305'],
  },
  'Zandvoort Circuit': {
    description: 'A classic European circuit nestled in the Dutch sand dunes. Banked corners, tight barriers, and an atmosphere of orange-clad fans that creates one of the most intense environments in motorsport.',
    setting: 'exterior',
    episodes: ['EP302', 'EP303'],
  },
  'Monaco': {
    description: 'The jewel in the calendar — narrow streets, harbor views, and the constant threat of the barriers. Where the world\'s wealthiest watch from their yachts and drivers earn their reputation.',
    setting: 'exterior',
    episodes: ['EP304'],
    notes: 'Limited shooting days. Plate photography completed; VFX extension for crowd and yacht basin.',
  },
}

// === PRODUCTION SCENES ===
// A narrative scene can have multiple production scenes (shoot days, setups).
// Keyed by a code that captures episode + scene + setup.

const PRODUCTION_SCENES: Record<string, ProductionSceneMeta> = {
  'EP301-S05-D03': {
    narrativeScene: 'INT. APEX GARAGE - RACE DAY',
    episode: 'EP301',
    shootDay: 3,
    shootDate: '2026-02-14',
    unit: '1st unit',
    description: 'Garage interior, race day. Telemetry monitors live, full crew dressing.',
  },
  'EP303-S52-D11': {
    narrativeScene: 'EXT. CIRCUIT - LAP 52',
    episode: 'EP303',
    shootDay: 11,
    shootDate: '2026-03-04',
    unit: '2nd unit',
    description: 'Plate photography at Silverstone for the wheel-to-wheel sequence.',
    notes: 'No drivers in car for plate run. Tracking markers in place.',
  },
  'EP306-S22-D18': {
    narrativeScene: 'EXT. ABU DHABI MARINA CIRCUIT - CHAMPIONSHIP DECIDER - SUNSET',
    episode: 'EP306',
    shootDay: 18,
    shootDate: '2026-04-22',
    unit: '1st unit',
    description: 'Sunset principal photography, championship decider. Two-camera setup on the start/finish straight.',
  },
}

// === PRODUCTION SHOTS ===
// Take-level granularity beneath production scenes.

const PRODUCTION_SHOTS: Record<string, ProductionShotMeta> = {
  'EP301-S05-T03A': {
    productionScene: 'EP301-S05-D03',
    narrativeScene: 'INT. APEX GARAGE - RACE DAY',
    episode: 'EP301',
    take: 3,
    camera: 'A',
    circle: true,
    lens: '32mm',
    description: 'Marco at strategy wall, master angle.',
  },
  'EP301-S05-T03B': {
    productionScene: 'EP301-S05-D03',
    narrativeScene: 'INT. APEX GARAGE - RACE DAY',
    episode: 'EP301',
    take: 3,
    camera: 'B',
    circle: false,
    lens: '85mm',
    description: 'Tight on Marco — reaction coverage.',
  },
  'EP303-S52-T07A': {
    productionScene: 'EP303-S52-D11',
    narrativeScene: 'EXT. CIRCUIT - LAP 52',
    episode: 'EP303',
    take: 7,
    camera: 'A',
    circle: true,
    lens: '50mm',
    description: 'Plate run, hero car through Maggotts-Becketts.',
  },
}

// === CG SEQUENCES ===

const CG_SEQUENCES: Record<string, CGSequenceMeta> = {
  'VFX_EP303_LAP52': {
    narrativeScene: 'EXT. CIRCUIT - LAP 52',
    episode: 'EP303',
    vendor: 'Framestore',
    description: 'Wheel-to-wheel CG car compositing across the wheel-to-wheel section. Hero cars + tire smoke + crowd extension.',
    status: 'in-progress',
  },
  'VFX_EP306_SKY': {
    narrativeScene: 'EXT. ABU DHABI MARINA CIRCUIT - CHAMPIONSHIP DECIDER - SUNSET',
    episode: 'EP306',
    vendor: 'DNEG',
    description: 'Day-to-night sky replacement and stadium lighting integration.',
    status: 'previs',
    notes: 'Critical for continuity through the championship-decider montage.',
  },
}

// === CG SHOTS ===

const CG_SHOTS: Record<string, CGShotMeta> = {
  'VFX_EP303_SC52_001': {
    narrativeScene: 'EXT. CIRCUIT - LAP 52',
    cgSequence: 'VFX_EP303_LAP52',
    replacesProductionShot: 'EP303-S52-T07A',
    episode: 'EP303',
    status: 'in-progress',
    version: 4,
    vendor: 'Framestore',
    description: 'Hero car CG composite over Silverstone plate. Tire smoke and heat haze added.',
  },
  'VFX_EP303_SC52_002': {
    narrativeScene: 'EXT. CIRCUIT - LAP 52',
    cgSequence: 'VFX_EP303_LAP52',
    episode: 'EP303',
    status: 'previs',
    version: 1,
    vendor: 'Framestore',
    description: 'Wide aerial CG car pass, no plate reference.',
  },
  'VFX_EP306_SKY_011': {
    narrativeScene: 'EXT. ABU DHABI MARINA CIRCUIT - CHAMPIONSHIP DECIDER - SUNSET',
    cgSequence: 'VFX_EP306_SKY',
    episode: 'EP306',
    status: 'concept',
    version: 1,
    vendor: 'DNEG',
    description: 'Sky replacement, marina lights coming up as light fades.',
  },
}

// === EDIT SEQUENCES ===
// The top-level assembly. EP301's final sequence IS the cut that becomes the episode.

/**
 * Edit Sequence Concepts — bound 1:1 to the cut folders in the editorial
 * workspace. Identity (stage, version, description) lives here on the Concept.
 * The folder (Concept-Asset Collection) and its file children (Media Assets)
 * are wired up in prototype-assets.ts.
 *
 * Keys mirror the scenario cut IDs so a Concept and its corresponding cut
 * Asset record share a single name.
 */
const EDIT_SEQUENCES: Record<string, EditSequenceMeta> = {
  'cut-ep301-lc-1': {
    episode: 'EP301',
    name: 'EP301 Locked Cut 1',
    stage: 'locked-cut',
    version: 1,
    description: "Initial picture lock; temp sound/music, no VFX.",
  },
  'cut-ep301-lc-2': {
    episode: 'EP301',
    name: 'EP301 Locked Cut 2',
    stage: 'locked-cut',
    version: 2,
    description: "Updated picture per David's pacing notes; added score cues for race sequences.",
  },
  'cut-ep301-lc-3': {
    episode: 'EP301',
    name: 'EP301 Locked Cut 3',
    stage: 'locked-cut',
    version: 3,
    description: 'Updated picture & subtitles; temp sound/music/ADR/VFX.',
  },
  'cut-ep301-fc': {
    episode: 'EP301',
    name: 'EP301 Final Cut',
    stage: 'final-cut',
    version: 1,
    description: 'Final picture and sound; all VFX final; approved for delivery.',
  },
  'cut-ep301-emf': {
    episode: 'EP301',
    name: 'EP301 EMF',
    stage: 'emf',
    version: 1,
    description: 'Delivery master; includes textless elements for localization.',
  },
  'cut-ep302-lc-1': {
    episode: 'EP302',
    name: 'EP302 Locked Cut 1',
    stage: 'locked-cut',
    version: 1,
    description: 'Initial lock; temp sound only, no VFX.',
  },
}

// === EDIT SCENES ===

// Empty for now — Edit Scenes (sub-divisions of an Edit Sequence) aren't
// modeled at this level of the prototype. Type machinery stays in place so
// the layer can be populated when needed.
const EDIT_SCENES: Record<string, EditSceneMeta> = {}

// === EDIT SHOTS ===

// Empty for now — Edit Shots (timeline-level grains within an Edit Scene) aren't
// modeled at this level of the prototype. Type machinery stays in place.
const EDIT_SHOTS: Record<string, EditShotMeta> = {}

// === LOOKUP ===

export function getOntologyMeta(name: string, icon: string): OntologyMeta | null {
  // Narrative
  if (icon === 'character' && CHARACTERS[name]) {
    return { type: 'character', data: CHARACTERS[name] }
  }
  if (icon === 'scene' && SCENES[name]) {
    return { type: 'scene', data: SCENES[name] }
  }
  if (icon === 'location' && LOCATIONS[name]) {
    return { type: 'location', data: LOCATIONS[name] }
  }
  // Production
  if (icon === 'production-scene' && PRODUCTION_SCENES[name]) {
    return { type: 'production-scene', data: PRODUCTION_SCENES[name] }
  }
  if (icon === 'production-shot' && PRODUCTION_SHOTS[name]) {
    return { type: 'production-shot', data: PRODUCTION_SHOTS[name] }
  }
  // CG
  if (icon === 'cg-sequence' && CG_SEQUENCES[name]) {
    return { type: 'cg-sequence', data: CG_SEQUENCES[name] }
  }
  if (icon === 'cg-shot' && CG_SHOTS[name]) {
    return { type: 'cg-shot', data: CG_SHOTS[name] }
  }
  // Edit
  if (icon === 'edit-sequence' && EDIT_SEQUENCES[name]) {
    return { type: 'edit-sequence', data: EDIT_SEQUENCES[name] }
  }
  if (icon === 'edit-scene' && EDIT_SCENES[name]) {
    return { type: 'edit-scene', data: EDIT_SCENES[name] }
  }
  if (icon === 'edit-shot' && EDIT_SHOTS[name]) {
    return { type: 'edit-shot', data: EDIT_SHOTS[name] }
  }
  return null
}

// Convenience accessors for the new entity dictionaries.

export function getProductionScene(key: string): ProductionSceneMeta | undefined {
  return PRODUCTION_SCENES[key]
}

export function getProductionShot(key: string): ProductionShotMeta | undefined {
  return PRODUCTION_SHOTS[key]
}

export function getCGSequence(key: string): CGSequenceMeta | undefined {
  return CG_SEQUENCES[key]
}

export function getCGShot(key: string): CGShotMeta | undefined {
  return CG_SHOTS[key]
}

export function getEditSequence(key: string): EditSequenceMeta | undefined {
  return EDIT_SEQUENCES[key]
}

export function getEditScene(key: string): EditSceneMeta | undefined {
  return EDIT_SCENES[key]
}

export function getEditShot(key: string): EditShotMeta | undefined {
  return EDIT_SHOTS[key]
}

// Bulk listings — useful for browse routes.

export function listProductionScenes(): Array<[string, ProductionSceneMeta]> {
  return Object.entries(PRODUCTION_SCENES)
}

export function listProductionShots(): Array<[string, ProductionShotMeta]> {
  return Object.entries(PRODUCTION_SHOTS)
}

export function listCGSequences(): Array<[string, CGSequenceMeta]> {
  return Object.entries(CG_SEQUENCES)
}

export function listCGShots(): Array<[string, CGShotMeta]> {
  return Object.entries(CG_SHOTS)
}

export function listEditSequences(): Array<[string, EditSequenceMeta]> {
  return Object.entries(EDIT_SEQUENCES)
}

export function listEditScenes(): Array<[string, EditSceneMeta]> {
  return Object.entries(EDIT_SCENES)
}

export function listEditShots(): Array<[string, EditShotMeta]> {
  return Object.entries(EDIT_SHOTS)
}
