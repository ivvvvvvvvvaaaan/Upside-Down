import { getCollections } from '@/lib/data'
import { EditorialView } from './view'

export default async function EditorialPage() {
  // Pass global collections for metadata lookup (names, types, avatars)
  const collections = await getCollections()

  return <EditorialView initialCollections={collections} />
}
