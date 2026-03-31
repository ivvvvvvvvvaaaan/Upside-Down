'use client'

import { UserCollectionsProvider, SmartCollectionsProvider, FileTreeProvider, PersonaProvider, AccessProvider } from '@/hooks'

/**
 * Nextgen Layout
 *
 * Provider order matters:
 * - PersonaProvider: manages active persona for access scoping
 * - UserCollectionsProvider: manages user-created collections
 * - FileTreeProvider: manages unified workspace file tree (must wrap AccessProvider — mutable tree consumed reactively)
 * - AccessProvider: manages access based on persona, grants, and file tree
 * - SmartCollectionsProvider: manages filter-based smart collections (consumes AccessProvider)
 */
export default function NextgenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PersonaProvider>
      <UserCollectionsProvider>
        <FileTreeProvider>
          <AccessProvider>
            <SmartCollectionsProvider>
              {children}
            </SmartCollectionsProvider>
          </AccessProvider>
        </FileTreeProvider>
      </UserCollectionsProvider>
    </PersonaProvider>
  )
}
