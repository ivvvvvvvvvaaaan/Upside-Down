import { createClient } from '@/lib/supabase/server'

// Asset Types
export type AssetType = 'shot' | 'video' | 'image' | 'text'

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

  // Collection relationships
  collectionIds?: string[]  // Which collections this asset appears in

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
    mainImage: 'https://picsum.photos/seed/concept1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/concept2/400/300',
      'https://picsum.photos/seed/concept3/400/300',
    ],
  },
  {
    id: 'art-2',
    name: 'Storyboards',
    type: 'art-type',
    assetCount: 342,
    mainImage: 'https://picsum.photos/seed/storyboard1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/storyboard2/400/300',
      'https://picsum.photos/seed/storyboard3/400/300',
    ],
  },
  {
    id: 'art-3',
    name: 'Set Design',
    type: 'art-type',
    assetCount: 89,
    mainImage: 'https://picsum.photos/seed/setdesign1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/setdesign2/400/300',
      'https://picsum.photos/seed/setdesign3/400/300',
    ],
  },
  {
    id: 'art-4',
    name: 'Set Blueprints',
    type: 'art-type',
    assetCount: 67,
    mainImage: 'https://picsum.photos/seed/blueprint1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/blueprint2/400/300',
      'https://picsum.photos/seed/blueprint3/400/300',
    ],
  },
  {
    id: 'art-5',
    name: 'Reference Photography',
    type: 'art-type',
    assetCount: 213,
    mainImage: 'https://picsum.photos/seed/reference1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/reference2/400/300',
      'https://picsum.photos/seed/reference3/400/300',
    ],
  },
  {
    id: 'art-6',
    name: 'Prop Design',
    type: 'art-type',
    assetCount: 78,
    mainImage: 'https://picsum.photos/seed/prop1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/prop2/400/300',
      'https://picsum.photos/seed/prop3/400/300',
    ],
  },
  {
    id: 'art-7',
    name: 'Costume Design',
    type: 'art-type',
    assetCount: 95,
    mainImage: 'https://picsum.photos/seed/costume1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/costume2/400/300',
      'https://picsum.photos/seed/costume3/400/300',
    ],
  },
  // Character collections for Art Department
  {
    id: 'art-char-1',
    name: 'Hopper',
    type: 'character',
    assetCount: 45,
    mainImage: 'https://picsum.photos/seed/hopperart1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/hopperart2/400/300',
      'https://picsum.photos/seed/hopperart3/400/300',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=68',
  },
  {
    id: 'art-char-2',
    name: 'Eleven',
    type: 'character',
    assetCount: 62,
    mainImage: 'https://picsum.photos/seed/elevenart1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/elevenart2/400/300',
      'https://picsum.photos/seed/elevenart3/400/300',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: 'art-char-3',
    name: 'Demogorgon',
    type: 'character',
    assetCount: 87,
    mainImage: 'https://picsum.photos/seed/demoart1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/demoart2/400/300',
      'https://picsum.photos/seed/demoart3/400/300',
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=70',
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
    thumbnail: 'https://picsum.photos/seed/artconcept1/800/450',
    imageMeta: {
      typeTag: 'Concept Art',
      imageCount: 1,
    },
    collectionIds: ['art-1'],
    created_at: '2024-02-15T09:00:00Z',
  },
  {
    id: 'art-asset-2',
    name: 'demogorgon_creature_design.jpg',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artconcept2/800/450',
    imageMeta: {
      typeTag: 'Concept Art',
      imageCount: 4,
    },
    collectionIds: ['art-1', 'art-char-3'],
    created_at: '2024-02-14T11:30:00Z',
  },
  {
    id: 'art-asset-3',
    name: 'hawkins_lab_interior_concept.jpg',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artconcept3/800/450',
    imageMeta: {
      typeTag: 'Concept Art',
      imageCount: 3,
    },
    collectionIds: ['art-1'],
    created_at: '2024-02-13T14:00:00Z',
  },
  {
    id: 'art-asset-4',
    name: 'episode_01_storyboard_sequence.pdf',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artstory1/800/450',
    imageMeta: {
      typeTag: 'Storyboards',
      imageCount: 24,
    },
    collectionIds: ['art-2'],
    created_at: '2024-02-12T10:00:00Z',
  },
  {
    id: 'art-asset-5',
    name: 'chase_scene_boards.pdf',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artstory2/800/450',
    imageMeta: {
      typeTag: 'Storyboards',
      imageCount: 18,
    },
    collectionIds: ['art-2'],
    created_at: '2024-02-11T15:30:00Z',
  },
  {
    id: 'art-asset-6',
    name: 'byers_house_floor_plan.pdf',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artblue1/800/450',
    imageMeta: {
      typeTag: 'Blueprint',
      imageCount: 2,
    },
    collectionIds: ['art-4', 'art-3'],
    created_at: '2024-02-10T09:00:00Z',
  },
  {
    id: 'art-asset-7',
    name: 'starcourt_mall_blueprints.pdf',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artblue2/800/450',
    imageMeta: {
      typeTag: 'Blueprint',
      imageCount: 6,
    },
    collectionIds: ['art-4', 'art-3'],
    created_at: '2024-02-09T13:00:00Z',
  },
  {
    id: 'art-asset-8',
    name: '1980s_hawkins_reference_photos.zip',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artref1/800/450',
    imageMeta: {
      typeTag: 'Reference',
      imageCount: 156,
    },
    collectionIds: ['art-5'],
    created_at: '2024-02-08T10:00:00Z',
  },
  {
    id: 'art-asset-9',
    name: 'arcade_reference_collection.zip',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artref2/800/450',
    imageMeta: {
      typeTag: 'Reference',
      imageCount: 42,
    },
    collectionIds: ['art-5'],
    created_at: '2024-02-07T11:30:00Z',
  },
  {
    id: 'art-asset-10',
    name: 'hopper_uniform_design.png',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artcostume1/800/450',
    imageMeta: {
      typeTag: 'Costume Design',
      imageCount: 3,
    },
    collectionIds: ['art-7', 'art-char-1'],
    created_at: '2024-02-06T09:00:00Z',
  },
  {
    id: 'art-asset-11',
    name: 'eleven_hospital_gown_design.png',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artcostume2/800/450',
    imageMeta: {
      typeTag: 'Costume Design',
      imageCount: 2,
    },
    collectionIds: ['art-7', 'art-char-2'],
    created_at: '2024-02-05T14:00:00Z',
  },
  {
    id: 'art-asset-12',
    name: 'walkie_talkie_prop_design.png',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artprop1/800/450',
    imageMeta: {
      typeTag: 'Prop Design',
      imageCount: 4,
    },
    collectionIds: ['art-6'],
    created_at: '2024-02-04T10:00:00Z',
  },
  {
    id: 'art-asset-13',
    name: 'christmas_lights_props.png',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/artprop2/800/450',
    imageMeta: {
      typeTag: 'Prop Design',
      imageCount: 6,
    },
    collectionIds: ['art-6'],
    created_at: '2024-02-03T15:00:00Z',
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
