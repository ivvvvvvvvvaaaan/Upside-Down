import { getAudioCollections } from '@/lib/data'
import { AudioSoundView } from './view'

export default async function AudioSoundPage() {
  const collections = await getAudioCollections()

  return <AudioSoundView initialCollections={collections} />
}
