'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from './button'
import { AccessModal } from './access-modal'
import { useAccess } from '@/hooks'
import type { ResourceRef, Grant } from '@/lib/grants'
import { profileLabel } from '@/lib/grants'
import { PERSONAS } from '@/lib/personas'
import { TEAMS } from '@/lib/teams'

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
  const { getResourceGrants, roleGroups } = useAccess()

  const grants = getResourceGrants(resourceId)

  const grantRows = grants.map((grant) => {
    let name: string
    const principal = grant.principal
    if (principal.type === 'user') {
      const persona = PERSONAS.find((p) => p.id === principal.userId)
      name = persona?.name ?? principal.userId
    } else {
      const team = TEAMS.find((t) => t.id === principal.teamId)
      name = team?.name ?? principal.teamId
    }
    const role = profileLabel(grant.templateId, roleGroups)
    return { id: grant.id, name, role }
  })

  const visibleRows = grantRows.slice(0, 4)
  const inheritedCount = inheritedGrants?.length ?? 0

  return (
    <>
      <section className="space-y-2">
        <h3 className="text-label-0-bold uppercase text-foreground-dim">Access</h3>
        <div className="space-y-1">
          {visibleRows.length === 0 && inheritedCount === 0 && (
            <p className="text-label-1-regular text-foreground-dim">Not shared</p>
          )}
          {visibleRows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-2 py-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
                <span className="text-body-0-regular text-foreground truncate">{row.name}</span>
              </div>
              <span className="text-label-0-regular text-foreground-dim flex-shrink-0">{row.role}</span>
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
