import { getCollections } from '@/lib/data'
import { AudioSoundView } from './view'

export default async function AudioSoundPage() {
  // Pass global collections for metadata lookup (names, types, avatars)
  const collections = await getCollections()

  return <AudioSoundView initialCollections={collections} />
}
