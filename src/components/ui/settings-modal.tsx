'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, ChevronDown, Plus, X, Info, RefreshCw } from 'lucide-react'
import { Facepile } from './facepile'
import { Modal } from './modal'
import { Button } from './button'
import { Input } from './input'
import { MenuSelect } from './menu-select'
import { RoleSelect } from './role-select'
import { Avatar } from './avatar'
import { DepartmentAvatar } from './department-avatar'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import { useAccess, usePersona } from '@/hooks'
import { cn } from '@/lib/utils'
import { PERSONAS, DIRECTORY_UPDATED_EVENT } from '@/lib/personas'
import type { User } from '@/lib/personas'
import { TEAMS } from '@/lib/teams'
import { PROJECT_RESOURCE, profileLabel, isGrantActive } from '@/lib/grants'
import type { Permission, RoleGroup, Grant, AccessProfileId, PrincipalRef, ResourceRef } from '@/lib/grants'
import type { DomainId } from '@/components/department/types'
import { DOMAIN_FOLDER_MAP } from '@/lib/workspace-data'
import type { DiscoveryResourceType } from '@/hooks/useAccess'

const ALL_PERMISSIONS: { id: Permission; name: string }[] = [
  { id: 'open', name: 'Read' },
  { id: 'download', name: 'Download' },
  { id: 'write', name: 'Write' },
  { id: 'delete', name: 'Delete' },
  { id: 'comment', name: 'Comment' },
  { id: 'share', name: 'Share' },
  { id: 'edit-acl', name: 'Admin' },
]

// --- Shared components ---

function PermissionCheckbox({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'w-5 h-5 rounded-sm border flex items-center justify-center transition-colors',
        disabled && 'opacity-40 cursor-not-allowed',
        checked
          ? 'bg-indigo-500 border-indigo-500'
          : 'bg-surface-flat border-border-subtle',
        !checked && !disabled && 'hover:border-foreground-dim',
      )}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

function roleGroupOptions(roleGroups: RoleGroup[]) {
  return roleGroups
    .filter((rg) => rg.id !== 'owner' && rg.id !== 'link-viewer')
    .map((rg) => ({ value: rg.id, label: rg.name }))
}

function toDisplayNameFromEmail(email: string): string {
  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toPersonaId(domainId: DomainId, email: string): string {
  const localPart = email.split('@')[0].replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
  const base = `${domainId}-${localPart || 'member'}`
  let nextId = base
  let index = 2
  while (PERSONAS.some((persona) => persona.id === nextId)) {
    nextId = `${base}-${index++}`
  }
  return nextId
}

function addOrMoveDomainMember(domainId: DomainId, teamId: string, email: string): User | null {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return null

  const domainTeamIds = new Set(
    TEAMS.filter((team) => team.domainId).map((team) => team.id),
  )

  let persona = PERSONAS.find((candidate) => candidate.email.toLowerCase() === normalizedEmail)

  if (!persona) {
    persona = {
      id: toPersonaId(domainId, normalizedEmail),
      name: toDisplayNameFromEmail(normalizedEmail),
      email: normalizedEmail,
      role: 'artist',
      title: `${DOMAIN_FOLDER_MAP[domainId].name} Artist`,
      domainId,
      teamIds: [teamId],
    }
    PERSONAS.push(persona)
  } else {
    persona.domainId = domainId
    if (persona.role !== 'manager' && persona.role !== 'artist') {
      persona.role = 'artist'
    }
    persona.teamIds = Array.from(new Set([
      ...persona.teamIds.filter((id) => !domainTeamIds.has(id)),
      teamId,
    ]))
  }

  for (const team of TEAMS) {
    if (!team.domainId) continue
    if (team.id === teamId) {
      if (!team.memberUserIds.includes(persona.id)) {
        team.memberUserIds.push(persona.id)
      }
      continue
    }
    team.memberUserIds = team.memberUserIds.filter((memberId) => memberId !== persona.id)
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DIRECTORY_UPDATED_EVENT))
  }

  return persona
}

