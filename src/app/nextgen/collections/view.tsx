import type { CollectionViewType } from '@/hooks'
import type { Collection } from '@/lib/data'
import { CollectionBrowserView } from '@/app/nextgen/_components/collection-browser-view'

interface CollectionCardsViewProps {
  title: string
  initialCollections: Collection[]
  collectionType?: CollectionViewType
}

export function CollectionCardsView({ title, initialCollections }: CollectionCardsViewProps) {
  return (
    <CollectionBrowserView
      title={title}
      description="Browse collections by character, location, or scene"
      detailBackLabel="Back to Collections"
      collections={initialCollections}
      allowHideEmptyCollections
    />
  )
}
