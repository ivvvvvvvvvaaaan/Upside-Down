import { createClient } from '@/lib/supabase/server'

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

  // Special flags
  isKeyArt?: boolean  // Mark asset as key art (hero imagery for the project)

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

const MOCK_ASSETS: Asset[] = [
  // SHOT examples
  {
    id: 'asset-1',
    name: 'Billy Close-up Confrontation',
    type: 'shot',
    thumbnail: 'https://picsum.photos/seed/shot1/800/450',
    shotMeta: {
      scene: 'Scene 07-01',
      take: 'Take 1',
      camera: 'Cam A',
      duration: '02:37',
    },
    collectionIds: ['char-1'],
    created_at: '2024-03-15T10:30:00Z',
  },
  {
    id: 'asset-2',
    name: 'Eleven Powers Awakening',
    type: 'shot',
    thumbnail: 'https://picsum.photos/seed/shot2/800/450',
    shotMeta: {
      scene: 'Scene 04-12',
      take: 'Take 3',
      camera: 'Cam B',
      duration: '01:45',
    },
    collectionIds: ['char-2', 'scene-1'],
    created_at: '2024-03-14T14:20:00Z',
  },
  {
    id: 'asset-3',
    name: 'Upside Down Portal Opening',
    type: 'shot',
    thumbnail: 'https://picsum.photos/seed/shot3/800/450',
    shotMeta: {
      scene: 'Scene 09-05',
      take: 'Take 2',
      camera: 'Cam A',
      duration: '03:12',
    },
    collectionIds: ['loc-1', 'scene-1'],
    created_at: '2024-03-13T09:15:00Z',
  },

  // VIDEO examples
  {
    id: 'asset-4',
    name: 'season_3_animatic_v2.mov',
    type: 'video',
    thumbnail: 'https://picsum.photos/seed/video1/800/450',
    videoMeta: {
      duration: '05:23',
      typeTag: 'Animatic',
    },
    collectionIds: ['char-1', 'loc-1'],
    created_at: '2024-03-12T16:45:00Z',
  },
  {
    id: 'asset-5',
    name: 'rough_cut_episode_07.mov',
    type: 'video',
    thumbnail: 'https://picsum.photos/seed/video2/800/450',
    videoMeta: {
      duration: '42:15',
      typeTag: 'Rough Cut',
    },
    collectionIds: ['char-1', 'char-2', 'scene-1'],
    created_at: '2024-03-11T11:30:00Z',
  },
  {
    id: 'asset-6',
    name: 'vfx_preview_upside_down.mov',
    type: 'video',
    thumbnail: 'https://picsum.photos/seed/video3/800/450',
    videoMeta: {
      duration: '01:58',
      typeTag: 'VFX Preview',
    },
    collectionIds: ['loc-1'],
    created_at: '2024-03-10T13:00:00Z',
  },

  // IMAGE examples
  {
    id: 'asset-7',
    name: 'storyboard_sequence_12.pdf',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/image1/800/450',
    imageMeta: {
      typeTag: 'Storyboards',
      imageCount: 8,
    },
    collectionIds: ['scene-1'],
    created_at: '2024-03-09T10:00:00Z',
  },
  {
    id: 'asset-8',
    name: 'concept_art_demogorgon.jpg',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/image2/800/450',
    imageMeta: {
      typeTag: 'Concept Art',
      imageCount: 1,
    },
    collectionIds: ['loc-1'],
    created_at: '2024-03-08T15:30:00Z',
  },
  {
    id: 'asset-9',
    name: 'costume_designs_billy.png',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/image3/800/450',
    imageMeta: {
      typeTag: 'Costume Design',
      imageCount: 6,
    },
    collectionIds: ['char-1'],
    created_at: '2024-03-07T09:45:00Z',
  },

  // TEXT examples
  {
    id: 'asset-10',
    name: 'virtual_art_department_notes.csv',
    type: 'text',
    thumbnail: 'https://picsum.photos/seed/text1/800/450',
    textMeta: {
      typeTag: 'Virtual Art',
    },
    collectionIds: ['loc-1'],
    created_at: '2024-03-06T12:00:00Z',
  },
  {
    id: 'asset-11',
    name: 'script_episode_07_final.pdf',
    type: 'text',
    thumbnail: 'https://picsum.photos/seed/text2/800/450',
    textMeta: {
      typeTag: 'Script',
    },
    collectionIds: ['char-1', 'char-2', 'scene-1'],
    created_at: '2024-03-05T14:30:00Z',
  },
  {
    id: 'asset-12',
    name: 'shot_list_master.xlsx',
    type: 'text',
    thumbnail: 'https://picsum.photos/seed/text3/800/450',
    textMeta: {
      typeTag: 'Shot List',
    },
    collectionIds: ['scene-1'],
    created_at: '2024-03-04T08:15:00Z',
  },

  // Art Department assets
  {
    id: 'art-asset-1',
    name: 'upside_down_environment_concept.jpg',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688.png',
    imageMeta: {
      typeTag: 'Concept Art',
    },
    collectionIds: ['art-1'],
    isKeyArt: true,
    created_at: '2024-02-15T09:00:00Z',
  },
  {
    id: 'art-asset-2',
    name: 'demogorgon_creature_design.jpg',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-1.png',
    imageMeta: {
      typeTag: 'Concept Art',
    },
    collectionIds: ['art-1', 'art-char-3'],
    isKeyArt: true,
    created_at: '2024-02-14T11:30:00Z',
  },
  {
    id: 'art-asset-3',
    name: 'hawkins_lab_interior_concept.jpg',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-2.png',
    imageMeta: {
      typeTag: 'Concept Art',
    },
    collectionIds: ['art-1'],
    created_at: '2024-02-13T14:00:00Z',
  },
  {
    id: 'art-asset-4',
    name: 'episode_01_storyboard_sequence.pdf',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-3.png',
    imageMeta: {
      typeTag: 'Storyboards',
    },
    collectionIds: ['art-2'],
    created_at: '2024-02-12T10:00:00Z',
  },
  {
    id: 'art-asset-5',
    name: 'chase_scene_boards.pdf',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-4.png',
    imageMeta: {
      typeTag: 'Storyboards',
    },
    collectionIds: ['art-2'],
    created_at: '2024-02-11T15:30:00Z',
  },
  {
    id: 'art-asset-6',
    name: 'byers_house_floor_plan.pdf',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-6.png',
    imageMeta: {
      typeTag: 'Blueprint',
    },
    collectionIds: ['art-4', 'art-3'],
    created_at: '2024-02-10T09:00:00Z',
  },
  {
    id: 'art-asset-7',
    name: 'starcourt_mall_blueprints.pdf',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-7.png',
    imageMeta: {
      typeTag: 'Blueprint',
    },
    collectionIds: ['art-4', 'art-3'],
    created_at: '2024-02-09T13:00:00Z',
  },
  {
    id: 'art-asset-8',
    name: '1980s_hawkins_reference_photos.zip',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-8.png',
    imageMeta: {
      typeTag: 'Reference',
    },
    collectionIds: ['art-5'],
    created_at: '2024-02-08T10:00:00Z',
  },
  {
    id: 'art-asset-9',
    name: 'arcade_reference_collection.zip',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-9.png',
    imageMeta: {
      typeTag: 'Reference',
    },
    collectionIds: ['art-5'],
    created_at: '2024-02-07T11:30:00Z',
  },
  {
    id: 'art-asset-10',
    name: 'hopper_uniform_design.png',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-11.png',
    imageMeta: {
      typeTag: 'Costume Design',
    },
    collectionIds: ['art-7', 'art-char-1'],
    isKeyArt: true,
    created_at: '2024-02-06T09:00:00Z',
  },
  {
    id: 'art-asset-11',
    name: 'eleven_hospital_gown_design.png',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16679.png',
    imageMeta: {
      typeTag: 'Costume Design',
    },
    collectionIds: ['art-7', 'art-char-2'],
    isKeyArt: true,
    created_at: '2024-02-05T14:00:00Z',
  },
  {
    id: 'art-asset-12',
    name: 'walkie_talkie_prop_design.png',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16678.png',
    imageMeta: {
      typeTag: 'Prop Design',
    },
    collectionIds: ['art-6'],
    created_at: '2024-02-04T10:00:00Z',
  },
  {
    id: 'art-asset-13',
    name: 'christmas_lights_props.png',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688.png',
    imageMeta: {
      typeTag: 'Prop Design',
    },
    collectionIds: ['art-6'],
    created_at: '2024-02-03T15:00:00Z',
  },

  // VFX Department assets
  {
    id: 'vfx-asset-1',
    name: 'demogorgon_rig_v3.mb',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-3.png',
    videoMeta: {
      duration: '00:45',
      typeTag: 'VFX Preview',
    },
    collectionIds: ['vfx-1', 'vfx-char-1'],
    created_at: '2024-02-20T09:00:00Z',
  },
  {
    id: 'vfx-asset-2',
    name: 'demogorgon_texture_maps.zip',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-4.png',
    imageMeta: {
      typeTag: 'Creature FX',
    },
    collectionIds: ['vfx-1', 'vfx-char-1'],
    created_at: '2024-02-19T14:30:00Z',
  },
  {
    id: 'vfx-asset-3',
    name: 'upside_down_fog_sim.hip',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-6.png',
    videoMeta: {
      duration: '01:23',
      typeTag: 'VFX Preview',
    },
    collectionIds: ['vfx-2', 'vfx-3'],
    created_at: '2024-02-18T10:00:00Z',
  },
  {
    id: 'vfx-asset-4',
    name: 'portal_particles_v2.hip',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-7.png',
    videoMeta: {
      duration: '00:32',
      typeTag: 'VFX Preview',
    },
    collectionIds: ['vfx-3'],
    created_at: '2024-02-17T11:00:00Z',
  },
  {
    id: 'vfx-asset-5',
    name: 'eleven_powers_comp_v4.nk',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-8.png',
    videoMeta: {
      duration: '00:58',
      typeTag: 'VFX Preview',
    },
    collectionIds: ['vfx-4', 'vfx-char-3'],
    created_at: '2024-02-16T09:30:00Z',
  },
  {
    id: 'vfx-asset-6',
    name: 'hawkins_lab_destruction_comp.nk',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-9.png',
    videoMeta: {
      duration: '02:15',
      typeTag: 'VFX Preview',
    },
    collectionIds: ['vfx-4'],
    created_at: '2024-02-15T15:00:00Z',
  },
  {
    id: 'vfx-asset-7',
    name: 'upside_down_matte_v3.psd',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16688-11.png',
    imageMeta: {
      typeTag: 'Matte Painting',
    },
    collectionIds: ['vfx-5'],
    created_at: '2024-02-14T10:00:00Z',
  },
  {
    id: 'vfx-asset-8',
    name: 'hawkins_skyline_matte.psd',
    type: 'image',
    thumbnail: '/images/dept/Rectangle 16679.png',
    imageMeta: {
      typeTag: 'Matte Painting',
    },
    collectionIds: ['vfx-5'],
    created_at: '2024-02-13T11:30:00Z',
  },
  {
    id: 'vfx-asset-9',
    name: 'mind_flayer_model_v5.mb',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16678.png',
    videoMeta: {
      duration: '01:05',
      typeTag: 'VFX Preview',
    },
    collectionIds: ['vfx-6', 'vfx-char-2'],
    created_at: '2024-02-12T09:00:00Z',
  },
  {
    id: 'vfx-asset-10',
    name: 'starcourt_mall_destruction.mb',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688.png',
    videoMeta: {
      duration: '01:45',
      typeTag: 'VFX Preview',
    },
    collectionIds: ['vfx-6'],
    created_at: '2024-02-11T14:00:00Z',
  },
  {
    id: 'vfx-asset-11',
    name: 'demodogs_pack_rig.mb',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-1.png',
    videoMeta: {
      duration: '00:52',
      typeTag: 'VFX Preview',
    },
    collectionIds: ['vfx-1', 'vfx-6'],
    created_at: '2024-02-10T10:30:00Z',
  },
  {
    id: 'vfx-asset-12',
    name: 'eleven_nosebleed_effect.nk',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-2.png',
    videoMeta: {
      duration: '00:18',
      typeTag: 'VFX Preview',
    },
    collectionIds: ['vfx-4', 'vfx-char-3'],
    created_at: '2024-02-09T16:00:00Z',
  },

  // Camera Department assets
  {
    id: 'cam-asset-1',
    name: 'ep01_scene12_take3.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688.png',
    videoMeta: {
      duration: '02:15',
      typeTag: 'Dailies',
    },
    collectionIds: ['cam-1'],
    created_at: '2024-03-01T09:00:00Z',
  },
  {
    id: 'cam-asset-2',
    name: 'ep01_scene08_take1.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-1.png',
    videoMeta: {
      duration: '03:42',
      typeTag: 'Dailies',
    },
    collectionIds: ['cam-1'],
    created_at: '2024-03-01T10:30:00Z',
  },
  {
    id: 'cam-asset-3',
    name: 'arri_alexa_mini_test.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-2.png',
    videoMeta: {
      duration: '01:30',
      typeTag: 'Camera Test',
    },
    collectionIds: ['cam-2'],
    created_at: '2024-02-28T14:00:00Z',
  },
  {
    id: 'cam-asset-4',
    name: 'cooke_anamorphic_35mm_test.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-3.png',
    videoMeta: {
      duration: '00:45',
      typeTag: 'Lens Test',
    },
    collectionIds: ['cam-3'],
    created_at: '2024-02-28T11:00:00Z',
  },
  {
    id: 'cam-asset-5',
    name: 'zeiss_master_prime_50mm_test.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-4.png',
    videoMeta: {
      duration: '01:12',
      typeTag: 'Lens Test',
    },
    collectionIds: ['cam-3'],
    created_at: '2024-02-28T11:30:00Z',
  },
  {
    id: 'cam-asset-6',
    name: 'hawkins_town_square_broll.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-6.png',
    videoMeta: {
      duration: '05:20',
      typeTag: 'B-Roll',
    },
    collectionIds: ['cam-4'],
    created_at: '2024-02-27T15:00:00Z',
  },
  {
    id: 'cam-asset-7',
    name: 'forest_atmosphere_broll.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-7.png',
    videoMeta: {
      duration: '04:15',
      typeTag: 'B-Roll',
    },
    collectionIds: ['cam-4'],
    created_at: '2024-02-27T16:30:00Z',
  },
  {
    id: 'cam-asset-8',
    name: 'hawkins_aerial_dawn.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-8.png',
    videoMeta: {
      duration: '02:45',
      typeTag: 'Aerial',
    },
    collectionIds: ['cam-5'],
    created_at: '2024-02-26T06:00:00Z',
  },
  {
    id: 'cam-asset-9',
    name: 'quarry_aerial_orbit.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-9.png',
    videoMeta: {
      duration: '03:30',
      typeTag: 'Aerial',
    },
    collectionIds: ['cam-5'],
    created_at: '2024-02-26T07:00:00Z',
  },
  {
    id: 'cam-asset-10',
    name: 'chase_scene_steadicam_take2.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-11.png',
    videoMeta: {
      duration: '01:58',
      typeTag: 'Steadicam',
    },
    collectionIds: ['cam-6'],
    created_at: '2024-02-25T14:00:00Z',
  },
  {
    id: 'cam-asset-11',
    name: 'hallway_tracking_shot.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16679.png',
    videoMeta: {
      duration: '02:12',
      typeTag: 'Steadicam',
    },
    collectionIds: ['cam-6'],
    created_at: '2024-02-25T15:30:00Z',
  },
  {
    id: 'cam-asset-12',
    name: 'ep01_scene15_take1.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16678.png',
    videoMeta: {
      duration: '04:05',
      typeTag: 'Dailies',
    },
    collectionIds: ['cam-1'],
    created_at: '2024-03-01T11:00:00Z',
  },

  // Editorial Department assets
  {
    id: 'edit-asset-1',
    name: 'ep01_rough_cut_v3.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688.png',
    videoMeta: {
      duration: '42:30',
      typeTag: 'Rough Cut',
    },
    collectionIds: ['edit-1'],
    created_at: '2024-03-05T09:00:00Z',
  },
  {
    id: 'edit-asset-2',
    name: 'ep02_rough_cut_v1.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-1.png',
    videoMeta: {
      duration: '45:15',
      typeTag: 'Rough Cut',
    },
    collectionIds: ['edit-1'],
    created_at: '2024-03-06T10:00:00Z',
  },
  {
    id: 'edit-asset-3',
    name: 'ep01_assembly_v1.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-2.png',
    videoMeta: {
      duration: '52:00',
      typeTag: 'Assembly',
    },
    collectionIds: ['edit-2'],
    created_at: '2024-03-03T14:00:00Z',
  },
  {
    id: 'edit-asset-4',
    name: 'ep01_fine_cut_v2.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-3.png',
    videoMeta: {
      duration: '41:45',
      typeTag: 'Fine Cut',
    },
    collectionIds: ['edit-3'],
    created_at: '2024-03-08T11:00:00Z',
  },
  {
    id: 'edit-asset-5',
    name: 'ep01_color_pass_v1.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-4.png',
    videoMeta: {
      duration: '41:45',
      typeTag: 'Color Pass',
    },
    collectionIds: ['edit-4'],
    created_at: '2024-03-10T09:00:00Z',
  },
  {
    id: 'edit-asset-6',
    name: 'ep01_color_pass_v2.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-6.png',
    videoMeta: {
      duration: '41:45',
      typeTag: 'Color Pass',
    },
    collectionIds: ['edit-4'],
    created_at: '2024-03-11T10:00:00Z',
  },
  {
    id: 'edit-asset-7',
    name: 'ep01_vfx_temp_v3.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-7.png',
    videoMeta: {
      duration: '41:45',
      typeTag: 'VFX Temp',
    },
    collectionIds: ['edit-5'],
    created_at: '2024-03-09T15:00:00Z',
  },
  {
    id: 'edit-asset-8',
    name: 'ep02_vfx_temp_v1.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-8.png',
    videoMeta: {
      duration: '44:20',
      typeTag: 'VFX Temp',
    },
    collectionIds: ['edit-5'],
    created_at: '2024-03-09T16:00:00Z',
  },
  {
    id: 'edit-asset-9',
    name: 'ep01_final_master.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-9.png',
    videoMeta: {
      duration: '41:30',
      typeTag: 'Final',
    },
    collectionIds: ['edit-6'],
    created_at: '2024-03-15T09:00:00Z',
  },
  {
    id: 'edit-asset-10',
    name: 'ep01_textless_master.mov',
    type: 'video',
    thumbnail: '/images/dept/Rectangle 16688-11.png',
    videoMeta: {
      duration: '41:30',
      typeTag: 'Final',
    },
    collectionIds: ['edit-6'],
    created_at: '2024-03-15T10:00:00Z',
  },

  // Audio & Sound Department assets
  {
    id: 'audio-asset-1',
    name: 'ep01_scene12_production_mix.wav',
    type: 'audio',
    audioMeta: {
      duration: '02:15',
      typeTag: 'Production',
    },
    collectionIds: ['audio-1'],
    created_at: '2024-03-01T09:00:00Z',
  },
  {
    id: 'audio-asset-2',
    name: 'ep01_scene08_production_mix.wav',
    type: 'audio',
    audioMeta: {
      duration: '03:42',
      typeTag: 'Production',
    },
    collectionIds: ['audio-1'],
    created_at: '2024-03-01T10:00:00Z',
  },
  {
    id: 'audio-asset-3',
    name: 'demogorgon_growl_sfx.wav',
    type: 'audio',
    audioMeta: {
      duration: '00:08',
      typeTag: 'SFX',
    },
    collectionIds: ['audio-2'],
    created_at: '2024-02-28T14:00:00Z',
  },
  {
    id: 'audio-asset-4',
    name: 'portal_opening_sfx.wav',
    type: 'audio',
    audioMeta: {
      duration: '00:15',
      typeTag: 'SFX',
    },
    collectionIds: ['audio-2'],
    created_at: '2024-02-28T14:30:00Z',
  },
  {
    id: 'audio-asset-5',
    name: 'eleven_powers_sfx.wav',
    type: 'audio',
    audioMeta: {
      duration: '00:12',
      typeTag: 'SFX',
    },
    collectionIds: ['audio-2'],
    created_at: '2024-02-28T15:00:00Z',
  },
  {
    id: 'audio-asset-6',
    name: 'footsteps_wood_floor_foley.wav',
    type: 'audio',
    audioMeta: {
      duration: '01:30',
      typeTag: 'Foley',
    },
    collectionIds: ['audio-3'],
    created_at: '2024-02-27T11:00:00Z',
  },
  {
    id: 'audio-asset-7',
    name: 'bike_chain_foley.wav',
    type: 'audio',
    audioMeta: {
      duration: '00:45',
      typeTag: 'Foley',
    },
    collectionIds: ['audio-3'],
    created_at: '2024-02-27T12:00:00Z',
  },
  {
    id: 'audio-asset-8',
    name: 'upside_down_ambience.wav',
    type: 'audio',
    audioMeta: {
      duration: '05:00',
      typeTag: 'Ambient',
    },
    collectionIds: ['audio-4'],
    created_at: '2024-02-26T09:00:00Z',
  },
  {
    id: 'audio-asset-9',
    name: 'hawkins_night_atmos.wav',
    type: 'audio',
    audioMeta: {
      duration: '10:00',
      typeTag: 'Ambient',
    },
    collectionIds: ['audio-4'],
    created_at: '2024-02-26T10:00:00Z',
  },
  {
    id: 'audio-asset-10',
    name: 'main_theme_score_v2.wav',
    type: 'audio',
    audioMeta: {
      duration: '03:45',
      typeTag: 'Score',
    },
    collectionIds: ['audio-5'],
    created_at: '2024-02-25T14:00:00Z',
  },
  {
    id: 'audio-asset-11',
    name: 'chase_scene_cue.wav',
    type: 'audio',
    audioMeta: {
      duration: '02:30',
      typeTag: 'Score',
    },
    collectionIds: ['audio-5'],
    created_at: '2024-02-25T15:00:00Z',
  },
  {
    id: 'audio-asset-12',
    name: 'eleven_adr_session_01.wav',
    type: 'audio',
    audioMeta: {
      duration: '15:00',
      typeTag: 'ADR',
    },
    collectionIds: ['audio-6'],
    created_at: '2024-02-24T10:00:00Z',
  },
]

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
  return getAssets()
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
