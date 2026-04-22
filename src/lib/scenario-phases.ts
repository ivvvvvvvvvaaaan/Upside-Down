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
    | { type: 'visit-page'; pathPrefix: string }
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
    title: 'New dailies land',
    description: 'Tom just finished ingesting today\'s camera media. He needs to get the selects to editorial and the director.',
    personaId: 'camera-dit',
    steps: [
      {
        id: 'p1-create-file',
        instruction: 'Add a new camera file to Dailies (right-click in the desktop view)',
        checkpoint: { type: 'file-created', parentFolderId: 'ws-cam-dailies' },
      },
      {
        id: 'p1-check-smart',
        instruction: 'Open smart collections and confirm the file appeared automatically',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/collections/smart-' },
      },
      {
        id: 'p1-share-selects',
        instruction: 'Share the Selects folder with David Park and the Editorial team',
        checkpoint: { type: 'grant', resourceId: 'ws-cam-selects', principalType: 'user', principalId: 'creative-david' },
      },
    ],
    nextPersonaId: 'vfx-coordinator',
  },
  {
    id: 'phase-2',
    title: 'VFX handoff to editorial',
    description: 'Sarah has approved comps ready for the EP301 edit. She packages them into a collection for Lisa and Maria.',
    personaId: 'vfx-coordinator',
    steps: [
      {
        id: 'p2-create-collection',
        instruction: 'Create a collection called "EP301 VFX Pulls" with VFX comp assets',
        checkpoint: { type: 'collection-created', nameContains: 'VFX Pulls' },
      },
      {
        id: 'p2-share-collection',
        instruction: 'Share it with Lisa Kim and Maria Santos',
        checkpoint: { type: 'grant', resourceId: 'ws-vfx-coll-for-editorial', principalType: 'user', principalId: 'editorial-coordinator' },
      },
    ],
    nextPersonaId: 'editorial-coordinator',
  },
  {
    id: 'phase-3',
    title: 'Editorial sends review cuts',
    description: 'Lisa received the VFX comps. Now she shares her latest cuts with the review group.',
    personaId: 'editorial-coordinator',
    steps: [
      {
        id: 'p3-check-inbox',
        instruction: 'Check your Inbox for Sarah\'s VFX Pulls collection',
        checkpoint: { type: 'visit-page', pathPrefix: '/nextgen/inbox' },
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
    title: 'Vendor gets delivery folder',
    description: 'Framestore needs a workspace to deliver final VFX comps. Sarah gives their team access.',
    personaId: 'vfx-coordinator',
    steps: [
      {
        id: 'p4-share-vendor',
        instruction: 'Share the Framestore folder (under Vendor Deliveries) with the Framestore team',
        checkpoint: { type: 'grant', resourceId: 'ws-vfx-vendor-framestore', principalType: 'team', principalId: 'framestore-io' },
      },
    ],
    nextPersonaId: 'vendor-framestore',
  },
  {
    id: 'phase-5',
    title: 'Vendor delivers comps',
    description: 'James at Framestore uploads finished VFX comps and shares them back to Sarah with delivery notes.',
    personaId: 'vendor-framestore',
    steps: [
      {
        id: 'p5-vendor-upload',
        instruction: 'Add a new comp file to the Framestore delivery folder',
        checkpoint: { type: 'file-created', parentFolderId: 'ws-vfx-vendor-framestore' },
      },
      {
        id: 'p5-vendor-share-back',
        instruction: 'Share the Framestore folder back to Sarah Chen with a delivery note',
        checkpoint: { type: 'grant', resourceId: 'ws-vfx-vendor-framestore', principalType: 'user', principalId: 'vfx-coordinator' },
      },
    ],
    nextPersonaId: 'camera-dit',
  },
  {
    id: 'phase-6',
    title: 'Camera shares reference footage',
    description: 'Art needs B-roll and dailies for concept work. Tom sends them a curated set.',
    personaId: 'camera-dit',
    steps: [
      {
        id: 'p6-share-broll',
        instruction: 'Share "B-Roll Highlights" with art and editorial',
        checkpoint: { type: 'grant', resourceId: 'ws-cam-coll-broll', principalType: 'user', principalId: 'art-designer' },
      },
      {
        id: 'p6-share-dailies-snapshot',
        instruction: 'Share a dailies snapshot with Priya Sharma for concept reference',
        checkpoint: { type: 'grant', resourceId: 'coll-cam-dailies', principalType: 'user', principalId: 'art-designer' },
      },
    ],
    nextPersonaId: 'editorial-coordinator',
  },
  {
    id: 'phase-7',
    title: 'Cut released to stakeholders',
    description: 'The locked cut is ready for broader review. Lisa releases it to studio departments.',
    personaId: 'editorial-coordinator',
    steps: [
      {
        id: 'p7-release-cut',
        instruction: 'Release Locked Cut 3 to Studio VFX, Studio Creative, and Studio Post',
        checkpoint: { type: 'grant', resourceId: 'cut-ep301-lc-3', principalType: 'domain', principalId: 'studio-vfx' },
      },
    ],
  },
]

export function getPhaseForPersona(personaId: string, completedPhaseIds: Set<string>): Phase | null {
  // Only show a phase if all previous phases are done
  for (const phase of PHASES) {
    if (completedPhaseIds.has(phase.id)) continue
    // This is the first incomplete phase — only return it if it matches the persona
    if (phase.personaId === personaId) return phase
    return null // earlier phase for a different persona isn't done yet
  }
  return null
}

export function getCurrentPhase(completedPhaseIds: Set<string>): Phase | null {
  for (const phase of PHASES) {
    if (!completedPhaseIds.has(phase.id)) return phase
  }
  return null
}
