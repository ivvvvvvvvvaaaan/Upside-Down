import { CollectionCardsView } from '@/app/collection-cards/view'
import { getCollectionsByType } from '@/lib/data'

export default async function CharactersPage() {
  const collections = await getCollectionsByType('character')
  return <CollectionCardsView title="Characters" initialCollections={collections} />
}
