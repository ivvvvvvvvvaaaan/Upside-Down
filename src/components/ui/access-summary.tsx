'use client'

import { useState } from 'react'
import { Button } from './button'
import { Avatar } from './avatar'
import { DepartmentAvatar, ReleaseDomainAvatar } from './department-avatar'
import { AccessModal } from './access-modal'
import { GrantBadge } from './grant-badge'
import { useAccess, usePersona } from '@/hooks'
import type { ResourceRef, Grant } from '@/lib/grants'
import { isGrantActive } from '@/lib/grants'
import { buildAccessDisplayEntries } from './access-display'
import { FolderAccessSourceRow } from './collection-access-source-row'

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

  const grants = getResourceGrants(resourceId)
  const inheritedFolderSources = new Map<string, { id: string; name: string; grants: Grant[] }>()

  for (const { grant, fromResourceName } of inheritedGrants ?? []) {
    if (!isGrantActive(grant)) continue
    const existing = inheritedFolderSources.get(grant.resource.id)
    if (existing) {
      existing.grants.push(grant)
    } else {
      inheritedFolderSources.set(grant.resource.id, {
        id: grant.resource.id,
        name: fromResourceName,
        grants: [grant],
      })
    }
  }

  const openModal = () => {
    setModalTarget({ resourceId, resourceRef, title: resourceName })
    setModalOpen(true)
  }

  const effectiveRows = buildAccessDisplayEntries(
    grants.map((grant) => ({
      key: `direct-${grant.id}`,
      grant,
    })),
    roleGroups,
    activePersona?.id,
  )
  const inheritedFolderSourceRows = Array.from(inheritedFolderSources.values())
  const hasAccess = effectiveRows.length > 0 || inheritedFolderSourceRows.length > 0

  return (
    <>
      <section className="space-y-2">
        <div className="space-y-1">
          {!hasAccess && (
            <p className="text-body-0-regular text-foreground-dim">Not shared</p>
          )}
          {inheritedFolderSourceRows.map((source) => (
            <FolderAccessSourceRow
              key={source.id}
              name={source.name}
              grants={source.grants}
              roleGroups={roleGroups}
            />
          ))}
          {effectiveRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-2 py-0.5">
              <div className="flex items-center gap-2 min-w-0">
                {row.principalType === 'team' ? (
                  <DepartmentAvatar domainId={row.domainId} size="compact" />
                ) : row.principalType === 'domain' ? (
                  <ReleaseDomainAvatar size="compact" />
                ) : (
                  <Avatar name={row.name} size="compact" />
                )}
                <div className="min-w-0">
                  <span className="text-body-0-regular text-foreground truncate block">{row.name}</span>
                  {row.subtitle && row.subtitle !== row.name && (
                    <span className="text-body-0-regular text-foreground-dim truncate block">{row.subtitle}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <GrantBadge grant={row.grant} roleGroups={roleGroups} />
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
          inheritedGrants={inheritedGrants}
          title={modalTarget.title}
        />
      )}
    </>
  )
}
