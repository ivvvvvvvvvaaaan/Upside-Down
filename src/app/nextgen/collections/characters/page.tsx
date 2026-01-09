import { CollectionCardsView } from '../view'
import { getCollectionsByType } from '@/lib/data'

export default async function CharactersPage() {
  const collections = await getCollectionsByType('character')
  return <CollectionCardsView title="Characters" initialCollections={collections} collectionType="character" />
}
