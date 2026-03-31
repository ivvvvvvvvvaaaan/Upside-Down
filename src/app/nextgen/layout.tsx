'use client'

import { UserCollectionsProvider, SmartCollectionsProvider, FileTreeProvider, PersonaProvider, AccessProvider } from '@/hooks'

/**
 * Nextgen Layout
 *
 * Wraps all nextgen pages with providers for shared state:
 * - PersonaProvider: manages active persona for access scoping
 * - UserCollectionsProvider: manages user-created collections (prototype, not persisted)
 * - AccessProvider: manages folder-level and asset-level access based on persona and collection shares
 * - SmartCollectionsProvider: manages filter-based smart collections (consumes AccessProvider)
 * - FileTreeProvider: manages unified workspace file tree (shared between Workspace and Finder)
 */
export default function NextgenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PersonaProvider>
      <UserCollectionsProvider>
        <AccessProvider>
          <SmartCollectionsProvider>
            <FileTreeProvider>
              {children}
            </FileTreeProvider>
          </SmartCollectionsProvider>
        </AccessProvider>
      </UserCollectionsProvider>
    </PersonaProvider>
  )
}
