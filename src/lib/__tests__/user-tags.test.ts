import { describe, expect, it } from 'vitest'
import type { Asset } from '@/lib/data'
import { mergeUserTagsIntoAsset } from '@/lib/user-tags'

describe('user tags', () => {
  it('merges user-created tags into asset tags for shared card rendering', () => {
    const asset: Asset = {
      id: 'asset-1',
      name: 'A_0003C011_260215',
      type: 'video',
      department: 'camera',
      tags: [{ label: 'Camera Daily', source: 'system' }],
    }

    const merged = mergeUserTagsIntoAsset(asset, {
      'asset-1': ['Circle Take'],
    })

    expect(merged.tags).toEqual([
      { label: 'Camera Daily', source: 'system' },
      { label: 'Circle Take', source: 'user' },
    ])
  })

  it('does not duplicate a user tag when a system tag already provides it', () => {
    const asset: Asset = {
      id: 'asset-1',
      name: 'Scene12_TakeB_SELECT',
      type: 'video',
      department: 'camera',
      tags: [
        { label: 'Camera Select', source: 'system' },
        { label: 'Circle Take', source: 'system' },
      ],
    }

    const merged = mergeUserTagsIntoAsset(asset, {
      'asset-1': ['circle take'],
    })

    expect(merged.tags).toEqual(asset.tags)
  })
})
