'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

/**
 * User-created collection (distinct from smart collections)
 * These are prototype-only, not persisted to backend
 */
export type UserCollection = {
  id: string
  name: string
  assetIds: string[]
  createdAt: Date
}

interface UserCollectionsContextValue {
  collections: UserCollection[]
  createCollection: (name: string, assetIds: string[]) => UserCollection
  deleteCollection: (id: string) => void
  getCollection: (id: string) => UserCollection | undefined
}

const UserCollectionsContext = createContext<UserCollectionsContextValue | null>(null)

export function UserCollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<UserCollection[]>([])

  const createCollection = useCallback((name: string, assetIds: string[]): UserCollection => {
    const newCollection: UserCollection = {
      id: `user-col-${Date.now()}`,
      name,
      assetIds,
      createdAt: new Date(),
    }
    setCollections(prev => [...prev, newCollection])
    return newCollection
  }, [])

  const deleteCollection = useCallback((id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id))
  }, [])

  const getCollection = useCallback((id: string): UserCollection | undefined => {
    return collections.find(c => c.id === id)
  }, [collections])

  return (
    <UserCollectionsContext.Provider value={{ collections, createCollection, deleteCollection, getCollection }}>
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
