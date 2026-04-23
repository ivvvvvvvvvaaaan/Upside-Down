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
    const completedPhaseIds = new Set(['phase-1', 'phase-2'])
    const completedStepIds = new Set(['p2-check-inbox', 'p2-share-dailies'])

    // Lisa's phase-2 is done, she should get phase-3 (release)
    expect(getPhaseForPersona('editorial-coordinator', completedPhaseIds, completedStepIds)?.phase.id).toBe('phase-3')
  })

  it('requires exact resources for multi-recipient sharing checkpoints', () => {
    const phase1Share = PHASES
      .find((phase) => phase.id === 'phase-1')
      ?.steps.find((step) => step.id === 'p1-share-collection')
      ?.checkpoint

    expect(phase1Share).toMatchObject({
      type: 'grant-set',
      resourceId: 'ws-vfx-coll-for-editorial',
    })
    expect(phase1Share?.type === 'grant-set' ? phase1Share.principals : []).toEqual([
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
