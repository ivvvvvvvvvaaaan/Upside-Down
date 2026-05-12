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
}

export type NarrativeSceneMeta = {
  description: string
  episode: string
  pageRange?: string
  timeOfDay?: string
}

export type NarrativeLocationMeta = {
  description: string
  setting: 'interior' | 'exterior' | 'mixed'
  episodes: string[]
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
}

// === CG LAYER ===

export type CGSequenceMeta = {
  /** Parent narrative scene this CG sequence belongs to. */
  narrativeScene: string
  episode: string
  vendor?: string
  description?: string
  status?: 'concept' | 'previs' | 'in-progress' | 'final'
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
}

export type EditSceneMeta = {
  /** Parent narrative scene. */
  narrativeScene: string
  /** Parent edit sequence (the cut this scene is part of). */
  editSequence?: string
  episode: string
  description?: string
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
  },

  // === Supporting ===
  'Sarah Walsh': {
    bio: 'Lead race engineer for Luca Ferreira. British, mid-30s. The voice in Luca\'s helmet that keeps him pointed forward when the race is collapsing. Calm under pressure, more devoted to her driver than to the team that pays her.',
    role: 'supporting',
    episodes: ['EP301', 'EP302', 'EP303', 'EP304', 'EP305', 'EP306'],
  },
  'Diego Castellano': {
    bio: 'Frank\'s son, brought in to "learn the family business." Late 20s, Stanford MBA, charming on camera and ruthless off it. A direct threat to Marco\'s authority over the racing operation.',
    role: 'supporting',
    episodes: ['EP302', 'EP303', 'EP304', 'EP305', 'EP306'],
  },
  'Hiroshi Tanaka': {
    bio: 'Apex Racing\'s technical director and lead designer of the AR-24 chassis. Japanese, late 50s, soft-spoken but uncompromising. The technical conscience of the team.',
    role: 'supporting',
    episodes: ['EP301', 'EP303', 'EP304', 'EP305', 'EP306'],
  },

  // === Recurring ===
  'Astrid Vance': {
    bio: 'Team principal of rival Titan Motorsport. Marco\'s professional opposite — Silicon Valley pedigree, corporate polish, runs Titan like a tech startup. Public rivalry with Apex masks a private respect for Marco.',
    role: 'recurring',
    episodes: ['EP302', 'EP303', 'EP305', 'EP306'],
  },
  'Karl Steinmann': {
    bio: 'FIA race director. Swiss-German, 60s, three decades enforcing the rulebook. The one who decides which racing incidents become penalties. Holds the line that the sport\'s legitimacy depends on consistency.',
    role: 'recurring',
    episodes: ['EP301', 'EP303', 'EP305'],
  },
  'Maya Brooks': {
    bio: 'British-American F1 journalist with a popular podcast and unrivaled paddock access. Her opinion moves the conversation about the team. Friendly with Marco, dangerous to him.',
    role: 'recurring',
    episodes: ['EP301', 'EP302', 'EP304', 'EP306'],
  },

  // === Guest ===
  'Hans Berger': {
    bio: 'Retired Apex Racing legend, three-time champion in his era. Now a consultant to Castellano Motors. Surfaces when the team\'s identity is in question — a reminder of what Apex used to be.',
    role: 'guest',
    episodes: ['EP301', 'EP306'],
  },
  'Pippa Ferreira': {
    bio: 'Luca\'s younger sister, briefly seconded to Apex\'s PR department during the European leg. Brings family stakes into the paddock. Sharper than her brother credits her for.',
    role: 'guest',
    episodes: ['EP303', 'EP304'],
  },
}

// Scenes

