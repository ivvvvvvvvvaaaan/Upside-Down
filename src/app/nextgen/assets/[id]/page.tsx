import { AssetDetailView } from './view'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AssetDetailPage({ params }: Props) {
  const { id } = await params
  return <AssetDetailView assetId={id} />
}
