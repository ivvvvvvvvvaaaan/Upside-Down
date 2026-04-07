'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Users, Search, Info, Link2 } from 'lucide-react'
import { Input } from './input'
import { Select } from './select'
import { Button } from './button'
import { Avatar } from './avatar'
import { Toggle } from './switch'
import { useAccess, usePersona } from '@/hooks'
import type { Grant, AccessProfileId, ResourceRef, PrincipalRef } from '@/hooks/useAccess'
import { getRoleGroup } from '@/lib/grants'
import type { RoleGroup } from '@/lib/grants'
import { buildAccessDisplayEntries } from './access-display'
import type { AccessDisplayEntry } from './access-display'
import { buildShareSearchResults } from '@/lib/share-search'
import type { GuestLinkSeed } from '@/lib/scenario'

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

function GrantRow({ grant, readOnly, roleGroups, onRemove, onUpdateProfile, name, subtitle, roleLabel, members }: {
  grant: Grant
  readOnly: boolean
  roleGroups: RoleGroup[]
  onRemove?: (grantId: string) => void
  onUpdateProfile?: (grantId: string, profileId: AccessProfileId) => void
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
                  value={grant.templateId ?? 'view'}
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
                      value={member.roleValue ?? 'view'}
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

function GuestLinksSection({
  resourceId,
  resourceRef,
  readOnly,
  canAddGrants,
  getResourceGuestLinks,
  createGuestLink,
  revokeGuestLink,
}: {
  resourceId: string
  resourceRef?: ResourceRef
  readOnly: boolean
  canAddGrants: boolean
  getResourceGuestLinks: (id: string) => GuestLinkSeed[]
  createGuestLink: (resource: ResourceRef, options: { allowDownload: boolean; passcode: boolean; expiresInDays: number }) => void
  revokeGuestLink: (linkId: string) => void
}) {
  const links = getResourceGuestLinks(resourceId)

  if (links.length > 0) {
    return (
      <>
        {links.map(link => (
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
              <span className="text-body-0-regular text-foreground-dim">
                {link.allowDownload ? 'View + Download' : 'View only'}
              </span>
              <span className="text-body-0-regular text-foreground-dim">
                Expires {link.expiresAt}
              </span>
              <span className="text-body-0-regular text-foreground-dim">
                {link.passcode ? 'Passcode required' : 'No passcode'}
              </span>
            </div>
          </div>
        ))}
      </>
    )
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
}

export function AccessPanel({ resourceId, resourceRef, readOnly = false, emptyLabel = 'Not shared', inheritedGrants }: AccessPanelProps) {
  const { getResourceGrants, createGrant, revokeGrant, updateGrantProfile, roleGroups, canShare, canEditAcl, getGrantableProfiles, getResourceGuestLinks, createGuestLink, revokeGuestLink } = useAccess()
  const { activePersona } = usePersona()
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const grants = getResourceGrants(resourceId)
  const canAddGrants = Boolean(resourceRef) && canShare(resourceRef)
  const canManageAllGrants = Boolean(resourceRef) && canEditAcl(resourceRef)

  // Role + expiration — consistent model at every level
  const [addAsRole, setAddAsRole] = useState<AccessProfileId>('view')
  const [expires, setExpires] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(7)

  const addRoleOptions = useMemo(() => {
    if (!resourceRef) return roleGroupOptions(roleGroups)
    const allowedProfiles = new Set(getGrantableProfiles(resourceRef))
    return roleGroupOptions(roleGroups).filter((option) => allowedProfiles.has(option.value as AccessProfileId))
  }, [resourceRef, roleGroups, getGrantableProfiles])

  // Users with 'share' can modify grants they created; 'edit-acl' can modify any grant
  const canManageGrant = (grant: Grant): boolean => {
    if (readOnly) return false
    if (canManageAllGrants) return true
    if (canAddGrants && activePersona && grant.grantedByUserId === activePersona.id) return true
    return false
  }
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

    createGrant(resourceRef, principal, addAsRole, {
      expiresInDays: expires ? expiresInDays : undefined,
    })
    setQuery('')
    setShowDropdown(false)
  }

  const allEntries = useMemo(() => {
    const directRaw = grants.map((grant) => ({
      key: `direct-${grant.id}`,
      grant,
      readOnly: !canManageGrant(grant),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grants, canManageAllGrants, canAddGrants, readOnly, activePersona?.id, inheritedGrants, roleGroups, activePersona])

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
      {!readOnly && !canAddGrants && !canManageAllGrants && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-surface-mid text-body-0-regular text-foreground">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>You don&apos;t have permission to manage access</span>
        </div>
      )}
      {!readOnly && canAddGrants && !canManageAllGrants && (
        <p className="text-body-0-regular text-foreground-dim">You can manage shares you created. Only admins can modify shares created by others.</p>
      )}

      {/* Search + role dropdown + expiration */}
      {!readOnly && resourceRef && canAddGrants && addRoleOptions.length > 0 && (
        <div className="space-y-3">
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
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <span className="text-body-0-regular text-foreground">Expires</span>
              {expires && (
                <select
                  value={expiresInDays}
                  onChange={e => setExpiresInDays(Number(e.target.value))}
                  className="text-body-0-regular text-foreground bg-surface-flat border border-border-dim rounded px-2 py-0.5"
                >
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                </select>
              )}
            </div>
            <Toggle checked={expires} onChange={setExpires} aria-label="Expires" />
          </div>
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
      <GuestLinksSection
        resourceId={resourceId}
        resourceRef={resourceRef}
        readOnly={readOnly}
        canAddGrants={canAddGrants}
        getResourceGuestLinks={getResourceGuestLinks}
        createGuestLink={createGuestLink}
        revokeGuestLink={revokeGuestLink}
      />

      {userEntries.length === 0 && teamEntries.length === 0 && getResourceGuestLinks(resourceId).length === 0 && (
        <p className="text-body-0-regular text-foreground-dim">{emptyLabel}</p>
      )}
    </div>
  )
}
