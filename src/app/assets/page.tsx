import { getAllAssets, getCollections } from '@/lib/data'
import { AssetsView } from './view'

export default async function AssetsPage() {
  const [assets, collections] = await Promise.all([
    getAllAssets(),
    getCollections(),
  ])

  return <AssetsView assets={assets} collections={collections} />
}
