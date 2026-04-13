import type { SmartCollection } from '@/lib/data'
import type { UserCollection } from '@/hooks/useUserCollections'

type SmartShareSource = Pick<SmartCollection, 'id' | 'name' | 'createdBy'>

function isLegacySmartShareSnapshot(
  collection: UserCollection,
  smartCollection: SmartShareSource,
): boolean {
  if (collection.sourceSmartCollectionId) return false
  if (!smartCollection.createdBy) return false
  return (
    collection.name === `${smartCollection.name} (shared)` &&
    collection.createdBy === smartCollection.createdBy
  )
}

export function isSmartShareSnapshotCollection(
  collection: UserCollection,
  smartCollection: SmartShareSource,
): boolean {
  return (
    collection.sourceSmartCollectionId === smartCollection.id ||
    isLegacySmartShareSnapshot(collection, smartCollection)
  )
}

export function getSmartShareSnapshotCollections(
  collections: UserCollection[],
  smartCollection: SmartShareSource,
): UserCollection[] {
  return collections
    .filter((collection) => isSmartShareSnapshotCollection(collection, smartCollection))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
}
