import type { SmartCollection } from '@/lib/data'
import { DEFAULT_SMART_COLLECTIONS } from '@/lib/smart-collection-seeds'
import { SEED_VERSION } from '@/lib/constants'

const SMART_COLLECTIONS_STORAGE_KEY = 'smart-collections'
const SMART_COLLECTIONS_VERSION_KEY = 'smart-collections-version'
let cachedSmartCollections: SmartCollection[] | null = null

function normalizeSmartCollectionDates(collections: SmartCollection[]): SmartCollection[] {
  return collections.map((collection) => ({
    ...collection,
    createdAt: new Date(collection.createdAt),
  }))
}

export function loadStoredSmartCollections(): SmartCollection[] {
  if (typeof window === 'undefined') {
    cachedSmartCollections = normalizeSmartCollectionDates(DEFAULT_SMART_COLLECTIONS)
    return cachedSmartCollections
  }

  try {
    const storedVersion = localStorage.getItem(SMART_COLLECTIONS_VERSION_KEY)
    if (storedVersion === String(SEED_VERSION)) {
      const stored = localStorage.getItem(SMART_COLLECTIONS_STORAGE_KEY)
      if (stored) {
        cachedSmartCollections = normalizeSmartCollectionDates(JSON.parse(stored) as SmartCollection[])
        return cachedSmartCollections
      }
    } else {
      localStorage.removeItem(SMART_COLLECTIONS_STORAGE_KEY)
      localStorage.setItem(SMART_COLLECTIONS_VERSION_KEY, String(SEED_VERSION))
    }
  } catch {
    // fall through to defaults
  }

  cachedSmartCollections = normalizeSmartCollectionDates(DEFAULT_SMART_COLLECTIONS)
  return cachedSmartCollections
}

export function persistSmartCollections(collections: SmartCollection[]) {
  cachedSmartCollections = normalizeSmartCollectionDates(collections)
  try {
    localStorage.setItem(SMART_COLLECTIONS_STORAGE_KEY, JSON.stringify(cachedSmartCollections))
    localStorage.setItem(SMART_COLLECTIONS_VERSION_KEY, String(SEED_VERSION))
  } catch {
    // ignore persistence failures in prototype mode
  }
}

export function getStoredSmartCollectionById(id: string): SmartCollection | undefined {
  if (!cachedSmartCollections) {
    loadStoredSmartCollections()
  }
  return cachedSmartCollections?.find((collection) => collection.id === id)
}

export function getSmartCollectionsStorageKey(): string {
  return SMART_COLLECTIONS_STORAGE_KEY
}
