import { createClient } from '@/lib/supabase/server'
import type { DepartmentId } from '@/components/department/types'
import { mergePrototypeAssets } from '@/lib/prototype-assets'

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
  // Characters
  {
    id: 'char-1',
    name: 'Billy Hargrove',
    type: 'character',
    assetCount: 27,
    mainImage: 'https://picsum.photos/seed/billy1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/billy2/400/300',
      'https://picsum.photos/seed/billy3/400/300',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: 'char-2',
    name: 'Eleven',
    type: 'character',
    assetCount: 52,
    mainImage: 'https://picsum.photos/seed/eleven1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/eleven2/400/300',
      'https://picsum.photos/seed/eleven3/400/300',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: 'char-3',
    name: 'Mike Wheeler',
    type: 'character',
    assetCount: 38,
    mainImage: 'https://picsum.photos/seed/mike1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/mike2/400/300',
      'https://picsum.photos/seed/mike3/400/300',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=33',
  },
  {
    id: 'char-4',
    name: 'Dustin Henderson',
    type: 'character',
    assetCount: 31,
    mainImage: 'https://picsum.photos/seed/dustin1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/dustin2/400/300',
      'https://picsum.photos/seed/dustin3/400/300',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=59',
  },
  {
    id: 'char-5',
    name: 'Joyce Byers',
    type: 'character',
    assetCount: 45,
    mainImage: 'https://picsum.photos/seed/joyce1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/joyce2/400/300',
      'https://picsum.photos/seed/joyce3/400/300',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=44',
  },
  {
    id: 'char-6',
    name: 'Jim Hopper',
    type: 'character',
    assetCount: 67,
    mainImage: 'https://picsum.photos/seed/hopper1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/hopper2/400/300',
      'https://picsum.photos/seed/hopper3/400/300',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=68',
  },
  // Locations
  {
    id: 'loc-1',
    name: 'The Upside Down',
    type: 'location',
    assetCount: 89,
    mainImage: 'https://picsum.photos/seed/upside1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/upside2/400/300',
      'https://picsum.photos/seed/upside3/400/300',
    ],
  },
  {
    id: 'loc-2',
    name: 'Hawkins Lab',
    type: 'location',
    assetCount: 56,
    mainImage: 'https://picsum.photos/seed/lab1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/lab2/400/300',
      'https://picsum.photos/seed/lab3/400/300',
    ],
  },
  {
    id: 'loc-3',
    name: 'Starcourt Mall',
    type: 'location',
    assetCount: 42,
    mainImage: 'https://picsum.photos/seed/mall1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/mall2/400/300',
      'https://picsum.photos/seed/mall3/400/300',
    ],
  },
  {
    id: 'loc-4',
    name: 'Byers House',
    type: 'location',
    assetCount: 73,
    mainImage: 'https://picsum.photos/seed/byers1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/byers2/400/300',
      'https://picsum.photos/seed/byers3/400/300',
    ],
  },
  {
    id: 'loc-5',
    name: 'Hawkins High School',
    type: 'location',
    assetCount: 34,
    mainImage: 'https://picsum.photos/seed/school1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/school2/400/300',
      'https://picsum.photos/seed/school3/400/300',
    ],
  },
  // Scenes
  {
    id: 'scene-1',
    name: 'EXT. GULAG YARD - DAY',
    type: 'scene',
    assetCount: 43,
    mainImage: 'https://picsum.photos/seed/scene1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/scene2/400/300',
      'https://picsum.photos/seed/scene3/400/300',
    ],
  },
  {
    id: 'scene-2',
    name: 'INT. HAWKINS LAB - NIGHT',
    type: 'scene',
    assetCount: 28,
    mainImage: 'https://picsum.photos/seed/labscene1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/labscene2/400/300',
      'https://picsum.photos/seed/labscene3/400/300',
    ],
  },
  {
    id: 'scene-3',
    name: 'EXT. STARCOURT PARKING - NIGHT',
    type: 'scene',
    assetCount: 51,
    mainImage: 'https://picsum.photos/seed/parking1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/parking2/400/300',
      'https://picsum.photos/seed/parking3/400/300',
    ],
  },
  {
    id: 'scene-4',
    name: 'INT. WHEELER BASEMENT - DAY',
    type: 'scene',
    assetCount: 19,
    mainImage: 'https://picsum.photos/seed/basement1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/basement2/400/300',
      'https://picsum.photos/seed/basement3/400/300',
    ],
  },
  {
    id: 'scene-5',
    name: 'EXT. FOREST CHASE - DUSK',
    type: 'scene',
    assetCount: 37,
    mainImage: 'https://picsum.photos/seed/forest1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/forest2/400/300',
      'https://picsum.photos/seed/forest3/400/300',
    ],
  },
  {
    id: 'scene-6',
    name: 'INT. BYERS LIVING ROOM - CHRISTMAS LIGHTS REVELATION - NIGHT',
    type: 'scene',
    assetCount: 24,
    mainImage: 'https://picsum.photos/seed/lights1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/lights2/400/300',
      'https://picsum.photos/seed/lights3/400/300',
    ],
  },
  {
    id: 'scene-7',
    name: 'EXT. HAWKINS NATIONAL LABORATORY PERIMETER FENCE - CONTINUOUS',
    type: 'scene',
    assetCount: 18,
    mainImage: 'https://picsum.photos/seed/fence1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/fence2/400/300',
      'https://picsum.photos/seed/fence3/400/300',
    ],
  },
  {
    id: 'scene-8',
    name: 'INT. STARCOURT MALL FOOD COURT - SCOOPS AHOY BACK ROOM - DAY',
    type: 'scene',
    assetCount: 33,
    mainImage: 'https://picsum.photos/seed/scoops1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/scoops2/400/300',
      'https://picsum.photos/seed/scoops3/400/300',
    ],
  },
  {
    id: 'scene-9',
    name: 'EXT. ABANDONED JUNKYARD - SCHOOL BUS STANDOFF - SUNSET',
    type: 'scene',
    assetCount: 41,
    mainImage: 'https://picsum.photos/seed/junkyard1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/junkyard2/400/300',
      'https://picsum.photos/seed/junkyard3/400/300',
    ],
  },
]

