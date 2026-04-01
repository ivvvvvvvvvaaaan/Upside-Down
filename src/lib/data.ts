import { createClient } from '@/lib/supabase/server'
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

/** @deprecated All assets now come from workspace file promotion */
const MOCK_ASSETS: Asset[] = []

export async function getAssets(): Promise<Asset[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLive = supabaseUrl && supabaseUrl.startsWith('http')

  if (!isLive) {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500))
    return MOCK_ASSETS
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('nodes').select('*').order('created_at', { ascending: false })
    
    if (error) {
      console.warn('Supabase error (falling back to mocks):', error.message)
      return MOCK_ASSETS
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      created_at: item.created_at,
      // Spread flexible meta fields which contains size, format, status etc.
      ...item.meta,
    })) as Asset[]
  } catch (e) {
    console.error('Failed to fetch assets:', e)
    return MOCK_ASSETS
  }
}

export async function getAllAssets(): Promise<Asset[]> {
  const assets = await getAssets()
  return mergePrototypeAssets(assets)
}

export async function getAssetsByDepartment(departmentId: DepartmentId): Promise<Asset[]> {
  const assets = await getAssets()
  return assets.filter(a => a.department === departmentId)
}

export async function getAssetsByDepartmentAndCollection(
  departmentId: DepartmentId,
  collectionId: string
): Promise<Asset[]> {
  const assets = await getAssets()
  return assets.filter(
    (a) => a.department === departmentId && a.collectionIds?.includes(collectionId)
  )
}

export async function getRecentAssets(limit: number = 12): Promise<Asset[]> {
  const assets = await getAssets()
  // Sort by created_at descending and take the first N
  return assets
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateB - dateA
    })
    .slice(0, limit)
}

export async function getAsset(id: string): Promise<Asset | undefined> {
  const assets = await getAllAssets()
  return assets.find(a => a.id === id)
}

export async function getAssetsByIds(ids: string[]): Promise<Asset[]> {
  const assets = await getAllAssets()
  const idSet = new Set(ids)
  return assets.filter(a => idSet.has(a.id))
}

export async function getCollections(): Promise<Collection[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLive = supabaseUrl && supabaseUrl.startsWith('http')

  if (!isLive) {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500))
    return MOCK_COLLECTIONS
  }

  // TODO: Implement Supabase collections query when schema is ready
  return MOCK_COLLECTIONS
}

export async function getCollectionsByType(type: Collection['type']): Promise<Collection[]> {
  const collections = await getCollections()
  return collections.filter(c => c.type === type)
}

export async function getAssetsByCollection(collectionId: string): Promise<Asset[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLive = supabaseUrl && supabaseUrl.startsWith('http')

  if (!isLive) {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 300))
    return MOCK_ASSETS.filter(asset =>
      asset.collectionIds?.includes(collectionId)
    )
  }

  // TODO: Implement Supabase query with collection filter when schema is ready
  return MOCK_ASSETS.filter(asset =>
    asset.collectionIds?.includes(collectionId)
  )
}

export async function getArtCollections(): Promise<Collection[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLive = supabaseUrl && supabaseUrl.startsWith('http')

  if (!isLive) {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500))
    return MOCK_ART_COLLECTIONS
  }

  // TODO: Implement Supabase art collections query when schema is ready
  return MOCK_ART_COLLECTIONS
}

export async function getVfxCollections(): Promise<Collection[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLive = supabaseUrl && supabaseUrl.startsWith('http')

  if (!isLive) {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500))
    return MOCK_VFX_COLLECTIONS
  }

  // TODO: Implement Supabase VFX collections query when schema is ready
  return MOCK_VFX_COLLECTIONS
}

export async function getCameraCollections(): Promise<Collection[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLive = supabaseUrl && supabaseUrl.startsWith('http')

  if (!isLive) {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500))
    return MOCK_CAMERA_COLLECTIONS
  }

  // TODO: Implement Supabase Camera collections query when schema is ready
  return MOCK_CAMERA_COLLECTIONS
}

export async function getEditorialCollections(): Promise<Collection[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLive = supabaseUrl && supabaseUrl.startsWith('http')

  if (!isLive) {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500))
    return MOCK_EDITORIAL_COLLECTIONS
  }

  // TODO: Implement Supabase Editorial collections query when schema is ready
  return MOCK_EDITORIAL_COLLECTIONS
}

export async function getAudioCollections(): Promise<Collection[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isLive = supabaseUrl && supabaseUrl.startsWith('http')

  if (!isLive) {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500))
    return MOCK_AUDIO_COLLECTIONS
  }

  // TODO: Implement Supabase Audio collections query when schema is ready
  return MOCK_AUDIO_COLLECTIONS
}
