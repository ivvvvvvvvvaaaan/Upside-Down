'use client'

import Link from 'next/link'
import { Folder, FileText, LayoutGrid } from 'lucide-react'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { Tag } from './tag'
import { AccessPanel } from './access-panel'
import { kindLabel, kindTagType } from '@/lib/access'
import type { AccessEntryKind } from '@/lib/access'
import { getPersonaName, PERSONAS } from '@/lib/personas'
import { formatDate } from '@/lib/utils'
import type { GrantView, ResourceRef, Permission } from '@/lib/grants'
import { profileLabel } from '@/lib/grants'

interface SharedSidePanelProps {
  entry: GrantView
  onClose: () => void
  isCreator?: boolean
  onRevokeShare?: (resourceId: string) => void
  /** Link to the shared resource (collection/folder) */
  href?: string
  /** Additional className for the ResponsivePanel */
  panelClassName?: string
}


function kindIcon(kind: AccessEntryKind) {
  if (kind === 'folder') return <Folder className="w-5 h-5 text-foreground-dim flex-shrink-0" />
  if (kind === 'collection') return <LayoutGrid className="w-5 h-5 text-foreground-dim flex-shrink-0" />
  if (kind === 'review-set') return <FileText className="w-5 h-5 text-foreground-dim flex-shrink-0" />
  return <FileText className="w-5 h-5 text-foreground-dim flex-shrink-0" />
}


const PERM_TAG_TYPE: Record<Permission, 'neutral'> = {
  'discover': 'neutral',
  'open': 'neutral',
  'download': 'neutral',
  'write': 'neutral',
  'delete': 'neutral',
  'comment': 'neutral',
  'share': 'neutral',
  'edit-acl': 'neutral',
}

const PERM_LABELS: Record<Permission, string> = {
  'discover': 'View',
  'open': 'View',
  'download': 'Save',
  'write': 'Edit',
  'delete': 'Delete',
  'comment': 'Note',
  'share': 'Share',
  'edit-acl': 'Admin',
}

export function SharedSidePanel({ entry, onClose, isCreator = false, onRevokeShare, href, panelClassName }: SharedSidePanelProps) {
  const kind = entry.resourceType as AccessEntryKind
  const grantor = PERSONAS.find((p) => p.id === entry.grantedByUserId)
  const granterName = grantor?.name ?? entry.grantedByUserId

  const resourceRef: ResourceRef = {
    id: entry.resourceId,
    type: entry.resourceType,
    departmentId: entry.departmentId,
  }

  return (
    <ResponsivePanel open={true} onClose={onClose} className={panelClassName}>
      {/* Header */}
      <div className="p-4">
        <span className="text-body-1-bold text-foreground">Sharing Details</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Item section */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Item</h3>
          <div className="flex items-center gap-3">
            {kindIcon(kind)}
            <div className="min-w-0 flex-1">
              <p className="text-body-1-bold text-foreground truncate">{entry.label}</p>
              <div className="flex items-center gap-2">
                <Tag size="compact" type={kindTagType(kind)}>
                  {kindLabel(kind)}
                </Tag>
                <Tag size="compact" type="neutral">
                  {profileLabel(entry.templateId)}
                </Tag>
              </div>
            </div>
          </div>
          {href && (
            <Button variant="secondary" compact asChild className="w-full mt-3">
              <Link href={href}>
                Open {kindLabel(kind).toLowerCase()}
              </Link>
            </Button>
          )}
        </section>

        {/* Details section */}
        <section className="space-y-2">
          <h3 className="text-label-0-bold uppercase text-foreground-dim">Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-label-1-regular text-foreground-dim">Shared by</span>
              <span className="text-body-0-regular text-foreground">{granterName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label-1-regular text-foreground-dim">Date</span>
              <span className="text-body-0-regular text-foreground">{formatDate(entry.grantedAt)}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-label-1-regular text-foreground-dim">Template</span>
                <span className="text-body-0-regular text-foreground">{profileLabel(entry.templateId)}</span>
              </div>
              <div className="flex flex-wrap gap-1 justify-end">
                {entry.permissions.map((perm) => (
                  <Tag key={perm} size="compact" type={PERM_TAG_TYPE[perm]}>
                    {PERM_LABELS[perm]}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Access section — readOnly when not creator */}
        <AccessPanel
          resourceId={entry.resourceId}
          resourceRef={resourceRef}
          readOnly={!isCreator}
        />

        {/* Revoke button — creator only */}
        {isCreator && onRevokeShare && (
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={() => onRevokeShare(entry.resourceId)}
              className="w-full text-foreground-negative hover:opacity-80"
            >
              Revoke Share
            </Button>
          </div>
        )}
      </div>
    </ResponsivePanel>
  )
}