// Art Department Collections
const MOCK_ART_COLLECTIONS: Collection[] = [
  // Art Type collections
  {
    id: 'art-1',
    name: 'Concept Art',
    type: 'art-type',
    assetCount: 156,
    mainImage: '/images/dept/Rectangle 16688.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-1.png',
      '/images/dept/Rectangle 16688-2.png',
    ],
  },
  {
    id: 'art-2',
    name: 'Storyboards',
    type: 'art-type',
    assetCount: 342,
    mainImage: '/images/dept/Rectangle 16688-3.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-4.png',
      '/images/dept/Rectangle 16688-6.png',
    ],
  },
  {
    id: 'art-3',
    name: 'Set Design',
    type: 'art-type',
    assetCount: 89,
    mainImage: '/images/dept/Rectangle 16688-7.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-8.png',
      '/images/dept/Rectangle 16688-9.png',
    ],
  },
  {
    id: 'art-4',
    name: 'Set Blueprints',
    type: 'art-type',
    assetCount: 67,
    mainImage: '/images/dept/Rectangle 16688-11.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16679.png',
      '/images/dept/Rectangle 16678.png',
    ],
  },
  {
    id: 'art-5',
    name: 'Reference Photography',
    type: 'art-type',
    assetCount: 213,
    mainImage: '/images/dept/Rectangle 16678.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688.png',
      '/images/dept/Rectangle 16688-1.png',
    ],
  },
  {
    id: 'art-6',
    name: 'Prop Design',
    type: 'art-type',
    assetCount: 78,
    mainImage: '/images/dept/Rectangle 16688-2.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-3.png',
      '/images/dept/Rectangle 16688-4.png',
    ],
  },
  {
    id: 'art-7',
    name: 'Costume Design',
    type: 'art-type',
    assetCount: 95,
    mainImage: '/images/dept/Rectangle 16688-6.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-7.png',
      '/images/dept/Rectangle 16688-8.png',
    ],
  },
  // Character collections for Art Department
  {
    id: 'art-char-1',
    name: 'Hopper',
    type: 'character',
    assetCount: 45,
    mainImage: '/images/dept/Rectangle 16688-9.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-11.png',
      '/images/dept/Rectangle 16679.png',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=68',
  },
  {
    id: 'art-char-2',
    name: 'Eleven',
    type: 'character',
    assetCount: 62,
    mainImage: '/images/dept/Rectangle 16688.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-1.png',
      '/images/dept/Rectangle 16688-2.png',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: 'art-char-3',
    name: 'Demogorgon',
    type: 'character',
    assetCount: 87,
    mainImage: '/images/dept/Rectangle 16688-3.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-4.png',
      '/images/dept/Rectangle 16688-6.png',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=70',
  },
]

