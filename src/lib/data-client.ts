import type { DepartmentId } from '@/components/department/types'
import { getFileIdsByCharacter, getFileIdsByLocation, getFileIdsByScene } from '@/lib/ai-tags'
import { pick, IMAGE_POOL as allImages, pickForDimension } from '@/lib/images'
import type { ImageDimension } from '@/lib/images'
import { getPromotedWorkspaceAssets } from '@/lib/prototype-assets'

// Asset Types
export type AssetType = 'shot' | 'video' | 'image' | 'text' | 'audio'

/** Composite asset kinds — assembled from multiple source files */
export type AssetKind = 'file' | 'cut' | 'sequence'

/** Cut progression stages */
export type CutStage =
  | 'locked-cut'
  | 'netflix-cut'
  | 'final-cut'
  | 'emf'

export type ShotMetadata = {
  scene?: string
  take?: string
  camera?: string
  duration?: string
}

export type VideoMetadata = {
  duration?: string
  typeTag?: string
}

export type ImageMetadata = {
  typeTag?: string
  imageCount?: number
}

export type TextMetadata = {
  typeTag?: string
}

export type AudioMetadata = {
  duration?: string
  typeTag?: string
}

export type { DepartmentId } from '@/components/department/types'

// Smart Collection Types
export type SmartCollectionCategory = 'narrative' | 'production' | 'cg' | 'edit'

export type SmartCollectionIcon = 'character' | 'location' | 'scene' | 'palette' | 'filter' | 'tag' | 'shot' | 'sequence'

export type AssetFilter = {
  query?: string
  types?: AssetType[]
  department?: DepartmentId
  typeTags?: string[]
  isKeyArt?: boolean
  isFinal?: boolean
  aiConfidenceBelow?: number
  aiCharacters?: string[]
  aiLocation?: string
  aiScene?: string
  aiHasCharacters?: boolean
  aiHasLocation?: boolean
  aiHasScene?: boolean
  shotTake?: string
  shotCamera?: string
}

export type SmartCollectionGroupBy = 'characters' | 'locations' | 'scenes' | 'takes' | 'cameras'

export type SmartCollection = {
  id: string
  name: string
  icon: SmartCollectionIcon
  filter: AssetFilter
  visibleToAll?: boolean
  createdBy?: string
  createdAt: Date
  groupBy?: SmartCollectionGroupBy
  parentId?: string
  category?: SmartCollectionCategory
}

export type TagSource = 'ai' | 'system' | 'user'

export type AssetTag = {
  label: string
  source: TagSource
  /** Optional tooltip description (e.g. full name for abbreviated release tags) */
  description?: string
}

export type AIMeta = {
  characters?: string[]
  scene?: string
  location?: string
  confidence?: number
  keywords?: string[]
}

export type Asset = {
  id: string
  name: string
  type: AssetType
  /** Composite kind — 'cut' and 'sequence' are assembled from constituent files */
  kind?: AssetKind
  /** Cut stage in the editorial progression */
  stage?: CutStage
  /** Version number within a stage (e.g. Director's Cut v4 → version: 4) */
  version?: number
  /** Groups versions of the same logical asset (e.g. all versions of SEQ010_SH010_comp) */
  versionGroupId?: string
  /** Episode identifier (e.g. 'EP301') */
  episode?: string
  /** IDs of source files that make up this composite asset */
  constituents?: string[]
  /** Source file extension (e.g. 'exr', 'nk', 'mb') */
  extension?: string
  thumbnail?: string
  shotMeta?: ShotMetadata
  videoMeta?: VideoMetadata
  imageMeta?: ImageMetadata
  textMeta?: TextMetadata
  audioMeta?: AudioMetadata
  collectionIds?: string[]
  department?: DepartmentId
  isKeyArt?: boolean
  isFinal?: boolean
  isAutoPromoted?: boolean
  aiMeta?: AIMeta
  workspacePath?: string
  sourceFolderIds?: string[]
  modifiedBy?: string
  created_at?: string
  tags?: AssetTag[]
}

export type Collection = {
  id: string
  name: string
  type: 'character' | 'location' | 'scene' | 'art-type'
  assetCount: number
  mainImage?: string
  thumbnailImages?: string[]
  avatarSrc?: string
}

type CollectionItem = { id: string; name: string; assetCount: number }

type PreviewableUserCollection = {
  id: string
  assetIds: string[]
}

