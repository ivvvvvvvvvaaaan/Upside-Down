/**
 * Scenario Phases
 *
 * Each phase is self-contained unless it explicitly declares a prerequisite.
 * Checkpoints describe observable app state so phase steps can be adapted
 * without rewriting the guide evaluator.
 */

export type CheckpointPrincipal = {
  principalType: 'user' | 'team' | 'domain'
  principalId: string
}

export interface PhaseStep {
  id: string
  instruction: string
  /** Which persona should perform this step (used for auto-detection gating) */
  personaId?: string
  checkpoint:
    | { type: 'grant-set'; resourceId: string; principals: CheckpointPrincipal[] }
    | { type: 'collection-created'; nameContains: string }
    | { type: 'collection-contains'; collectionId: string; minAssets?: number; tag?: string }
    | { type: 'file-created'; parentFolderId: string }
    | { type: 'asset-tagged'; tag: string; parentFolderId?: string; assetId?: string; requireUserCreated?: boolean }
    | { type: 'inbox-resource'; resourceId: string; grantedByUserId?: string }
    | { type: 'visit-page'; path: string; match?: 'exact' | 'prefix' }
    | { type: 'visit-resource'; basePath: '/nextgen/collections' | '/nextgen/workspace'; resourceId: string }
    | { type: 'persona-switch'; personaId: string }
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
  /** Message shown when the phase is locked (prerequisite not done) */
  waitingMessage?: string
  /** Suggest switching to this persona after completing this phase */
  nextPersonaId?: string
}

