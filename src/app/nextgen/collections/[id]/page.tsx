import { UserCollectionDetailView } from './view'

interface Props {
  params: Promise<{ id: string }>
}

export default async function UserCollectionPage({ params }: Props) {
  const { id } = await params
  return <UserCollectionDetailView collectionId={id} />
}
