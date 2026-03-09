'use client'

import { UserCollectionsProvider, SmartCollectionsProvider, WorkspaceFilesProvider } from '@/hooks'

/**
 * Nextgen Layout
 *
 * Wraps all nextgen pages with providers for shared state:
 * - UserCollectionsProvider: manages user-created collections (prototype, not persisted)
 * - SmartCollectionsProvider: manages filter-based smart collections
 * - WorkspaceFilesProvider: manages workspace folders/files (create folder, transient folders)
 */
export default function NextgenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SmartCollectionsProvider>
      <UserCollectionsProvider>
        <WorkspaceFilesProvider>
          {children}
        </WorkspaceFilesProvider>
      </UserCollectionsProvider>
    </SmartCollectionsProvider>
  )
}
