import type { Asset, AssetFilter, SmartCollection } from '@/lib/data'
import { getUserTagsForAsset } from '@/lib/user-tags'

/**
 * Check if an asset matches the given filter rules
 * All filter rules are combined with AND logic
 * Empty/undefined rules are ignored (pass-through)
 */
export function matchesFilter(asset: Asset, filter: AssetFilter): boolean {
  // Query: free text search on name + AI metadata + episode + mediaAssetType
  if (filter.query && filter.query.trim()) {
    const query = filter.query.toLowerCase().trim()
    const searchParts = [asset.name]
    if (asset.tags) searchParts.push(...asset.tags.map(t => t.label))
    if (asset.episode) searchParts.push(asset.episode)
    if (asset.mediaAssetType) searchParts.push(asset.mediaAssetType)
    if (asset.aiMeta) {
      if (asset.aiMeta.characters) searchParts.push(...asset.aiMeta.characters)
      if (asset.aiMeta.keywords) searchParts.push(...asset.aiMeta.keywords)
      if (asset.aiMeta.location) searchParts.push(asset.aiMeta.location)
      if (asset.aiMeta.scene) searchParts.push(asset.aiMeta.scene)
    }
    const searchText = searchParts.join(' ').toLowerCase()
    if (!searchText.includes(query)) {
      return false
    }
  }

  // Types: asset type must be in the list
  if (filter.types && filter.types.length > 0) {
    if (!filter.types.includes(asset.type)) {
      return false
    }
  }

  // Department: must match
  if (filter.department) {
    if (asset.department !== filter.department) {
      return false
    }
  }

  // Type tags: asset must have at least one matching tag. Checks both
  // asset.mediaAssetType (controlled-vocab kebab-case) and the per-format
  // free-form typeTag string — search and smart collections both use this.
  if (filter.typeTags && filter.typeTags.length > 0) {
    const normalizedTags = filter.typeTags.map(t => t.toLowerCase())
    const candidates: string[] = []
    if (asset.mediaAssetType) candidates.push(asset.mediaAssetType.toLowerCase())
    const formatTypeTag = getAssetTypeTag(asset)
    if (formatTypeTag) candidates.push(formatTypeTag.toLowerCase())
    if (!candidates.some(c => normalizedTags.includes(c))) {
      return false
    }
  }

  // Key art: must match if specified
  if (filter.isKeyArt !== undefined) {
    if (Boolean(asset.isKeyArt) !== filter.isKeyArt) {
      return false
    }
  }

  // Final: must match if specified
  if (filter.isFinal !== undefined) {
    if (Boolean(asset.isFinal) !== filter.isFinal) {
      return false
    }
  }

  // Circle take: check boolean flag, asset tags, AND user-applied tags from localStorage
  if (filter.isCircleTake !== undefined) {
    const hasCircleTag = asset.tags?.some(t => t.label.toLowerCase() === 'circle take') ?? false
    const hasUserCircleTag = getUserTagsForAsset(asset.id).some(t => t.toLowerCase() === 'circle take')
    if (!asset.isCircleTake && !hasCircleTag && !hasUserCircleTag) {
      return false
    }
  }

  // AI confidence below threshold
  if (filter.aiConfidenceBelow != null) {
    if (!asset.aiMeta?.confidence || asset.aiMeta.confidence >= filter.aiConfidenceBelow) {
      return false
    }
  }

  // AI metadata filters
  if (filter.aiHasCharacters) {
    if (!asset.aiMeta?.characters || asset.aiMeta.characters.length === 0) {
      return false
    }
  }

  if (filter.aiHasLocation) {
    if (!asset.aiMeta?.location) {
      return false
    }
  }

  if (filter.aiHasScene) {
    if (!asset.aiMeta?.scene) {
      return false
    }
  }

  if (filter.aiCharacters && filter.aiCharacters.length > 0) {
    if (!asset.aiMeta?.characters || asset.aiMeta.characters.length === 0) {
      return false
    }
    const filterChars = filter.aiCharacters.map(c => c.toLowerCase())
    const assetChars = asset.aiMeta.characters.map(c => c.toLowerCase())
    const hasIntersection = filterChars.some(fc => assetChars.includes(fc))
    if (!hasIntersection) {
      return false
    }
  }

  if (filter.aiLocation) {
    const locations = Array.isArray(filter.aiLocation) ? filter.aiLocation : [filter.aiLocation]
    if (!asset.aiMeta?.location) return false
    const loc = asset.aiMeta.location.toLowerCase()
    if (!locations.some(l => l.toLowerCase() === loc)) return false
  }

  if (filter.aiScene) {
    const scenes = Array.isArray(filter.aiScene) ? filter.aiScene : [filter.aiScene]
    if (!asset.aiMeta?.scene) return false
    const sc = asset.aiMeta.scene.toLowerCase()
    if (!scenes.some(s => s.toLowerCase() === sc)) return false
  }

  if (filter.episode) {
    const episodes = Array.isArray(filter.episode) ? filter.episode : [filter.episode]
    if (!asset.episode || !episodes.some(e => e.toLowerCase() === asset.episode!.toLowerCase())) return false
  } else if (filter.hasEpisode) {
    if (!asset.episode) return false
  }

  if (filter.stage) {
    const stages = Array.isArray(filter.stage) ? filter.stage : [filter.stage]
    if (!asset.stage || !stages.includes(asset.stage)) return false
  } else if (filter.hasStage) {
    if (!asset.stage) return false
  }

  if (filter.shootingDay != null) {
    const days = Array.isArray(filter.shootingDay) ? filter.shootingDay : [filter.shootingDay]
    if (asset.shootingDay == null || !days.includes(asset.shootingDay)) return false
  } else if (filter.hasShootingDay) {
    if (asset.shootingDay == null) return false
  }

  // Shot metadata filters
  if (filter.shotTake) {
    if (!asset.shotMeta?.take) {
      return false
    }
    if (asset.shotMeta.take.toLowerCase() !== filter.shotTake.toLowerCase()) {
      return false
    }
  }

  if (filter.shotCamera) {
    if (!asset.shotMeta?.camera) {
      return false
    }
    if (asset.shotMeta.camera.toLowerCase() !== filter.shotCamera.toLowerCase()) {
      return false
    }
  }

  return true
}

