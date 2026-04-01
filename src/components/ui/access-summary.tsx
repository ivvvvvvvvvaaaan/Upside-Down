'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from './button'
import { AccessModal } from './access-modal'
import { useAccess, usePersona } from '@/hooks'
import type { ResourceRef, Grant } from '@/lib/grants'
import { profileLabel } from '@/lib/grants'
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
  const { activePersona } = usePersona()
  const { getResourceGrants, roleGroups, describeMyAccess } = useAccess()

  const grants = getResourceGrants(resourceId)
  const accessRoute = resourceRef ? describeMyAccess(resourceRef) : null

  const grantRows = buildAccessDisplayEntries(
    grants.map((grant) => ({
      key: grant.id,
      grant,
    })),
    roleGroups,
    activePersona?.id,
  )

  const visibleRows = grantRows.slice(0, 4)
  const inheritedCount = inheritedGrants?.length ?? 0

  return (
    <>
      <section className="space-y-2">
        <h3 className="text-label-0-bold uppercase text-foreground-dim">Access</h3>
        <div className="space-y-2">
          {accessRoute && (
            <div className="rounded-lg border border-border-dim bg-surface-1 px-3 py-2">
              <p className="text-label-0-regular text-foreground-dim">Your access</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-body-0-regular text-foreground truncate">Via {accessRoute.viaLabel}</p>
                <span className="text-label-0-regular text-foreground-dim flex-shrink-0">
                  {profileLabel(accessRoute.templateId, roleGroups)}
                </span>
              </div>
              {accessRoute.detail && (
                <p className="mt-1 text-label-0-regular text-foreground-dim">{accessRoute.detail}</p>
              )}
            </div>
          )}
          <div className="space-y-1">
            {visibleRows.length === 0 && inheritedCount === 0 && (
              <p className="text-label-1-regular text-foreground-dim">Not shared</p>
            )}
            {visibleRows.map((row) => (
              <div key={row.key} className="flex items-start justify-between gap-2 py-0.5">
                <div className="flex items-start gap-2 min-w-0">
                  <Users className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-body-0-regular text-foreground truncate block">{row.name}</span>
                    {row.subtitle && (
                      <span className="text-label-0-regular text-foreground-dim truncate block">{row.subtitle}</span>
                    )}
                  </div>
                </div>
                <span className="text-label-0-regular text-foreground-dim flex-shrink-0">{row.roleLabel}</span>
              </div>
            ))}
            {grantRows.length > 4 && (
              <p className="text-label-0-regular text-foreground-dim">
                + {grantRows.length - 4} more
              </p>
            )}
            {inheritedCount > 0 && (
              <p className="text-label-0-regular text-foreground-dim">
                + {inheritedCount} inherited
              </p>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          compact
          className="w-full"
          onClick={() => setModalOpen(true)}
        >
          Manage Access
        </Button>
      </section>

      <AccessModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        resourceId={resourceId}
        resourceRef={resourceRef}
        inheritedGrants={inheritedGrants}
        title={resourceName}
      />
    </>
  )
}
