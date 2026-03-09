'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { DepartmentId } from '@/components/department/types'
import type { WorkspaceFileNode } from '@/lib/workspace-data'

/**
 * Transient folder store — follows the same pattern as useUserCollections.
 * Simple flat array, persists across navigation, resets on page refresh.
 */

type FolderScope = DepartmentId | 'workspace'

interface TransientFolder {
  scope: FolderScope
  parentKey: string // parentPath.join('/'), "" for root
  folder: WorkspaceFileNode
}

interface WorkspaceFilesContextValue {
  folders: TransientFolder[]
  createFolder: (scope: FolderScope, name: string, parentPath: string[]) => void
}

const WorkspaceFilesContext = createContext<WorkspaceFilesContextValue>({
  folders: [],
  createFolder: () => {},
})

export function WorkspaceFilesProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<TransientFolder[]>([])

  const createFolder = useCallback((scope: FolderScope, name: string, parentPath: string[]) => {
    const entry: TransientFolder = {
      scope,
      parentKey: parentPath.join('/'),
      folder: {
        id: `new-folder-${Date.now()}`,
        name,
        type: 'folder',
        children: [],
      },
    }
    setFolders(prev => [...prev, entry])
  }, [])

  return (
    <WorkspaceFilesContext.Provider value={{ folders, createFolder }}>
      {children}
    </WorkspaceFilesContext.Provider>
  )
}

/** Get transient folders for a scope as a parentKey → folders map */
export function useTransientFolders(scope: FolderScope): Map<string, WorkspaceFileNode[]> {
  const { folders } = useContext(WorkspaceFilesContext)
  return useMemo(() => {
    const map = new Map<string, WorkspaceFileNode[]>()
    for (const entry of folders) {
      if (entry.scope !== scope) continue
      const existing = map.get(entry.parentKey) ?? []
      map.set(entry.parentKey, [...existing, entry.folder])
    }
    return map
  }, [folders, scope])
}

/** Get workspace-level transient folders (flat list) */
export function useWorkspaceLandingFolders(): WorkspaceFileNode[] {
  const { folders } = useContext(WorkspaceFilesContext)
  return useMemo(
    () => folders.filter((e) => e.scope === 'workspace').map((e) => e.folder),
    [folders],
  )
}

/** Create a transient folder */
export function useCreateFolder() {
  const { createFolder } = useContext(WorkspaceFilesContext)
  return createFolder
}
