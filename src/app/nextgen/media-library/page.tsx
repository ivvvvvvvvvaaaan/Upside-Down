import { getCollections } from '@/lib/data'
import { AllCollectionsView } from './view'

export default function AllCollectionsPage() {
  const collections = getCollections()

  return <AllCollectionsView collections={collections} />
}