/**
 * Get the type tag from an asset's metadata
 */
function getAssetTypeTag(asset: Asset): string | undefined {
  switch (asset.type) {
    case 'video':
      return asset.videoMeta?.typeTag
    case 'image':
      return asset.imageMeta?.typeTag
    case 'text':
      return asset.textMeta?.typeTag
    case 'audio':
      return asset.audioMeta?.typeTag
    default:
      return undefined
  }
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Generate child smart collections from a parent's groupBy dimension */
export function generateChildCollections(parent: SmartCollection, assets: Asset[]): SmartCollection[] {
  if (!parent.groupBy) return []

  // Filter assets matching parent's filter
  const matchingAssets = assets.filter(a => matchesFilter(a, parent.filter))

  // Extract unique values from the relevant metadata field
  const valuesSet = new Set<string>()
  for (const asset of matchingAssets) {
    switch (parent.groupBy) {
      case 'characters':
        if (asset.aiMeta?.characters) {
          asset.aiMeta.characters.forEach(c => valuesSet.add(c))
        }
        break
      case 'locations':
        if (asset.aiMeta?.location) {
          valuesSet.add(asset.aiMeta.location)
        }
        break
      case 'scenes':
        if (asset.aiMeta?.scene) {
          valuesSet.add(asset.aiMeta.scene)
        }
        break
      case 'takes':
        if (asset.shotMeta?.take) {
          valuesSet.add(asset.shotMeta.take)
        }
        break
      case 'cameras':
        if (asset.shotMeta?.camera) {
          valuesSet.add(asset.shotMeta.camera)
        }
        break
    }
  }

  // Create child SmartCollection per unique value
  const sortedValues = Array.from(valuesSet).sort()
  return sortedValues.map(value => {
    const childFilter: AssetFilter = {}
    switch (parent.groupBy) {
      case 'characters':
        childFilter.aiCharacters = [value]
        break
      case 'locations':
        childFilter.aiLocation = value
        break
      case 'scenes':
        childFilter.aiScene = value
        break
      case 'takes':
        childFilter.shotTake = value
        break
      case 'cameras':
        childFilter.shotCamera = value
        break
    }

    return {
      flavor: 'smart' as const,
      id: `${parent.id}--${slugify(value)}`,
      name: value,
      icon: parent.icon,
      filter: childFilter,
      visibleToAll: true,
      createdAt: parent.createdAt,
      parentId: parent.id,
    }
  })
}
