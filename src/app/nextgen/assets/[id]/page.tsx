import { AssetDetailView } from './view'

interface Props {
  params: { id: string }
}

export default function AssetDetailPage({ params }: Props) {
  const { id } = params
  return <AssetDetailView assetId={id} />
}
