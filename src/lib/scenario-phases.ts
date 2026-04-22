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
}

export const PHASES: Phase[] = [
  {
    id: 'phase-1',
    title: 'New dailies land',
    description: 'Tom finished ingesting today\'s camera media. He reviews director picks, curates the best takes into a collection, and shares them with the director.',
    personaId: 'camera-dit',
    steps: [
      {
        id: 'p1-create-file',
        instruction: 'Add new camera footage to Camera / Dailies (right-click in the desktop view)',
        personaId: 'camera-dit',
        checkpoint: { type: 'file-created', parentFolderId: 'ws-cam-dailies' },
      },
      {
        id: 'p1-check-smart',
        instruction: 'Open "Circle Takes" to review director picks',
        personaId: 'camera-dit',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/collections/smart-circle-takes' },
      },
      {
        id: 'p1-create-collection',
        instruction: 'Create a collection called "Day 15 Selects" and add your top picks',
        personaId: 'camera-dit',
        checkpoint: { type: 'collection-created', nameContains: 'Selects' },
      },
      {
        id: 'p1-share-collection',
        instruction: 'Share the collection with David Park',
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
        checkpoint: { type: 'grant', resourceId: 'ws-vfx-coll-for-editorial', principalType: 'user', principalId: 'editorial-coordinator' },
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
    title: 'Vendor exchange',
    description: 'Sarah sets up a delivery folder for Framestore. James uploads finished comps and shares them back with notes.',
    personaId: 'vfx-coordinator',
    steps: [
      {
        id: 'p3-share-vendor',
        instruction: 'As Sarah, share the Framestore folder (under Vendor Deliveries) with the Framestore team',
        personaId: 'vfx-coordinator',
        checkpoint: { type: 'grant', resourceId: 'ws-vfx-vendor-framestore', principalType: 'team', principalId: 'framestore-io' },
      },
      {
        id: 'p3-switch-james',
        instruction: 'Switch to James Liu (Framestore)',
        checkpoint: { type: 'persona-switch', personaId: 'vendor-framestore' },
      },
      {
        id: 'p3-vendor-upload',
        instruction: 'Add a new comp file to the Framestore delivery folder',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'file-created', parentFolderId: 'ws-vfx-vendor-framestore' },
      },
      {
        id: 'p3-vendor-share-back',
        instruction: 'Share the Framestore folder back to Sarah with a delivery note',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'grant', resourceId: 'ws-vfx-vendor-framestore', principalType: 'user', principalId: 'vfx-coordinator' },
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
        checkpoint: { type: 'grant', resourceId: 'ws-cam-coll-broll', principalType: 'user', principalId: 'art-designer' },
      },
      {
        id: 'p4-share-dailies-snapshot',
        instruction: 'Share a dailies snapshot with Priya Sharma for concept reference',
        personaId: 'camera-dit',
        checkpoint: { type: 'grant', resourceId: 'coll-cam-dailies', principalType: 'user', principalId: 'art-designer' },
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
        checkpoint: { type: 'grant', resourceId: 'cut-ep301-lc-3', principalType: 'domain', principalId: 'studio-vfx' },
      },
    ],
  },
]

export function getPhaseForPersona(personaId: string, completedPhaseIds: Set<string>): Phase | null {
  for (const phase of PHASES) {
    if (completedPhaseIds.has(phase.id)) continue
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
