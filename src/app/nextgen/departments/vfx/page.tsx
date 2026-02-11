import { getVfxCollections } from '@/lib/data'
import { VfxView } from './view'

export default async function VFXPage() {
  const collections = await getVfxCollections()

  return <VfxView initialCollections={collections} />
}
