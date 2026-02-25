import { SmartCollectionDetailView } from './view'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SmartCollectionPage({ params }: Props) {
  const { id } = await params
  return <SmartCollectionDetailView collectionId={id} />
}
