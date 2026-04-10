import type { DomainConfig, DomainId } from '@/components/department/types'

export const domainConfigs: Record<DomainId, DomainConfig> = {
  'art-design': {
    id: 'art-design',
    name: 'Art & Design',
    shortName: 'Art & Design',
    description: 'Concept art, storyboards, and design assets',
    smartCollectionTypes: ['character', 'location', 'scene'],
    userCollectionType: 'art-type',
    color: 'bg-purple-500',
  },
  vfx: {
    id: 'vfx',
    name: 'VFX',
    shortName: 'VFX',
    description: 'Visual effects, compositing, and 3D assets',
    smartCollectionTypes: ['character', 'location', 'scene'],
    userCollectionType: 'art-type',
    color: 'bg-blue-500',
  },
  camera: {
    id: 'camera',
    name: 'Camera',
    shortName: 'Camera',
    description: 'Dailies, camera tests, and production footage',
    smartCollectionTypes: ['scene'],
    userCollectionType: 'art-type',
    color: 'bg-green-500',
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    shortName: 'Editorial',
    description: 'Cuts, color passes, and delivery masters',
    smartCollectionTypes: ['scene'],
    userCollectionType: 'art-type',
    color: 'bg-yellow-500',
  },
  'audio-sound': {
    id: 'audio-sound',
    name: 'Audio & Sound',
    shortName: 'Audio',
    description: 'Production sound, SFX, foley, and music',
    smartCollectionTypes: ['scene'],
    userCollectionType: 'art-type',
    color: 'bg-red-500',
  },
}

/** @deprecated Use domainConfigs */
export const departmentConfigs = domainConfigs
