'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Users, Search, Info, Link2, Lock } from 'lucide-react'
import { Input } from './input'
import { Select } from './select'
import { Button } from './button'
import { Avatar } from './avatar'
import { useAccess, usePersona } from '@/hooks'
import type { Grant, AccessProfileId, ResourceRef, PrincipalRef } from '@/hooks/useAccess'
import { PERSONAS } from '@/lib/personas'
import { getRoleGroup } from '@/lib/grants'
import type { RoleGroup } from '@/lib/grants'
import { TEAMS } from '@/lib/teams'
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

type SearchResult = {
  key: string
  principal: PrincipalRef
  name: string
  subtitle: string
  kind: 'user' | 'team'
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
  const { getResourceGrants, createGrant, revokeGrant, updateGrantProfile, roleGroups, canShare, canEditAcl, getGrantableProfiles, getResourceGuestLinks, createGuestLink, revokeGuestLink } = useAccess()
  const { activePersona } = usePersona()
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [addAsRole, setAddAsRole] = useState<AccessProfileId>('viewer')
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkDownload, setLinkDownload] = useState(false)
  const [linkPasscode, setLinkPasscode] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const grants = getResourceGrants(resourceId)
  const canAddGrants = Boolean(resourceRef) && canShare(resourceRef)
  const canManageExistingGrants = Boolean(resourceRef) && canEditAcl(resourceRef)
  const grantsReadOnly = readOnly || !canManageExistingGrants
  const addRoleOptions = useMemo(() => {
    if (!resourceRef) return roleGroupOptions(roleGroups)
    const allowedProfiles = new Set(getGrantableProfiles(resourceRef))
    return roleGroupOptions(roleGroups).filter((option) => allowedProfiles.has(option.value as AccessProfileId))
  }, [resourceRef, roleGroups, getGrantableProfiles])

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

  useEffect(() => {
    if (addRoleOptions.some((option) => option.value === addAsRole)) return
    if (addRoleOptions[0]) {
      setAddAsRole(addRoleOptions[0].value as AccessProfileId)
    }
  }, [addRoleOptions, addAsRole])

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const existingUserIds = new Set(
      grants
        .filter((grant): grant is Grant & { principal: { type: 'user'; userId: string } } => grant.principal.type === 'user')
        .map((grant) => grant.principal.userId),
    )
    const existingGroupIds = new Set(
      grants
        .filter((grant): grant is Grant & { principal: { type: 'team'; teamId: string } } => grant.principal.type === 'team')
        .map((grant) => grant.principal.teamId),
    )

    const userResults: SearchResult[] = PERSONAS
      .filter((persona) =>
        persona.id !== activePersona?.id &&
        !existingUserIds.has(persona.id) &&
        (
          persona.name.toLowerCase().includes(q) ||
          persona.email.toLowerCase().includes(q)
        ),
      )
      .map((persona) => ({
        key: `user-${persona.id}`,
        principal: { type: 'user', userId: persona.id },
        name: persona.name,
        subtitle: persona.email,
        kind: 'user',
      }))

    const teamResults: SearchResult[] = TEAMS
      .filter((team) =>
        !existingGroupIds.has(team.id) &&
        !team.departmentId &&
        team.name.toLowerCase().includes(q),
      )
      .map((team) => ({
        key: `team-${team.id}`,
        principal: { type: 'team', teamId: team.id },
        name: team.name,
        subtitle: `${team.memberUserIds.length} ${team.memberUserIds.length === 1 ? 'member' : 'members'}`,
        kind: 'team',
      }))

    return [...userResults, ...teamResults].slice(0, 8)
  }, [query, activePersona, grants])

  const hasResults = results.length > 0

  const handleAddPrincipal = (principal: PrincipalRef) => {
    if (!resourceRef || !canAddGrants) return
    if (principal.type === 'user' && principal.userId === activePersona?.id) return
    if (principal.type === 'user' && grants.some((grant) => grant.principal.type === 'user' && grant.principal.userId === principal.userId)) return
    if (principal.type === 'team' && grants.some((grant) => grant.principal.type === 'team' && grant.principal.teamId === principal.teamId)) return
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
  const teamEntries = useMemo(() =>
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
      {!readOnly && resourceRef && canAddGrants && addRoleOptions.length > 0 && (
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
                {results.map((result) => (
                  <button
                    key={result.key}
                    onClick={() => handleAddPrincipal(result.principal)}
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
                {!hasResults && (
                  <div className="px-3 py-2 text-body-0-regular text-foreground-dim">No matches</div>
                )}
              </div>
            )}
          </div>
          <Select
            options={addRoleOptions}
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

      {/* Teams */}
      {teamEntries.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-label-1-bold text-foreground-dim">Teams</h3>
          <div className="space-y-0">
            {teamEntries.map((entry) => (
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

      {/* Guest Links */}
      {(() => {
        const links = getResourceGuestLinks(resourceId)
        const hasLink = links.length > 0

        if (hasLink) {
          return (
            <div className="space-y-2">
              {links.map(link => (
                <div key={link.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link2 className="w-4 h-4 text-foreground-dim flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-body-0-regular text-foreground truncate block">
                        Guest link · {link.allowDownload ? 'View + Download' : 'View only'}
                      </span>
                      <span className="text-label-0-regular text-foreground-dim truncate block">
                        Expires {new Date(link.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {link.passcode && ' · Passcode protected'}
                      </span>
                    </div>
                  </div>
                  {!readOnly && canAddGrants && (
                    <Button
                      variant="secondary"
                      compact
                      onClick={() => revokeGuestLink(link.id)}
                      className="text-foreground-negative flex-shrink-0"
                    >
                      Revoke link
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )
        }

        if (showLinkForm && resourceRef) {
          return (
            <div className="rounded-lg bg-surface-3/40 p-3 space-y-3">
              <p className="text-body-0-bold text-foreground">Create guest link</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-body-0-regular text-foreground cursor-pointer">
                  <input type="checkbox" checked={linkDownload} onChange={e => setLinkDownload(e.target.checked)} className="rounded" />
                  Allow download
                </label>
                <label className="flex items-center gap-2 text-body-0-regular text-foreground cursor-pointer">
                  <input type="checkbox" checked={linkPasscode} onChange={e => setLinkPasscode(e.target.checked)} className="rounded" />
                  Require passcode
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" compact onClick={() => setShowLinkForm(false)}>
                  Cancel
                </Button>
                <Button
                  compact
                  onClick={() => {
                    createGuestLink(resourceRef, { allowDownload: linkDownload, passcode: linkPasscode, expiresInDays: 7 })
                    setShowLinkForm(false)
                    setLinkDownload(false)
                    setLinkPasscode(false)
                  }}
                >
                  Create link
                </Button>
              </div>
            </div>
          )
        }

        if (!readOnly && canAddGrants) {
          return (
            <Button
              variant="secondary"
              compact
              onClick={() => setShowLinkForm(true)}
              icon={<Link2 className="w-3.5 h-3.5" />}
            >
              Create guest link
            </Button>
          )
        }

        return null
      })()}

      {userEntries.length === 0 && teamEntries.length === 0 && getResourceGuestLinks(resourceId).length === 0 && !showLinkForm && (
        <p className="text-body-0-regular text-foreground-dim">Not shared</p>
      )}
    </div>
  )
}
