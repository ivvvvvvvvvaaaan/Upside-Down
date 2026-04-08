import { describe, expect, it } from 'vitest'
import { compareCutsByStageAndVersion, getCutStageLabel, seedCutToAsset } from '@/lib/cuts'
import type { SeedCut } from '@/lib/scenario'

const BASE_CUT: SeedCut = {
  id: 'cut-1',
  name: 'Episode 101 Cut',
  episode: '101',
  stage: 'locked-cut',
  version: 0,
  assetVersion: 'v1',
  constituents: ['asset-1'],
  createdBy: 'editor@example.com',
  date: '2026-02-10',
  duration: '01:00',
  note: 'Prototype cut',
}

describe('cut utilities', () => {
  it('builds release-aware cut tags from one shared transformer', () => {
    const asset = seedCutToAsset(BASE_CUT, {
      labels: ['Studio Post', 'Globalization'],
      isAll: false,
    })

    expect(asset.tags?.map((tag) => tag.label)).toEqual([
      'Locked Cut',
      'SP',
      '+1',
    ])
  })

  it('sorts later cut stages ahead of earlier ones', () => {
    expect(compareCutsByStageAndVersion(
      { stage: 'locked-cut', version: 3 },
      { stage: 'final-cut', version: 1 },
    )).toBeGreaterThan(0)
    expect(getCutStageLabel('emf')).toBe('EMF')
  })
})
