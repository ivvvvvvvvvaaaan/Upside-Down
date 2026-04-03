import { describe, expect, it } from 'vitest'
import { mergeCollectionAssetIds } from '@/lib/collection-membership'

describe('mergeCollectionAssetIds', () => {
  it('appends new assets and preserves existing order', () => {
    expect(mergeCollectionAssetIds(['asset-1', 'asset-2'], ['asset-3'])).toEqual([
      'asset-1',
      'asset-2',
      'asset-3',
    ])
  })

  it('dedupes repeated asset ids when adding to an existing collection', () => {
    expect(mergeCollectionAssetIds(['asset-1', 'asset-2'], ['asset-2', 'asset-3', 'asset-1'])).toEqual([
      'asset-1',
      'asset-2',
      'asset-3',
    ])
  })
})
