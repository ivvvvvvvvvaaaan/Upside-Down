'use client'

import { useCollections } from '@/hooks'
import { isSmart } from '@/lib/collection-types'
import { UserCollectionDetailView } from './view'
import { SmartCollectionDetailView } from '@/app/nextgen/smart-collections/[id]/view'

interface Props {
  params: { id: string }
}

/**
 * Unified collection route — renders the right view based on collection flavor.
 * Smart collections and curated collections both resolve at /nextgen/collections/[id].
 * The old /nextgen/smart-collections/[id] route still works for backward compatibility.
 */
export default function CollectionPage({ params }: Props) {
  const { id } = params
  const { getCollection } = useCollections()
  const collection = getCollection(id)

  // Smart collection → use the smart collection detail view
  if (collection && isSmart(collection)) {
    return <SmartCollectionDetailView collectionId={id} />
  }

  // Curated or unknown → use the user collection detail view
  return <UserCollectionDetailView collectionId={id} />
}