const SCENES: Record<string, NarrativeSceneMeta> = {
  'EXT. GRID WALK - PRE-RACE': {
    description: 'The electric atmosphere of the grid 30 minutes before lights out. Drivers navigate through journalists, celebrities, and team personnel. Key character introductions and tension-setting through overheard radio checks.',
    episode: 'EP301',
    pageRange: 'pp. 1–8',
    timeOfDay: 'Day',
  },
  'INT. APEX GARAGE - RACE DAY': {
    description: 'The nerve center of the team during a race weekend. Banks of monitors, strategy screens, and the deafening sound of engines bleeding through the walls. Where the real decisions are made under extreme time pressure.',
    episode: 'EP301',
    pageRange: 'pp. 12–18',
    timeOfDay: 'Day',
  },
  'EXT. PADDOCK - POST-RACE': {
    description: 'The decompression zone after the checkered flag. A mix of celebration and devastation, media scrums and private moments. The paddock reveals character through how each person handles the result.',
    episode: 'EP301',
    pageRange: 'pp. 42–48',
    timeOfDay: 'Golden hour',
  },
  'INT. MERCEDES MOTORHOME - DEBRIEF': {
    description: 'A sterile, corporate meeting room where the team dissects what went wrong. Glass walls, fluorescent light, uncomfortable silences. The politics of blame unfold behind closed doors.',
    episode: 'EP302',
    pageRange: 'pp. 3–7',
    timeOfDay: 'Night',
  },
  'EXT. CIRCUIT - LAP 52': {
    description: 'The decisive moment of the race. High-speed wheel-to-wheel combat through a technical section. The outcome reshapes the championship and relationships within the team.',
    episode: 'EP303',
    pageRange: 'pp. 28–34',
    timeOfDay: 'Day',
  },
  'INT. FIA STEWARDS ROOM - PENALTY HEARING - RACE DAY': {
    description: 'A windowless room where three stewards review onboard footage and telemetry data to adjudicate a controversial racing incident. The accused driver and team representative present their case.',
    episode: 'EP303',
    pageRange: 'pp. 35–39',
    timeOfDay: 'Day',
  },
  'EXT. SILVERSTONE CIRCUIT PIT STRAIGHT GRANDSTAND - CONTINUOUS': {
    description: 'The roar of a home crowd as cars blast past the main grandstand. Union flags, air horns, the visceral experience of speed from the spectator\'s perspective.',
    episode: 'EP305',
    pageRange: 'pp. 14–16',
    timeOfDay: 'Day',
  },
  'INT. PADDOCK CLUB VIP HOSPITALITY - DRIVERS PARADE LOUNGE - RACE DAY': {
    description: 'The gilded cage of F1\'s upper echelon. Sponsors, celebrities, and team owners circulate with champagne while the real power plays happen in quiet corners.',
    episode: 'EP304',
    pageRange: 'pp. 8–14',
    timeOfDay: 'Day',
  },
  'EXT. ABU DHABI MARINA CIRCUIT - CHAMPIONSHIP DECIDER - SUNSET': {
    description: 'The season finale under fading desert light. The circuit transforms from daylight to floodlit as the championship hangs in the balance. Every lap carries the weight of an entire season.',
    episode: 'EP306',
    pageRange: 'pp. 22–45',
    timeOfDay: 'Day to night',
  },

  // === EP301 — Season opener ===
  'INT. APEX GARAGE - PRE-RACE BRIEFING': {
    description: 'Marco walks his drivers and engineers through the race plan. Strategy boards, telemetry projections, the team trying to project calm confidence.',
    episode: 'EP301',
    pageRange: 'pp. 9–11',
    timeOfDay: 'Day',
  },
  'EXT. CIRCUIT - OPENING LAPS': {
    description: 'Lights out. Twenty cars launch into Turn 1. Ferreira makes an aggressive move on Ashworth that establishes the season-long tension between the two Apex drivers.',
    episode: 'EP301',
    pageRange: 'pp. 19–25',
    timeOfDay: 'Day',
  },
  'INT. APEX GARAGE - RACE STRATEGY CALL': {
    description: 'Elena weighs two pit-stop strategies on the wall display. Marco listens, makes the call. The radio crackles back to Ashworth — and he doesn\'t like it.',
    episode: 'EP301',
    pageRange: 'pp. 26–30',
    timeOfDay: 'Day',
  },
  'INT. CASTELLANO MOTORS HQ - VIDEO CALL': {
    description: 'Frank watches the race remotely from a glass-walled office. A wall of monitors, a private line open to Marco. Suggestions that sound like instructions.',
    episode: 'EP301',
    pageRange: 'pp. 36–40',
    timeOfDay: 'Day',
  },

  // === EP302 — Zandvoort weekend ===
  'INT. APEX GARAGE - STRATEGY MEETING': {
    description: 'Saturday night. Elena, Marco, and the head of race engineering map out Sunday\'s race over takeaway containers and exhausted coffee.',
    episode: 'EP302',
    pageRange: 'pp. 8–12',
    timeOfDay: 'Night',
  },
  'EXT. ZANDVOORT CIRCUIT - FREE PRACTICE': {
    description: 'Cars stream through banked corners as orange-clad fans roar from the dunes. Ferreira posts the fastest lap; the radio celebration is short-lived when telemetry flags a worrying gearbox spike.',
    episode: 'EP302',
    pageRange: 'pp. 14–20',
    timeOfDay: 'Day',
  },
  'INT. FERREIRA\'S HOTEL ROOM - NIGHT': {
    description: 'Luca alone after the call with his father. The hotel room as a confessional — quiet, anonymous, a moment where the public performance drops.',
    episode: 'EP302',
    pageRange: 'pp. 22–24',
    timeOfDay: 'Night',
  },
  'EXT. ZANDVOORT CIRCUIT - RACE START': {
    description: 'The orange wall of sound as the field accelerates off the grid. Ashworth defends from Dragan into Tarzan. Ferreira gets squeezed and drops three positions in one corner.',
    episode: 'EP302',
    pageRange: 'pp. 27–33',
    timeOfDay: 'Day',
  },
  'INT. ZANDVOORT MEDIA CENTRE - POST-RACE PRESSER': {
    description: 'Three drivers behind a long table. Microphones, hostile questions, and Ashworth\'s carefully controlled answers that say everything except what he means.',
    episode: 'EP302',
    pageRange: 'pp. 41–44',
    timeOfDay: 'Day',
  },

  // === EP303 — Crisis race ===
  'INT. APEX GARAGE - TIRE DEGRADATION ALARMS': {
    description: 'Mid-race. The pit wall sees both Apex cars dropping seconds per lap. Elena triages the data while Marco decides whether to gamble or hold the line.',
    episode: 'EP303',
    pageRange: 'pp. 17–22',
    timeOfDay: 'Day',
  },
  'EXT. PIT LANE - SAFETY CAR': {
    description: 'Yellow flags everywhere. The Apex pit crew sprints to position as both cars dive in at once. The double-stack is a controlled disaster — one set of tyres ready, one not.',
    episode: 'EP303',
    pageRange: 'pp. 23–27',
    timeOfDay: 'Day',
  },
  'INT. CASTELLANO\'S OFFICE - EMERGENCY CALL': {
    description: 'Frank in his New York office at 2am, listening to Marco explain why they just lost the race. He doesn\'t raise his voice. That makes it worse.',
    episode: 'EP303',
    pageRange: 'pp. 40–43',
    timeOfDay: 'Night',
  },
  'EXT. CIRCUIT - PODIUM CEREMONY - NIGHT': {
    description: 'Dragan on top of the podium, champagne arcing into the floodlit air. Ferreira on the second step, jaw clenched. Ashworth absent.',
    episode: 'EP303',
    pageRange: 'pp. 44–46',
    timeOfDay: 'Night',
  },

  // === EP304 — Monaco politics ===
  'EXT. MONACO HARBOUR - DAWN': {
    description: 'Superyachts in pale light. The pre-race-weekend stillness before the circus arrives. Marco walks alone along the harbour, a moment of perspective before the chaos.',
    episode: 'EP304',
    pageRange: 'pp. 1–3',
    timeOfDay: 'Dawn',
  },
  'EXT. MONACO STREET CIRCUIT - QUALIFYING': {
    description: 'Cars threading the barriers at impossible speed. Ferreira\'s pole lap — a perfect sequence of corners visible from every overlook in the principality.',
    episode: 'EP304',
    pageRange: 'pp. 15–22',
    timeOfDay: 'Day',
  },
  'INT. APEX GARAGE - MID-RACE TENSION': {
    description: 'The garage in deafening silence as the team listens to Ferreira on radio. Three corners of the circuit visible on monitors. Marco\'s hand hovers over the radio key.',
    episode: 'EP304',
    pageRange: 'pp. 25–31',
    timeOfDay: 'Day',
  },
  'EXT. CASINO SQUARE - NIGHT': {
    description: 'Post-race. Drivers and sponsors moving between bars and casinos. Ferreira slips away from the crowd. Frank Castellano is waiting where he can\'t avoid him.',
    episode: 'EP304',
    pageRange: 'pp. 38–42',
    timeOfDay: 'Night',
  },
  'EXT. MONACO STREET CIRCUIT - SUNSET': {
    description: 'The circuit emptying as the sun drops behind Mont Charvet. A lone marshal walks the track. Beauty without a single car on it — and Marco watching from an empty grandstand.',
    episode: 'EP304',
    pageRange: 'pp. 44–46',
    timeOfDay: 'Sunset',
  },

  // === EP305 — Mid-season crash ===
  'EXT. CIRCUIT - LAP 8 CRASH SEQUENCE': {
    description: 'A multi-car incident at high speed. Carbon fibre disintegrates in slow motion as cars pinball through the gravel trap. The team radio goes silent.',
    episode: 'EP305',
    pageRange: 'pp. 17–23',
    timeOfDay: 'Day',
  },
  'INT. MEDICAL CENTRE - WAITING ROOM': {
    description: 'The team waits for news. Marco standing, Elena seated, neither speaking. The clock on the wall the loudest sound in the room.',
    episode: 'EP305',
    pageRange: 'pp. 24–28',
    timeOfDay: 'Day',
  },
  'INT. APEX GARAGE - CRISIS MEETING': {
    description: 'The garage transformed from a race-day battle station into a war room. Frank patched in by video. Decisions that will shape the rest of the season.',
    episode: 'EP305',
    pageRange: 'pp. 30–36',
    timeOfDay: 'Day',
  },
  'INT. ASHWORTH\'S HOTEL SUITE - NIGHT': {
    description: 'James in a suite that should feel like luxury but feels like exile. A glass of whisky. A television replaying the incident on loop.',
    episode: 'EP305',
    pageRange: 'pp. 40–42',
    timeOfDay: 'Night',
  },
  'EXT. PIT LANE - DAY': {
    description: 'The morning after. A skeleton crew of mechanics working on the rebuilt car. Silence where the noise should be. Ferreira walks the empty lane.',
    episode: 'EP305',
    pageRange: 'pp. 44–46',
    timeOfDay: 'Day',
  },

  // === EP306 — Championship finale ===
  'INT. APEX GARAGE - CHAMPIONSHIP MORNING': {
    description: 'The garage on the morning of the finale. Quieter than usual. Every gesture deliberate. The day everyone has been working toward for ten months.',
    episode: 'EP306',
    pageRange: 'pp. 1–5',
    timeOfDay: 'Dawn',
  },
  'EXT. PIT LANE - FINAL STOP': {
    description: 'The last pit stop of the season. The crew operates on instinct alone. Tires on, jacks dropped, car released — every millisecond a championship point.',
    episode: 'EP306',
    pageRange: 'pp. 35–37',
    timeOfDay: 'Day to night',
  },
  'EXT. PODIUM - VICTORY': {
    description: 'The champagne plume. The trophy raised. Two drivers on the same podium, only one with the championship. The other forcing a smile that no one will believe.',
    episode: 'EP306',
    pageRange: 'pp. 46–48',
    timeOfDay: 'Night',
  },
  'INT. POST-RACE PRESS CONFERENCE': {
    description: 'The new champion at the centre of a media scrum. Cameras flashing. Frank Castellano in the back of the room — already calculating next season.',
    episode: 'EP306',
    pageRange: 'pp. 49–52',
    timeOfDay: 'Night',
  },
  'EXT. ABU DHABI MARINA - CELEBRATION - NIGHT': {
    description: 'The end-of-season party on the marina. Fireworks over the harbour. The new champion, the team that built it, and the politics that won\'t wait until next year.',
    episode: 'EP306',
    pageRange: 'pp. 53–58',
    timeOfDay: 'Night',
  },
}

