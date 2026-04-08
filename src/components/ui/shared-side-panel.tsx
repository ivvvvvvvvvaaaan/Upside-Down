'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { AccessKindIcon } from './access-kind-icon'
import { AccessSummary } from './access-summary'
import { useAccess, useUserCollections } from '@/hooks'
import { kindLabel } from '@/lib/access'
import type { AccessEntryKind } from '@/lib/access'
import { getSharePreviewImages } from '@/lib/data-client'
import { getSharedResourceHref } from '@/lib/shared-resources'
import { PERSONAS } from '@/lib/personas'
import { formatDate } from '@/lib/utils'
import type { GrantView, ResourceRef } from '@/lib/grants'
import { profileLabel } from '@/lib/grants'

interface SharedSidePanelProps {
  entry: GrantView
  onClose: () => void
  onRevokeGrant?: (grantId: string) => void
  canRevokeGrant?: boolean
  /** Additional className for the ResponsivePanel */
  panelClassName?: string
}

export interface SharedDetailContentProps {
  entry: GrantView
  onRevokeGrant?: (grantId: string) => void
  canRevokeGrant?: boolean
  showAccess?: boolean
}

export function SharedDetailContent({ entry, onRevokeGrant, canRevokeGrant = false, showAccess = true }: SharedDetailContentProps) {
  const { getInheritedGrants } = useAccess()
  const { collections } = useUserCollections()
  const kind = entry.resourceType as AccessEntryKind
  const grantor = PERSONAS.find((p) => p.id === entry.grantedByUserId)
  const granterName = grantor?.name ?? entry.grantedByUserId

  const resourceRef: ResourceRef = {
    id: entry.resourceId,
    type: entry.resourceType,
    departmentId: entry.departmentId,
  }
  const resolvedHref = getSharedResourceHref({
    resourceId: entry.resourceId,
    resourceType: kind,
    departmentId: entry.departmentId,
  })
  const resolvedPreviewImages = getSharePreviewImages(entry, collections)

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4">
        <AccessKindIcon kind={kind} size="md" />
        <span className="text-body-2-bold text-foreground truncate">{entry.label}</span>
      </div>

      {/* Preview */}
      {resolvedPreviewImages && resolvedPreviewImages.length > 0 && (() => {
        const visible = resolvedPreviewImages.slice(0, 3)
        const remaining = resolvedPreviewImages.length - 3
        const cols = visible.length === 1 ? 'grid-cols-1' : visible.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        return (
          <div className="px-4 pt-2">
            <div className={`grid ${cols} gap-1 rounded overflow-hidden`}>
              {visible.map((src, i) => (
                <div key={i} className="relative aspect-video bg-surface-2">
                  <Image src={src} alt="" fill className="object-cover" sizes={visible.length === 1 ? '600px' : '200px'} />
                  {i === visible.length - 1 && remaining > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-body-2-bold text-white">+{remaining}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {resolvedHref && (
          <Button variant="secondary" asChild className="w-full">
            <Link href={resolvedHref}>
              Open {kindLabel(kind).toLowerCase()}
            </Link>
          </Button>
        )}

        {/* Details section */}
        <section className="space-y-2">
          <h3 className="text-body-0-bold text-foreground-dim">Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body-0-regular text-foreground-dim">Shared by</span>
              <span className="text-body-0-regular text-foreground">{granterName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-0-regular text-foreground-dim">Date</span>
              <span className="text-body-0-regular text-foreground">{formatDate(entry.grantedAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-0-regular text-foreground-dim">Permission</span>
              <span className="text-body-0-regular text-foreground">{profileLabel(entry.templateId)}</span>
            </div>
          </div>
        </section>

        {/* Access section */}
        {showAccess && (
          <AccessSummary
            resourceId={entry.resourceId}
            resourceRef={resourceRef}
            inheritedGrants={getInheritedGrants(entry.resourceId).map(({ grant, fromResourceName }) => ({
              grant,
              fromResourceName,
            }))}
            resourceName={entry.label}
          />
        )}

        {/* Revoke button */}
        {canRevokeGrant && onRevokeGrant && (
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={() => onRevokeGrant(entry.id)}
              className="w-full text-foreground-negative hover:opacity-80"
            >
              Revoke Share
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export function SharedSidePanel({ entry, onClose, onRevokeGrant, canRevokeGrant = false, panelClassName }: SharedSidePanelProps) {
  return (
    <ResponsivePanel open={true} onClose={onClose} className={panelClassName}>
      <SharedDetailContent
        entry={entry}
        onRevokeGrant={onRevokeGrant}
        canRevokeGrant={canRevokeGrant}
      />
    </ResponsivePanel>
  )
}