function removePersonFromDirectory(userId: string): User | null {
  const persona = PERSONAS.find((candidate) => candidate.id === userId)
  if (!persona) return null

  persona.domainId = undefined
  persona.teamIds = []

  for (const team of TEAMS) {
    team.memberUserIds = team.memberUserIds.filter((memberId) => memberId !== userId)
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DIRECTORY_UPDATED_EVENT))
  }

  return persona
}

function removeDomainMember(domainId: DomainId, teamId: string, userId: string): User | null {
  const persona = PERSONAS.find((candidate) => candidate.id === userId)
  if (!persona) return null

  const team = TEAMS.find((candidate) => candidate.id === teamId)
  if (team) {
    team.memberUserIds = team.memberUserIds.filter((memberId) => memberId !== userId)
  }

  persona.teamIds = persona.teamIds.filter((id) => id !== teamId)

  if (persona.domainId === domainId) {
    const nextDomainTeam = TEAMS.find(
      (candidate) => candidate.domainId && persona.teamIds.includes(candidate.id),
    )
    persona.domainId = nextDomainTeam?.domainId
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DIRECTORY_UPDATED_EVENT))
  }

  return persona
}

type PendingDomainInvite = {
  id: string
  email: string
  domainId: DomainId
  teamId: string
  displayName: string
}

// --- People tab ---

