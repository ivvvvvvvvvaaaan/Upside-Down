'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { usePersona } from './usePersona'
import { buildSeedCollections } from '@/lib/scenario'
import { mergeCollectionAssetIds } from '@/lib/collection-membership'

/**
 * User-created collection (distinct from smart collections)
 * Persisted to localStorage alongside grants so they survive refresh.
 */
export type UserCollection = {
  flavor: 'collection'
  id: string
  name: string
  assetIds: string[]
  createdAt: Date
  createdBy?: string
  /** If set, this collection resolves assets from a folder at query time */
  boundFolderId?: string
  boundDomainId?: string
}

const COLLECTIONS_STORAGE_KEY = 'user-collections'
import { SEED_VERSION } from '@/lib/constants'
const SEED_VERSION_KEY = 'user-collections-version'

function loadStoredCollections(): UserCollection[] {
  if (typeof window === 'undefined') return buildSeedCollections()
  try {
    const storedVersion = localStorage.getItem(SEED_VERSION_KEY)
    if (storedVersion === String(SEED_VERSION)) {
      const stored = localStorage.getItem(COLLECTIONS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as UserCollection[]
        return parsed.map(c => ({ ...c, flavor: 'collection' as const, createdAt: new Date(c.createdAt) }))
      }
    } else {
      localStorage.removeItem(COLLECTIONS_STORAGE_KEY)
      localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
    }
  } catch { /* fall through */ }
  return buildSeedCollections()
}

function persistCollections(collections: UserCollection[]) {
  try {
    localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections))
    localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
  } catch { /* ignore */ }
}

interface UserCollectionsContextValue {
  collections: UserCollection[]
  createCollection: (name: string, assetIds: string[]) => UserCollection
  createWorkspaceCollection: (name: string, folderId: string, domainId: string) => UserCollection
  addAssetsToCollection: (id: string, assetIds: string[]) => void
  deleteCollection: (id: string) => void
  getCollection: (id: string) => UserCollection | undefined
}

const UserCollectionsContext = createContext<UserCollectionsContextValue | null>(null)

export function UserCollectionsProvider({ children }: { children: ReactNode }) {
  const { activePersona } = usePersona()
  const [collections, setCollectionsState] = useState<UserCollection[]>(loadStoredCollections)

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== COLLECTIONS_STORAGE_KEY) return
      setCollectionsState(loadStoredCollections())
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setCollections = useCallback((action: UserCollection[] | ((prev: UserCollection[]) => UserCollection[])) => {
    setCollectionsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      persistCollections(next)
      return next
    })
  }, [])

  const createCollection = useCallback((name: string, assetIds: string[]): UserCollection => {
    const newCollection: UserCollection = {
      flavor: 'collection',
      id: `user-col-${Date.now()}`,
      name,
      assetIds,
      createdAt: new Date(),
      createdBy: activePersona?.email,
    }
    setCollections(prev => [...prev, newCollection])
    return newCollection
  }, [activePersona, setCollections])

  const createWorkspaceCollection = useCallback((name: string, folderId: string, domainId: string): UserCollection => {
    const existing = collections.find(c => c.boundFolderId === folderId)
    if (existing) return existing

    const newCollection: UserCollection = {
      flavor: 'collection',
      id: `ws-col-${Date.now()}`,
      name,
      assetIds: [],
      createdAt: new Date(),
      createdBy: activePersona?.email,
      boundFolderId: folderId,
      boundDomainId: domainId,
    }
    setCollections(prev => [...prev, newCollection])
    return newCollection
  }, [activePersona, setCollections, collections])

  const addAssetsToCollection = useCallback((id: string, assetIds: string[]) => {
    if (assetIds.length === 0) return
    setCollections((prev) => prev.map((collection) => {
      if (collection.id !== id) return collection
      return {
        ...collection,
        assetIds: mergeCollectionAssetIds(collection.assetIds, assetIds),
      }
    }))
  }, [setCollections])

  const deleteCollection = useCallback((id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id))
  }, [setCollections])

  const getCollection = useCallback((id: string): UserCollection | undefined => {
    return collections.find(c => c.id === id)
  }, [collections])

  return (
    <UserCollectionsContext.Provider value={useMemo(() => ({
      collections,
      createCollection,
      createWorkspaceCollection,
      addAssetsToCollection,
      deleteCollection,
      getCollection,
    }), [collections, createCollection, createWorkspaceCollection, addAssetsToCollection, deleteCollection, getCollection])}>
      {children}
    </UserCollectionsContext.Provider>
  )
}

export function useUserCollections(): UserCollectionsContextValue {
  const context = useContext(UserCollectionsContext)
  if (!context) {
    throw new Error('useUserCollections must be used within a UserCollectionsProvider')
  }
  return context
}
