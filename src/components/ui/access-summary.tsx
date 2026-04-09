'use client'

import { useState } from 'react'
import { Button } from './button'
import { Avatar } from './avatar'
import { DepartmentAvatar } from './department-avatar'
import { AccessModal } from './access-modal'
import { useAccess, usePersona } from '@/hooks'
import { useShareAsCollection } from '@/hooks/useShareAsCollection'
import type { ResourceRef, Grant } from '@/lib/grants'
import { buildAccessDisplayEntries } from './access-display'

interface AccessSummaryProps {
  resourceId: string
  resourceRef?: ResourceRef
  inheritedGrants?: { grant: Grant; fromResourceName: string }[]
  resourceName?: string
}

export function AccessSummary({
  resourceId,
  resourceRef,
  inheritedGrants,
  resourceName,
}: AccessSummaryProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTarget, setModalTarget] = useState<{ resourceId: string; resourceRef?: ResourceRef; title?: string } | null>(null)
  const { activePersona, isAdmin } = usePersona()
  const { getResourceGrants, roleGroups, canShare } = useAccess()
  const { resolveShareTarget } = useShareAsCollection()

  const grants = getResourceGrants(resourceId)

  const openModal = () => {
    // Resolve folder → collection only when the user clicks, not on render
    if (resourceRef?.type === 'folder' && resourceName) {
      const resolved = resolveShareTarget(resourceRef, resourceName)
      setModalTarget({ resourceId: resolved.resourceRef.id, resourceRef: resolved.resourceRef as ResourceRef, title: resolved.name })
    } else {
      setModalTarget({ resourceId, resourceRef, title: resourceName })
    }
    setModalOpen(true)
  }

  const effectiveRows = buildAccessDisplayEntries(
    [
      ...grants.map((grant) => ({
        key: `direct-${grant.id}`,
        grant,
      })),
      ...(inheritedGrants ?? []).map(({ grant, fromResourceName }) => ({
        key: `inherited-${grant.id}-${fromResourceName}`,
        grant,
        sourceName: fromResourceName,
      })),
    ],
    roleGroups,
    activePersona?.id,
  )

  return (
    <>
      <section className="space-y-2">
        <div className="space-y-1">
          {effectiveRows.length === 0 && (
            <p className="text-body-0-regular text-foreground-dim">Not shared</p>
          )}
          {effectiveRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-2 py-0.5">
              <div className="flex items-center gap-2 min-w-0">
                {row.principalType === 'team' ? (
                  <DepartmentAvatar departmentId={row.departmentId} size="compact" />
                ) : (
                  <Avatar name={row.name} size="compact" />
                )}
                <div className="min-w-0">
                  <span className="text-body-0-regular text-foreground truncate block">{row.name}</span>
                  {row.subtitle && (
                    <span className="text-body-0-regular text-foreground-dim truncate block">{row.subtitle}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-1.5 justify-end flex-shrink-0 text-body-0-regular text-foreground-dim">
                <span>{row.roleLabel}</span>
                {row.grant.allowUpload && <span>Uploads</span>}
                {row.grant.shareMode === 'live' && <span>Include new</span>}
              </div>
            </div>
          ))}
        </div>
        {(isAdmin || (resourceRef && canShare(resourceRef))) && (
          <Button
            variant="secondary"
            compact
            onClick={openModal}
          >
            Manage Access
          </Button>
        )}
      </section>

      {modalTarget && (
        <AccessModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          resourceId={modalTarget.resourceId}
          resourceRef={modalTarget.resourceRef}
          inheritedGrants={resourceRef?.type === 'folder' ? undefined : inheritedGrants}
          title={modalTarget.title}
        />
      )}
    </>
  )
}
