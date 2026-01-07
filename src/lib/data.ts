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
  type: 'character' | 'location' | 'scene'
  assetCount: number
  mainImage?: string
  thumbnailImages?: string[]
  avatarSrc?: string
}

const MOCK_COLLECTIONS: Collection[] = [
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
    id: 'scene-1',
    name: 'Lab Escape Sequence',
    type: 'scene',
    assetCount: 43,
    mainImage: 'https://picsum.photos/seed/scene1/400/300',
    thumbnailImages: [
      'https://picsum.photos/seed/scene2/400/300',
      'https://picsum.photos/seed/scene3/400/300',
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
