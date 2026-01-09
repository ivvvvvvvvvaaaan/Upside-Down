import { CollectionCardsView } from '@/app/collection-cards/view'
import { getCollectionsByType } from '@/lib/data'

export default async function ScenesPage() {
  const collections = await getCollectionsByType('scene')
  return <CollectionCardsView title="Scenes" initialCollections={collections} collectionType="scene" />
}
