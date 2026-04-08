import type { SmartCollection } from '@/lib/data'

export const SYSTEM_DEFAULT_SMART_COLLECTIONS: SmartCollection[] = [
  {
    id: 'smart-character',
    name: 'Character',
    icon: 'character',
    filter: { aiHasCharacters: true },
    visibleToAll: true,
    createdAt: new Date('2026-01-15'),
    groupBy: 'characters',
  },
  {
    id: 'smart-scene',
    name: 'Scene',
    icon: 'scene',
    filter: { aiHasScene: true },
    visibleToAll: true,
    createdAt: new Date('2026-01-15'),
    groupBy: 'scenes',
  },
  {
    id: 'smart-location',
    name: 'Location',
    icon: 'location',
    filter: { aiHasLocation: true },
    visibleToAll: true,
    createdAt: new Date('2026-01-15'),
    groupBy: 'locations',
  },
  {
    id: 'smart-take',
    name: 'Take',
    icon: 'shot',
    filter: { types: ['shot'] },
    visibleToAll: true,
    createdAt: new Date('2026-01-15'),
    groupBy: 'takes',
  },
  {
    id: 'smart-camera',
    name: 'Camera',
    icon: 'shot',
    filter: { types: ['shot'] },
    visibleToAll: true,
    createdAt: new Date('2026-01-15'),
    groupBy: 'cameras',
  },
]

export const SEED_USER_SMART_COLLECTIONS: SmartCollection[] = [
  {
    id: 'smart-finals',
    name: 'Finals',
    icon: 'shot',
    filter: { isFinal: true },
    createdBy: 'schen@netflix.com',
    createdAt: new Date('2026-02-05'),
  },
  {
    id: 'smart-key-art',
    name: 'Key Art',
    icon: 'scene',
    filter: { isKeyArt: true },
    createdBy: 'psharma@netflix.com',
    createdAt: new Date('2026-02-08'),
  },
  {
    id: 'smart-low-conf',
    name: 'Needs AI Review',
    icon: 'filter',
    filter: { aiConfidenceBelow: 0.7 },
    createdBy: 'mtorres@netflix.com',
    createdAt: new Date('2026-02-10'),
  },
]

export const DEFAULT_SMART_COLLECTIONS: SmartCollection[] = [
  ...SYSTEM_DEFAULT_SMART_COLLECTIONS,
  ...SEED_USER_SMART_COLLECTIONS,
]
