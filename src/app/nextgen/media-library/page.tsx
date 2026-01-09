import { getCollections } from '@/lib/data'
import { AllCollectionsView } from './view'

export default async function AllCollectionsPage() {
  const collections = await getCollections()

  return <AllCollectionsView collections={collections} />
}
