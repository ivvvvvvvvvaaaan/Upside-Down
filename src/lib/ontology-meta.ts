/**
 * Ontology metadata — enriched context for characters, scenes, and locations.
 *
 * In production this would come from script breakdowns, production databases,
 * and AI pipeline analysis. Here we seed representative data.
 */

export type CharacterMeta = {
  bio: string
  role: 'lead' | 'supporting' | 'recurring' | 'guest'
  episodes: string[]
  notes?: string
}

export type SceneMeta = {
  description: string
  episode: string
  pageRange?: string
  timeOfDay?: string
  mood?: string
  notes?: string
}

export type LocationMeta = {
  description: string
  setting: 'interior' | 'exterior' | 'mixed'
  episodes: string[]
  notes?: string
}

export type OntologyMeta =
  | { type: 'character'; data: CharacterMeta }
  | { type: 'scene'; data: SceneMeta }
  | { type: 'location'; data: LocationMeta }

// Characters

const CHARACTERS: Record<string, CharacterMeta> = {
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

const SCENES: Record<string, SceneMeta> = {
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

const LOCATIONS: Record<string, LocationMeta> = {
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

// Lookup

export function getOntologyMeta(name: string, icon: string): OntologyMeta | null {
  if (icon === 'character' && CHARACTERS[name]) {
    return { type: 'character', data: CHARACTERS[name] }
  }
  if (icon === 'scene' && SCENES[name]) {
    return { type: 'scene', data: SCENES[name] }
  }
  if (icon === 'location' && LOCATIONS[name]) {
    return { type: 'location', data: LOCATIONS[name] }
  }
  return null
}
