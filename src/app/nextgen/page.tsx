import { Suspense } from 'react'
import { getRecentAssets } from '@/lib/data'
import { MediaLibrarySearchView } from './search/view'

/**
 * /nextgen — landing page. Mounts the same search view as /nextgen/search so
 * the experience is identical from either URL; ?q= round-trips at both.
 *
 * Suspense boundary required by Next 14 — useSearchParams inside the client
 * view forces dynamic rendering of the page tree above it.
 */
export default async function NextGenPage() {
  const recentAssets = await getRecentAssets(12)

  return (
    <Suspense fallback={null}>
      <MediaLibrarySearchView recentAssets={recentAssets} />
    </Suspense>
  )
}
