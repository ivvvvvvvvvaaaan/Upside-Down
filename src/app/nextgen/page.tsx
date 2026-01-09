import { getCollections, getAllAssets } from '@/lib/data'
import { MediaLibraryView } from './media-library/view'

export default async function NextGenPage() {
  const [collections, assets] = await Promise.all([
    getCollections(),
    getAllAssets(),
  ])

  return <MediaLibraryView collections={collections} assets={assets} />
}
