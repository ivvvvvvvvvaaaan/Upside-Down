'use client'

import { UserCollectionsProvider, SmartCollectionsProvider } from '@/hooks'

/**
 * Nextgen Layout
 *
 * Wraps all nextgen pages with providers for shared state:
 * - UserCollectionsProvider: manages user-created collections (prototype, not persisted)
 * - SmartCollectionsProvider: manages filter-based smart collections
 */
export default function NextgenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SmartCollectionsProvider>
      <UserCollectionsProvider>
        {children}
      </UserCollectionsProvider>
    </SmartCollectionsProvider>
  )
}
