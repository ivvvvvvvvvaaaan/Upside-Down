import { getArtCollections } from '@/lib/data'
import { ArtDesignView } from './view'

export default async function ArtDesignPage() {
  const collections = await getArtCollections()

  return <ArtDesignView initialCollections={collections} />
}
