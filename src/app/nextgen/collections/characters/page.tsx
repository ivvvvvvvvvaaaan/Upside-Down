import { CollectionCardsView } from '../view'
import { getCollectionsByType } from '@/lib/data'

export default function CharactersPage() {
  const collections = getCollectionsByType('character')
  return <CollectionCardsView title="Characters" initialCollections={collections} collectionType="character" />
}
