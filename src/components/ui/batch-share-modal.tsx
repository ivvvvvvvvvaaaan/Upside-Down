'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { Modal } from './modal'
import { Card } from './card'
import { Input } from './input'
import { Button } from './button'
import { Select } from './select'
import { Avatar } from './avatar'
import { useAccess, usePersona } from '@/hooks'
import type { AccessProfileId, PrincipalRef } from '@/hooks/useAccess'
import { getRoleGroup } from '@/lib/grants'
import type { SelectionEntity } from '@/lib/selection-actions'
import { buildShareSearchResults } from '@/lib/share-search'

interface BatchShareModalProps {
  open: boolean
  onClose: () => void
  selectedEntities: SelectionEntity[]
  allowedProfiles: AccessProfileId[]
}

function roleOptions(allowedProfiles: AccessProfileId[], allProfiles: ReturnType<typeof useAccess>['roleGroups']) {
  return allowedProfiles
    .filter((profileId) => profileId !== 'owner' && profileId !== 'link-viewer')
    .map((profileId) => ({
      value: profileId,
      label: getRoleGroup(allProfiles, profileId)?.name ?? profileId,
    }))
}

export function BatchShareModal({
  open,
  onClose,
  selectedEntities,
  allowedProfiles,
}: BatchShareModalProps) {
  const { activePersona } = usePersona()
  const { roleGroups, getResourceGrants, createGrant } = useAccess()
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [addAsRole, setAddAsRole] = useState<AccessProfileId>('viewer')
  const [appliedRecipients, setAppliedRecipients] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectableRoleOptions = useMemo(() => roleOptions(allowedProfiles, roleGroups), [allowedProfiles, roleGroups])

  const fullyGrantedUserIds = useMemo(() => {
    const resourceGrantSets = selectedEntities.map((entity) => new Set(
      getResourceGrants(entity.resourceRef.id)
        .filter((grant): grant is typeof grant & { principal: { type: 'user'; userId: string } } => grant.principal.type === 'user')
        .map((grant) => grant.principal.userId),
    ))

    if (resourceGrantSets.length === 0) return new Set<string>()

    const [first, ...rest] = resourceGrantSets
    return new Set(Array.from(first).filter((userId) => rest.every((set) => set.has(userId))))
  }, [selectedEntities, getResourceGrants])

  const fullyGrantedTeamIds = useMemo(() => {
    const resourceGrantSets = selectedEntities.map((entity) => new Set(
      getResourceGrants(entity.resourceRef.id)
        .filter((grant): grant is typeof grant & { principal: { type: 'team'; teamId: string } } => grant.principal.type === 'team')
        .map((grant) => grant.principal.teamId),
    ))

    if (resourceGrantSets.length === 0) return new Set<string>()

    const [first, ...rest] = resourceGrantSets
    return new Set(Array.from(first).filter((teamId) => rest.every((set) => set.has(teamId))))
  }, [selectedEntities, getResourceGrants])

  const results = useMemo(() => buildShareSearchResults({
    query,
    activeUserId: activePersona?.id,
    existingUserIds: fullyGrantedUserIds,
    existingTeamIds: fullyGrantedTeamIds,
  }), [query, activePersona, fullyGrantedUserIds, fullyGrantedTeamIds])

  useEffect(() => {
    if (selectableRoleOptions.some((option) => option.value === addAsRole)) return
    if (selectableRoleOptions[0]) {
      setAddAsRole(selectableRoleOptions[0].value as AccessProfileId)
    }
  }, [selectableRoleOptions, addAsRole])

  useEffect(() => {
    if (!showDropdown) return
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setShowDropdown(false)
      setAppliedRecipients([])
    }
  }, [open])

  const handleAddPrincipal = (result: ReturnType<typeof buildShareSearchResults>[number]) => {
    let appliedCount = 0

    for (const entity of selectedEntities) {
      const alreadyGranted = getResourceGrants(entity.resourceRef.id).some((grant) => (
        grant.principal.type === result.principal.type &&
        (
          (grant.principal.type === 'user' && result.principal.type === 'user' && grant.principal.userId === result.principal.userId) ||
          (grant.principal.type === 'team' && result.principal.type === 'team' && grant.principal.teamId === result.principal.teamId)
        )
      ))

      if (alreadyGranted) continue
      createGrant(entity.resourceRef, result.principal as PrincipalRef, addAsRole)
      appliedCount += 1
    }

    if (appliedCount > 0) {
      const roleLabel = getRoleGroup(roleGroups, addAsRole)?.name ?? addAsRole
      setAppliedRecipients((prev) => [`${result.name} added as ${roleLabel} on ${appliedCount} item${appliedCount === 1 ? '' : 's'}.`, ...prev].slice(0, 3))
    }

    setQuery('')
    setShowDropdown(false)
  }

  const selectionLabel = selectedEntities[0]?.kind === 'folder'
    ? 'folders'
    : selectedEntities[0]?.kind === 'asset'
      ? 'items'
      : 'collections'

  return (
    <Modal open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} size="sm">
      <Modal.Header title={`Share ${selectedEntities.length} ${selectionLabel}`} />
      <Modal.Body>
        <div className="space-y-4">
          <p className="text-body-0-regular text-foreground-dim">
            Add the same people or access groups to all selected items.
          </p>

          <div className="flex items-start gap-2">
            <div ref={dropdownRef} className="relative flex-1">
              <Input
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => query.trim() && setShowDropdown(true)}
                placeholder="Add people or access groups..."
                icon={<Search className="w-4 h-4" />}
                iconPosition="left"
              />
              {showDropdown && query.trim() && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-surface-1 border border-border-dim rounded shadow-lg z-50 max-h-[240px] overflow-y-auto">
                  {results.map((result) => (
                    <button
                      key={result.key}
                      onClick={() => handleAddPrincipal(result)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                    >
                      {result.kind === 'user' ? (
                        <Avatar name={result.name} size="sm" />
                      ) : (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center bg-surface-3 text-foreground-dim flex-shrink-0">
                          <Users className="w-3 h-3" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <span className="text-body-0-regular text-foreground truncate block">{result.name}</span>
                        <span className="text-body-0-regular text-foreground-dim truncate block">{result.subtitle}</span>
                      </div>
                    </button>
                  ))}
                  {results.length === 0 && (
                    <div className="px-3 py-2 text-body-0-regular text-foreground-dim">No matches</div>
                  )}
                </div>
              )}
            </div>
            <Select
              options={selectableRoleOptions}
              value={addAsRole}
              onChange={(value) => setAddAsRole(value as AccessProfileId)}
              className="w-auto flex-shrink-0"
            />
          </div>

          {appliedRecipients.length > 0 && (
            <div className="space-y-1">
              {appliedRecipients.map((message) => (
                <p key={message} className="text-body-0-regular text-foreground">
                  {message}
                </p>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
      <Card.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Card.Footer>
    </Modal>
  )
}
