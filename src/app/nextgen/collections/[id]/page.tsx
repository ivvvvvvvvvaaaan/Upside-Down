import { UserCollectionDetailView } from './view'

interface Props {
  params: { id: string }
}

export default function UserCollectionPage({ params }: Props) {
  const { id } = params
  return <UserCollectionDetailView collectionId={id} />
}