// VFX Department Collections
const MOCK_VFX_COLLECTIONS: Collection[] = [
  // VFX Type collections
  {
    id: 'vfx-1',
    name: 'Creature FX',
    type: 'art-type',
    assetCount: 124,
    mainImage: '/images/dept/Rectangle 16688-3.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-4.png',
      '/images/dept/Rectangle 16688-6.png',
    ],
  },
  {
    id: 'vfx-2',
    name: 'Environment FX',
    type: 'art-type',
    assetCount: 89,
    mainImage: '/images/dept/Rectangle 16688-7.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-8.png',
      '/images/dept/Rectangle 16688-9.png',
    ],
  },
  {
    id: 'vfx-3',
    name: 'Particle Systems',
    type: 'art-type',
    assetCount: 156,
    mainImage: '/images/dept/Rectangle 16688.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-1.png',
      '/images/dept/Rectangle 16688-2.png',
    ],
  },
  {
    id: 'vfx-4',
    name: 'Compositing',
    type: 'art-type',
    assetCount: 203,
    mainImage: '/images/dept/Rectangle 16688-11.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16679.png',
      '/images/dept/Rectangle 16678.png',
    ],
  },
  {
    id: 'vfx-5',
    name: 'Matte Paintings',
    type: 'art-type',
    assetCount: 67,
    mainImage: '/images/dept/Rectangle 16678.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688.png',
      '/images/dept/Rectangle 16688-1.png',
    ],
  },
  {
    id: 'vfx-6',
    name: '3D Assets',
    type: 'art-type',
    assetCount: 178,
    mainImage: '/images/dept/Rectangle 16688-2.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-3.png',
      '/images/dept/Rectangle 16688-4.png',
    ],
  },
  // Character collections for VFX
  {
    id: 'vfx-char-1',
    name: 'Demogorgon',
    type: 'character',
    assetCount: 94,
    mainImage: '/images/dept/Rectangle 16688-6.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-7.png',
      '/images/dept/Rectangle 16688-8.png',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=70',
  },
  {
    id: 'vfx-char-2',
    name: 'Mind Flayer',
    type: 'character',
    assetCount: 112,
    mainImage: '/images/dept/Rectangle 16688-9.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-11.png',
      '/images/dept/Rectangle 16679.png',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=62',
  },
  {
    id: 'vfx-char-3',
    name: 'Eleven',
    type: 'character',
    assetCount: 78,
    mainImage: '/images/dept/Rectangle 16688.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-1.png',
      '/images/dept/Rectangle 16688-2.png',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=5',
  },
]

// Camera Department Collections
const MOCK_CAMERA_COLLECTIONS: Collection[] = [
  {
    id: 'cam-1',
    name: 'Dailies',
    type: 'art-type',
    assetCount: 234,
    mainImage: '/images/dept/Rectangle 16688.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-1.png',
      '/images/dept/Rectangle 16688-2.png',
    ],
  },
  {
    id: 'cam-2',
    name: 'Camera Tests',
    type: 'art-type',
    assetCount: 45,
    mainImage: '/images/dept/Rectangle 16688-3.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-4.png',
      '/images/dept/Rectangle 16688-6.png',
    ],
  },
  {
    id: 'cam-3',
    name: 'Lens Tests',
    type: 'art-type',
    assetCount: 28,
    mainImage: '/images/dept/Rectangle 16688-7.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-8.png',
      '/images/dept/Rectangle 16688-9.png',
    ],
  },
  {
    id: 'cam-4',
    name: 'B-Roll',
    type: 'art-type',
    assetCount: 156,
    mainImage: '/images/dept/Rectangle 16688-11.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16679.png',
      '/images/dept/Rectangle 16678.png',
    ],
  },
  {
    id: 'cam-5',
    name: 'Aerial Footage',
    type: 'art-type',
    assetCount: 67,
    mainImage: '/images/dept/Rectangle 16678.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688.png',
      '/images/dept/Rectangle 16688-1.png',
    ],
  },
  {
    id: 'cam-6',
    name: 'Steadicam',
    type: 'art-type',
    assetCount: 89,
    mainImage: '/images/dept/Rectangle 16688-2.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-3.png',
      '/images/dept/Rectangle 16688-4.png',
    ],
  },
]

