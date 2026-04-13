import { describe, expect, it } from 'vitest'
import type { SmartCollection } from '@/lib/data'
import type { UserCollection } from '@/hooks/useUserCollections'
import { getSmartShareSnapshotCollections } from '@/lib/smart-collection-share-utils'

function buildSmartCollection(overrides: Partial<SmartCollection> = {}): SmartCollection {
  return {
    flavor: 'smart',
    id: 'smart-needs-review',
    name: 'Needs AI Review',
    icon: 'filter',
    filter: { aiConfidenceBelow: 0.7 },
    createdBy: 'mtorres@netflix.com',
    createdAt: new Date('2026-02-10'),
    ...overrides,
  }
}

function buildUserCollection(overrides: Partial<UserCollection> = {}): UserCollection {
  return {
    flavor: 'collection',
    id: 'user-col-1',
    name: 'Needs AI Review (shared)',
    assetIds: ['asset-1'],
    createdAt: new Date('2026-02-11'),
    createdBy: 'mtorres@netflix.com',
    ...overrides,
  }
}

describe('getSmartShareSnapshotCollections', () => {
  it('matches snapshot collections by explicit source smart collection id', () => {
    const smartCollection = buildSmartCollection()
    const collections = [
      buildUserCollection({ id: 'linked', sourceSmartCollectionId: smartCollection.id }),
      buildUserCollection({ id: 'other', sourceSmartCollectionId: 'smart-other' }),
    ]

    expect(getSmartShareSnapshotCollections(collections, smartCollection).map((collection) => collection.id)).toEqual(['linked'])
  })

  it('falls back to the legacy shared naming convention for older snapshots', () => {
    const smartCollection = buildSmartCollection()
    const collections = [
      buildUserCollection({ id: 'legacy' }),
      buildUserCollection({ id: 'different-owner', createdBy: 'someone-else@netflix.com' }),
      buildUserCollection({ id: 'different-name', name: 'Needs AI Review Archive' }),
    ]

    expect(getSmartShareSnapshotCollections(collections, smartCollection).map((collection) => collection.id)).toEqual(['legacy'])
  })

  it('returns newest snapshots first', () => {
    const smartCollection = buildSmartCollection()
    const collections = [
      buildUserCollection({
        id: 'older',
        createdAt: new Date('2026-02-11'),
        sourceSmartCollectionId: smartCollection.id,
      }),
      buildUserCollection({
        id: 'newer',
        createdAt: new Date('2026-02-12'),
        sourceSmartCollectionId: smartCollection.id,
      }),
    ]

    expect(getSmartShareSnapshotCollections(collections, smartCollection).map((collection) => collection.id)).toEqual([
      'newer',
      'older',
    ])
  })
})
