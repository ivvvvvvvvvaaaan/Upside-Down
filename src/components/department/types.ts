import type { Collection } from '@/lib/data'

export type ProductionDomainId = 'art-design' | 'vfx' | 'camera' | 'editorial' | 'audio-sound'

export type DistributionDomainId = 'marketing' | 'legal' | 'globalization'

export type DomainId = ProductionDomainId | DistributionDomainId

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
  /** Production domains have workspaces; distribution domains receive content via releases */
  kind: 'production' | 'distribution'
}
