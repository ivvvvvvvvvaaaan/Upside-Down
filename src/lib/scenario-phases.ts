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
    title: 'Sarah: Set up sharing channels',
    description: 'Set up directional sharing folders so VFX shots flow to editorial and vendor deliveries have a clear home.',
    personaId: 'vfx-coordinator',
    nextPersonaId: 'vendor-framestore',
    steps: [
      {
        id: 'p1-share-to-editorial',
        instruction: 'Share the "VFX to Editorial" folder with Lisa Kim (Editorial Coordinator) and Maria Santos (Editor)',
        personaId: 'vfx-coordinator',
        checkpoint: {
          type: 'grant-set',
          resourceId: 'ws-vfx-to-editorial',
          principals: [
            { principalType: 'user', principalId: 'editorial-coordinator' },
            { principalType: 'user', principalId: 'editorial-artist' },
          ],
        },
      },
      {
        id: 'p1-share-to-framestore',
        instruction: 'Share the "Framestore <> VFX" folder with the Framestore team',
        personaId: 'vfx-coordinator',
        checkpoint: {
          type: 'grant-set',
          resourceId: 'ws-vfx-to-framestore',
          principals: [{ principalType: 'team', principalId: 'framestore-io' }],
        },
      },
    ],
  },
  {
    id: 'phase-2',
    title: 'James: Deliver comps',
    description: 'Sarah (VFX Coordinator) shared a delivery folder with your team. Browse it, upload your finished comps, and share back with Sarah.',
    personaId: 'vendor-framestore',
    requiresPhase: 'phase-1',
    waitingMessage: 'Waiting for Sarah Chen (VFX Coordinator) to set up your delivery folder. Switch to Sarah to complete that step first.',
    nextPersonaId: 'vfx-supervisor',
    steps: [
      {
        id: 'p2-check-inbox',
        instruction: 'Check your Inbox for Sarah\'s shared delivery folder',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'inbox-resource', resourceId: 'ws-vfx-to-framestore', grantedByUserId: 'vfx-coordinator' },
      },
      {
        id: 'p2-browse-folder',
        instruction: 'Open the "Framestore <> VFX" folder and browse existing deliverables',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'visit-resource', basePath: '/nextgen/workspace', resourceId: 'ws-vfx-to-framestore' },
      },
      {
        id: 'p2-upload',
        instruction: 'Add a new comp file to the delivery folder',
        personaId: 'vendor-framestore',
        checkpoint: { type: 'file-created', parentFolderId: 'ws-vfx-to-framestore' },
      },
      {
        id: 'p2-share-back',
        instruction: 'Share the folder back to Sarah Chen (VFX Coordinator) with a delivery note',
        personaId: 'vendor-framestore',
        checkpoint: {
          type: 'grant-set',
          resourceId: 'ws-vfx-to-framestore',
          principals: [{ principalType: 'user', principalId: 'vfx-coordinator' }],
        },
      },
    ],
  },
  {
    id: 'phase-3',
    title: 'Mike: Approve shots for editorial',
    description: 'Vendor comps have arrived. Review them and add approved shots to the "VFX to Editorial" folder so the editorial team can pick them up.',
    personaId: 'vfx-supervisor',
    nextPersonaId: 'editorial-coordinator',
    steps: [
      {
        id: 'p3-browse-vendor',
        instruction: 'Open the "Framestore <> VFX" folder and review the vendor deliveries',
        personaId: 'vfx-supervisor',
        checkpoint: { type: 'visit-resource', basePath: '/nextgen/workspace', resourceId: 'ws-vfx-to-framestore' },
      },
      {
        id: 'p3-add-to-editorial',
        instruction: 'Copy an approved shot into the "VFX to Editorial" folder',
        personaId: 'vfx-supervisor',
        checkpoint: { type: 'file-created', parentFolderId: 'ws-vfx-to-editorial' },
      },
    ],
  },
  {
    id: 'phase-4',
    title: 'Lisa: Review VFX shots & share cuts',
    description: 'New VFX shots are in the "VFX to Editorial" folder. Review them, then share your dailies review cuts with the team.',
    personaId: 'editorial-coordinator',
    steps: [
      {
        id: 'p4-check-vfx-folder',
        instruction: 'Open the "VFX to Editorial" shared folder and review the new shots',
        personaId: 'editorial-coordinator',
        checkpoint: { type: 'visit-resource', basePath: '/nextgen/workspace', resourceId: 'ws-vfx-to-editorial' },
      },
      {
        id: 'p4-share-dailies',
        instruction: 'Share "Dailies Review Cuts" with Maria Santos (Editor), David Park (Director), and Mike Torres (VFX Supervisor)',
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
    id: 'phase-5',
    title: 'Lisa: Release locked cut',
    description: 'The locked cut is ready for broader review. Release it to studio departments.',
    personaId: 'editorial-coordinator',
    steps: [
      {
        id: 'p5-release-cut',
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
    description: 'Lisa (Editorial Coordinator) shared dailies review cuts with you. Check your inbox and review them.',
    personaId: 'creative-david',
    requiresPhase: 'phase-4',
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
    description: 'Lisa (Editorial Coordinator) shared dailies review cuts with you. Check your inbox and browse them.',
    personaId: 'editorial-artist',
    requiresPhase: 'phase-4',
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
