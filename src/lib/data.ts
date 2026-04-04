import { mergePrototypeAssets } from '@/lib/prototype-assets'
import {
  MOCK_COLLECTIONS,
} from '@/lib/data-client'
import type { Asset, Collection, DepartmentId } from '@/lib/data-client'

export type {
  AssetType,
  AssetKind,
  CutStage,
  ShotMetadata,
  VideoMetadata,
  ImageMetadata,
  TextMetadata,
  AudioMetadata,
  DepartmentId,
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
} from '@/lib/data-client'

const MOCK_ASSETS: Asset[] = []

export function getAssetIdVariants(id: string): string[] {
  if (id.startsWith('inst-')) {
    return [id, id.slice(5)]
  }
  return [id, `inst-${id}`]
}

function getAssetResolutionScore(asset: Asset): number {
  let score = 0

  if (asset.thumbnail) score += 10
  if (asset.workspacePath) score += 4
  if ((asset.sourceFolderIds?.length ?? 0) > 0) score += 3
  if (asset.department) score += 2
  if (asset.created_at) score += 1

  return score
}

function resolveAssetById(id: string, assetsById: Map<string, Asset>): Asset | undefined {
  const resolved = getAssetIdVariants(id)
    .map((candidateId) => assetsById.get(candidateId))
    .filter((candidate): candidate is Asset => Boolean(candidate))
    .sort((left, right) => {
      const scoreDelta = getAssetResolutionScore(right) - getAssetResolutionScore(left)
      if (scoreDelta !== 0) return scoreDelta

      return left.id === id ? -1 : right.id === id ? 1 : 0
    })[0]

  if (!resolved) return undefined
  if (resolved.id === id) return resolved

  // Preserve the requested ID so collection membership and shared routes stay stable.
  return { ...resolved, id }
}

export function getAssets(): Asset[] {
  return MOCK_ASSETS
}

function getAllAssets(): Asset[] {
  return mergePrototypeAssets(getAssets())
}

export function getAssetsByDepartment(departmentId: DepartmentId): Asset[] {
  return getAssets().filter(a => a.department === departmentId)
}

export function getAssetsByDepartmentAndCollection(departmentId: DepartmentId, collectionId: string): Asset[] {
  return getAssets().filter(a => a.department === departmentId && a.collectionIds?.includes(collectionId))
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
    .map((id) => resolveAssetById(id, assetsById))
    .filter(Boolean) as Asset[]
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
