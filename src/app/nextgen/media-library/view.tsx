import type { Collection } from '@/lib/data'
import { CollectionBrowserView } from '@/app/nextgen/_components/collection-browser-view'

interface AllCollectionsViewProps {
  collections: Collection[]
}

export function AllCollectionsView({ collections }: AllCollectionsViewProps) {
  return (
    <CollectionBrowserView
      title="All Collections"
      description={`${collections.length} collection${collections.length !== 1 ? 's' : ''}`}
      detailBackLabel="Back to All Collections"
      collections={collections}
      filterOptions={[
        { id: 'type', label: 'Type' },
        { id: 'modified', label: 'Modified' },
      ]}
    />
  )
}