export type SharePreviewResource = {
  resourceId: string
  resourceType: 'asset' | 'cut' | 'folder' | 'collection' | 'smart-collection' | 'review-set' | 'project'
  departmentId?: DepartmentId
}

// Derive collection thumbnails from AI-tagged workspace files.
// Each file ID hashes into the given image pool for a deterministic thumbnail.
function imagesFromFileIds(fileIds: string[], dimension?: ImageDimension, max: number = 3): { mainImage?: string; thumbnailImages?: string[] } {
  if (fileIds.length === 0) return {}
  const seen = new Set<string>()
  const thumbs: string[] = []
  for (const id of fileIds) {
    if (thumbs.length >= max) break
    const img = pickForDimension(dimension, id, 1)[0]
    if (img && !seen.has(img)) {
      seen.add(img)
      thumbs.push(img)
    }
  }
  if (thumbs.length === 0) return {}
  return { mainImage: thumbs[0], thumbnailImages: thumbs.slice(1) }
}

const COLLECTION_TYPE_TO_DIMENSION: Record<string, ImageDimension> = {
  character: 'characters',
  scene: 'scenes',
  location: 'locations',
}

function buildTaggedCollections(
  items: readonly CollectionItem[],
  type: Collection['type'],
  getFileIds: (name: string) => string[],
): Collection[] {
  const dimension = COLLECTION_TYPE_TO_DIMENSION[type]
  return items.map(c => {
    const fileIds = getFileIds(c.name)
    const images = imagesFromFileIds(fileIds, dimension)
    return {
      id: c.id,
      name: c.name,
      type,
      assetCount: fileIds.length || c.assetCount,
      ...images,
      ...(type === 'character' ? { avatarSrc: images.mainImage } : {}),
    }
  })
}

function buildDeptCollections(items: readonly (CollectionItem & { visual?: boolean })[]): Collection[] {
  return items.map(c => ({
    id: c.id,
    name: c.name,
    type: 'art-type' as const,
    assetCount: c.assetCount,
    ...(c.visual !== false ? {
      mainImage: pick(allImages, c.id, 1)[0],
      thumbnailImages: pick(allImages, `${c.id}-thumb`, 2),
    } : {}),
  }))
}

export const MOCK_COLLECTIONS: Collection[] = [
  ...buildTaggedCollections([
    { id: 'char-1', name: 'Luca Ferreira', assetCount: 27 },
    { id: 'char-2', name: 'Marco Vitale', assetCount: 52 },
    { id: 'char-3', name: 'James Ashworth', assetCount: 38 },
    { id: 'char-4', name: 'Elena Richter', assetCount: 31 },
    { id: 'char-5', name: 'Frank Castellano', assetCount: 45 },
    { id: 'char-6', name: 'Viktor Dragan', assetCount: 67 },
  ], 'character', getFileIdsByCharacter),
  ...buildTaggedCollections([
    { id: 'loc-1', name: 'Pit Lane', assetCount: 89 },
    { id: 'loc-2', name: 'Apex Garage', assetCount: 56 },
    { id: 'loc-3', name: 'Paddock Club', assetCount: 42 },
    { id: 'loc-4', name: 'FIA Stewards Office', assetCount: 73 },
    { id: 'loc-5', name: 'Zandvoort Circuit', assetCount: 34 },
    { id: 'loc-6', name: 'Monaco', assetCount: 28 },
  ], 'location', getFileIdsByLocation),
  ...buildTaggedCollections([
    { id: 'scene-1', name: 'EXT. GRID WALK - PRE-RACE', assetCount: 43 },
    { id: 'scene-2', name: 'INT. APEX GARAGE - RACE DAY', assetCount: 28 },
    { id: 'scene-3', name: 'EXT. PADDOCK - POST-RACE', assetCount: 51 },
    { id: 'scene-4', name: 'INT. MERCEDES MOTORHOME - DEBRIEF', assetCount: 19 },
    { id: 'scene-5', name: 'EXT. CIRCUIT - LAP 52', assetCount: 37 },
    { id: 'scene-6', name: 'INT. FIA STEWARDS ROOM - PENALTY HEARING - RACE DAY', assetCount: 24 },
    { id: 'scene-7', name: 'EXT. SILVERSTONE CIRCUIT PIT STRAIGHT GRANDSTAND - CONTINUOUS', assetCount: 18 },
    { id: 'scene-8', name: 'INT. PADDOCK CLUB VIP HOSPITALITY - DRIVERS PARADE LOUNGE - RACE DAY', assetCount: 33 },
    { id: 'scene-9', name: 'EXT. ABU DHABI MARINA CIRCUIT - CHAMPIONSHIP DECIDER - SUNSET', assetCount: 41 },
  ], 'scene', getFileIdsByScene),
]

