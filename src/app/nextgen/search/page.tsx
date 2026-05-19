import { Suspense } from 'react'
import { getRecentAssets } from '@/lib/data'
import { MediaLibrarySearchView } from './view'

/**
 * /nextgen/search — canonical, deep-linkable search route.
 *
 * Reads `?q=` from the URL (client-side via the view) and round-trips on
 * edits. Server side just hands the recent assets gallery to the view; the
 * search engine and UI live in the client component.
 *
 * The Suspense boundary is required by Next 14 because useSearchParams in
 * the view opts the page out of static rendering otherwise.
 */
export default async function SearchPage() {
  const recentAssets = await getRecentAssets(12)

  return (
    <Suspense fallback={null}>
      <MediaLibrarySearchView recentAssets={recentAssets} />
    </Suspense>
  )
}
