/**
 * Scenario Phases
 *
 * Each phase is self-contained with no cross-phase dependencies.
 * Multi-persona phases include a persona switch as a step.
 */

export interface PhaseStep {
  id: string
  instruction: string
  /** Which persona should perform this step (used for auto-detection gating) */
  personaId?: string
  checkpoint:
    | { type: 'grant'; resourceId: string; principalType: 'user' | 'team' | 'domain'; principalId: string }
    | { type: 'any-grant-to'; principalType: 'user' | 'team'; principalId: string }
    | { type: 'collection-created'; nameContains: string }
    | { type: 'file-created'; parentFolderId: string }
    | { type: 'visit-page'; pathPrefix: string }
    | { type: 'persona-switch'; personaId: string }
    | { type: 'manual' }
}

export interface Phase {
  id: string
  title: string
  description: string
  /** The persona who starts this phase */
  personaId: string
  steps: PhaseStep[]
  /** This phase only unlocks after another phase is completed */
  requiresPhase?: string
}

export const PHASES: Phase[] = [
  {
    id: 'phase-1',
    title: 'New dailies land',
    description: 'Tom finished ingesting today\'s camera media. He verifies the files synced, marks circle takes, adds them to his selects collection, and shares with the director.',
    personaId: 'camera-dit',
    steps: [
      {
        id: 'p1-create-file',
        instruction: 'Add new camera footage to Camera / Dailies (right-click in the desktop view)',
        personaId: 'camera-dit',
        checkpoint: { type: 'file-created', parentFolderId: 'ws-cam-dailies' },
      },
      {
        id: 'p1-verify-sync',
        instruction: 'Find the file in the media library to verify it synced and has AI tags',
        personaId: 'camera-dit',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/workspace/' },
      },
      {
        id: 'p1-circle-take',
        instruction: 'Add the "Circle Take" tag to mark it as a director pick',
        personaId: 'camera-dit',
        checkpoint: { type: 'manual' },
      },
      {
        id: 'p1-check-smart',
        instruction: 'Open "Circle Takes" smart collection to see all picks',
        personaId: 'camera-dit',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/collections/smart-circle-takes' },
      },
      {
        id: 'p1-add-to-collection',
        instruction: 'Select the takes and add them to "Day 15 Selects"',
        personaId: 'camera-dit',
        checkpoint: { type: 'manual' },
      },
      {
        id: 'p1-share-collection',
        instruction: 'Share "Day 15 Selects" with David Park',
        personaId: 'camera-dit',
        checkpoint: { type: 'any-grant-to', principalType: 'user', principalId: 'creative-david' },
      },
    ],
  },
  {
    id: 'phase-2',
    title: 'VFX to editorial',
    description: 'Sarah packages approved VFX comps for editorial. Lisa receives them and shares her review cuts back.',
    personaId: 'vfx-coordinator',
    steps: [
      {
        id: 'p2-create-collection',
        instruction: 'As Sarah, create a collection called "EP301 VFX Pulls" with VFX comp assets',
        personaId: 'vfx-coordinator',
        checkpoint: { type: 'collection-created', nameContains: 'VFX Pulls' },
      },
      {
        id: 'p2-share-collection',
        instruction: 'Share it with Lisa Kim and Maria Santos',
        personaId: 'vfx-coordinator',
        checkpoint: { type: 'any-grant-to', principalType: 'user', principalId: 'editorial-coordinator' },
      },
      {
        id: 'p2-switch-lisa',
        instruction: 'Switch to Lisa Kim',
        checkpoint: { type: 'persona-switch', personaId: 'editorial-coordinator' },
      },
      {
        id: 'p2-check-inbox',
        instruction: 'Check your Inbox for Sarah\'s VFX Pulls collection',
        personaId: 'editorial-coordinator',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/inbox' },
      },
      {
        id: 'p2-share-dailies',
        instruction: 'Share "Dailies Review Cuts" with Maria Santos, David Park, and Mike Torres',
        personaId: 'editorial-coordinator',
        checkpoint: { type: 'grant', resourceId: 'ws-edit-coll-dailies', principalType: 'user', principalId: 'editorial-artist' },
      },
    ],
  },
  {
    id: 'phase-3',
    title: 'Vendor setup',
    description: 'Sarah sets up a shared delivery folder for the Framestore vendor team.',
    personaId: 'vfx-coordinator',
    steps: [
      {
        id: 'p3-share-vendor',
        instruction: 'Share the Framestore folder (under Vendor Deliveries) with the Framestore team',
        personaId: 'vfx-coordinator',
        checkpoint: { type: 'grant', resourceId: 'ws-vfx-vendor-framestore', principalType: 'team', principalId: 'framestore-io' },
      },
    ],
  },
  {
    id: 'phase-4',
    title: 'Camera shares reference',
    description: 'Art needs B-roll and dailies for concept work. Tom sends them a curated set.',
    personaId: 'camera-dit',
    steps: [
      {
        id: 'p4-share-broll',
        instruction: 'Share "B-Roll Highlights" with art and editorial',
        personaId: 'camera-dit',
        checkpoint: { type: 'grant', resourceId: 'ws-cam-coll-broll', principalType: 'user', principalId: 'art-artist' },
      },
      {
        id: 'p4-share-dailies-snapshot',
        instruction: 'Share a dailies snapshot with Priya Sharma for concept reference',
        personaId: 'camera-dit',
        checkpoint: { type: 'grant', resourceId: 'coll-cam-dailies', principalType: 'user', principalId: 'art-artist' },
      },
    ],
  },
  {
    id: 'phase-5',
    title: 'Cut released',
    description: 'The locked cut is ready for broader review. Lisa releases it to studio departments.',
    personaId: 'editorial-coordinator',
    steps: [
      {
        id: 'p5-release-cut',
        instruction: 'Release Locked Cut 3 to Studio VFX, Studio Creative, and Studio Post',
        personaId: 'editorial-coordinator',
        checkpoint: { type: 'grant', resourceId: 'cut-ep301-lc-3', principalType: 'team', principalId: 'vfx-core' },
      },
    ],
  },

  // --- Receiver phases ---

  {
    id: 'phase-david',
    title: 'Director reviews selects',
    description: 'David received camera selects from Tom. He reviews the picks and checks what else is shared with him.',
    personaId: 'creative-david',
    requiresPhase: 'phase-1',
    steps: [
      {
        id: 'pd-check-inbox',
        instruction: 'Check your Inbox for Tom\'s "Day 15 Selects"',
        personaId: 'creative-david',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/inbox' },
      },
      {
        id: 'pd-open-collection',
        instruction: 'Open the collection and review the selects',
        personaId: 'creative-david',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/collections/' },
      },
      {
        id: 'pd-check-shares',
        instruction: 'Check the Shares page to see everything shared with you',
        personaId: 'creative-david',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/shared' },
      },
    ],
  },
  {
    id: 'phase-maria',
    title: 'Editor receives review cuts',
    description: 'Maria received the dailies review cuts from Lisa. She opens them and checks the assets.',
    personaId: 'editorial-artist',
    requiresPhase: 'phase-2',
    steps: [
      {
        id: 'pm-check-inbox',
        instruction: 'Check your Inbox for Lisa\'s shared cuts',
        personaId: 'editorial-artist',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/inbox' },
      },
      {
        id: 'pm-open-cuts',
        instruction: 'Open "Dailies Review Cuts" and browse the assets',
        personaId: 'editorial-artist',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/collections/' },
      },
    ],
  },
  {
    id: 'phase-mike',
    title: 'VFX supervisor reviews access',
    description: 'Mike oversees VFX assets and checks who has access to what across his department.',
    personaId: 'vfx-supervisor',
    steps: [
      {
        id: 'pmk-browse-workspace',
        instruction: 'Browse the VFX workspace to see all assets',
        personaId: 'vfx-supervisor',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/workspace/' },
      },
      {
        id: 'pmk-check-shares',
        instruction: 'Check the Shares page to review all outbound shares',
        personaId: 'vfx-supervisor',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/shared' },
      },
    ],
  },
  {
    id: 'phase-priya',
    title: 'Art reviews reference footage',
    description: 'Priya received B-roll highlights and dailies from Tom for concept reference.',
    personaId: 'art-artist',
    requiresPhase: 'phase-4',
    steps: [
      {
        id: 'pp-check-inbox',
        instruction: 'Check your Inbox for Tom\'s shared reference footage',
        personaId: 'art-artist',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/inbox' },
      },
      {
        id: 'pp-open-broll',
        instruction: 'Open "B-Roll Highlights" and browse the footage',
        personaId: 'art-artist',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/collections/' },
      },
    ],
  },
  {
    id: 'phase-james',
    title: 'Vendor delivers comps',
    description: 'James at Framestore received the delivery folder from Sarah. He browses it, uploads finished comps, and notifies Sarah.',
    personaId: 'vendor-framestore',
    requiresPhase: 'phase-3',
    steps: [
      {
        id: 'pj-check-inbox',
        instruction: 'Check your Inbox for Sarah\'s shared delivery folder',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/inbox' },
      },
      {
        id: 'pj-browse-folder',
        instruction: 'Open the Framestore folder and browse existing deliverables',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/workspace/' },
      },
      {
        id: 'pj-upload',
        instruction: 'Add a new comp file to the Framestore delivery folder',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'file-created', parentFolderId: 'ws-vfx-vendor-framestore' },
      },
      {
        id: 'pj-share-back',
        instruction: 'Share the folder back to Sarah with a delivery note',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'grant', resourceId: 'ws-vfx-vendor-framestore', principalType: 'user', principalId: 'vfx-coordinator' },
      },
    ],
  },
  {
    id: 'phase-rachel',
    title: 'Audio shares temp sound',
    description: 'Rachel packages a temp sound kit for the editorial team to use in their rough cut.',
    personaId: 'audio-supervisor',
    steps: [
      {
        id: 'pr-open-collection',
        instruction: 'Open the "Temp Sound Kit" collection',
        personaId: 'audio-supervisor',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/collections/' },
      },
      {
        id: 'pr-share-sound',
        instruction: 'Share it with Lisa Kim and Maria Santos',
        personaId: 'audio-supervisor',
        checkpoint: { type: 'any-grant-to', principalType: 'user', principalId: 'editorial-coordinator' },
      },
    ],
  },
]

export function getPhaseForPersona(personaId: string, completedPhaseIds: Set<string>): Phase | null {
  for (const phase of PHASES) {
    if (completedPhaseIds.has(phase.id)) continue
    // Skip phases whose prerequisite isn't done yet
    if (phase.requiresPhase && !completedPhaseIds.has(phase.requiresPhase)) continue
    if (phase.personaId === personaId) return phase
    // Also match phases where the current step needs this persona
    const nextStep = phase.steps.find(s => !completedPhaseIds.has(s.id))
    if (nextStep?.personaId === personaId) return phase
  }
  return null
}

export function getCurrentPhase(completedPhaseIds: Set<string>): Phase | null {
  for (const phase of PHASES) {
    if (!completedPhaseIds.has(phase.id)) return phase
  }
  return null
}