// Editorial Department Collections
const MOCK_EDITORIAL_COLLECTIONS: Collection[] = [
  {
    id: 'edit-1',
    name: 'Rough Cuts',
    type: 'art-type',
    assetCount: 24,
    mainImage: '/images/dept/Rectangle 16688-6.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-7.png',
      '/images/dept/Rectangle 16688-8.png',
    ],
  },
  {
    id: 'edit-2',
    name: 'Assembly Edits',
    type: 'art-type',
    assetCount: 18,
    mainImage: '/images/dept/Rectangle 16688-9.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-11.png',
      '/images/dept/Rectangle 16679.png',
    ],
  },
  {
    id: 'edit-3',
    name: 'Fine Cuts',
    type: 'art-type',
    assetCount: 12,
    mainImage: '/images/dept/Rectangle 16678.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688.png',
      '/images/dept/Rectangle 16688-1.png',
    ],
  },
  {
    id: 'edit-4',
    name: 'Color Passes',
    type: 'art-type',
    assetCount: 36,
    mainImage: '/images/dept/Rectangle 16688-2.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-3.png',
      '/images/dept/Rectangle 16688-4.png',
    ],
  },
  {
    id: 'edit-5',
    name: 'VFX Temp',
    type: 'art-type',
    assetCount: 42,
    mainImage: '/images/dept/Rectangle 16688-6.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-7.png',
      '/images/dept/Rectangle 16688-8.png',
    ],
  },
  {
    id: 'edit-6',
    name: 'Final Delivery',
    type: 'art-type',
    assetCount: 8,
    mainImage: '/images/dept/Rectangle 16688-9.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-11.png',
      '/images/dept/Rectangle 16679.png',
    ],
  },
]

// Audio & Sound Department Collections
const MOCK_AUDIO_COLLECTIONS: Collection[] = [
  {
    id: 'audio-1',
    name: 'Production Sound',
    type: 'art-type',
    assetCount: 189,
    mainImage: '/images/dept/Rectangle 16688.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-1.png',
      '/images/dept/Rectangle 16688-2.png',
    ],
  },
  {
    id: 'audio-2',
    name: 'Sound Effects',
    type: 'art-type',
    assetCount: 312,
    mainImage: '/images/dept/Rectangle 16688-3.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-4.png',
      '/images/dept/Rectangle 16688-6.png',
    ],
  },
  {
    id: 'audio-3',
    name: 'Foley',
    type: 'art-type',
    assetCount: 156,
    mainImage: '/images/dept/Rectangle 16688-7.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-8.png',
      '/images/dept/Rectangle 16688-9.png',
    ],
  },
  {
    id: 'audio-4',
    name: 'Ambient/Atmos',
    type: 'art-type',
    assetCount: 78,
    mainImage: '/images/dept/Rectangle 16688-11.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16679.png',
      '/images/dept/Rectangle 16678.png',
    ],
  },
  {
    id: 'audio-5',
    name: 'Music Score',
    type: 'art-type',
    assetCount: 45,
    mainImage: '/images/dept/Rectangle 16678.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688.png',
      '/images/dept/Rectangle 16688-1.png',
    ],
  },
  {
    id: 'audio-6',
    name: 'ADR/Dialogue',
    type: 'art-type',
    assetCount: 234,
    mainImage: '/images/dept/Rectangle 16688-2.png',
    thumbnailImages: [
      '/images/dept/Rectangle 16688-3.png',
      '/images/dept/Rectangle 16688-4.png',
    ],
  },
]

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
