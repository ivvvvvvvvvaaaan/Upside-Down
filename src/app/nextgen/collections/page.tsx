import { CollectionCardsView } from './view'
import { getCollections } from '@/lib/data'

/*
 * ===========================================
 * COLLECTION CARDS
 * ===========================================
 * Display collections by character, location, and scene
 * Based on Figma design: Next-Gen Media Library
 */

export default async function CollectionCardsPage() {
  const collections = await getCollections()

  return <CollectionCardsView title="Collections" initialCollections={collections} collectionType="all" />
}
