import { getRecentAssets } from '@/lib/data'
import { MediaLibrarySearchView } from './search-view'

export default async function NextGenPage() {
  const recentAssets = await getRecentAssets(12)

  return <MediaLibrarySearchView recentAssets={recentAssets} />
}
