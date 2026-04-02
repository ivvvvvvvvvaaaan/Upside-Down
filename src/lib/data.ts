import { mergePrototypeAssets } from '@/lib/prototype-assets'
import {
  MOCK_COLLECTIONS,
  MOCK_ART_COLLECTIONS,
  MOCK_VFX_COLLECTIONS,
  MOCK_CAMERA_COLLECTIONS,
  MOCK_EDITORIAL_COLLECTIONS,
  MOCK_AUDIO_COLLECTIONS,
} from '@/lib/data-client'
import type { Asset, Collection, DepartmentId } from '@/lib/data-client'

export type {
  AssetType,
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

export function getAssets(): Asset[] {
  return MOCK_ASSETS
}

export function getAllAssets(): Asset[] {
  return mergePrototypeAssets(getAssets())
}

export function getAssetsByDepartment(departmentId: DepartmentId): Asset[] {
  return getAssets().filter(a => a.department === departmentId)
}

export function getAssetsByDepartmentAndCollection(departmentId: DepartmentId, collectionId: string): Asset[] {
  return getAssets().filter(a => a.department === departmentId && a.collectionIds?.includes(collectionId))
}

export function getRecentAssets(limit: number = 12): Asset[] {
  return getAssets()
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateB - dateA
    })
    .slice(0, limit)
}

export function getAsset(id: string): Asset | undefined {
  return getAllAssets().find(a => a.id === id)
}

export function getAssetsByIds(ids: string[]): Asset[] {
  const idSet = new Set(ids)
  return getAllAssets().filter(a => idSet.has(a.id))
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

export function getArtCollections(): Collection[] { return MOCK_ART_COLLECTIONS }
export function getVfxCollections(): Collection[] { return MOCK_VFX_COLLECTIONS }
export function getCameraCollections(): Collection[] { return MOCK_CAMERA_COLLECTIONS }
export function getEditorialCollections(): Collection[] { return MOCK_EDITORIAL_COLLECTIONS }
export function getAudioCollections(): Collection[] { return MOCK_AUDIO_COLLECTIONS }
