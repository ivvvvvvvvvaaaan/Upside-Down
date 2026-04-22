import type { Asset, AssetFilter, SmartCollection } from '@/lib/data'

/**
 * Check if an asset matches the given filter rules
 * All filter rules are combined with AND logic
 * Empty/undefined rules are ignored (pass-through)
 */
export function matchesFilter(asset: Asset, filter: AssetFilter): boolean {
  // Query: free text search on name + AI metadata
  if (filter.query && filter.query.trim()) {
    const query = filter.query.toLowerCase().trim()
    const searchParts = [asset.name]
    if (asset.tags) searchParts.push(...asset.tags.map(t => t.label))
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

  // Type tags: asset must have at least one matching tag
  if (filter.typeTags && filter.typeTags.length > 0) {
    const assetTypeTag = getAssetTypeTag(asset)
    if (!assetTypeTag) {
      return false
    }
    const normalizedTags = filter.typeTags.map(t => t.toLowerCase())
    if (!normalizedTags.includes(assetTypeTag.toLowerCase())) {
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

  // Circle take: check both the boolean flag AND user tags
  if (filter.isCircleTake !== undefined) {
    const hasCircleTag = asset.tags?.some(t => t.label.toLowerCase() === 'circle take') ?? false
    if (!asset.isCircleTake && !hasCircleTag) {
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
    if (!asset.aiMeta?.location) {
      return false
    }
    if (asset.aiMeta.location.toLowerCase() !== filter.aiLocation.toLowerCase()) {
      return false
    }
  }

  if (filter.aiScene) {
    if (!asset.aiMeta?.scene) {
      return false
    }
    if (asset.aiMeta.scene.toLowerCase() !== filter.aiScene.toLowerCase()) {
      return false
    }
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
