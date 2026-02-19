'use client'

import { UserCollectionsProvider } from '@/hooks'

/**
 * Nextgen Layout
 *
 * Wraps all nextgen pages with providers for shared state:
 * - UserCollectionsProvider: manages user-created collections (prototype, not persisted)
 */
export default function NextgenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserCollectionsProvider>
      {children}
    </UserCollectionsProvider>
  )
}
