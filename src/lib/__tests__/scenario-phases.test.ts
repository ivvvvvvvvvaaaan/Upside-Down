import { describe, expect, it } from 'vitest'
import { PHASES, getPhaseForPersona } from '@/lib/scenario-phases'

describe('scenario phases', () => {
  it('uses auto-detectable checkpoint types for every step', () => {
    const checkpoints = PHASES.flatMap((phase) => phase.steps.map((step) => step.checkpoint))
    const checkpointTypes = checkpoints.map((checkpoint) => checkpoint.type)

    expect(checkpointTypes).not.toContain('manual')
    expect(checkpointTypes).not.toContain('grant')
    expect(checkpointTypes).not.toContain('any-grant-to')
    expect(checkpoints.some((checkpoint) => 'pathPrefix' in checkpoint)).toBe(false)
  })

  it('selects persona phases from the next incomplete step, not phase ids', () => {
    const completedPhaseIds = new Set(['phase-2'])
    const completedStepIds = new Set(['p2-find-collection', 'p2-share-collection'])

    expect(getPhaseForPersona('editorial-coordinator', completedPhaseIds, completedStepIds)?.id).toBe('phase-2b')
  })

  it('requires exact resources for multi-recipient sharing checkpoints', () => {
    const phase2Share = PHASES
      .find((phase) => phase.id === 'phase-2')
      ?.steps.find((step) => step.id === 'p2-share-collection')
      ?.checkpoint

    expect(phase2Share).toMatchObject({
      type: 'grant-set',
      resourceId: 'ws-vfx-coll-for-editorial',
    })
    expect(phase2Share?.type === 'grant-set' ? phase2Share.principals : []).toEqual([
      { principalType: 'user', principalId: 'editorial-coordinator' },
      { principalType: 'user', principalId: 'editorial-artist' },
    ])
  })

  it('ties inbox steps to the shared resource they are meant to validate', () => {
    const inboxCheckpoints = PHASES.flatMap((phase) =>
      phase.steps
        .map((step) => step.checkpoint)
        .filter((checkpoint) => checkpoint.type === 'inbox-resource')
    )

    expect(inboxCheckpoints.length).toBeGreaterThan(0)
    expect(inboxCheckpoints.every((checkpoint) => checkpoint.resourceId.length > 0)).toBe(true)
  })
})