const MOCK_ART_COLLECTIONS: Collection[] = [
  ...buildDeptCollections([
    { id: 'art-1', name: 'Concept Art', assetCount: 156 },
    { id: 'art-2', name: 'Storyboards', assetCount: 342 },
    { id: 'art-3', name: 'Set Design', assetCount: 89 },
    { id: 'art-4', name: 'Set Blueprints', assetCount: 67, visual: false },
    { id: 'art-5', name: 'Reference Photography', assetCount: 213 },
    { id: 'art-6', name: 'Prop Design', assetCount: 78 },
    { id: 'art-7', name: 'Costume Design', assetCount: 95 },
  ]),
  ...buildTaggedCollections([
    { id: 'art-char-1', name: 'Viktor Dragan', assetCount: 45 },
    { id: 'art-char-2', name: 'Marco Vitale', assetCount: 62 },
    { id: 'art-char-3', name: 'AR-24', assetCount: 87 },
  ], 'character', getFileIdsByCharacter),
]

const MOCK_VFX_COLLECTIONS: Collection[] = [
  ...buildDeptCollections([
    { id: 'vfx-1', name: 'Car FX', assetCount: 124 },
    { id: 'vfx-2', name: 'Environment FX', assetCount: 89 },
    { id: 'vfx-3', name: 'Particle Systems', assetCount: 156, visual: false },
    { id: 'vfx-4', name: 'Compositing', assetCount: 203 },
    { id: 'vfx-5', name: 'Matte Paintings', assetCount: 67 },
    { id: 'vfx-6', name: '3D Assets', assetCount: 178, visual: false },
  ]),
  ...buildTaggedCollections([
    { id: 'vfx-char-1', name: 'AR-24', assetCount: 94 },
    { id: 'vfx-char-2', name: 'Richter RM-15', assetCount: 112 },
    { id: 'vfx-char-3', name: 'Marco Vitale', assetCount: 78 },
  ], 'character', getFileIdsByCharacter),
]

const MOCK_CAMERA_COLLECTIONS: Collection[] = buildDeptCollections([
  { id: 'cam-1', name: 'Dailies', assetCount: 234 },
  { id: 'cam-2', name: 'Camera Tests', assetCount: 45 },
  { id: 'cam-3', name: 'Lens Tests', assetCount: 28, visual: false },
  { id: 'cam-4', name: 'B-Roll', assetCount: 156 },
  { id: 'cam-5', name: 'Aerial Footage', assetCount: 67 },
  { id: 'cam-6', name: 'Steadicam', assetCount: 89 },
])

const MOCK_EDITORIAL_COLLECTIONS: Collection[] = buildDeptCollections([
  { id: 'edit-1', name: 'Rough Cuts', assetCount: 24 },
  { id: 'edit-2', name: 'Assembly Edits', assetCount: 18 },
  { id: 'edit-3', name: 'Fine Cuts', assetCount: 12 },
  { id: 'edit-4', name: 'Color Passes', assetCount: 36 },
  { id: 'edit-5', name: 'VFX Temp', assetCount: 42 },
  { id: 'edit-6', name: 'Final Delivery', assetCount: 8 },
])

const MOCK_AUDIO_COLLECTIONS: Collection[] = buildDeptCollections([
  { id: 'audio-1', name: 'Production Sound', assetCount: 189, visual: false },
  { id: 'audio-2', name: 'Sound Effects', assetCount: 312, visual: false },
  { id: 'audio-3', name: 'Foley', assetCount: 156, visual: false },
  { id: 'audio-4', name: 'Ambient/Atmos', assetCount: 78, visual: false },
  { id: 'audio-5', name: 'Music Score', assetCount: 45, visual: false },
  { id: 'audio-6', name: 'ADR/Dialogue', assetCount: 234, visual: false },
])

