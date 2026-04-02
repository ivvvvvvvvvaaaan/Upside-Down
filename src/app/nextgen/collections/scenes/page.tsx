import { CollectionCardsView } from '../view'
import { getCollectionsByType } from '@/lib/data'

export default function ScenesPage() {
  const collections = getCollectionsByType('scene')
  return <CollectionCardsView title="Scenes" initialCollections={collections} collectionType="scene" />
}
