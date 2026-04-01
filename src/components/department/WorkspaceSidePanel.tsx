'use client'

import { useMemo } from 'react'
import { X, Folder, FolderSymlink, FolderLock, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResponsivePanel } from '@/components/ui/responsive-panel'
import { AccessSummary } from '@/components/ui/access-summary'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import type { DepartmentId } from '@/components/department/types'
import type { ResourceRef } from '@/lib/grants'
import { formatDate } from '@/lib/utils'
import { useAccess, useFileTree } from '@/hooks'
import { DEPARTMENT_FOLDER_MAP } from '@/lib/workspace-data'
import { departmentConfigs } from '@/lib/department-configs'

interface WorkspaceSidePanelProps {
  node?: WorkspaceFileNode | null
  open?: boolean
  onClose: () => void
  departmentId?: DepartmentId
  /** Whether this folder is a managed zone */
  isManagedZone?: boolean
  /** Toggle managed zone for this folder */
  onToggleManagedZone?: (folderId: string) => void
  /** Folder variant: 'shared' | 'restricted' — changes the folder icon */
  folderVariant?: 'shared' | 'restricted'
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '\u2014'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}


function countChildFiles(node: WorkspaceFileNode): number {
  if (node.type === 'file') return 1
  let count = 0
  for (const child of node.children ?? []) {
    if (child.type === 'file') count++
    else count += countChildFiles(child)
  }
  return count
}

function findNodePath(nodes: WorkspaceFileNode[], id: string, trail: WorkspaceFileNode[] = []): WorkspaceFileNode[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node]
    if (node.id === id) return nextTrail
    if (node.children) {
      const found = findNodePath(node.children, id, nextTrail)
      if (found) return found
    }
  }
  return null
}

const DEPARTMENT_ROOT_ID_TO_ID = new Map(
  Object.entries(DEPARTMENT_FOLDER_MAP).map(([id, meta]) => [meta.id, id as DepartmentId]),
)

export function WorkspaceSidePanel({
  node,
  open = true,
  onClose,
  departmentId,
  isManagedZone,
  onToggleManagedZone,
  folderVariant,
}: WorkspaceSidePanelProps) {
  const isFolder = node?.type === 'folder'
  const FolderIcon = folderVariant === 'shared' ? FolderSymlink
    : folderVariant === 'restricted' ? FolderLock
    : Folder
  const fileCount = isFolder && node ? countChildFiles(node) : 0
  const { getInheritedGrants } = useAccess()
  const { tree: fileTree } = useFileTree()
  const nodePath = useMemo(() => {
    return node ? findNodePath(fileTree as WorkspaceFileNode[], node.id) : null
  }, [node, fileTree])

  const resolvedDepartmentId = useMemo(() => {
    if (departmentId) return departmentId
    if (!node) return undefined
    if (node.departmentId) return node.departmentId
    const match = Object.entries(DEPARTMENT_FOLDER_MAP).find(([, meta]) => meta.id === node.id)
    if (match) return match[0] as DepartmentId

    const departmentRootId = nodePath?.find((entry) => DEPARTMENT_ROOT_ID_TO_ID.has(entry.id))?.id
    return departmentRootId ? DEPARTMENT_ROOT_ID_TO_ID.get(departmentRootId) : undefined
  }, [departmentId, node, nodePath])

  const resourceRef: ResourceRef | undefined = node ? {
    id: node.id,
    type: node.type === 'folder' ? 'folder' : 'asset',
    departmentId: resolvedDepartmentId,
  } : undefined

  const inheritedGrants = node ? getInheritedGrants(node.id).map(({ grant, fromResourceName }) => ({
    grant,
    fromResourceName,
  })) : []

  const fullPath = useMemo(() => {
    if (!node) return null

    const rootPath = '/Apex S1'
    if (!resolvedDepartmentId) return `${rootPath}/${node.name}`

    const departmentRootId = DEPARTMENT_FOLDER_MAP[resolvedDepartmentId].id
    const departmentName = departmentConfigs[resolvedDepartmentId].name

    if (!nodePath || nodePath.length === 0) {
      return `${rootPath}/${departmentName}/${node.name}`
    }

    const pathNames = nodePath
      .map((entry) => entry.id === departmentRootId ? departmentName : entry.name)

    return `${rootPath}/${pathNames.join('/')}`
  }, [node, nodePath, resolvedDepartmentId])

  return (
    <ResponsivePanel open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4">
        {node ? (
          <div className="flex items-center gap-3 min-w-0">
            {isFolder ? (
              <FolderIcon className="w-8 h-8 text-foreground flex-shrink-0" />
            ) : (
              <File className="w-8 h-8 text-foreground-dim flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-body-0-bold text-foreground truncate">{node.name}</p>
              <p className="text-body-0-regular text-foreground-dim">
                {isFolder ? 'Folder' : node.extension?.toUpperCase() || 'File'}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-body-0-bold text-foreground">Info</span>
        )}
        <Button variant="icon" compact onClick={onClose} className="flex-shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {!node ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <span className="text-body-0-regular text-foreground-dim">Select an item to see details</span>
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Details */}
        <section className="space-y-2">
          <div className="space-y-1">

            <div className="space-y-1">
              {isFolder ? (
                <div className="flex justify-between text-body-0-regular">
                  <span className="text-foreground-dim">Items</span>
                  <span className="text-foreground">{node.children?.length ?? 0} ({fileCount} files)</span>
                </div>
              ) : (
                <div className="flex justify-between text-body-0-regular">
                  <span className="text-foreground-dim">Size</span>
                  <span className="text-foreground">{formatFileSize(node.size)}</span>
                </div>
              )}
              {node.modifiedAt && (
              <div className="flex justify-between text-body-0-regular">
                <span className="text-foreground-dim">Modified</span>
                <span className="text-foreground">{formatDate(node.modifiedAt)}</span>
              </div>
              )}
              {fullPath && (
              <div className="flex justify-between text-body-0-regular">
                <span className="text-foreground-dim">Path</span>
                <span className="text-foreground text-right truncate ml-2">{fullPath}</span>
              </div>
              )}
            </div>
          </div>
        </section>


        <AccessSummary
          resourceId={node?.id ?? ''}
          resourceRef={resourceRef}
          inheritedGrants={inheritedGrants}
          resourceName={node.name}
        />
      </div>
      )}
    </ResponsivePanel>
  )
}
