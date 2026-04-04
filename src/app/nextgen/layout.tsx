'use client'

import { usePathname } from 'next/navigation'
import { AppLayout } from '@/components/layouts'
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
  const pathname = usePathname()
  const isShelllessRoute = pathname === '/nextgen/menu'
    || pathname.startsWith('/nextgen/menu/')
    || pathname === '/nextgen/desktop'
    || pathname.startsWith('/nextgen/desktop/')
  const hideNav = pathname.startsWith('/nextgen/assets/')

  return (
    <PersonaProvider>
      <UserCollectionsProvider>
        <FileTreeProvider>
          <AccessProvider>
            <SmartCollectionsProvider>
              {isShelllessRoute ? children : (
                <AppLayout hideNav={hideNav}>
                  {children}
                </AppLayout>
              )}
            </SmartCollectionsProvider>
          </AccessProvider>
        </FileTreeProvider>
      </UserCollectionsProvider>
    </PersonaProvider>
  )
}