function PeopleTab({
  grants,
  directoryVersion,
  canRemoveParticipants,
  activeUserId,
  onRemoveParticipant,
}: {
  grants: Grant[]
  directoryVersion: number
  canRemoveParticipants: boolean
  activeUserId?: string
  onRemoveParticipant?: (userId: string) => void
}) {
  const policyResourceIds = useMemo(
    () => new Set(['project', ...Object.values(DOMAIN_FOLDER_MAP).map((folder) => folder.id)]),
    [],
  )

  const participants = useMemo(() => {
    void directoryVersion
    const stats = new Map<string, { received: number; shared: number; directGrantCount: number; teamCount: number }>()

    const touch = (userId: string, field: 'received' | 'shared') => {
      const current = stats.get(userId) ?? { received: 0, shared: 0, directGrantCount: 0, teamCount: 0 }
      current[field] += 1
      stats.set(userId, current)
    }

    const noteDirectGrant = (userId: string) => {
      const current = stats.get(userId) ?? { received: 0, shared: 0, directGrantCount: 0, teamCount: 0 }
      current.directGrantCount += 1
      stats.set(userId, current)
    }

    for (const grant of grants) {
      if (!isGrantActive(grant)) continue
      if (policyResourceIds.has(grant.resource.id)) continue

      touch(grant.grantedByUserId, 'shared')

      if (grant.principal.type === 'user') {
        touch(grant.principal.userId, 'received')
        noteDirectGrant(grant.principal.userId)
        continue
      }

      const teamId = grant.principal.teamId
      const team = TEAMS.find((candidate) => candidate.id === teamId)
      for (const memberId of team?.memberUserIds ?? []) {
        touch(memberId, 'received')
      }
    }

    return PERSONAS
      .filter((persona) => persona.domainId || stats.has(persona.id))
      .map((persona) => {
        const involvement = stats.get(persona.id) ?? { received: 0, shared: 0, directGrantCount: 0, teamCount: 0 }
        const teamCount = TEAMS.filter((team) => team.memberUserIds.includes(persona.id)).length
        const primaryLabel = persona.domainId
          ? `${DOMAIN_FOLDER_MAP[persona.domainId].name} member`
          : persona.role === 'vendor'
          ? 'External participant'
          : 'Shared participant'
        const activityParts = [
          involvement.received > 0 ? `${involvement.received} received` : null,
          involvement.shared > 0 ? `${involvement.shared} shared` : null,
        ].filter(Boolean)

        return {
          ...persona,
          primaryLabel,
          activityLabel: activityParts.length > 0 ? activityParts.join(' · ') : 'No active shares',
          directGrantCount: involvement.directGrantCount,
          teamCount,
          canRemove: persona.id !== activeUserId && (Boolean(persona.domainId) || involvement.directGrantCount > 0 || teamCount > 0),
        }
      })
      .sort((a, b) => {
        const aDom = a.domainId ? 0 : 1
        const bDom = b.domainId ? 0 : 1
        if (aDom !== bDom) return aDom - bDom
        return a.name.localeCompare(b.name)
      })
  }, [grants, policyResourceIds, directoryVersion, activeUserId])

  return (
    <div className="space-y-3">
      <p className="text-body-0-regular text-foreground-dim">
        People appear here because they belong to a domain or are involved through explicit shares. Add new working users from the Domains tab, and use share controls on assets or collections for ad hoc access.
      </p>
      {canRemoveParticipants && (
        <p className="text-label-0-regular text-foreground-dim">
          Project admins can remove a person here to revoke their direct shares and remove them from domain and team membership.
        </p>
      )}

      {participants.length === 0 ? (
        <p className="text-body-0-regular text-foreground-dim py-4 text-center">No participants yet.</p>
      ) : (
        <div className="space-y-1">
          {participants.map((persona) => (
            <div key={persona.id} className="flex items-center justify-between gap-2 py-2 px-2 rounded hover:bg-surface-3/40 transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar name={persona.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body-0-regular text-foreground truncate">{persona.name}</span>
                    {persona.title && (
                      <span className="text-label-0-regular text-foreground-dim truncate hidden sm:inline">{persona.title}</span>
                    )}
                  </div>
                  <span className="text-label-0-regular text-foreground-dim truncate block">{persona.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-label-0-regular text-foreground">{persona.primaryLabel}</div>
                  <div className="text-label-0-regular text-foreground-dim">{persona.activityLabel}</div>
                </div>
                {canRemoveParticipants && persona.canRemove && onRemoveParticipant && (
                  <Button
                    variant="icon"
                    size="compact-icon"
                    aria-label={`Remove ${persona.name} from project access`}
                    title="Remove access"
                    onClick={() => onRemoveParticipant(persona.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DiscoverySection({
  title,
  description,
  enabled,
  onToggleEnabled,
  disabledDomains,
  onToggleDomain,
  disabled,
}: {
  title: string
  description: string
  enabled: boolean
  onToggleEnabled: () => void
  disabledDomains: Set<DomainId>
  onToggleDomain: (domId: DomainId) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border-dim p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-0-bold text-foreground">{title}</p>
          <p className="text-body-0-regular text-foreground-dim">{description}</p>
        </div>
        <button
          onClick={onToggleEnabled}
          disabled={disabled}
          className={cn(
            'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
            enabled ? 'bg-indigo-500' : 'bg-surface-3',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
        >
          <div
            className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
              enabled ? 'left-5' : 'left-1',
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-1">
          <p className="text-label-1-bold text-foreground-dim">Domain overrides</p>
          {(Object.keys(DOMAIN_FOLDER_MAP) as DomainId[]).map((domId) => {
            const domainDisabled = disabledDomains.has(domId)
            return (
              <div key={domId} className="flex items-center justify-between py-1">
                <span className="text-body-0-regular text-foreground">{DOMAIN_FOLDER_MAP[domId].name}</span>
                <button
                  onClick={() => onToggleDomain(domId)}
                  disabled={disabled}
                  className={cn(
                    'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
                    !domainDisabled ? 'bg-indigo-500' : 'bg-surface-3',
                    disabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                      !domainDisabled ? 'left-5' : 'left-1',
                    )}
                  />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Domains tab ---

function DomainsTab({
  roleGroups,
  getResourceGrants,
  onRoleChange,
  onAddGrant,
  onRemoveGrant,
  canShareResource,
  canEditResource,
  pendingInvites,
  inviteEmail,
  onInviteEmailChange,
  selectedDomainId,
  onSelectedDomainChange,
  onStageInvite,
  onRemovePendingInvite,
  onRemoveDomainMember,
  readOnly = false,
}: {
  roleGroups: RoleGroup[]
  getResourceGrants: (resourceId: string) => Grant[]
  onRoleChange: (grantId: string, profileId: AccessProfileId) => void
  onAddGrant: (resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId) => void
  onRemoveGrant: (grantId: string) => void
  canShareResource: (resource: ResourceRef) => boolean
  canEditResource: (resource: ResourceRef) => boolean
  pendingInvites: PendingDomainInvite[]
  inviteEmail: string
  onInviteEmailChange: (value: string) => void
  selectedDomainId: DomainId
  onSelectedDomainChange: (domainId: DomainId) => void
  onStageInvite: () => boolean
  onRemovePendingInvite: (inviteId: string) => void
  onRemoveDomainMember: (domainId: DomainId, teamId: string, userId: string) => void
  readOnly?: boolean
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingOverrides, setEditingOverrides] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const options = useMemo(() => roleGroupOptions(roleGroups), [roleGroups])
  const domains = useMemo(
    () => (Object.keys(DOMAIN_FOLDER_MAP) as DomainId[]).map((domainId) => ({
      domainId,
      folder: DOMAIN_FOLDER_MAP[domainId],
      team: TEAMS.find((candidate) => candidate.domainId === domainId),
    })),
    [],
  )
  const domainOptions = useMemo(
    () => domains.map(({ domainId, folder }) => ({ value: domainId, label: folder.name })),
    [domains],
  )
  const pendingByDomain = useMemo(() => {
    const map = new Map<DomainId, PendingDomainInvite[]>()
    for (const invite of pendingInvites) {
      const existing = map.get(invite.domainId) ?? []
      existing.push(invite)
      map.set(invite.domainId, existing)
    }
    return map
  }, [pendingInvites])
  const canStageInvite = inviteEmail.trim().length > 0

  return (
    <div className="space-y-3">
      <p className="text-body-0-regular text-foreground-dim">
        Domains own content. Members get workspace access automatically based on the role set here.
      </p>
      {!readOnly && (
        <div className="space-y-2">
          <p className="text-body-0-regular text-foreground-dim">
            Queue someone into a domain, then confirm with Update Access in the footer.
          </p>
          <div className="flex items-start gap-2">
            <Input
              icon={<Search />}
              iconPosition="left"
              type="email"
              value={inviteEmail}
              onChange={(e) => onInviteEmailChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (onStageInvite()) {
                  setExpanded((prev) => new Set(prev).add(selectedDomainId))
                }
              }}
              placeholder="Add by email..."
            />
            <MenuSelect
              className="w-48 flex-shrink-0"
              options={domainOptions}
              value={selectedDomainId}
              onChange={(value) => onSelectedDomainChange(value as DomainId)}
              size="standard"
              align="start"
              width="sm"
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (onStageInvite()) {
                  setExpanded((prev) => new Set(prev).add(selectedDomainId))
                }
              }}
              disabled={!canStageInvite}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {domains.map(({ domainId, folder, team }) => {
          const isOpen = expanded.has(domainId)
          const members = (team?.memberUserIds ?? [])
            .map(uid => PERSONAS.find(p => p.id === uid))
            .filter(Boolean)
          const pendingMembers = pendingByDomain.get(domainId) ?? []
          const resourceRef: ResourceRef = { id: folder.id, type: 'folder', domainId }
          const rootGrants = getResourceGrants(resourceRef.id)
          const grant = team
            ? rootGrants.find(g => g.principal.type === 'team' && g.principal.teamId === team.id)
            : undefined
          const canShareDomain = canShareResource(resourceRef)
          const canEditDomain = canEditResource(resourceRef)
          const noDefaultAccessValue = '__no_default_access__'
          const defaultRoleValue = grant?.templateId ?? noDefaultAccessValue
          const defaultMemberLabel = grant?.templateId
            ? profileLabel(grant.templateId, roleGroups)
            : 'No default access'

          return (
            <div key={domainId} className={cn('rounded-lg transition-colors', isOpen && 'bg-surface-3/40')}>
              <div className={cn('flex items-center justify-between gap-2 py-2 px-2 rounded-lg transition-colors', !isOpen && 'hover:bg-surface-3/40')}>
                <button
                  onClick={() => toggle(domainId)}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <ChevronDown className={cn('w-3.5 h-3.5 text-foreground-dim transition-transform flex-shrink-0', !isOpen && '-rotate-90')} />
                  <DepartmentAvatar domainId={domainId} size="sm" />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-body-0-bold text-foreground truncate block">{folder.name}</span>
                    <span className="text-label-0-regular text-foreground-dim block">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                      {pendingMembers.length > 0 ? ` · ${pendingMembers.length} pending` : ''}
                    </span>
                  </div>
                  {!isOpen && members.length > 0 && (
                    <Facepile
                      users={members.filter(Boolean).map(p => ({ id: p!.id, name: p!.name }))}
                      max={4}
                      size="compact"
                    />
                  )}
                </button>
                {team ? (
                  <RoleSelect
                    options={[{ value: noDefaultAccessValue, label: 'No default access' }, ...options]}
                    value={defaultRoleValue}
                    disabled={readOnly || (grant ? !canEditDomain : !canShareDomain)}
                    onChange={(value) => {
                      if (value === noDefaultAccessValue) {
                        if (grant) onRemoveGrant(grant.id)
                        return
                      }

                      if (grant) {
                        onRoleChange(grant.id, value as AccessProfileId)
                        return
                      }

                      onAddGrant(
                        resourceRef,
                        { type: 'team', teamId: team.id },
                        value as AccessProfileId,
                      )
                    }}
                  />
                ) : (
                  <span className="text-label-0-regular text-foreground-dim flex-shrink-0">
                    No default access
                  </span>
                )}
              </div>
              {isOpen && (
                <div className="px-2 pb-2">
                  {pendingMembers.map((invite) => (
                    <div key={invite.id} className="flex items-center gap-2 py-1.5 pl-2 pr-0 rounded">
                      <Avatar name={invite.displayName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="text-body-0-regular text-foreground truncate block">{invite.displayName}</span>
                        <span className="text-label-0-regular text-foreground-dim truncate block">{invite.email}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-label-0-regular text-foreground-dim">New user</span>
                        <Button
                          variant="secondary"
                          compact
                          onClick={() => onRemovePendingInvite(invite.id)}
                          aria-label={`Remove pending addition for ${invite.displayName}`}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  {members.filter(Boolean).map((persona) => persona && (
                    (() => {
                      const overrideGrant = rootGrants.find(
                        (candidate) => candidate.principal.type === 'user' && candidate.principal.userId === persona.id,
                      )
                      const overrideKey = `${domainId}:${persona.id}`
                      const isEditingOverride = editingOverrides.has(overrideKey)
                      const memberValue = overrideGrant?.templateId ?? noDefaultAccessValue
                      const displayedMemberLabel = overrideGrant?.templateId
                        ? profileLabel(overrideGrant.templateId, roleGroups)
                        : defaultMemberLabel
                      const removeAccessValue = '__remove_domain_access__'
                      const overrideOptions = [
                        ...(overrideGrant ? options : [{ value: noDefaultAccessValue, label: displayedMemberLabel }]),
                        ...options,
                        {
                          value: removeAccessValue,
                          label: 'Remove Access',
                          destructive: true,
                          separated: true,
                        },
                      ]

                      return (
                        <div key={persona.id} className="flex items-center gap-2 py-1.5 pl-2 pr-0 rounded">
                          <Avatar name={persona.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <span className="text-body-0-regular text-foreground truncate block">{persona.name}</span>
                            <span className="text-label-0-regular text-foreground-dim truncate block">{persona.email}</span>
                          </div>
                          {isEditingOverride ? (
                            <div className="flex items-center flex-shrink-0">
                              <MenuSelect
                                options={overrideOptions}
                                value={memberValue}
                                size="compact"
                                width="sm"
                                align="end"
                                disabled={readOnly || (overrideGrant ? !canEditDomain : !canShareDomain)}
                                onChange={(value) => {
                                  if (value === noDefaultAccessValue) {
                                    setEditingOverrides((prev) => {
                                      const next = new Set(prev)
                                      next.delete(overrideKey)
                                      return next
                                    })
                                    return
                                  }

                                  if (value === removeAccessValue) {
                                    if (overrideGrant) onRemoveGrant(overrideGrant.id)
                                    onRemoveDomainMember(domainId, team!.id, persona.id)
                                    setEditingOverrides((prev) => {
                                      const next = new Set(prev)
                                      next.delete(overrideKey)
                                      return next
                                    })
                                    return
                                  }

                                  if (overrideGrant) {
                                    onRoleChange(overrideGrant.id, value as AccessProfileId)
                                  } else {
                                    onAddGrant(
                                      resourceRef,
                                      { type: 'user', userId: persona.id },
                                      value as AccessProfileId,
                                    )
                                  }

                                  setEditingOverrides((prev) => {
                                    const next = new Set(prev)
                                    next.delete(overrideKey)
                                    return next
                                  })
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center flex-shrink-0">
                              {!readOnly && canShareDomain && (
                                <Button
                                  variant="secondary"
                                  compact
                                  icon={<RefreshCw className="w-3 h-3" />}
                                  onClick={() => {
                                    setEditingOverrides((prev) => new Set(prev).add(overrideKey))
                                  }}
                                >
                                  Override
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })()
                  ))}
                  {members.length === 0 && (
                    <p className="text-label-0-regular text-foreground-dim py-2 px-2 text-center">No members yet</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Role Groups tab ---

function RoleGroupsTab({
  roleGroups,
  onUpdate,
  onRename,
  onAdd,
  onRemove,
  readOnly = false,
}: {
  roleGroups: RoleGroup[]
  onUpdate: (id: string, permissions: Permission[]) => void
  onRename: (id: string, name: string) => void
  onAdd: (name: string, permissions: Permission[]) => void
  onRemove: (id: string) => void
  readOnly?: boolean
}) {
  const visible = roleGroups.filter(rg => rg.id !== 'owner' && rg.id !== 'link-viewer')

  return (
    <div className="space-y-4">
      <p className="text-body-0-regular text-foreground-dim">
        Role groups define what actions users can take. Assign a role group to a person or domain to grant capabilities.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-label-0-bold uppercase text-foreground-dim py-2 pr-4 pl-2 w-[180px]">
                Role
              </th>
              {ALL_PERMISSIONS.map((perm) => (
                <th key={perm.id} className="text-center text-label-0-bold uppercase text-foreground-dim py-2 px-3">
                  {perm.name}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {visible.map((rg) => (
              <tr key={rg.id} className="hover:bg-surface-1 transition-colors group">
                <td className="py-2.5 pr-4 pl-2">
                  <input
                    value={rg.name}
                    onChange={(e) => onRename(rg.id, e.target.value)}
                    disabled={readOnly}
                    className="text-body-0-regular text-foreground bg-transparent border-none outline-none w-full hover:bg-surface-2 focus:bg-surface-2 rounded px-1 -mx-1 py-0.5 transition-colors"
                  />
                </td>
                {ALL_PERMISSIONS.map((perm) => (
                  <td key={perm.id} className="py-2.5 px-3 text-center">
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        checked={rg.permissions.includes(perm.id)}
                        disabled={readOnly}
                        onChange={(checked) => {
                          const next = checked
                            ? [...rg.permissions, perm.id]
                            : rg.permissions.filter((p) => p !== perm.id)
                          onUpdate(rg.id, next)
                        }}
                      />
                    </div>
                  </td>
                ))}
                <td className="py-2.5 px-1">
                  {!rg.builtIn && !readOnly && (
                    <Button variant="icon" size="compact-icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemove(rg.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="secondary" disabled={readOnly} onClick={() => {
        const name = prompt('Role group name')
        if (name?.trim()) onAdd(name.trim(), ['open'])
      }}>
        <Plus className="w-3 h-3 mr-1" />
        New Role Group
      </Button>
    </div>
  )
}

// --- Main modal ---

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const {
    grants,
    roleGroups,
    updateRoleGroup,
    renameRoleGroup,
    addRoleGroup,
    removeRoleGroup,
    getResourceGrants,
    createGrant,
    updateGrantProfile,
    revokeGrant,
    revokeUserAccess,
    canShare,
    canEditAcl,
    getDiscoverySettings,
    setDiscoveryEnabledForType,
    toggleDomainDiscoveryForType,
  } = useAccess()
  const { activePersona } = usePersona()
  const canManageProject = canEditAcl(PROJECT_RESOURCE)
  const [activeTab, setActiveTab] = useState('domains')
  const [directoryVersion, setDirectoryVersion] = useState(0)
  const [pendingDomainInvites, setPendingDomainInvites] = useState<PendingDomainInvite[]>([])
  const domainIds = useMemo(() => Object.keys(DOMAIN_FOLDER_MAP) as DomainId[], [])
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedDomainId, setSelectedDomainId] = useState<DomainId>(domainIds[0] ?? 'vfx')
  const canManageDomains = useMemo(
    () => (Object.keys(DOMAIN_FOLDER_MAP) as DomainId[]).some((domainId) => {
      const resourceRef: ResourceRef = {
        id: DOMAIN_FOLDER_MAP[domainId].id,
        type: 'folder',
        domainId,
      }
      return canShare(resourceRef) || canEditAcl(resourceRef)
    }),
    [canShare, canEditAcl],
  )
  const canManageAnything = canManageDomains || canManageProject
  const hasPendingDomainInvites = pendingDomainInvites.length > 0
  const discoverySections: { resourceType: DiscoveryResourceType; title: string; description: string }[] = [
    {
      resourceType: 'asset',
      title: 'Asset Discovery',
      description: 'Allow users to see restricted assets as blurred tiles and request access.',
    },
    {
      resourceType: 'cut',
      title: 'Cut Discovery',
      description: 'Allow users to know a cut exists before it has been explicitly shared.',
    },
  ]

  const resetPendingDomainInvites = useCallback(() => {
    setPendingDomainInvites([])
    setInviteEmail('')
  }, [])

  const stageDomainInvite = useCallback(() => {
    const normalizedEmail = inviteEmail.trim().toLowerCase()
    if (!normalizedEmail) return false

    const team = TEAMS.find((candidate) => candidate.domainId === selectedDomainId)
    if (!team) return false

    const existingPersona = PERSONAS.find((candidate) => candidate.email.toLowerCase() === normalizedEmail)
    if (team.memberUserIds.includes(existingPersona?.id ?? '')) {
      setInviteEmail('')
      return false
    }

    setPendingDomainInvites((prev) => {
      const next = prev.filter((invite) => invite.email !== normalizedEmail)
      next.push({
        id: `pending-${selectedDomainId}-${normalizedEmail}`,
        email: normalizedEmail,
        domainId: selectedDomainId,
        teamId: team.id,
        displayName: existingPersona?.name ?? toDisplayNameFromEmail(normalizedEmail),
      })
      return next
    })
    setInviteEmail('')
    return true
  }, [inviteEmail, selectedDomainId])

  const applyPendingDomainInvites = useCallback(() => {
    if (pendingDomainInvites.length === 0) return
    for (const invite of pendingDomainInvites) {
      addOrMoveDomainMember(invite.domainId, invite.teamId, invite.email)
    }
    setDirectoryVersion((prev) => prev + 1)
    resetPendingDomainInvites()
  }, [pendingDomainInvites, resetPendingDomainInvites])

  const handleRemoveDomainMember = useCallback((domainId: DomainId, teamId: string, userId: string) => {
    removeDomainMember(domainId, teamId, userId)
    setDirectoryVersion((prev) => prev + 1)
  }, [])

  const handleModalOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      resetPendingDomainInvites()
    }
    onOpenChange(nextOpen)
  }, [onOpenChange, resetPendingDomainInvites])

  return (
    <Modal open={open} onOpenChange={handleModalOpenChange} size="md">
      <div className="flex flex-col max-h-[80vh]">
        <div className="pb-0">
          <Modal.Header
            title="Access Control"
            subtitle={
              !canManageAnything
                ? 'View who can access content and what actions they can take.'
                : 'Manage who can access content and what actions they can take.'
            }
          />

          {!canManageProject && (
            <div className="mx-6 mt-4 flex items-start gap-2 rounded border border-border-dim bg-surface-low px-3 py-2">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground-dim" />
              <p className="text-body-0-regular text-foreground-dim">
                {canManageDomains
                  ? 'Project-wide settings are view only. You can still manage domain membership and domain access where you have rights.'
                  : 'Project-wide settings are managed by project admins.'}
              </p>
            </div>
          )}

          <Tabs
            defaultValue="domains"
            value={activeTab}
            onValueChange={setActiveTab}
            className="px-6 pt-4"
          >
            <TabsList>
              <Tab value="domains">Domains</Tab>
              <Tab value="people">People</Tab>
              {canManageProject && <Tab value="role-groups">Role Groups</Tab>}
              {canManageProject && <Tab value="settings">Settings</Tab>}
            </TabsList>

            <div className="flex-1 overflow-y-auto max-h-[50vh] px-1 pb-4">
              <TabsContent value="people">
                <PeopleTab
                  grants={grants}
                  directoryVersion={directoryVersion}
                  canRemoveParticipants={canManageProject}
                  activeUserId={activePersona?.id}
                  onRemoveParticipant={(userId) => {
                    const persona = PERSONAS.find((candidate) => candidate.id === userId)
                    const name = persona?.name ?? 'this person'
                    const confirmed = window.confirm(
                      `Remove ${name} from the project? This revokes direct shares and removes domain and team membership.`,
                    )
                    if (!confirmed) return
                    revokeUserAccess(userId)
                    removePersonFromDirectory(userId)
                    setDirectoryVersion((prev) => prev + 1)
                  }}
                />
              </TabsContent>
              <TabsContent value="domains">
                <DomainsTab
                  roleGroups={roleGroups}
                  getResourceGrants={getResourceGrants}
                  onRoleChange={updateGrantProfile}
                  onAddGrant={createGrant}
                  onRemoveGrant={revokeGrant}
                  canShareResource={canShare}
                  canEditResource={canEditAcl}
                  pendingInvites={pendingDomainInvites}
                  inviteEmail={inviteEmail}
                  onInviteEmailChange={setInviteEmail}
                  selectedDomainId={selectedDomainId}
                  onSelectedDomainChange={setSelectedDomainId}
                  onStageInvite={stageDomainInvite}
                  onRemovePendingInvite={(inviteId) => {
                    setPendingDomainInvites((prev) => prev.filter((invite) => invite.id !== inviteId))
                  }}
                  onRemoveDomainMember={handleRemoveDomainMember}
                  readOnly={!canManageDomains && !canManageProject}
                />
              </TabsContent>
              {canManageProject && (
                <TabsContent value="role-groups">
                  <RoleGroupsTab
                    roleGroups={roleGroups}
                    onUpdate={updateRoleGroup}
                    onRename={renameRoleGroup}
                    onAdd={addRoleGroup}
                    onRemove={removeRoleGroup}
                    readOnly={false}
                  />
                </TabsContent>
              )}
              {canManageProject && (
                <TabsContent value="settings">
                  <div className="space-y-3">
                    {discoverySections.map(({ resourceType, title, description }) => {
                      const settings = getDiscoverySettings(resourceType)
                      return (
                        <DiscoverySection
                          key={resourceType}
                          title={title}
                          description={description}
                          enabled={settings.enabled}
                          onToggleEnabled={() => setDiscoveryEnabledForType(resourceType, !settings.enabled)}
                          disabledDomains={settings.disabledDomains}
                          onToggleDomain={(domId) => toggleDomainDiscoveryForType(resourceType, domId)}
                          disabled={false}
                        />
                      )
                    })}
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border-dim">
          {hasPendingDomainInvites ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  resetPendingDomainInvites()
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  applyPendingDomainInvites()
                  onOpenChange(false)
                }}
              >
                Update Access
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