// Locations

const LOCATIONS: Record<string, NarrativeLocationMeta> = {
  'Pit Lane': {
    description: 'The narrow corridor of controlled chaos where pit stops happen in under two seconds. A place of mechanical precision and human error, separated from the track by a low wall and a world of consequences.',
    setting: 'exterior',
    episodes: ['EP301', 'EP302', 'EP303', 'EP305', 'EP306'],
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
  },
  'Circuit': {
    description: 'The racing surface itself — asphalt, kerbs, run-off zones. Generic "on-track" coverage that isn\'t tied to a specific named circuit. Camera dailies often land here when location detail can\'t be inferred from the footage alone.',
    setting: 'exterior',
    episodes: ['EP301', 'EP302', 'EP303', 'EP304', 'EP305', 'EP306'],
  },
}

// === PRODUCTION SCENES ===
// A narrative scene can have multiple production scenes (shoot days, setups).
// Keyed by a code that captures episode + scene + setup.

const PRODUCTION_SCENES: Record<string, ProductionSceneMeta> = {
  'EP301-S01-D02': {
    narrativeScene: 'EXT. GRID WALK - PRE-RACE',
    episode: 'EP301',
    shootDay: 2,
    shootDate: '2026-02-13',
    unit: '1st unit',
    description: 'Grid walk steadicam, full crowd dressing, pre-race tension.',
  },
  'EP301-S05-D03': {
    narrativeScene: 'INT. APEX GARAGE - RACE DAY',
    episode: 'EP301',
    shootDay: 3,
    shootDate: '2026-02-14',
    unit: '1st unit',
    description: 'Garage interior, race day. Telemetry monitors live, full crew dressing.',
  },
  'EP301-S07-D05': {
    narrativeScene: 'EXT. PADDOCK - POST-RACE',
    episode: 'EP301',
    shootDay: 5,
    shootDate: '2026-02-16',
    unit: '1st unit',
    description: 'Paddock crowd, post-race aftermath. Press scrum dressing.',
  },
  'EP303-S52-D11': {
    narrativeScene: 'EXT. CIRCUIT - LAP 52',
    episode: 'EP303',
    shootDay: 11,
    shootDate: '2026-03-04',
    unit: '2nd unit',
    description: 'Plate photography at Silverstone for the wheel-to-wheel sequence.',
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
  // EXT. GRID WALK - PRE-RACE
  'EP301-S01-T02A': {
    productionScene: 'EP301-S01-D02',
    narrativeScene: 'EXT. GRID WALK - PRE-RACE',
    episode: 'EP301',
    take: 2,
    camera: 'A',
    circle: true,
    lens: '35mm',
    description: 'Marco walks the grid, steadicam tracking shot.',
  },
  'EP301-S01-T02C': {
    productionScene: 'EP301-S01-D02',
    narrativeScene: 'EXT. GRID WALK - PRE-RACE',
    episode: 'EP301',
    take: 2,
    camera: 'C',
    circle: false,
    lens: '50mm',
    description: 'Reverse coverage on grid walk — crowd reactions.',
  },
  // INT. APEX GARAGE - RACE DAY
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
  'EP301-S05-T05A': {
    productionScene: 'EP301-S05-D03',
    narrativeScene: 'INT. APEX GARAGE - RACE DAY',
    episode: 'EP301',
    take: 5,
    camera: 'A',
    circle: true,
    lens: '24mm',
    description: 'Wide master, full garage crew, alternate take.',
  },
  // EXT. PADDOCK - POST-RACE
  'EP301-S07-T01A': {
    productionScene: 'EP301-S07-D05',
    narrativeScene: 'EXT. PADDOCK - POST-RACE',
    episode: 'EP301',
    take: 1,
    camera: 'A',
    circle: true,
    lens: '24mm',
    description: 'Wide paddock, press scrum forming around Marco.',
  },
  // EXT. CIRCUIT - LAP 52
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
  'EP303-S52-T07B': {
    productionScene: 'EP303-S52-D11',
    narrativeScene: 'EXT. CIRCUIT - LAP 52',
    episode: 'EP303',
    take: 7,
    camera: 'B',
    circle: false,
    lens: '200mm',
    description: 'Tight track-level, hero car wheels.',
  },
  'EP303-S52-T08A': {
    productionScene: 'EP303-S52-D11',
    narrativeScene: 'EXT. CIRCUIT - LAP 52',
    episode: 'EP303',
    take: 8,
    camera: 'A',
    circle: false,
    lens: '100mm',
    description: 'Plate run, second pass, alternate line through Maggotts.',
  },
  // EXT. ABU DHABI MARINA CIRCUIT - CHAMPIONSHIP DECIDER - SUNSET
  'EP306-S22-T01A': {
    productionScene: 'EP306-S22-D18',
    narrativeScene: 'EXT. ABU DHABI MARINA CIRCUIT - CHAMPIONSHIP DECIDER - SUNSET',
    episode: 'EP306',
    take: 1,
    camera: 'A',
    circle: true,
    lens: '50mm',
    description: 'Sunset establishing wide, championship decider.',
  },
  'EP306-S22-T01B': {
    productionScene: 'EP306-S22-D18',
    narrativeScene: 'EXT. ABU DHABI MARINA CIRCUIT - CHAMPIONSHIP DECIDER - SUNSET',
    episode: 'EP306',
    take: 1,
    camera: 'B',
    circle: false,
    lens: '35mm',
    description: 'Driver POV, start-finish straight.',
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

export function listNarrativeScenes(): Array<[string, NarrativeSceneMeta]> {
  return Object.entries(SCENES)
}

export function listNarrativeCharacters(): Array<[string, NarrativeCharacterMeta]> {
  return Object.entries(CHARACTERS)
}

export function listNarrativeLocations(): Array<[string, NarrativeLocationMeta]> {
  return Object.entries(LOCATIONS)
}

export function getNarrativeScene(name: string): NarrativeSceneMeta | undefined {
  return SCENES[name]
}

export function getNarrativeCharacter(name: string): NarrativeCharacterMeta | undefined {
  return CHARACTERS[name]
}

export function getNarrativeLocation(name: string): NarrativeLocationMeta | undefined {
  return LOCATIONS[name]
}

/** Display labels for a character's narrative role. */
export const CHARACTER_ROLE_LABEL: Record<NarrativeCharacterMeta['role'], string> = {
  lead: 'Lead',
  supporting: 'Supporting',
  recurring: 'Recurring',
  guest: 'Guest',
}

export function listProductionScenes(): Array<[string, ProductionSceneMeta]> {
  return Object.entries(PRODUCTION_SCENES)
}

export function listProductionShots(): Array<[string, ProductionShotMeta]> {
  return Object.entries(PRODUCTION_SHOTS)
}

/**
 * Forward-reference: CG Shots that REPLACE the given Production Shot.
 * Drives the "Replaced by" relationship on Production Shot detail pages —
 * a CG Shot stands in for the production shot in the final cut, and the
 * Production Shot should expose that link as much as the CG Shot does upward.
 */
export function getCGShotsReplacing(
  productionShotKey: string,
): Array<[string, CGShotMeta]> {
  return Object.entries(CG_SHOTS).filter(
    ([, meta]) => meta.replacesProductionShot === productionShotKey,
  )
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
