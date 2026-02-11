import { getArtCollections } from '@/lib/data'
import { CollectionCardsView } from '../../collections/view'

export default async function ArtDesignPage() {
  const collections = await getArtCollections()

  return (
    <CollectionCardsView
      title="Art & Design"
      initialCollections={collections}
      collectionType="all"
    />
  )
}
