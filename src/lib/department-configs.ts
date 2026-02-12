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
}

export function getDepartmentConfig(id: DepartmentId): DepartmentConfig {
  return departmentConfigs[id]
}
