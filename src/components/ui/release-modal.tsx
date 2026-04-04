'use client'

import { useState, useMemo, useEffect } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { useAccess } from '@/hooks'
import { cn } from '@/lib/utils'
import { getReleaseDomainsByGroup, deriveReleasedDomains } from '@/lib/release'
import type { SeedCut } from '@/lib/scenario'

interface ReleaseModalProps {
  open: boolean
  onClose: () => void
  cut: SeedCut | null
}

export function ReleaseModal({ open, onClose, cut }: ReleaseModalProps) {
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null)
  const { grants, createGrant, revokeGrant, getResourceGrants } = useAccess()

  // Domains applicable to cuts, grouped by tier
  const domainGroups = useMemo(() => getReleaseDomainsByGroup('cut'), [])
  const allDomains = useMemo(() => domainGroups.flatMap(g => g.domains), [domainGroups])

  const currentlyReleased = useMemo(() => {
    if (!cut) return new Set<string>()
    return new Set(deriveReleasedDomains(cut.id, grants).map(d => d.id))
  }, [cut, grants])

  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelected(new Set(currentlyReleased))
  }, [currentlyReleased])

  const toggle = (domainId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(domainId)) next.delete(domainId)
      else next.add(domainId)
      return next
    })
  }

  const hasChanges = useMemo(() => {
    if (selected.size !== currentlyReleased.size) return true
    return Array.from(selected).some(id => !currentlyReleased.has(id))
  }, [selected, currentlyReleased])

  const handleRelease = () => {
    if (!cut) return
    const resource = { id: cut.id, type: 'cut' as const, departmentId: 'editorial' as const }

    // For each newly selected domain, create grants for its grantee teams
    for (const domain of allDomains) {
      if (selected.has(domain.id) && !currentlyReleased.has(domain.id)) {
        for (const teamId of domain.granteeTeamIds) {
          createGrant(resource, { type: 'team', teamId }, domain.defaultProfile)
        }
      }
    }

    // For each deselected domain, revoke grants for its grantee teams
    const cutGrants = getResourceGrants(cut.id)
    for (const domain of allDomains) {
      if (!selected.has(domain.id) && currentlyReleased.has(domain.id)) {
        for (const teamId of domain.granteeTeamIds) {
          const grant = cutGrants.find(
            g => g.principal.type === 'team' && g.principal.teamId === teamId,
          )
          if (grant) revokeGrant(grant.id)
        }
      }
    }

    onClose()
  }

  if (!cut) return null

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} width={460}>
      <div className="flex flex-col">
        <Modal.Header
          title={`Release ${cut.name}`}
        />

        <div className="px-6 pb-4 space-y-4">
          {domainGroups.map(({ group, domains }) => (
            <div key={group} className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-label-1-bold text-foreground-dim">Release to {group}</h3>
              </div>
              {domains.map(domain => {
                const isSelected = selected.has(domain.id)
                const wasReleased = currentlyReleased.has(domain.id)
                const hasGrantees = domain.granteeTeamIds.length > 0
                const isConfirmingRevoke = revokeConfirm === domain.id

                if (wasReleased) {
                  return (
                    <div
                      key={domain.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                        isConfirmingRevoke ? 'bg-red-500/10' : 'bg-indigo-500/5',
                      )}
                    >
                      <span className="text-body-0-regular text-foreground flex-1 truncate">{domain.name}</span>
                      {isConfirmingRevoke ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-label-0-regular text-foreground-dim">Revoke access?</span>
                          <Button variant="secondary" compact onClick={() => { toggle(domain.id); setRevokeConfirm(null) }}>
                            Yes
                          </Button>
                          <Button variant="secondary" compact onClick={() => setRevokeConfirm(null)}>
                            No
                          </Button>
                        </div>
                      ) : isSelected ? (
                        <button
                          onClick={() => setRevokeConfirm(domain.id)}
                          className="text-label-0-regular text-foreground-dim hover:text-foreground-negative transition-colors flex-shrink-0"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-label-0-bold text-foreground-negative flex-shrink-0">Revoking</span>
                      )}
                    </div>
                  )
                }

                return (
                  <button
                    key={domain.id}
                    onClick={() => toggle(domain.id)}
                    disabled={!hasGrantees}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                      !hasGrantees && 'opacity-40 cursor-not-allowed',
                      hasGrantees && isSelected && 'bg-indigo-500/10',
                      hasGrantees && !isSelected && 'hover:bg-surface-2',
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-sm border flex items-center justify-center transition-colors flex-shrink-0',
                      isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-border-subtle',
                    )}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <span className="text-body-0-regular text-foreground flex-1 truncate">{domain.name}</span>

                    {!hasGrantees && (
                      <span className="text-label-0-regular text-foreground-dim">No recipients</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border-dim">
          <span className="text-label-0-regular text-foreground-dim">
            {Array.from(selected).filter(id => allDomains.find(d => d.id === id)?.granteeTeamIds.length).length} of {allDomains.filter(d => d.granteeTeamIds.length > 0).length} domains
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleRelease} disabled={!hasChanges}>
              {Array.from(selected).some(id => !currentlyReleased.has(id)) ? 'Release' : 'Update'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
