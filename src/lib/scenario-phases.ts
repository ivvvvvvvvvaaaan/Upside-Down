/**
 * Scenario Phases
 *
 * Defines the guided walkthrough phases. Each phase has:
 * - A persona who performs the actions
 * - Steps with instructions and checkpoint conditions
 * - Context copy explaining WHY this action matters
 *
 * Checkpoints are detected by matching mutations in the data:
 * grants created, collections created, files added.
 */

export interface PhaseStep {
  id: string
  instruction: string
  /** How to detect this step is done */
  checkpoint:
    | { type: 'grant'; resourceId: string; principalType: 'user' | 'team' | 'domain'; principalId: string }
    | { type: 'collection-created'; nameContains: string }
    | { type: 'file-created'; parentFolderId: string }
    | { type: 'manual' }
}

export interface Phase {
  id: string
  title: string
  description: string
  personaId: string
  steps: PhaseStep[]
  /** Which persona to switch to after this phase */
  nextPersonaId?: string
}

export const PHASES: Phase[] = [
  {
    id: 'phase-1',
    title: 'Camera dailies arrive',
    description: 'New camera footage lands in the workspace. Tom organizes selects and shares them with the editorial and creative teams.',
    personaId: 'camera-dit',
    steps: [
      {
        id: 'p1-create-file',
        instruction: 'Create a new file in Camera / Dailies (right-click in desktop view or use the upload button)',
        checkpoint: { type: 'file-created', parentFolderId: 'ws-cam-dailies' },
      },
      {
        id: 'p1-check-smart',
        instruction: 'Check the smart collections — your new file should appear in Take and Camera automatically',
        checkpoint: { type: 'manual' },
      },
      {
        id: 'p1-share-selects',
        instruction: 'Open the Selects folder and share it with David Park and the Editorial team',
        checkpoint: { type: 'grant', resourceId: 'ws-cam-selects', principalType: 'user', principalId: 'creative-david' },
      },
    ],
    nextPersonaId: 'vfx-coordinator',
  },
  {
    id: 'phase-2',
    title: 'VFX packages for editorial',
    description: 'Sarah curates the latest VFX comps into a collection and shares it with the editorial team for review.',
    personaId: 'vfx-coordinator',
    steps: [
      {
        id: 'p2-create-collection',
        instruction: 'Create a new collection called "EP301 VFX Pulls" and add VFX comp assets to it',
        checkpoint: { type: 'collection-created', nameContains: 'VFX Pulls' },
      },
      {
        id: 'p2-share-collection',
        instruction: 'Share the collection with Lisa Kim and Maria Santos',
        checkpoint: { type: 'grant', resourceId: 'ws-vfx-coll-for-editorial', principalType: 'user', principalId: 'editorial-coordinator' },
      },
    ],
    nextPersonaId: 'editorial-coordinator',
  },
  {
    id: 'phase-3',
    title: 'Editorial reviews',
    description: 'Lisa receives VFX comps in her inbox and shares her own review cuts with the creative team.',
    personaId: 'editorial-coordinator',
    steps: [
      {
        id: 'p3-check-inbox',
        instruction: 'Open your Inbox to see the VFX Pulls collection from Sarah',
        checkpoint: { type: 'manual' },
      },
      {
        id: 'p3-share-dailies',
        instruction: 'Share "Dailies Review Cuts" with Maria Santos, David Park, and Mike Torres',
        checkpoint: { type: 'grant', resourceId: 'ws-edit-coll-dailies', principalType: 'user', principalId: 'editorial-artist' },
      },
    ],
    nextPersonaId: 'vfx-coordinator',
  },
  {
    id: 'phase-4',
    title: 'Vendor delivery',
    description: 'Sarah sets up a shared workspace folder for the Framestore vendor team to deliver VFX comps.',
    personaId: 'vfx-coordinator',
    steps: [
      {
        id: 'p4-share-vendor',
        instruction: 'Share the Vendor Deliveries / Framestore folder with the Framestore team',
        checkpoint: { type: 'grant', resourceId: 'ws-vfx-vendor-framestore', principalType: 'team', principalId: 'framestore-io' },
      },
    ],
    nextPersonaId: 'camera-dit',
  },
  {
    id: 'phase-5',
    title: 'Cross-department collaboration',
    description: 'Tom shares camera B-roll highlights and dailies reference with art and editorial teams.',
    personaId: 'camera-dit',
    steps: [
      {
        id: 'p5-share-broll',
        instruction: 'Share "B-Roll Highlights" collection with the Art and Editorial teams',
        checkpoint: { type: 'grant', resourceId: 'ws-cam-coll-broll', principalType: 'user', principalId: 'art-designer' },
      },
      {
        id: 'p5-share-dailies-snapshot',
        instruction: 'Share a snapshot of camera dailies with Priya Sharma for concept reference',
        checkpoint: { type: 'grant', resourceId: 'coll-cam-dailies', principalType: 'user', principalId: 'art-designer' },
      },
    ],
    nextPersonaId: 'editorial-coordinator',
  },
  {
    id: 'phase-6',
    title: 'Release to stakeholders',
    description: 'Lisa releases the locked cut to broader studio audiences for review and approval.',
    personaId: 'editorial-coordinator',
    steps: [
      {
        id: 'p6-release-cut',
        instruction: 'Release Locked Cut 3 to Studio VFX, Studio Creative, and Studio Post',
        checkpoint: { type: 'grant', resourceId: 'cut-ep301-lc-3', principalType: 'domain', principalId: 'studio-vfx' },
      },
    ],
  },
]

export function getPhaseForPersona(personaId: string, completedPhaseIds: Set<string>): Phase | null {
  // Find the first incomplete phase for this persona
  for (const phase of PHASES) {
    if (completedPhaseIds.has(phase.id)) continue
    if (phase.personaId === personaId) return phase
  }
  return null
}

export function getCurrentPhase(completedPhaseIds: Set<string>): Phase | null {
  for (const phase of PHASES) {
    if (!completedPhaseIds.has(phase.id)) return phase
  }
  return null
}
