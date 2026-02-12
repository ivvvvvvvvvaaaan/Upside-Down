import { getCameraCollections } from '@/lib/data'
import { CameraView } from './view'

export default async function CameraPage() {
  const collections = await getCameraCollections()

  return <CameraView initialCollections={collections} />
}
