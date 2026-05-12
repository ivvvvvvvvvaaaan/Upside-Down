import { describe, expect, it } from 'vitest'
import {
  getCompositeConceptComponents,
  getMediaAssetsByProductionShot,
} from '@/lib/prototype-assets'

describe('prototype composite concept assets', () => {
  it('keeps CG replacement shots out of production-shot media constituents', () => {
    const assets = getMediaAssetsByProductionShot('EP303-S52-T07A')
    const ids = assets.map((asset) => asset.id)

    expect(ids).toContain('ws-edit-vfx-2')
    expect(ids).not.toContain('VFX_EP303_SC52_001')
    expect(assets.every((asset) => !asset.kind || asset.kind === 'file')).toBe(true)
  })

  it('returns hand-seeded media components for their production shot', () => {
    const ids = new Set(
      getMediaAssetsByProductionShot('EP301-S05-T03A')
        .map((asset) => asset.id),
    )

    for (const component of getCompositeConceptComponents()) {
      expect(ids.has(component.id)).toBe(true)
    }
  })
})
