import { getAllAssets } from '@/lib/data'
import { AssetsView } from './view'

export default async function AssetsPage() {
  const assets = await getAllAssets()

  return <AssetsView assets={assets} />
}
