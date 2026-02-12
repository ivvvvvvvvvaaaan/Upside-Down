import { getEditorialCollections } from '@/lib/data'
import { EditorialView } from './view'

export default async function EditorialPage() {
  const collections = await getEditorialCollections()

  return <EditorialView initialCollections={collections} />
}
