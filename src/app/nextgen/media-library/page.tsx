import { getCollections, getAllAssets } from '@/lib/data'
import { MediaLibraryView } from './view'

export default async function MediaLibraryPage() {
  const [collections, assets] = await Promise.all([
    getCollections(),
    getAllAssets(),
  ])

  return <MediaLibraryView collections={collections} assets={assets} />
}
