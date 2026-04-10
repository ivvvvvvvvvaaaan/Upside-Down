import type { Collection } from '@/lib/data'

export type DomainId = 'art-design' | 'vfx' | 'camera' | 'editorial' | 'audio-sound'

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
