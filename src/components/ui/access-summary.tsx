'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from './button'
import { AccessModal } from './access-modal'
import { useAccess, usePersona } from '@/hooks'
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
  const { activePersona } = usePersona()
  const { getResourceGrants, roleGroups } = useAccess()

  const grants = getResourceGrants(resourceId)

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
        <h3 className="text-body-0-bold text-foreground-dim">Access</h3>
        <div className="space-y-1">
          {effectiveRows.length === 0 && (
            <p className="text-body-0-regular text-foreground-dim">Not shared</p>
          )}
          {effectiveRows.map((row) => (
            <div key={row.key} className="flex items-start justify-between gap-2 py-0.5">
              <div className="flex items-start gap-2 min-w-0">
                <Users className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-body-0-regular text-foreground truncate block">{row.name}</span>
                  {row.subtitle && (
                    <span className="text-body-0-regular text-foreground-dim truncate block">{row.subtitle}</span>
                  )}
                </div>
              </div>
              <span className="text-body-0-regular text-foreground-dim flex-shrink-0">{row.roleLabel}</span>
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          compact
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
