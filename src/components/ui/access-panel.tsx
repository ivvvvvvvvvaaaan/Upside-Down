'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Users, Search, Info } from 'lucide-react'
import { Input } from './input'
import { Select } from './select'
import { Button } from './button'
import { Avatar } from './avatar'
import { cn } from '@/lib/utils'
import { useAccess, usePersona } from '@/hooks'
import type { Grant, AccessProfileId, ResourceRef, PrincipalRef } from '@/hooks/useAccess'
import { PERSONAS, initials } from '@/lib/personas'
import { TEAMS } from '@/lib/teams'
import { getRoleGroup } from '@/lib/grants'
import type { RoleGroup } from '@/lib/grants'
import { buildAccessDisplayEntries } from './access-display'
import type { AccessDisplayEntry } from './access-display'

interface AccessPanelProps {
  resourceId: string
  resourceRef?: ResourceRef
  readOnly?: boolean
  emptyLabel?: string
  inheritedGrants?: { grant: Grant; fromResourceName: string }[]
}

function roleGroupOptions(roleGroups: RoleGroup[]) {
  return roleGroups
    .filter((rg) => rg.id !== 'owner' && rg.id !== 'link-viewer')
    .map((rg) => ({ value: rg.id, label: rg.name }))
}

function GrantRow({ grant, readOnly, roleGroups, onRemove, onUpdateProfile, sourceName, name, subtitle, roleLabel, members }: {
  grant: Grant
  readOnly: boolean
  roleGroups: RoleGroup[]
  onRemove?: (grantId: string) => void
  onUpdateProfile?: (grantId: string, profileId: AccessProfileId) => void
  sourceName?: string
  name: string
  subtitle?: string
  roleLabel: string
  members?: AccessDisplayEntry['members']
}) {
  const isOwner = grant.templateId === 'owner'
  const principal = grant.principal

  return (
    <div className="py-1.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {principal.type === 'user' ? (
            <Avatar name={name} size="sm" />
          ) : (
            <span className="w-6 h-6 rounded-full flex items-center justify-center bg-surface-3 text-foreground-dim flex-shrink-0">
              <Users className="w-3 h-3" />
            </span>
          )}
          <div className="min-w-0">
            <span className="text-body-0-regular text-foreground truncate block">{name}</span>
            {subtitle && (
              <span className="text-body-0-regular text-foreground-dim truncate block">{subtitle}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!readOnly && onUpdateProfile ? (
            <>
              {isOwner ? (
                <span className="text-body-0-regular text-foreground-dim px-2 py-1">
                  {getRoleGroup(roleGroups, grant.templateId ?? 'owner')?.name ?? 'Owner'}
                </span>
              ) : (
                <Select
                  options={roleGroupOptions(roleGroups)}
                  value={grant.templateId ?? 'viewer'}
                  onChange={(value) => onUpdateProfile(grant.id, value as AccessProfileId)}
                  size="compact"
                  borderless
                  className="w-auto flex-shrink-0"
                />
              )}
              {!isOwner && onRemove && (
                <Button variant="icon" size="compact-icon" onClick={() => onRemove(grant.id)}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </>
          ) : (
            <span className="text-body-0-regular text-foreground-dim px-2 py-1">
              {roleLabel}
            </span>
          )}
        </div>
      </div>
      {principal.type === 'team' && members && members.length > 0 && (
        <div className="relative ml-1 pt-1">
          {members.map((member, i) => (
            <div key={member.id} className="relative flex items-center justify-between gap-2 py-1 pl-4">
              {/* Vertical trunk: top half always, bottom half except last */}
              <div className="absolute left-1.5 top-0 h-1/2 border-l border-border-dim" />
              {i < members.length - 1 && (
                <div className="absolute left-1.5 top-1/2 bottom-0 border-l border-border-dim" />
              )}
              {/* Horizontal branch */}
              <div className="absolute left-1.5 top-1/2 w-2.5 border-t border-border-dim" />
              <div className="flex items-center gap-2 min-w-0">
                <Avatar name={member.name} size="compact" />
                <div className="min-w-0">
                  <span className="text-body-0-regular text-foreground truncate block">
                    {member.name}
                  </span>
                  {member.email && (
                    <span className="text-body-0-regular text-foreground-dim truncate block">{member.email}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!readOnly && member.grantId && onUpdateProfile ? (
                  <>
                    <Select
                      options={roleGroupOptions(roleGroups)}
                      value={member.roleValue ?? 'viewer'}
                      onChange={(value) => onUpdateProfile(member.grantId!, value as AccessProfileId)}
                      size="compact"
                      borderless
                      className="w-auto flex-shrink-0"
                    />
                    {onRemove && (
                      <Button variant="icon" size="compact-icon" onClick={() => onRemove(member.grantId!)}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </>
                ) : member.roleLabel ? (
                  <span className="text-body-0-regular text-foreground-dim flex-shrink-0">{member.roleLabel}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AccessPanel({ resourceId, resourceRef, readOnly = false, emptyLabel = 'Not shared', inheritedGrants }: AccessPanelProps) {
  const { getResourceGrants, createGrant, revokeGrant, updateGrantProfile, roleGroups, canShare, canEditAcl } = useAccess()
  const { activePersona } = usePersona()
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [addAsRole, setAddAsRole] = useState<AccessProfileId>('viewer')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const grants = getResourceGrants(resourceId)
  const canAddGrants = Boolean(resourceRef) && canShare(resourceRef)
  const canManageExistingGrants = Boolean(resourceRef) && canEditAcl(resourceRef)
  const grantsReadOnly = readOnly || !canManageExistingGrants

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDropdown) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  // Search results: people + teams
  const results = useMemo(() => {
    if (!query.trim()) return { people: [], teams: [] }
    const q = query.toLowerCase()
    const people = PERSONAS.filter(p =>
      p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    ).slice(0, 5)
    const teams = TEAMS.filter(t =>
      t.name.toLowerCase().includes(q)
    ).slice(0, 3)
    return { people, teams }
  }, [query])

  const hasResults = results.people.length > 0 || results.teams.length > 0

  const handleAddUser = (userId: string) => {
    if (!resourceRef || !canAddGrants) return
    if (grants.some(g => g.principal.type === 'user' && g.principal.userId === userId)) return
    const principal: PrincipalRef = { type: 'user', userId }
    createGrant(resourceRef, principal, addAsRole)
    setQuery('')
    setShowDropdown(false)
  }

  const handleAddTeam = (teamId: string) => {
    if (!resourceRef || !canAddGrants) return
    if (grants.some(g => g.principal.type === 'team' && g.principal.teamId === teamId)) return
    const principal: PrincipalRef = { type: 'team', teamId }
    createGrant(resourceRef, principal, addAsRole)
    setQuery('')
    setShowDropdown(false)
  }

  const allEntries = useMemo(() => {
    const directRaw = grants.map((grant) => ({
      key: `direct-${grant.id}`,
      grant,
      readOnly: grantsReadOnly,
      sourceName: undefined as string | undefined,
    }))

    const inheritedRaw = (inheritedGrants ?? []).map(({ grant, fromResourceName }) => ({
      key: `inherited-${grant.id}-${fromResourceName}`,
      grant,
      readOnly: true,
      sourceName: fromResourceName,
    }))

    return buildAccessDisplayEntries(
      [...directRaw, ...inheritedRaw],
      roleGroups,
      activePersona?.id,
    )
  }, [grants, grantsReadOnly, inheritedGrants, roleGroups, activePersona])

  const directEntries = useMemo(() => allEntries.filter(e => !e.sourceName), [allEntries])
  const inheritedEntries = useMemo(() => allEntries.filter(e => !!e.sourceName), [allEntries])

  const userEntries = useMemo(() =>
    [...directEntries, ...inheritedEntries].filter(e => e.grant.principal.type === 'user'),
    [directEntries, inheritedEntries],
  )
  const groupEntries = useMemo(() =>
    [...directEntries, ...inheritedEntries].filter(e => e.grant.principal.type === 'team'),
    [directEntries, inheritedEntries],
  )

  return (
    <div className="space-y-4">
      {/* Permission hints */}
      {!readOnly && !canAddGrants && !canManageExistingGrants && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-surface-mid text-body-0-regular text-foreground">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>You don&apos;t have permission to manage access</span>
        </div>
      )}
      {!readOnly && canAddGrants && !canManageExistingGrants && (
        <p className="text-body-0-regular text-foreground">You can add new shares, but only people with admin access can change or remove existing entries</p>
      )}

      {/* Search row: input + role dropdown */}
      {!readOnly && resourceRef && canAddGrants && (
        <div className="flex items-start gap-2">
          <div ref={dropdownRef} className="relative flex-1">
            <Input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
              onFocus={() => query.trim() && setShowDropdown(true)}
              placeholder="Add people or teams..."
              icon={<Search className="w-4 h-4" />}
              iconPosition="left"
            />
            {showDropdown && query.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface-1 border border-border-dim rounded shadow-lg z-50 max-h-[240px] overflow-y-auto">
                {results.people.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddUser(p.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                  >
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0">
                      <span className="text-body-0-regular text-foreground truncate block">{p.name}</span>
                      <span className="text-body-0-regular text-foreground-dim truncate block">{p.email}</span>
                    </div>
                  </button>
                ))}
                {results.teams.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleAddTeam(t.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-surface-3 text-foreground-dim flex items-center justify-center flex-shrink-0">
                      <Users className="w-3 h-3" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-body-0-regular text-foreground truncate block">{t.name}</span>
                      <span className="text-body-0-regular text-foreground-dim truncate block">{t.memberUserIds.length} members</span>
                    </div>
                  </button>
                ))}
                {!hasResults && (
                  <div className="px-3 py-2 text-body-0-regular text-foreground-dim">No matches</div>
                )}
              </div>
            )}
          </div>
          <Select
            options={roleGroupOptions(roleGroups)}
            value={addAsRole}
            onChange={(value) => setAddAsRole(value as AccessProfileId)}
            className="w-auto flex-shrink-0"
          />
        </div>
      )}

      {/* Users */}
      {userEntries.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-label-1-bold text-foreground-dim">Users</h3>
          <div className="space-y-0">
            {userEntries.map((entry) => (
              <GrantRow
                key={entry.key}
                grant={entry.grant}
                readOnly={entry.readOnly}
                roleGroups={roleGroups}
                sourceName={entry.sourceName}
                name={entry.name}
                subtitle={entry.subtitle}
                roleLabel={entry.roleLabel}
                members={entry.members}
                onRemove={!entry.sourceName ? revokeGrant : undefined}
                onUpdateProfile={!entry.sourceName ? updateGrantProfile : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      {groupEntries.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-label-1-bold text-foreground-dim">Groups</h3>
          <div className="space-y-0">
            {groupEntries.map((entry) => (
              <GrantRow
                key={entry.key}
                grant={entry.grant}
                readOnly={entry.readOnly}
                roleGroups={roleGroups}
                sourceName={entry.sourceName}
                name={entry.name}
                subtitle={entry.subtitle}
                roleLabel={entry.roleLabel}
                members={entry.members}
                onRemove={!entry.sourceName ? revokeGrant : undefined}
                onUpdateProfile={!entry.sourceName ? updateGrantProfile : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {userEntries.length === 0 && groupEntries.length === 0 && (
        <p className="text-body-0-regular text-foreground-dim">Not shared</p>
      )}
    </div>
  )
}
