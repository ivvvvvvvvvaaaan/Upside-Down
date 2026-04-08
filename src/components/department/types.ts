import type { Collection } from '@/lib/data'

export type DepartmentId = 'art-design' | 'vfx' | 'camera' | 'editorial' | 'audio-sound'

export type SmartCollectionType = 'character' | 'location' | 'scene'

export interface DepartmentConfig {
  id: DepartmentId
  name: string
  shortName: string
  description: string
  smartCollectionTypes: SmartCollectionType[]
  userCollectionType: Collection['type']
  /** Tailwind bg class for department avatar */
  color: string
}
