import { CollectionCardsView } from '../view'
import { getCollectionsByType } from '@/lib/data'

export default async function LocationsPage() {
  const collections = await getCollectionsByType('location')
  return <CollectionCardsView title="Locations" initialCollections={collections} collectionType="location" />
}
