import { CollectionCardsView } from './view'
import { getCollections } from '@/lib/data'

/*
 * ===========================================
 * COLLECTION CARDS
 * ===========================================
 * Display collections by character, location, and scene
 * Based on Figma design: Next-Gen Media Library
 */

export default function CollectionCardsPage() {
  const collections = getCollections()

  return <CollectionCardsView title="Collections" initialCollections={collections} collectionType="all" />
}
