'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from './button'
import { ResponsivePanel } from './responsive-panel'
import { AccessKindIcon } from './access-kind-icon'
import { AccessSummary } from './access-summary'
import { useAccess, usePersona, useUserCollections } from '@/hooks'
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
  /** Called when the user leaves (self-revokes) this share */
  onLeave?: (grantId: string) => void
  /** Additional className for the ResponsivePanel */
  panelClassName?: string
}

export interface SharedDetailContentProps {
  entry: GrantView
  showAccess?: boolean
}

export function SharedDetailContent({ entry, showAccess = true, onLeave }: SharedDetailContentProps & { onLeave?: (grantId: string) => void }) {
  const { getInheritedGrants } = useAccess()
  const { activePersona } = usePersona()
  const { collections } = useUserCollections()
  const kind = entry.resourceType as AccessEntryKind
  const grantor = PERSONAS.find((p) => p.id === entry.grantedByUserId)
  const granterName = grantor?.name ?? entry.grantedByUserId

  const resourceRef: ResourceRef = {
    id: entry.resourceId,
    type: entry.resourceType,
    domainId: entry.domainId,
  }
  const resolvedHref = getSharedResourceHref({
    resourceId: entry.resourceId,
    resourceType: kind,
    domainId: entry.domainId,
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
        const previewGrid = (
          <div className={`grid ${cols} gap-1`}>
            {visible.map((src, i) => (
              <div key={i} className="relative aspect-video bg-surface-2 group-hover:opacity-60 transition-opacity">
                <Image src={src} alt="" fill className="object-cover" sizes={visible.length === 1 ? '600px' : '200px'} />
                {i === visible.length - 1 && remaining > 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-body-2-bold text-white">+{remaining}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
        return (
          <div className="px-4 pt-2">
            {resolvedHref ? (
              <Link href={resolvedHref} className="block rounded overflow-hidden cursor-pointer group">
                {previewGrid}
              </Link>
            ) : (
              <div className="rounded overflow-hidden">
                {previewGrid}
              </div>
            )}
          </div>
        )
      })()}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex gap-2">
          {resolvedHref && (
            <Button variant="secondary" asChild>
              <Link href={resolvedHref}>
                Open {entry.label}
              </Link>
            </Button>
          )}
          {onLeave && activePersona && entry.grantedByUserId !== activePersona.id && (
            <Button variant="secondary" onClick={() => onLeave(entry.id)}>
              Leave
            </Button>
          )}
        </div>

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
            {entry.note && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-body-0-regular text-foreground-dim flex-shrink-0">Note</span>
                <span className="text-body-0-regular text-foreground text-right">{entry.note}</span>
              </div>
            )}
          </div>
        </section>

        {/* Access section — manage/revoke individual grants via the Share modal */}
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
      </div>
    </>
  )
}

export function SharedSidePanel({ entry, onClose, onLeave, panelClassName }: SharedSidePanelProps) {
  return (
    <ResponsivePanel open={true} onClose={onClose} className={panelClassName}>
      <SharedDetailContent entry={entry} onLeave={onLeave} />
    </ResponsivePanel>
  )
}
