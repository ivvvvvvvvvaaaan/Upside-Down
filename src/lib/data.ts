import { mergePrototypeAssets } from '@/lib/prototype-assets'
import { MOCK_COLLECTIONS } from '@/lib/data-client'
import type { Asset, Collection, DomainId } from '@/lib/data-client'
import { seedCutToAsset } from '@/lib/cuts'
import { buildCuts } from '@/lib/scenario'
import type { UserCollection } from '@/hooks/useUserCollections'

export type {
  AssetType,
  AssetKind,
  CutStage,
  ShotMetadata,
  VideoMetadata,
  ImageMetadata,
  TextMetadata,
  AudioMetadata,
  DomainId,
  SmartCollectionCategory,
  SmartCollectionIcon,
  AssetFilter,
  SmartCollectionGroupBy,
  SmartCollection,
  TagSource,
  AssetTag,
  AIMeta,
  Asset,
  Collection,
  MediaAssetType,
} from '@/lib/data-client'

const MOCK_ASSETS: Asset[] = []

export function getAssetIdVariants(id: string): string[] {
  return [id]
}

export function getAssets(): Asset[] {
  return MOCK_ASSETS
}

function getAllAssets(): Asset[] {
  const assets = mergePrototypeAssets(getAssets())
  const cutAssets = buildCuts().map(c => seedCutToAsset(c))
  return [...assets, ...cutAssets]
}

export function getAssetsByDomain(domainId: DomainId): Asset[] {
  return getAssets().filter(a => a.department === domainId)
}
export function getAssetsByDomainAndCollection(domainId: DomainId, collectionId: string): Asset[] {
  return getAssets().filter(a => a.department === domainId && a.collectionIds?.includes(collectionId))
}
export function getRecentAssets(limit: number = 12): Asset[] {
  return getAllAssets()
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateB - dateA
    })
    .slice(0, limit)
}

export function getAssetsByIds(ids: string[]): Asset[] {
  const assetsById = new Map(getAllAssets().map((asset) => [asset.id, asset]))
  return ids
    .map((id) => assetsById.get(id))
    .filter((a): a is Asset => a != null)
}

/**
 * Resolve full Asset objects for a collection.
 * Single function used by both API routes and hooks.
 */
export function resolveCollectionAssets(collection: UserCollection): Asset[] {
  return getAssetsByIds(collection.assetIds)
}

export function getCollections(): Collection[] {
  return MOCK_COLLECTIONS
}

export function getCollectionsByType(type: Collection['type']): Collection[] {
  return MOCK_COLLECTIONS.filter(c => c.type === type)
}

export function getAssetsByCollection(collectionId: string): Asset[] {
  return MOCK_ASSETS.filter(asset => asset.collectionIds?.includes(collectionId))
}
