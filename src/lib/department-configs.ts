import type { DepartmentConfig, DepartmentId } from '@/components/department/types'

export const departmentConfigs: Record<DepartmentId, DepartmentConfig> = {
  'art-design': {
    id: 'art-design',
    name: 'Art & Design',
    shortName: 'Art & Design',
    description: 'Concept art, storyboards, and design assets',
    smartCollectionTypes: ['character', 'location', 'scene'],
    userCollectionType: 'art-type',
  },
  vfx: {
    id: 'vfx',
    name: 'VFX',
    shortName: 'VFX',
    description: 'Visual effects, compositing, and 3D assets',
    smartCollectionTypes: ['character', 'location', 'scene'],
    userCollectionType: 'art-type',
  },
  camera: {
    id: 'camera',
    name: 'Camera',
    shortName: 'Camera',
    description: 'Dailies, camera tests, and production footage',
    smartCollectionTypes: ['scene'],
    userCollectionType: 'art-type',
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    shortName: 'Editorial',
    description: 'Cuts, color passes, and delivery masters',
    smartCollectionTypes: ['scene'],
    userCollectionType: 'art-type',
  },
  'audio-sound': {
    id: 'audio-sound',
    name: 'Audio & Sound',
    shortName: 'Audio',
    description: 'Production sound, SFX, foley, and music',
    smartCollectionTypes: ['scene'],
    userCollectionType: 'art-type',
  },
}
