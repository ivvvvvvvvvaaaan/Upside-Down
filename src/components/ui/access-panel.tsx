'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Users, Search, Info, Link2, Lock, ChevronDown } from 'lucide-react'
import { Input } from './input'
import { Select } from './select'
import { Button } from './button'
import { Avatar } from './avatar'
import { cn } from '@/lib/utils'
import { useAccess, usePersona } from '@/hooks'
import type { Grant, AccessProfileId, ResourceRef, PrincipalRef } from '@/hooks/useAccess'
import { getRoleGroup } from '@/lib/grants'
import type { RoleGroup } from '@/lib/grants'
import { buildAccessDisplayEntries } from './access-display'
import type { AccessDisplayEntry } from './access-display'
import { buildShareSearchResults } from '@/lib/share-search'

interface AccessPanelProps {
  resourceId: string
  resourceRef?: ResourceRef
  readOnly?: boolean
  emptyLabel?: string
  inheritedGrants?: { grant: Grant; fromResourceName: string }[]
}

function InlineDropdown({ label, options, onSelect }: { label: string; options: string[]; onSelect: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-0.5 text-label-0-regular text-foreground hover:text-foreground-system-link transition-colors"
      >
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-surface-1 border border-border-dim rounded shadow-lg z-50 min-w-[120px]">
          {options.map(option => (
            <button
              key={option}
              onClick={() => { onSelect(option); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-1.5 text-label-0-regular transition-colors',
                option === label ? 'text-foreground' : 'text-foreground-dim hover:text-foreground hover:bg-surface-2',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
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

  const results = useMemo(() => {
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

    return buildShareSearchResults({
      query,
      activeUserId: activePersona?.id,
      existingUserIds,
      existingTeamIds: existingGroupIds,
    })
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

      {/* Links */}
      {(() => {
        const links = getResourceGuestLinks(resourceId)

        if (links.length > 0) {
          return links.map(link => (
            <div key={link.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 className="w-4 h-4 text-foreground-dim flex-shrink-0" />
                  <span className="text-body-0-regular text-foreground truncate">Link</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => navigator.clipboard.writeText(`https://share.example.com/${link.id}`)}
                  >
                    Copy link
                  </Button>
                  {!readOnly && canAddGrants && (
                    <Button
                      variant="secondary"
                      compact
                      onClick={() => revokeGuestLink(link.id)}
                      className="text-foreground-negative"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 pl-6">
                <InlineDropdown
                  label={link.allowDownload ? 'View + Download' : 'View only'}
                  options={['View only', 'View + Download']}
                  onSelect={() => {}}
                />
                <InlineDropdown
                  label="7 days"
                  options={['7 days', '14 days', '30 days']}
                  onSelect={() => {}}
                />
                <InlineDropdown
                  label={link.passcode ? 'Passcode' : 'No passcode'}
                  options={['No passcode', 'Passcode']}
                  onSelect={() => {}}
                />
              </div>
            </div>
          ))
        }

        if (!readOnly && canAddGrants && resourceRef) {
          return (
            <Button
              variant="secondary"
              compact
              onClick={() => createGuestLink(resourceRef, { allowDownload: false, passcode: false, expiresInDays: 7 })}
              icon={<Link2 className="w-3.5 h-3.5" />}
            >
              Create link
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
