import { CollectionCardsView } from '../view'
import { getCollectionsByType } from '@/lib/data'

export default function LocationsPage() {
  const collections = getCollectionsByType('location')
  return <CollectionCardsView title="Locations" initialCollections={collections} collectionType="location" />
}
