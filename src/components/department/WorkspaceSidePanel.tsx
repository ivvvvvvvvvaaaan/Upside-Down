'use client'

import { useMemo } from 'react'
import { X, Folder, File, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ResponsivePanel } from '@/components/ui/responsive-panel'
import { Tag } from '@/components/ui/tag'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import type { DepartmentId } from '@/components/department/types'
import { getAITagsForFile } from '@/lib/ai-tags'
import { slugify } from '@/lib/smart-collection-filters'
import { formatDate } from '@/lib/utils'
import { SCENARIO } from '@/lib/scenario'
import { getTeamById } from '@/lib/teams'
import { profileLabel } from '@/lib/grants'

interface WorkspaceSidePanelProps {
  node?: WorkspaceFileNode | null
  open?: boolean
  onClose: () => void
  departmentId?: DepartmentId
  /** Whether this folder is a managed zone */
  isManagedZone?: boolean
  /** Toggle managed zone for this folder */
  onToggleManagedZone?: (folderId: string) => void
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

export function WorkspaceSidePanel({
  node,
  open = true,
  onClose,
  departmentId,
  isManagedZone,
  onToggleManagedZone,
}: WorkspaceSidePanelProps) {
  const isFolder = node?.type === 'folder'
  const fileCount = isFolder && node ? countChildFiles(node) : 0

  const departmentTeams = useMemo(() => {
    return Object.entries(SCENARIO.projectRoles.teams)
      .filter(([teamId]) => {
        if (!departmentId) return true
        const team = getTeamById(teamId)
        return team?.departmentId === departmentId || !team?.departmentId
      })
      .map(([teamId, role]) => {
        const team = getTeamById(teamId)
        return {
          id: teamId,
          name: team?.name ?? teamId,
          memberCount: team?.memberUserIds.length ?? 0,
          role,
        }
      })
  }, [departmentId])
  const aiTags = !isFolder && node ? getAITagsForFile(node.id) : undefined

  return (
    <ResponsivePanel open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <span className="text-body-1-bold text-foreground">
          {node ? (isFolder ? 'Folder Info' : 'File Info') : 'Info'}
        </span>
        <Button variant="icon" compact onClick={onClose}>
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
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {isFolder ? (
                <Folder className="w-8 h-8 text-foreground-dim flex-shrink-0" />
              ) : (
                <File className="w-8 h-8 text-foreground-dim flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-body-1-bold text-foreground truncate">{node.name}</p>
                <p className="text-label-0-regular text-foreground-dim">
                  {isFolder ? 'Folder' : node.extension?.toUpperCase() || 'File'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {isFolder ? (
                <div className="flex justify-between text-label-1-regular">
                  <span className="text-foreground-dim">Items</span>
                  <span className="text-foreground">{node.children?.length ?? 0} ({fileCount} files)</span>
                </div>
              ) : (
                <div className="flex justify-between text-label-1-regular">
                  <span className="text-foreground-dim">Size</span>
                  <span className="text-foreground">{formatFileSize(node.size)}</span>
                </div>
              )}
              {node.modifiedAt && (
              <div className="flex justify-between text-label-1-regular">
                <span className="text-foreground-dim">Modified</span>
                <span className="text-foreground">{formatDate(node.modifiedAt)}</span>
              </div>
              )}
            </div>
          </div>
        </section>


        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Access</h3>
          <div className="space-y-2">
            {departmentTeams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="w-4 h-4 text-foreground-dim flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-body-0-regular text-foreground truncate block">{team.name}</span>
                        <span className="text-label-0-regular text-foreground-dim">{team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}</span>
                      </div>
                    </div>
                    <Tag size="compact" type="neutral">{profileLabel(team.role)}</Tag>
                  </div>
                ))}
          </div>
        </section>

        {/* AI tags (files only) */}
        {!isFolder && aiTags && (
          <section className="space-y-2">
            <h3 className="text-label-0-bold uppercase text-foreground-dim">Tags</h3>
            <div className="space-y-2">

              {aiTags.characters.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {aiTags.characters.map(c => (
                    <Tag key={c} type="neutral" variant="border" size="compact">{c}</Tag>
                  ))}
                </div>
              )}

              {aiTags.location && (
                <div className="flex justify-between text-label-1-regular">
                  <span className="text-foreground-dim">Location</span>
                  <span className="text-foreground">{aiTags.location}</span>
                </div>
              )}

              {aiTags.scene && (
                <div className="flex justify-between text-label-1-regular">
                  <span className="text-foreground-dim">Scene</span>
                  <Link
                    href={`/nextgen/smart-collections/smart-scene--${slugify(aiTags.scene)}`}
                    className="text-foreground hover:text-foreground-system-link transition-colors truncate ml-2"
                  >
                    {aiTags.scene}
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Path */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Path</h3>
          <p className="text-label-0-regular text-foreground-dim font-mono break-all">
            /Workspaces/Apex S1/{node.name}
          </p>
        </section>
      </div>
      )}
    </ResponsivePanel>
  )
}
