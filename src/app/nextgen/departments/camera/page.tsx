import { getCollections } from '@/lib/data'
import { CameraView } from './view'

export default async function CameraPage() {
  // Pass global collections for metadata lookup (names, types, avatars)
  const collections = await getCollections()

  return <CameraView initialCollections={collections} />
}