const ALL_COLLECTIONS = [
  ...MOCK_COLLECTIONS,
  ...MOCK_ART_COLLECTIONS,
  ...MOCK_VFX_COLLECTIONS,
  ...MOCK_CAMERA_COLLECTIONS,
  ...MOCK_EDITORIAL_COLLECTIONS,
  ...MOCK_AUDIO_COLLECTIONS,
]

const COLLECTION_BY_ID = new Map(ALL_COLLECTIONS.map(collection => [collection.id, collection]))
const PROTOTYPE_ASSETS = getPromotedWorkspaceAssets()
const PROTOTYPE_ASSET_BY_ID = new Map(PROTOTYPE_ASSETS.map(asset => [asset.id, asset]))
const PROTOTYPE_ASSETS_BY_DEPARTMENT = new Map<DepartmentId, Asset[]>()
const PROTOTYPE_ASSETS_BY_FOLDER = new Map<string, Asset[]>()

for (const asset of PROTOTYPE_ASSETS) {
  if (asset.department) {
    const departmentAssets = PROTOTYPE_ASSETS_BY_DEPARTMENT.get(asset.department) ?? []
    departmentAssets.push(asset)
    PROTOTYPE_ASSETS_BY_DEPARTMENT.set(asset.department, departmentAssets)
  }

  for (const folderId of asset.sourceFolderIds ?? []) {
    const folderAssets = PROTOTYPE_ASSETS_BY_FOLDER.get(folderId) ?? []
    folderAssets.push(asset)
    PROTOTYPE_ASSETS_BY_FOLDER.set(folderId, folderAssets)
  }
}

function uniquePreviewImages(images: Array<string | undefined>, max: number = 6): string[] | undefined {
  const deduped = Array.from(new Set(images.filter(Boolean) as string[])).slice(0, max)
  return deduped.length > 0 ? deduped : undefined
}

function getPrototypeAsset(assetId: string): Asset | undefined {
  return PROTOTYPE_ASSET_BY_ID.get(assetId) ?? PROTOTYPE_ASSET_BY_ID.get(`inst-${assetId}`)
}

function getAssetPreviewImages(assetIds: string[], max: number = 6): string[] | undefined {
  return uniquePreviewImages(assetIds.map(assetId => getPrototypeAsset(assetId)?.thumbnail), max)
}

function getCollectionImages(collectionId: string): { mainImage?: string; thumbnails: string[] } {
  return {
    mainImage: pick(allImages, collectionId, 1)[0],
    thumbnails: pick(allImages, `${collectionId}-thumb`, 2),
  }
}

export function getSharePreviewImages(
  resource: SharePreviewResource,
  userCollections: PreviewableUserCollection[] = [],
): string[] | undefined {
  if (resource.resourceType === 'asset') {
    return uniquePreviewImages([getPrototypeAsset(resource.resourceId)?.thumbnail], 1)
  }

  if (resource.resourceType === 'cut') {
    return uniquePreviewImages([pick(allImages, resource.resourceId, 1)[0]], 1)
  }

  if (resource.resourceType === 'folder') {
    const folderImages = uniquePreviewImages(
      (PROTOTYPE_ASSETS_BY_FOLDER.get(resource.resourceId) ?? []).map(asset => asset.thumbnail),
    )
    if (folderImages) return folderImages

    if (!resource.departmentId) return undefined

    return uniquePreviewImages(
      (PROTOTYPE_ASSETS_BY_DEPARTMENT.get(resource.departmentId) ?? []).map(asset => asset.thumbnail),
    )
  }

  if (resource.resourceType === 'collection') {
    const userCollection = userCollections.find(collection => collection.id === resource.resourceId)
    if (userCollection) {
      const userCollectionImages = getAssetPreviewImages(userCollection.assetIds)
      if (userCollectionImages) return userCollectionImages

      const fallbackImages = getCollectionImages(resource.resourceId)
      return uniquePreviewImages([fallbackImages.mainImage, ...fallbackImages.thumbnails], 3)
    }

    const collection = COLLECTION_BY_ID.get(resource.resourceId)
    if (collection) {
      return uniquePreviewImages([collection.mainImage, ...(collection.thumbnailImages ?? [])])
    }
  }

  if (resource.resourceType === 'smart-collection') {
    const { mainImage, thumbnails } = getCollectionImages(resource.resourceId)
    return uniquePreviewImages([mainImage, ...thumbnails], 3)
  }

  return undefined
}
