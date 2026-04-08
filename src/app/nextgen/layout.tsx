import { Suspense } from 'react'
import { UserCollectionsProvider } from '@/hooks/useUserCollections'
import { SmartCollectionsProvider } from '@/hooks/useSmartCollections'
import { FileTreeProvider } from '@/hooks/useFileTree'
import { PersonaProvider } from '@/hooks/usePersona'
import { AccessProvider } from '@/hooks/useAccess'
import { NextgenShell } from './_components/nextgen-shell'
import { ToastProvider } from '@/components/ui/toast'

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
              <ToastProvider>
                <Suspense fallback={children}>
                  <NextgenShell>{children}</NextgenShell>
                </Suspense>
              </ToastProvider>
            </SmartCollectionsProvider>
          </AccessProvider>
        </FileTreeProvider>
      </UserCollectionsProvider>
    </PersonaProvider>
  )
}
