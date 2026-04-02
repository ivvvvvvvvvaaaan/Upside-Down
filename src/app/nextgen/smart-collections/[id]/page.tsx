import { SmartCollectionDetailView } from './view'

interface Props {
  params: { id: string }
}

export default function SmartCollectionPage({ params }: Props) {
  const { id } = params
  return <SmartCollectionDetailView collectionId={id} />
}
