'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { usePersona } from './usePersona'
import { buildSeedCollections } from '@/lib/scenario'
import { mergeCollectionAssetIds } from '@/lib/collection-membership'

/**
 * User-created collection (distinct from smart collections)
 * These are prototype-only, not persisted to backend
 */
export type UserCollection = {
  id: string
  name: string
  assetIds: string[]
  createdAt: Date
  createdBy?: string
  /** If set, this collection resolves assets from a folder at query time */
  boundFolderId?: string
  boundDepartmentId?: string
}

interface UserCollectionsContextValue {
  collections: UserCollection[]
  createCollection: (name: string, assetIds: string[]) => UserCollection
  createWorkspaceCollection: (name: string, folderId: string, departmentId: string) => UserCollection
  addAssetsToCollection: (id: string, assetIds: string[]) => void
  deleteCollection: (id: string) => void
  getCollection: (id: string) => UserCollection | undefined
}

const UserCollectionsContext = createContext<UserCollectionsContextValue | null>(null)

export function UserCollectionsProvider({ children }: { children: ReactNode }) {
  const { activePersona } = usePersona()
  const [collections, setCollections] = useState<UserCollection[]>(buildSeedCollections)

  const createCollection = useCallback((name: string, assetIds: string[]): UserCollection => {
    const newCollection: UserCollection = {
      id: `user-col-${Date.now()}`,
      name,
      assetIds,
      createdAt: new Date(),
      createdBy: activePersona?.email,
    }
    setCollections(prev => [...prev, newCollection])
    return newCollection
  }, [activePersona])

  const createWorkspaceCollection = useCallback((name: string, folderId: string, departmentId: string): UserCollection => {
    const newCollection: UserCollection = {
      id: `ws-col-${Date.now()}`,
      name,
      assetIds: [], // resolved at query time from boundFolderId
      createdAt: new Date(),
      createdBy: activePersona?.email,
      boundFolderId: folderId,
      boundDepartmentId: departmentId,
    }
    setCollections(prev => [...prev, newCollection])
    return newCollection
  }, [activePersona])

  const addAssetsToCollection = useCallback((id: string, assetIds: string[]) => {
    if (assetIds.length === 0) return
    setCollections((prev) => prev.map((collection) => {
      if (collection.id !== id) return collection
      return {
        ...collection,
        assetIds: mergeCollectionAssetIds(collection.assetIds, assetIds),
      }
    }))
  }, [])

  const deleteCollection = useCallback((id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id))
  }, [])

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
