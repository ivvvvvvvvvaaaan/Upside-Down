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

  it('advances to next phase for the same persona', () => {
    const completedPhaseIds = new Set(['phase-1', 'phase-2', 'phase-3', 'phase-4'])
    const completedStepIds = new Set(['p4-check-vfx-folder', 'p4-share-dailies'])

    // Lisa completed phase-4, should get phase-5 (release)
    expect(getPhaseForPersona('editorial-coordinator', completedPhaseIds, completedStepIds)?.phase.id).toBe('phase-5')
  })

  it('requires exact resources for multi-recipient sharing checkpoints', () => {
    const phase1Share = PHASES
      .find((phase) => phase.id === 'phase-1')
      ?.steps.find((step) => step.id === 'p1-share-to-editorial')
      ?.checkpoint

    expect(phase1Share).toMatchObject({
      type: 'grant-set',
      resourceId: 'ws-vfx-to-editorial',
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
