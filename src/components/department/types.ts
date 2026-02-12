import type { Collection } from '@/lib/data'

export type DepartmentId = 'art-design' | 'vfx'

export type SmartCollectionType = 'character' | 'location' | 'scene'

export interface DepartmentConfig {
  id: DepartmentId
  name: string
  shortName: string
  description: string
  smartCollectionTypes: SmartCollectionType[]
  userCollectionType: Collection['type']
}

export interface DepartmentHomeViewProps {
  config: DepartmentConfig
  initialCollections: Collection[]
}

export interface EnrichedCollection extends Collection {
  mainImage?: string
  thumbnailImages?: string[]
}
