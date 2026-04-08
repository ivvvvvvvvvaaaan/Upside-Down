'use client'

import { useCollections } from '@/hooks'
import { isSmart } from '@/lib/collection-types'
import { UserCollectionDetailView } from './view'
import { SmartCollectionDetailView } from './smart-collection-view'

interface Props {
  params: { id: string }
}

/**
 * Unified collection route — renders the right view based on collection flavor.
 * Smart collections and curated collections both resolve at /nextgen/collections/[id].
 */
export default function CollectionPage({ params }: Props) {
  const { id } = params
  const { getCollection } = useCollections()
  const collection = getCollection(id)
  const isLikelySmartCollection = id.startsWith('smart-')

  // Smart collection → use the smart collection detail view
  if ((collection && isSmart(collection)) || isLikelySmartCollection) {
    return <SmartCollectionDetailView collectionId={id} />
  }

  // Curated or unknown → use the user collection detail view
  return <UserCollectionDetailView collectionId={id} />
}
