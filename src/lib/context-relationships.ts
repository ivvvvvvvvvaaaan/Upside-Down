import type { Asset } from '@/lib/data'

export type ContextRelationshipType =
  | 'adjacent-takes'
  | 'alternate-angle'

export type RelatedAssetGroup = {
  type: ContextRelationshipType
  label: string
  assets: Asset[]
}

function normalize(value?: string): string {
  return value?.trim().toLowerCase() ?? ''
}

function matchNameToken(name: string, pattern: RegExp): string {
  const match = name.match(pattern)
  return normalize(match?.[1] ?? match?.[0])
}

function getSceneKey(asset: Asset): string {
  return normalize(asset.shotMeta?.scene || asset.aiMeta?.scene)
    || matchNameToken(asset.name, /scene[\s_-]*([a-z0-9]+)/i)
    || matchNameToken(asset.name, /(seq[\s_-]*[a-z0-9]+)/i)
}

function getTakeKey(asset: Asset): string {
  return normalize(asset.shotMeta?.take)
    || matchNameToken(asset.name, /take[\s_-]*([a-z0-9]+)/i)
}

function getCameraKey(asset: Asset): string {
  return normalize(asset.shotMeta?.camera)
    || matchNameToken(asset.name, /cam[\s_-]*([a-z0-9]+)/i)
    || matchNameToken(asset.name, /\bC([0-9]{3})\b/)
}

export function getContextAssetGroups(asset: Asset, candidates: Asset[], limit: number = 4): RelatedAssetGroup[] {
  const sceneKey = getSceneKey(asset)
  const takeKey = getTakeKey(asset)
  const cameraKey = getCameraKey(asset)

  const others = candidates.filter((candidate) => candidate.id !== asset.id)
  const sameSceneAssets = sceneKey
    ? others.filter((candidate) => getSceneKey(candidate) === sceneKey)
    : []

  const groups: RelatedAssetGroup[] = []

  if (sceneKey) {
    const adjacentTakes = sameSceneAssets
      .filter((candidate) => getTakeKey(candidate) && getTakeKey(candidate) !== takeKey)
      .slice(0, limit)
    if (adjacentTakes.length > 0) {
      groups.push({
        type: 'adjacent-takes',
        label: 'Other Takes',
        assets: adjacentTakes,
      })
    }

    const alternateAngles = sameSceneAssets
      .filter((candidate) => {
        const candidateCamera = getCameraKey(candidate)
        return candidateCamera && candidateCamera !== cameraKey
      })
      .slice(0, limit)
    if (alternateAngles.length > 0) {
      groups.push({
        type: 'alternate-angle',
        label: 'Other Angles',
        assets: alternateAngles,
      })
    }

  }

  return groups
}
