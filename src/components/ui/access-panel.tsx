'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Users, ChevronDown } from 'lucide-react'
import { Input } from './input'
import { cn } from '@/lib/utils'
import { useAccess, usePersona } from '@/hooks'
import type { Grant, AccessProfileId, ResourceRef, PrincipalRef } from '@/hooks/useAccess'
import { PERSONAS, initials } from '@/lib/personas'
import { TEAMS } from '@/lib/teams'
import { getRoleGroup } from '@/lib/grants'
import type { RoleGroup } from '@/lib/grants'
import { buildAccessDisplayEntries } from './access-display'

interface AccessPanelProps {
  resourceId: string
  resourceRef?: ResourceRef
  readOnly?: boolean
  emptyLabel?: string
  inheritedGrants?: { grant: Grant; fromResourceName: string }[]
}

function PermissionDropdown({
  value,
  onChange,
  disabled,
  roleGroups,
}: {
  value: AccessProfileId
  onChange: (v: AccessProfileId) => void
  disabled?: boolean
  roleGroups: RoleGroup[]
}) {
  const [open, setOpen] = useState(false)
  const currentGroup = getRoleGroup(roleGroups, value)
  const label = currentGroup?.name ?? value

  const options = useMemo(
    () => roleGroups.filter((rg) => rg.id !== 'owner' && rg.id !== 'link-viewer'),
    [roleGroups],
  )

  if (disabled) {
    return (
      <span className="text-label-0-regular text-foreground-dim px-2 py-1">
        {label}
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded text-label-0-regular text-foreground-dim hover:bg-surface-2 transition-colors"
      >
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface-1 border border-border-dim rounded shadow-lg z-50 min-w-[140px]">
          {options.map((rg) => (
            <button
              key={rg.id}
              onClick={() => { onChange(rg.id); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-2 text-body-0-regular hover:bg-surface-2 transition-colors',
                value === rg.id ? 'text-foreground' : 'text-foreground-subtle',
              )}
            >
              {rg.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GrantRow({ grant, readOnly, roleGroups, onRemove, onUpdateProfile, sourceName, name, subtitle, roleLabel }: {
  grant: Grant
  readOnly: boolean
  roleGroups: RoleGroup[]
  onRemove?: (grantId: string) => void
  onUpdateProfile?: (grantId: string, profileId: AccessProfileId) => void
  sourceName?: string
  name: string
  subtitle?: string
  roleLabel: string
}) {
  const isOwner = grant.templateId === 'owner'
  const principal = grant.principal

  return (
    <div className="py-1.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-label-0-bold flex-shrink-0',
            principal.type === 'user' ? 'bg-indigo-500/20 text-indigo-500' : 'bg-surface-3 text-foreground-dim',
          )}>
            {principal.type === 'user' ? initials(name) : <Users className="w-3 h-3" />}
          </span>
          <div className="min-w-0">
            <span className="text-body-0-regular text-foreground truncate block">{name}</span>
            {sourceName && (
              <span className="text-label-0-regular text-foreground-dim truncate block">
                Via {sourceName}
              </span>
            )}
            {subtitle && (
              <span className="text-label-0-regular text-foreground-dim truncate block">{subtitle}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!readOnly && onUpdateProfile ? (
            <>
              <PermissionDropdown
                value={grant.templateId ?? 'viewer'}
                onChange={(value) => onUpdateProfile(grant.id, value)}
                disabled={isOwner}
                roleGroups={roleGroups}
              />
              {!isOwner && onRemove && (
                <button
                  onClick={() => onRemove(grant.id)}
                  className="p-1 rounded hover:bg-surface-3 text-foreground-dim hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <span className="text-label-0-regular text-foreground-dim px-2 py-1">
              {roleLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function AccessPanel({ resourceId, resourceRef, readOnly = false, emptyLabel = 'Not shared', inheritedGrants }: AccessPanelProps) {
  const { getResourceGrants, createGrant, revokeGrant, updateGrantProfile, roleGroups, canShare, canEditAcl } = useAccess()
  const { activePersona } = usePersona()
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
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
    createGrant(resourceRef, principal, 'viewer')
    setQuery('')
    setShowDropdown(false)
  }

  const handleAddTeam = (teamId: string) => {
    if (!resourceRef || !canAddGrants) return
    if (grants.some(g => g.principal.type === 'team' && g.principal.teamId === teamId)) return
    const principal: PrincipalRef = { type: 'team', teamId }
    createGrant(resourceRef, principal, 'viewer')
    setQuery('')
    setShowDropdown(false)
  }

  const displayEntries = useMemo(() => {
    const directEntries = grants.map((grant) => ({
      key: `direct-${grant.id}`,
      grant,
      readOnly: grantsReadOnly,
      sourceName: undefined as string | undefined,
    }))

    const inheritedEntries = (inheritedGrants ?? []).map(({ grant, fromResourceName }) => ({
      key: `inherited-${grant.id}-${fromResourceName}`,
      grant,
      readOnly: true,
      sourceName: fromResourceName,
    }))

    return buildAccessDisplayEntries(
      [...directEntries, ...inheritedEntries],
      roleGroups,
      activePersona?.id,
    )
  }, [grants, grantsReadOnly, inheritedGrants, roleGroups, activePersona])

  return (
    <section className="space-y-2">
      <h3 className="text-label-0-bold uppercase text-foreground-dim">Access</h3>
      <div className="space-y-3">
        {/* Read-only hint for unauthorized roles */}
        {!readOnly && !canAddGrants && !canManageExistingGrants && (
          <p className="text-label-0-regular text-foreground-dim">You don&apos;t have permission to manage access</p>
        )}
        {!readOnly && canAddGrants && !canManageExistingGrants && (
          <p className="text-label-0-regular text-foreground-dim">You can add new shares, but only people with admin access can change or remove existing entries</p>
        )}

        {/* Add person/team — placed at top for easy access */}
        {!readOnly && resourceRef && canAddGrants && (
          <div ref={dropdownRef} className="relative">
            <Input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
              onFocus={() => query.trim() && setShowDropdown(true)}
              placeholder="Add person or team..."
            />
            {showDropdown && query.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface-1 border border-border-dim rounded shadow-lg z-50 max-h-[240px] overflow-y-auto">
                {results.people.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddUser(p.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-label-0-bold flex-shrink-0">
                      {initials(p.name)}
                    </span>
                    <div className="min-w-0">
                      <span className="text-body-0-regular text-foreground truncate block">{p.name}</span>
                      <span className="text-label-0-regular text-foreground-dim truncate block">{p.email}</span>
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
                      <span className="text-label-0-regular text-foreground-dim truncate block">{t.memberUserIds.length} members</span>
                    </div>
                  </button>
                ))}
                {!hasResults && (
                  <div className="px-3 py-2 text-body-0-regular text-foreground-dim">No matches</div>
                )}
              </div>
            )}
          </div>
        )}

        {displayEntries.length === 0 && (
          <p className="text-label-1-regular text-foreground-dim">{emptyLabel}</p>
        )}
        {displayEntries.length > 0 && (
          <div className="space-y-0">
            {displayEntries.map((entry) => (
              <GrantRow
                key={entry.key}
                grant={entry.grant}
                readOnly={entry.readOnly}
                roleGroups={roleGroups}
                sourceName={entry.sourceName}
                name={entry.name}
                subtitle={entry.subtitle}
                roleLabel={entry.roleLabel}
                onRemove={revokeGrant}
                onUpdateProfile={updateGrantProfile}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
