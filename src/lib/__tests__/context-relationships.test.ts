import { describe, expect, it } from 'vitest'
import type { Asset } from '@/lib/data'
import { getContextAssetGroups } from '@/lib/context-relationships'

const baseAsset: Asset = {
  id: 'asset-a',
  name: 'Scene 12 Take B',
  type: 'shot',
  shotMeta: {
    scene: 'Scene 12',
    take: 'Take B',
    camera: 'Cam A',
  },
  aiMeta: {
    characters: ['Eleven', 'Mike'],
    scene: 'Scene 12',
  },
}

describe('getContextAssetGroups', () => {
  it('groups adjacent takes, alternate angles, same scene, and shared characters', () => {
    const candidates: Asset[] = [
      {
        id: 'asset-b',
        name: 'Scene 12 Take C',
        type: 'shot',
        shotMeta: { scene: 'Scene 12', take: 'Take C', camera: 'Cam A' },
        aiMeta: { characters: ['Eleven'], scene: 'Scene 12' },
      },
      {
        id: 'asset-c',
        name: 'Scene 12 Cam B',
        type: 'shot',
        shotMeta: { scene: 'Scene 12', take: 'Take B', camera: 'Cam B' },
        aiMeta: { characters: ['Mike'], scene: 'Scene 12' },
      },
      {
        id: 'asset-d',
        name: 'Character Match',
        type: 'image',
        aiMeta: { characters: ['Eleven'] },
      },
    ]

    const groups = getContextAssetGroups(baseAsset, [baseAsset, ...candidates])

    expect(groups.find((group) => group.type === 'adjacent-takes')?.assets.map((asset) => asset.id)).toContain('asset-b')
    expect(groups.find((group) => group.type === 'alternate-angle')?.assets.map((asset) => asset.id)).toContain('asset-c')
    expect(groups.find((group) => group.type === 'same-scene')?.assets.map((asset) => asset.id)).toEqual(
      expect.arrayContaining(['asset-b', 'asset-c']),
    )
    expect(groups.find((group) => group.type === 'related-character')?.assets.map((asset) => asset.id)).toEqual(
      expect.arrayContaining(['asset-b', 'asset-c', 'asset-d']),
    )
  })
})
