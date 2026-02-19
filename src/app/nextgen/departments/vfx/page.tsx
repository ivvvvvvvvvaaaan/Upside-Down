import { getCollections } from '@/lib/data'
import { VfxView } from './view'

export default async function VFXPage() {
  // Pass global collections for metadata lookup (names, types, avatars)
  const collections = await getCollections()

  return <VfxView initialCollections={collections} />
}
