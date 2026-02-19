import { getCollections } from '@/lib/data'
import { ArtDesignView } from './view'

export default async function ArtDesignPage() {
  // Pass global collections for metadata lookup (names, types, avatars)
  const collections = await getCollections()

  return <ArtDesignView initialCollections={collections} />
}