export const PHASES: Phase[] = [
  {
    id: 'phase-1',
    title: 'Sarah: Share comps & set up vendor',
    description: 'As the VFX Coordinator, share approved comps with editorial and set up the Framestore delivery folder for vendor uploads.',
    personaId: 'vfx-coordinator',
    nextPersonaId: 'editorial-coordinator',
    steps: [
      {
        id: 'p1-find-collection',
        instruction: 'Find the "EP301 VFX Pulls" collection',
        personaId: 'vfx-coordinator',
        checkpoint: { type: 'visit-resource', basePath: '/nextgen/collections', resourceId: 'ws-vfx-coll-for-editorial' },
      },
      {
        id: 'p1-share-collection',
        instruction: 'Share it with Lisa Kim (Editorial Coordinator) and Maria Santos (Editor)',
        personaId: 'vfx-coordinator',
        checkpoint: {
          type: 'grant-set',
          resourceId: 'ws-vfx-coll-for-editorial',
          principals: [
            { principalType: 'user', principalId: 'editorial-coordinator' },
            { principalType: 'user', principalId: 'editorial-artist' },
          ],
        },
      },
      {
        id: 'p1-share-vendor',
        instruction: 'Share the Framestore folder (under Vendor Deliveries) with the Framestore team',
        personaId: 'vfx-coordinator',
        checkpoint: {
          type: 'grant-set',
          resourceId: 'ws-vfx-vendor-framestore',
          principals: [{ principalType: 'team', principalId: 'framestore-io' }],
        },
      },
    ],
  },
  {
    id: 'phase-2',
    title: 'Lisa: Review & share cuts',
    description: 'As the Editorial Coordinator, Sarah shared VFX comps with you. Check your inbox, then share your review cuts with the team.',
    personaId: 'editorial-coordinator',
    requiresPhase: 'phase-1',
    waitingMessage: 'Waiting for Sarah Chen (VFX Coordinator) to share VFX Pulls with you. Switch to Sarah to complete that step first.',
    steps: [
      {
        id: 'p2-check-inbox',
        instruction: 'Check your Inbox for Sarah\'s VFX Pulls collection',
        personaId: 'editorial-coordinator',
        checkpoint: { type: 'inbox-resource', resourceId: 'ws-vfx-coll-for-editorial', grantedByUserId: 'vfx-coordinator' },
      },
      {
        id: 'p2-share-dailies',
        instruction: 'Share "Dailies Review Cuts" with Maria Santos, David Park, and Mike Torres',
        personaId: 'editorial-coordinator',
        checkpoint: {
          type: 'grant-set',
          resourceId: 'ws-edit-coll-dailies',
          principals: [
            { principalType: 'user', principalId: 'editorial-artist' },
            { principalType: 'user', principalId: 'creative-david' },
            { principalType: 'user', principalId: 'vfx-supervisor' },
          ],
        },
      },
    ],
  },
  {
    id: 'phase-3',
    title: 'Lisa: Release locked cut',
    description: 'As the Editorial Coordinator, the locked cut is ready for broader review. Release it to studio departments.',
    personaId: 'editorial-coordinator',
    steps: [
      {
        id: 'p3-release-cut',
        instruction: 'Open Cuts, select a locked cut, and release it to Studio VFX, Studio Creative, and Studio Post',
        personaId: 'editorial-coordinator',
        checkpoint: {
          type: 'grant-set',
          resourceId: 'cut-ep301-lc-3',
          principals: [
            { principalType: 'domain', principalId: 'studio-vfx' },
            { principalType: 'domain', principalId: 'studio-creative' },
            { principalType: 'domain', principalId: 'studio-post' },
          ],
        },
      },
    ],
  },

  // --- Receiver phases ---

  {
    id: 'phase-david',
    title: 'David: Review cuts',
    description: 'As the Director, Lisa (Editorial Coordinator) shared dailies review cuts with you. Review the cuts and check your shares.',
    personaId: 'creative-david',
    requiresPhase: 'phase-2',
    waitingMessage: 'Waiting for Lisa Kim (Editorial Coordinator) to share review cuts with you. Switch to Lisa to complete that step first.',
    steps: [
      {
        id: 'pd-check-inbox',
        instruction: 'Check your Inbox for Lisa\'s "Dailies Review Cuts"',
        personaId: 'creative-david',
        checkpoint: { type: 'inbox-resource', resourceId: 'ws-edit-coll-dailies', grantedByUserId: 'editorial-coordinator' },
      },
      {
        id: 'pd-open-collection',
        instruction: 'Open the collection and review the cuts',
        personaId: 'creative-david',
        checkpoint: { type: 'visit-resource', basePath: '/nextgen/collections', resourceId: 'ws-edit-coll-dailies' },
      },
      {
        id: 'pd-check-shares',
        instruction: 'Check the Shares page to see everything shared with you',
        personaId: 'creative-david',
        checkpoint: { type: 'visit-page', path: '/nextgen/shared', match: 'exact' },
      },
    ],
  },
  {
    id: 'phase-maria',
    title: 'Maria: Review cuts',
    description: 'As the Editor, Lisa (Editorial Coordinator) shared dailies review cuts with you. Open and browse them.',
    personaId: 'editorial-artist',
    requiresPhase: 'phase-2',
    waitingMessage: 'Waiting for Lisa Kim (Editorial Coordinator) to share review cuts with you. Switch to Lisa to complete that step first.',
    steps: [
      {
        id: 'pm-check-inbox',
        instruction: 'Check your Inbox for Lisa\'s shared cuts',
        personaId: 'editorial-artist',
        checkpoint: { type: 'inbox-resource', resourceId: 'ws-edit-coll-dailies', grantedByUserId: 'editorial-coordinator' },
      },
      {
        id: 'pm-open-cuts',
        instruction: 'Open "Dailies Review Cuts" and browse the assets',
        personaId: 'editorial-artist',
        checkpoint: { type: 'visit-resource', basePath: '/nextgen/collections', resourceId: 'ws-edit-coll-dailies' },
      },
    ],
  },
  {
    id: 'phase-mike',
    title: 'Mike: Share VFX shots',
    description: 'As the VFX Supervisor, David needs to review VFX shots. Give him access to the Shots folder.',
    personaId: 'vfx-supervisor',
    nextPersonaId: 'creative-david',
    steps: [
      {
        id: 'pmk-browse-workspace',
        instruction: 'Browse the VFX workspace and open the Shots folder',
        personaId: 'vfx-supervisor',
        checkpoint: { type: 'visit-resource', basePath: '/nextgen/workspace', resourceId: 'ws-vfx-shots' },
      },
      {
        id: 'pmk-share-shots',
        instruction: 'Share the Shots folder with David Park (Director)',
        personaId: 'vfx-supervisor',
        checkpoint: {
          type: 'grant-set',
          resourceId: 'ws-vfx-shots',
          principals: [{ principalType: 'user', principalId: 'creative-david' }],
        },
      },
    ],
  },
  {
    id: 'phase-james',
    title: 'James: Deliver comps',
    description: 'As Lead Compositor at Framestore, Sarah (VFX Coordinator) shared a delivery folder with your team. Browse it, upload finished comps, and notify Sarah.',
    personaId: 'vendor-framestore',
    requiresPhase: 'phase-1',
    waitingMessage: 'Waiting for Sarah Chen (VFX Coordinator) to set up your delivery folder. Switch to Sarah to complete that step first.',
    steps: [
      {
        id: 'pj-check-inbox',
        instruction: 'Check your Inbox for Sarah\'s shared delivery folder',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'inbox-resource', resourceId: 'ws-vfx-vendor-framestore', grantedByUserId: 'vfx-coordinator' },
      },
      {
        id: 'pj-browse-folder',
        instruction: 'Open the Framestore folder and browse existing deliverables',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'visit-resource', basePath: '/nextgen/workspace', resourceId: 'ws-vfx-vendor-framestore' },
      },
      {
        id: 'pj-upload',
        instruction: 'Add a new comp file to the Framestore delivery folder',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'file-created', parentFolderId: 'ws-vfx-vendor-framestore' },
      },
      {
        id: 'pj-share-back',
        instruction: 'Share the folder back to Sarah Chen (VFX Coordinator) with a delivery note',
        personaId: 'vendor-framestore',
        checkpoint: {
          type: 'grant-set',
          resourceId: 'ws-vfx-vendor-framestore',
          principals: [{ principalType: 'user', principalId: 'vfx-coordinator' }],
        },
      },
    ],
  },
]

export function getStepPersonaId(phase: Phase, step: PhaseStep | undefined): string | undefined {
  if (!step) return undefined
  if (step.checkpoint.type === 'persona-switch') return step.checkpoint.personaId
  return step.personaId ?? phase.personaId
}

export function getPhaseForPersona(personaId: string, completedPhaseIds: Set<string>, completedStepIds: Set<string>): { phase: Phase; locked: boolean } | null {
  // First try unlocked phases
  for (const phase of PHASES) {
    if (completedPhaseIds.has(phase.id)) continue
    if (phase.requiresPhase && !completedPhaseIds.has(phase.requiresPhase)) continue
    const nextStep = phase.steps.find(step => !completedStepIds.has(step.id))
    if (getStepPersonaId(phase, nextStep) === personaId) return { phase, locked: false }
  }
  // Then try locked phases (show waiting message)
  for (const phase of PHASES) {
    if (completedPhaseIds.has(phase.id)) continue
    if (!phase.requiresPhase || completedPhaseIds.has(phase.requiresPhase)) continue
    if (phase.personaId === personaId) return { phase, locked: true }
  }
  return null
}

export function getCurrentPhase(completedPhaseIds: Set<string>): Phase | null {
  for (const phase of PHASES) {
    if (!completedPhaseIds.has(phase.id)) return phase
  }
  return null
}
