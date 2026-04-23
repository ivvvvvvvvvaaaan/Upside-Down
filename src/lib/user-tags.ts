import type { Asset, AssetTag } from '@/lib/data'

export const USER_TAGS_STORAGE_KEY = 'user-tags'
export const USER_TAGS_CHANGED_EVENT = 'user-tags-changed'

export type UserTagsMap = Record<string, string[]>

export function normalizeUserTagLabel(value: string): string {
  return value.trim().replace(/\b\w/g, character => character.toUpperCase())
}

export function normalizeUserTagKey(value: string): string {
  return value.trim().toLowerCase()
}

export function readUserTagsMap(): UserTagsMap {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(USER_TAGS_STORAGE_KEY)
    return stored ? JSON.parse(stored) as UserTagsMap : {}
  } catch {
    return {}
  }
}

export function writeUserTagsMap(tags: UserTagsMap) {
  localStorage.setItem(USER_TAGS_STORAGE_KEY, JSON.stringify(tags))
  window.dispatchEvent(new Event(USER_TAGS_CHANGED_EVENT))
}

export function getUserTagsForAsset(assetId: string, userTagsMap: UserTagsMap = readUserTagsMap()): string[] {
  return userTagsMap[assetId] ?? []
}

export function mergeUserTagsIntoAsset(asset: Asset, userTagsMap: UserTagsMap = readUserTagsMap()): Asset {
  const userTags = getUserTagsForAsset(asset.id, userTagsMap)
  if (userTags.length === 0) return asset

  const existingLabels = new Set((asset.tags ?? []).map(tag => normalizeUserTagKey(tag.label)))
  const addedTags: AssetTag[] = userTags
    .map(normalizeUserTagLabel)
    .filter(label => label.length > 0)
    .filter((label) => {
      const key = normalizeUserTagKey(label)
      if (existingLabels.has(key)) return false
      existingLabels.add(key)
      return true
    })
    .map(label => ({ label, source: 'user' }))

  if (addedTags.length === 0) return asset
  return { ...asset, tags: [...(asset.tags ?? []), ...addedTags] }
}

export function mergeUserTagsIntoAssets(assets: Asset[], userTagsMap: UserTagsMap = readUserTagsMap()): Asset[] {
  return assets.map(asset => mergeUserTagsIntoAsset(asset, userTagsMap))
}
