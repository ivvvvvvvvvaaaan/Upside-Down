'use client'

import { useState, useMemo } from 'react'
import { X, Folder, FolderSymlink, FolderLock, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivityFeed } from '@/components/ui/activity-feed'
import type { ActivityEvent } from '@/components/ui/activity-feed'
import { Modal } from '@/components/ui/modal'
import { Card } from '@/components/ui/card'
import { ResponsivePanel } from '@/components/ui/responsive-panel'
import { AccessModal } from '@/components/ui/access-modal'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import type { DomainId } from '@/components/department/types'
import type { ResourceRef } from '@/lib/grants'
import { formatDate, formatFileSize } from '@/lib/utils'
import { useAccess, useFileTree, usePersona } from '@/hooks'
import { PERSONAS } from '@/lib/personas'
import { DOMAIN_FOLDER_MAP, isReferenceFolder } from '@/lib/workspace-data'
import { domainConfigs } from '@/lib/domain-configs'

interface WorkspaceSidePanelProps {
  node?: WorkspaceFileNode | null
  open?: boolean
  onClose: () => void
  domainId?: DomainId
  /** Folder variant: 'shared' | 'restricted' — changes the folder icon */
  folderVariant?: 'shared' | 'restricted'
  /** Called when user deletes this folder */
  onDelete?: (nodeId: string) => void
  /** Called when user renames this folder */
  onRename?: (nodeId: string, newName: string) => void
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

const DOMAIN_ROOT_ID_TO_ID = new Map(
  Object.entries(DOMAIN_FOLDER_MAP).map(([id, meta]) => [meta.id, id as DomainId]),
)

export function WorkspaceSidePanel({
  node,
  open = true,
  onClose,
  domainId,
  folderVariant,
  onDelete,
  onRename,
}: WorkspaceSidePanelProps) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [accessModalOpen, setAccessModalOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const isFolder = node?.type === 'folder'
  const isCollectionProjection = isReferenceFolder(node)
  const FolderIcon = folderVariant === 'shared' ? FolderSymlink
    : folderVariant === 'restricted' ? FolderLock
    : Folder
  const fileCount = isFolder && node ? countChildFiles(node) : 0
  const { getInheritedGrants, getResourceGrants, canShare } = useAccess()
  const { isAdmin } = usePersona()
  const { tree: fileTree } = useFileTree()
  const nodePath = useMemo(() => {
    return node ? findNodePath(fileTree as WorkspaceFileNode[], node.id) : null
  }, [node, fileTree])

  const resolvedDomainId = useMemo(() => {
    if (domainId) return domainId
    if (!node) return undefined
    if (node.domainId) return node.domainId
    const match = Object.entries(DOMAIN_FOLDER_MAP).find(([, meta]) => meta.id === node.id)
    if (match) return match[0] as DomainId

    const domainRootId = nodePath?.find((entry) => DOMAIN_ROOT_ID_TO_ID.has(entry.id))?.id
    return domainRootId ? DOMAIN_ROOT_ID_TO_ID.get(domainRootId) : undefined
  }, [domainId, node, nodePath])

  const resourceRef: ResourceRef | undefined = node ? {
    id: node.id,
    type: node.type === 'folder' ? 'folder' : 'asset',
    domainId: resolvedDomainId,
  } : undefined

  const inheritedGrants = node ? getInheritedGrants(node.id).map(({ grant, fromResourceName }) => ({
    grant,
    fromResourceName,
  })) : []

  const sharedByName = useMemo(() => {
    if (!node || folderVariant !== 'shared') return null
    const grants = getResourceGrants(node.id)
    if (grants.length === 0) return null
    const grantor = PERSONAS.find(p => p.id === grants[0].grantedByUserId)
    return grantor?.name ?? null
  }, [node, folderVariant, getResourceGrants])

  const activityFeed = useMemo((): ActivityEvent[] => {
    if (!node || !isFolder) return []
    const events: ActivityEvent[] = []

    // Share events (deduplicated by sharer+time)
    const grants = getResourceGrants(node.id)
    const seen = new Set<string>()
    for (const grant of grants) {
      const key = `${grant.grantedByUserId}:${grant.grantedAt}`
      if (seen.has(key)) continue
      seen.add(key)
      const sharer = PERSONAS.find((p) => p.id === grant.grantedByUserId)
      events.push({
        id: `share-${grant.id}`,
        icon: 'share',
        text: `${sharer?.name ?? 'Someone'} shared this folder`,
        date: grant.grantedAt,
        detail: grant.note ?? undefined,
      })
    }

    // Recent file additions
    const collectFiles = (children: WorkspaceFileNode[]): WorkspaceFileNode[] => {
      const files: WorkspaceFileNode[] = []
      for (const child of children) {
        if (child.type === 'file' && child.modifiedAt) files.push(child)
        if (child.children) files.push(...collectFiles(child.children))
      }
      return files
    }

    for (const file of collectFiles(node.children ?? []).sort((a, b) => (b.modifiedAt ?? '').localeCompare(a.modifiedAt ?? '')).slice(0, 5)) {
      events.push({
        id: `file-${file.id}`,
        icon: 'file-add',
        text: file.name,
        date: file.modifiedAt!,
      })
    }

    return events.sort((a, b) => b.date.localeCompare(a.date))
  }, [node, isFolder, getResourceGrants])

  const fullPath = useMemo(() => {
    if (!node) return null

    const rootPath = '/Apex S1'
    if (!resolvedDomainId) return `${rootPath}/${node.name}`

    const domainRootId = DOMAIN_FOLDER_MAP[resolvedDomainId].id
    const domainName = domainConfigs[resolvedDomainId].name

    if (!nodePath || nodePath.length === 0) {
      return `${rootPath}/${domainName}/${node.name}`
    }

    const pathNames = nodePath
      .map((entry) => entry.id === domainRootId ? domainName : entry.name)

    return `${rootPath}/${pathNames.join('/')}`
  }, [node, nodePath, resolvedDomainId])

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
                {isFolder
                  ? (isCollectionProjection ? 'Collection' : 'Folder')
                  : node.extension?.toUpperCase() || 'File'}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-body-0-bold text-foreground">Info</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="icon" compact onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
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
              {sharedByName && (
              <div className="flex justify-between text-body-0-regular">
                <span className="text-foreground-dim">Shared by</span>
                <span className="text-foreground">{sharedByName}</span>
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

        <ActivityFeed events={activityFeed} />

      </div>
      )}
      {/* Edit modal */}
      {node && resourceRef && (
        <AccessModal
          open={accessModalOpen}
          onClose={() => setAccessModalOpen(false)}
          resourceId={node.id}
          resourceRef={resourceRef}
          inheritedGrants={inheritedGrants}
          title={node.name}
        />
      )}
      {node && onRename && (
        <Modal open={editModalOpen} onOpenChange={setEditModalOpen} size="sm">
          <Modal.Header title={isCollectionProjection ? 'Edit Collection' : 'Edit Folder'} />
          <Modal.Body>
            <div>
              <label className="text-label-1-bold text-foreground-dim block mb-1">Name</label>
              <input
                type="text"
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                className="w-full h-10 px-3 rounded border border-border-dim bg-surface-highlight text-body-0-regular text-foreground focus:border-border-subtle outline-none transition-colors"
              />
            </div>
          </Modal.Body>
          <Card.Footer>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              if (draftName && draftName !== node.name) onRename(node.id, draftName)
              setEditModalOpen(false)
            }}>Save</Button>
          </Card.Footer>
        </Modal>
      )}
    </ResponsivePanel>
  )
}
