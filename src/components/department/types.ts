import type { Collection } from '@/lib/data'

export type DomainId = 'art-design' | 'vfx' | 'camera' | 'editorial' | 'audio-sound'

/** @deprecated Use DomainId */
export type DepartmentId = DomainId

export type SmartCollectionType = 'character' | 'location' | 'scene'

export interface DomainConfig {
  id: DomainId
  name: string
  shortName: string
  description: string
  smartCollectionTypes: SmartCollectionType[]
  userCollectionType: Collection['type']
  /** Tailwind bg class for domain avatar */
  color: string
}

/** @deprecated Use DomainConfig */
export type DepartmentConfig = DomainConfig
