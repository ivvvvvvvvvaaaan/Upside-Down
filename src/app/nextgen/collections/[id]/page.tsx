'use client'

import { useCollections } from '@/hooks'
import { isSmart } from '@/lib/collection-types'
import { UserCollectionDetailView } from './view'
import { SmartCollectionDetailView } from './smart-collection-view'
import { SharedFolderView } from './shared-folder-view'
import { redirect } from 'next/navigation'

interface Props {
  params: { id: string }
}

/**
 * Unified collection route — renders the right view based on collection flavor.
 * Smart collections, curated collections, and shared folders all resolve at /nextgen/collections/[id].
 * Cut folders (composite assets) redirect to the asset detail page.
 */
export default function CollectionPage({ params }: Props) {
  const { id } = params
  const { getCollection } = useCollections()
  const collection = getCollection(id)
  const isLikelySmartCollection = id.startsWith('smart-')

  // Cut folders are composite assets, not folders — redirect to asset detail
  if (id.startsWith('cut-')) {
    redirect(`/nextgen/assets/${id}`)
  }

  // Smart collection
  if ((collection && isSmart(collection)) || isLikelySmartCollection) {
    return <SmartCollectionDetailView collectionId={id} />
  }

  // Curated collection
  if (collection) {
    return <UserCollectionDetailView collectionId={id} />
  }

  // Shared folder (ID is a workspace folder, not a collection)
  return <SharedFolderView folderId={id} />
}
