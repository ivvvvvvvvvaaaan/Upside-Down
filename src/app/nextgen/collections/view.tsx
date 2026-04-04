import type { CollectionViewType } from '@/hooks'
import type { Collection } from '@/lib/data'
import { CollectionBrowserView } from '@/app/nextgen/_components/collection-browser-view'

interface CollectionCardsViewProps {
  title: string
  initialCollections: Collection[]
  collectionType?: CollectionViewType
}

export function CollectionCardsView({ title, initialCollections, collectionType = 'all' }: CollectionCardsViewProps) {
  const filterOptions = (() => {
    switch (collectionType) {
      case 'character':
        return [
          { id: 'episode', label: 'Episode' },
          { id: 'role', label: 'Role' },
          { id: 'status', label: 'Status' },
        ]
      case 'scene':
        return [
          { id: 'episode', label: 'Episode' },
          { id: 'location', label: 'Location' },
          { id: 'time-of-day', label: 'Time of Day' },
        ]
      default:
        return [
          { id: 'type', label: 'Type' },
          { id: 'modified', label: 'Modified' },
        ]
    }
  })()

  return (
    <CollectionBrowserView
      title={title}
      description="Browse collections by character, location, or scene"
      detailBackLabel="Back to Collections"
      collections={initialCollections}
      filterOptions={filterOptions}
      allowHideEmptyCollections
    />
  )
}
