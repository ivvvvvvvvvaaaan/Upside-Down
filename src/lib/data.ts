import { createClient } from '@/lib/supabase/server'
import type { DepartmentId } from '@/components/department/types'
import { mergePrototypeAssets } from '@/lib/prototype-assets'
import { pick, IMAGE_POOL as allImages } from '@/lib/images'
import { getFileIdsByCharacter, getFileIdsByLocation, getFileIdsByScene } from '@/lib/ai-tags'

// Asset Types
export type AssetType = 'shot' | 'video' | 'image' | 'text' | 'audio'

export type ShotMetadata = {
  scene?: string      // e.g., "Scene 07-01"
  take?: string       // e.g., "Take 1"
  camera?: string     // e.g., "Cam A"
  duration?: string   // e.g., "02:37"
}

export type VideoMetadata = {
  duration?: string   // e.g., "02:37"
  typeTag?: string    // e.g., "Animatic", "Rough Cut"
}

export type ImageMetadata = {
  typeTag?: string    // e.g., "Storyboards", "Concept Art"
  imageCount?: number // For multi-image display
}

export type TextMetadata = {
  typeTag?: string    // e.g., "Virtual Art", "Script"
}

export type AudioMetadata = {
  duration?: string   // e.g., "02:37"
  typeTag?: string    // e.g., "Production", "SFX", "Foley", "Score"
}

export type { DepartmentId } from '@/components/department/types'

// Smart Collection Types
export type SmartCollectionCategory = 'narrative' | 'production' | 'cg' | 'edit'

export type SmartCollectionIcon = 'character' | 'location' | 'scene' | 'palette' | 'filter' | 'tag' | 'shot' | 'sequence'

export type AssetFilter = {
  query?: string              // Free text search (name, tags)
  types?: AssetType[]         // ['image', 'video', 'shot', 'text', 'audio']
  department?: DepartmentId   // 'art-design', 'vfx', 'camera', etc.
  typeTags?: string[]         // ['Concept Art', 'Storyboards', 'Final']
  isKeyArt?: boolean          // Key art filter
  isFinal?: boolean           // Final/approved version filter
  aiConfidenceBelow?: number  // Match assets with aiMeta.confidence < threshold
  aiCharacters?: string[]     // Match assets with ANY of these in aiMeta.characters
  aiLocation?: string         // Match assets with this aiMeta.location
  aiScene?: string            // Match assets with this aiMeta.scene
  aiHasCharacters?: boolean   // true = must have at least one character
  aiHasLocation?: boolean     // true = must have a location
  aiHasScene?: boolean        // true = must have a scene
}

export type SmartCollectionGroupBy = 'characters' | 'locations' | 'scenes'

export type SmartCollection = {
  id: string
  name: string
  icon: SmartCollectionIcon
  filter: AssetFilter
  isDefault?: boolean         // Cannot be deleted, only edited
  createdBy?: string          // Email of creator; absent = system default
  createdAt: Date
  groupBy?: SmartCollectionGroupBy   // Auto-generate children from this AI dimension
  parentId?: string                  // Links child back to parent
  category?: SmartCollectionCategory // Pipeline stage grouping
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
  thumbnail?: string

  // Type-specific metadata
  shotMeta?: ShotMetadata
  videoMeta?: VideoMetadata
  imageMeta?: ImageMetadata
  textMeta?: TextMetadata
  audioMeta?: AudioMetadata

  // Collection relationships
  collectionIds?: string[]  // Which collections this asset appears in

  // Department ownership
  department?: DepartmentId  // Which department this asset belongs to

  // Special flags
  isKeyArt?: boolean  // Mark asset as key art (hero imagery for the project)
  isFinal?: boolean   // Mark asset as final/approved version

  // AI-promoted workspace assets
  isAutoPromoted?: boolean  // True when surfaced from a managed workspace zone
  aiMeta?: AIMeta           // AI analysis results (characters, scene, location, etc.)
  workspacePath?: string    // Source path in workspace

  // Folder access scoping
  sourceFolderIds?: string[] // Managed-zone folder IDs this asset originates from

  // Provenance
  modifiedBy?: string        // Email of last person to modify this asset

  created_at?: string
}

// Collection Type
export type Collection = {
  id: string
  name: string
  type: 'character' | 'location' | 'scene' | 'art-type'
  assetCount: number
  mainImage?: string
  thumbnailImages?: string[]
  avatarSrc?: string
}

const MOCK_COLLECTIONS: Collection[] = [
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

type CollectionItem = { id: string; name: string; assetCount: number }

// Derive collection thumbnails from AI-tagged workspace files.
// Each file ID hashes into the given image pool for a deterministic thumbnail.
function imagesFromFileIds(fileIds: string[], max: number = 3): { mainImage?: string; thumbnailImages?: string[] } {
  if (fileIds.length === 0 || allImages.length === 0) return {}
  const seen = new Set<string>()
  const thumbs: string[] = []
  for (const id of fileIds) {
    if (thumbs.length >= max) break
    const img = pick(allImages, id, 1)[0]
    if (img && !seen.has(img)) {
      seen.add(img)
      thumbs.push(img)
    }
  }
  if (thumbs.length === 0) return {}
  return { mainImage: thumbs[0], thumbnailImages: thumbs.slice(1) }
}

function buildTaggedCollections(
  items: readonly CollectionItem[],
  type: Collection['type'],
  getFileIds: (name: string) => string[],
): Collection[] {
  return items.map(c => {
    const fileIds = getFileIds(c.name)
    const images = imagesFromFileIds(fileIds)
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
      thumbnailImages: pick(allImages, c.id + '-thumb', 2),
    } : {}),
  }))
}

// Art Department Collections
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

// VFX Department Collections
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

// Camera Department Collections
const MOCK_CAMERA_COLLECTIONS: Collection[] = buildDeptCollections([
  { id: 'cam-1', name: 'Dailies', assetCount: 234 },
  { id: 'cam-2', name: 'Camera Tests', assetCount: 45 },
  { id: 'cam-3', name: 'Lens Tests', assetCount: 28, visual: false },
  { id: 'cam-4', name: 'B-Roll', assetCount: 156 },
  { id: 'cam-5', name: 'Aerial Footage', assetCount: 67 },
  { id: 'cam-6', name: 'Steadicam', assetCount: 89 },
])

// Editorial Department Collections
const MOCK_EDITORIAL_COLLECTIONS: Collection[] = buildDeptCollections([
  { id: 'edit-1', name: 'Rough Cuts', assetCount: 24 },
  { id: 'edit-2', name: 'Assembly Edits', assetCount: 18 },
  { id: 'edit-3', name: 'Fine Cuts', assetCount: 12 },
  { id: 'edit-4', name: 'Color Passes', assetCount: 36 },
  { id: 'edit-5', name: 'VFX Temp', assetCount: 42 },
  { id: 'edit-6', name: 'Final Delivery', assetCount: 8 },
])

// Audio & Sound Department Collections (no image previews — audio files)
const MOCK_AUDIO_COLLECTIONS: Collection[] = buildDeptCollections([
  { id: 'audio-1', name: 'Production Sound', assetCount: 189, visual: false },
  { id: 'audio-2', name: 'Sound Effects', assetCount: 312, visual: false },
  { id: 'audio-3', name: 'Foley', assetCount: 156, visual: false },
  { id: 'audio-4', name: 'Ambient/Atmos', assetCount: 78, visual: false },
  { id: 'audio-5', name: 'Music Score', assetCount: 45, visual: false },
  { id: 'audio-6', name: 'ADR/Dialogue', assetCount: 234, visual: false },
])

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
