'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Search, ChevronDown, ChevronRight, Plus, X, Info, Shield, Lock, Unlock, FileText, ArrowRightLeft, Archive } from 'lucide-react'
import { Facepile } from './facepile'
import { Modal } from './modal'
import { Button } from './button'
import { Input } from './input'
import { MenuSelect } from './menu-select'
import { Avatar } from './avatar'
import { AccessSummary } from './access-summary'
import { DepartmentAvatar } from './department-avatar'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import { useAccess, usePersona } from '@/hooks'
import { useUserCollections } from '@/hooks/useUserCollections'
import { useToast } from './toast'
import { cn } from '@/lib/utils'
import { PERSONAS, DIRECTORY_UPDATED_EVENT } from '@/lib/personas'
import type { User } from '@/lib/personas'
import {
  TEAMS,
  addTeamManager,
  addUserToTeam,
  createTeam,
  isUserTeamManager,
  removeTeamManager,
  removeUserFromTeam,
} from '@/lib/teams'
import { PROJECT_RESOURCE, isGrantActive } from '@/lib/grants'
import type { Permission, RoleGroup, Grant, ResourceRef } from '@/lib/grants'
import type { DomainId, ProductionDomainId } from '@/components/department/types'
import { DOMAIN_FOLDER_MAP } from '@/lib/workspace-data'
import type { DiscoveryResourceType, UserAccessSummary } from '@/hooks/useAccess'
import type { AuditEvent, AuditEventType } from '@/lib/audit-log'

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


function toDisplayNameFromEmail(email: string): string {
  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toPersonaId(scopeId: string, email: string): string {
  const localPart = email.split('@')[0].replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
  const base = `${scopeId}-${localPart || 'member'}`
  let nextId = base
  let index = 2
  while (PERSONAS.some((persona) => persona.id === nextId)) {
    nextId = `${base}-${index++}`
  }
  return nextId
}

function addUserToWorkspaceTeam(teamId: string, email: string): User | null {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return null

  const team = TEAMS.find((candidate) => candidate.id === teamId && candidate.kind === 'group')
  if (!team) return null

  let persona = PERSONAS.find((candidate) => candidate.email.toLowerCase() === normalizedEmail)

  if (!persona) {
    persona = {
      id: toPersonaId(team.domainId ?? team.id, normalizedEmail),
      name: toDisplayNameFromEmail(normalizedEmail),
      email: normalizedEmail,
      role: 'artist',
      title: `${team.name} Artist`,
      domainId: undefined,
      teamIds: [],
    }
    PERSONAS.push(persona)
  }

  if (!team.memberUserIds.includes(persona.id)) {
    addUserToTeam(persona.id, teamId)
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
    team.managerUserIds = team.managerUserIds.filter((managerId) => managerId !== userId)
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DIRECTORY_UPDATED_EVENT))
  }

  return persona
}

function removeWorkspaceMember(teamId: string, userId: string): User | null {
  const persona = PERSONAS.find((candidate) => candidate.id === userId)
  if (!persona) return null

  return removeUserFromTeam(userId, teamId) ? persona : null
}

type PendingWorkspaceInvite = {
  id: string
  email: string
  teamId: string
  displayName: string
}

function getSoleManagedTeams(userId: string) {
  return TEAMS.filter(
    (team) => team.managerUserIds.includes(userId) && team.managerUserIds.length === 1,
  )
}

// --- People tab ---

function PersonAccessDetail({
  userId,
  getUserAccessSummary,
  canRemove,
  onRevokeAll,
}: {
  userId: string
  getUserAccessSummary: (userId: string) => UserAccessSummary
  canRemove: boolean
  onRevokeAll?: () => void
}) {
  const summary = useMemo(() => getUserAccessSummary(userId), [getUserAccessSummary, userId])

  return (
    <div className="bg-surface-mid rounded px-3 py-2 ml-8 mr-2 mb-1 space-y-2">
      {summary.workspaceRoots.length > 0 && (
        <div>
          <p className="text-label-0-bold text-foreground-dim uppercase mb-1">Workspaces</p>
          {summary.workspaceRoots.map((root) => (
            <p key={root.folderId} className="text-body-0-regular text-foreground">
              {root.folderName} root — {root.count} assets
            </p>
          ))}
        </div>
      )}

      {summary.directShares.length > 0 && (
        <div>
          <p className="text-label-0-bold text-foreground-dim uppercase mb-1">Direct shares</p>
          {summary.directShares.map((s) => (
            <div key={s.resourceId} className="flex items-center justify-between">
              <span className="text-body-0-regular text-foreground truncate">{s.label}</span>
              <span className="text-label-0-regular text-foreground-dim flex-shrink-0 ml-2">{s.profile}</span>
            </div>
          ))}
        </div>
      )}

      {summary.collectionShares.length > 0 && (
        <div>
          <p className="text-label-0-bold text-foreground-dim uppercase mb-1">Collections</p>
          {summary.collectionShares.map((c) => (
            <p key={c.collectionId} className="text-body-0-regular text-foreground">
              {c.collectionName} — {c.assetCount} assets
            </p>
          ))}
        </div>
      )}

      {summary.domainReleases.length > 0 && (
        <div>
          <p className="text-label-0-bold text-foreground-dim uppercase mb-1">Releases</p>
          {summary.domainReleases.map((r) => (
            <p key={r.domainId} className="text-body-0-regular text-foreground">
              {r.domainName} — {r.assetCount} assets
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border-dim">
        <p className="text-body-0-bold text-foreground">
          {summary.totalUniqueAssets} unique assets accessible
        </p>
        {canRemove && onRevokeAll && (
          <Button variant="secondary" compact onClick={onRevokeAll}>
            Revoke all access
          </Button>
        )}
      </div>
    </div>
  )
}

function PeopleTab({
  grants,
  directoryVersion,
  canRemoveParticipants,
  activeUserId,
  onRemoveParticipant,
  getUserAccessSummary,
}: {
  grants: Grant[]
  directoryVersion: number
  canRemoveParticipants: boolean
  activeUserId?: string
  onRemoveParticipant?: (userId: string) => void
  getUserAccessSummary: (userId: string) => UserAccessSummary
}) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

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

      if (grant.principal.type !== 'team') continue
      const teamId = grant.principal.teamId
      const team = TEAMS.find((candidate) => candidate.id === teamId)
      for (const memberId of team?.memberUserIds ?? []) {
        touch(memberId, 'received')
      }
    }

    return PERSONAS
      .filter((persona) => persona.teamIds.length > 0 || stats.has(persona.id))
      .map((persona) => {
        const involvement = stats.get(persona.id) ?? { received: 0, shared: 0, directGrantCount: 0, teamCount: 0 }
        const workspaceMemberships = TEAMS.filter((team) => team.rootFolderId && team.memberUserIds.includes(persona.id))
        const teamCount = TEAMS.filter((team) => team.memberUserIds.includes(persona.id)).length
        const primaryLabel = workspaceMemberships.length > 1
          ? `${workspaceMemberships.length} workspaces`
          : workspaceMemberships.length === 1
          ? `${workspaceMemberships[0].name} workspace`
          : persona.role === 'vendor'
          ? 'External participant'
          : persona.teamIds.length > 0
          ? 'Team member'
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
          canRemove: persona.id !== activeUserId && (persona.teamIds.length > 0 || involvement.directGrantCount > 0 || teamCount > 0),
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [grants, policyResourceIds, directoryVersion, activeUserId])

  return (
    <div className="space-y-3">
      <p className="text-body-0-regular text-foreground-dim">
        People appear here because they belong to a workspace or team, or are involved through explicit shares. Add new working users from the Workspaces tab, and use share controls on assets or collections for ad hoc access.
      </p>
      {canRemoveParticipants && (
        <p className="text-label-0-regular text-foreground-dim">
          Project admins can remove a person here to remove their direct shares and remove them from workspace and team membership.
        </p>
      )}

      {participants.length === 0 ? (
        <p className="text-body-0-regular text-foreground-dim py-4 text-center">No people with access yet.</p>
      ) : (
        <div className="space-y-1">
          {participants.map((persona) => {
            const isExpanded = expandedUserId === persona.id
            return (
              <div key={persona.id}>
                <div
                  className={cn(
                    'flex items-center justify-between gap-2 py-2 px-2 rounded cursor-pointer transition-colors',
                    isExpanded ? 'bg-surface-3/60' : 'hover:bg-surface-3/40',
                  )}
                  onClick={() => setExpandedUserId(isExpanded ? null : persona.id)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-foreground-dim flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-foreground-dim flex-shrink-0" />
                    )}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveParticipant(persona.id)
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <PersonAccessDetail
                    userId={persona.id}
                    getUserAccessSummary={getUserAccessSummary}
                    canRemove={canRemoveParticipants && persona.canRemove}
                    onRevokeAll={
                      canRemoveParticipants && persona.canRemove && onRemoveParticipant
                        ? () => onRemoveParticipant(persona.id)
                        : undefined
                    }
                  />
                )}
              </div>
            )
          })}
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
          <p className="text-label-1-bold text-foreground-dim">Department overrides</p>
          {(Object.keys(DOMAIN_FOLDER_MAP) as ProductionDomainId[]).map((domId) => {
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

// --- Workspaces tab ---

function WorkspaceRootsTab({
  pendingInvites,
  inviteEmail,
  onInviteEmailChange,
  selectedTeamId,
  onSelectedTeamChange,
  onStageInvite,
  onRemovePendingInvite,
  onRemoveWorkspaceMember,
  onPromoteManager,
  onDemoteManager,
  canManageTeamMembers,
  canManageTeamManagers,
}: {
  pendingInvites: PendingWorkspaceInvite[]
  inviteEmail: string
  onInviteEmailChange: (value: string) => void
  selectedTeamId: string
  onSelectedTeamChange: (teamId: string) => void
  onStageInvite: () => boolean
  onRemovePendingInvite: (inviteId: string) => void
  onRemoveWorkspaceMember: (teamId: string, userId: string) => void
  onPromoteManager: (teamId: string, userId: string) => void
  onDemoteManager: (teamId: string, userId: string) => void
  canManageTeamMembers: (teamId: string) => boolean
  canManageTeamManagers: (teamId: string) => boolean
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const workspaceTeams = useMemo(
    () => TEAMS
      .filter((team) => team.kind === 'group' && team.rootFolderId)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  )
  const manageableWorkspaceTeams = useMemo(
    () => workspaceTeams.filter((team) => canManageTeamMembers(team.id)),
    [workspaceTeams, canManageTeamMembers],
  )
  const teamOptions = useMemo(
    () => manageableWorkspaceTeams.map((team) => ({ value: team.id, label: team.name })),
    [manageableWorkspaceTeams],
  )
  const pendingByTeam = useMemo(() => {
    const map = new Map<string, PendingWorkspaceInvite[]>()
    for (const invite of pendingInvites) {
      const existing = map.get(invite.teamId) ?? []
      existing.push(invite)
      map.set(invite.teamId, existing)
    }
    return map
  }, [pendingInvites])
  const selectedInviteTeamId = teamOptions.some((team) => team.value === selectedTeamId)
    ? selectedTeamId
    : (teamOptions[0]?.value ?? '')
  const canStageInvite = teamOptions.length > 0 && inviteEmail.trim().length > 0

  useEffect(() => {
    if (teamOptions.length === 0 || teamOptions.some((team) => team.value === selectedTeamId)) return
    onSelectedTeamChange(teamOptions[0]!.value)
  }, [onSelectedTeamChange, selectedTeamId, teamOptions])

  if (workspaceTeams.length === 0) {
    return (
      <p className="text-body-0-regular text-foreground-dim">
        No workspace roots are configured.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-body-0-regular text-foreground-dim">
        Workspace access comes from root-folder groups. Members inherit access from the folder grants configured here.
      </p>
      {teamOptions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-body-0-regular text-foreground-dim">
            Queue someone into a workspace root, then confirm with Update Access in the footer.
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
                  setExpanded((prev) => new Set(prev).add(selectedInviteTeamId))
                }
              }}
              placeholder="Add by email..."
            />
            <MenuSelect
              className="w-48 flex-shrink-0"
              options={teamOptions}
              value={selectedInviteTeamId}
              onChange={(value) => onSelectedTeamChange(value as string)}
              size="standard"
              align="start"
              width="sm"
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (onStageInvite()) {
                  setExpanded((prev) => new Set(prev).add(selectedInviteTeamId))
                }
              }}
              disabled={!canStageInvite}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-body-0-regular text-foreground-dim">
          Group managers staff workspace membership. You can still review folder access below.
        </p>
      )}

      <div className="space-y-1">
        {workspaceTeams.map((team) => {
          const isOpen = expanded.has(team.id)
          const members = team.memberUserIds
            .map(uid => PERSONAS.find(p => p.id === uid))
            .filter(Boolean) as User[]
          const pendingMembers = pendingByTeam.get(team.id) ?? []
          const managerIds = new Set(team.managerUserIds)
          const canManageMembers = canManageTeamMembers(team.id)
          const canManageManagers = canManageTeamManagers(team.id)
          const resourceRef: ResourceRef = { id: team.rootFolderId!, type: 'folder', domainId: team.domainId }

          return (
            <div key={team.id} className={cn('rounded-lg transition-colors', isOpen && 'bg-surface-3/40')}>
              <div className={cn('flex items-center justify-between gap-2 py-2 px-2 rounded-lg transition-colors', !isOpen && 'hover:bg-surface-3/40')}>
                <button
                  onClick={() => toggle(team.id)}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <ChevronDown className={cn('w-3.5 h-3.5 text-foreground-dim transition-transform flex-shrink-0', !isOpen && '-rotate-90')} />
                  <DepartmentAvatar domainId={team.domainId} size="sm" />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-body-0-bold text-foreground truncate block">{team.name}</span>
                    <span className="text-label-0-regular text-foreground-dim block">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                      {' · '}
                      {team.managerUserIds.length} {team.managerUserIds.length === 1 ? 'manager' : 'managers'}
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
                <span className="text-label-0-regular text-foreground-dim flex-shrink-0">
                  Root folder
                </span>
              </div>
              {isOpen && (
                <div className="px-2 pb-2 space-y-3">
                  {pendingMembers.map((invite) => (
                    <div key={invite.id} className="flex items-center gap-2 py-1.5 pl-2 pr-0 rounded">
                      <Avatar name={invite.displayName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="text-body-0-regular text-foreground truncate block">{invite.displayName}</span>
                        <span className="text-label-0-regular text-foreground-dim truncate block">{invite.email}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-label-0-regular text-foreground-dim">New user</span>
                        {canManageMembers && (
                          <Button
                            variant="secondary"
                            compact
                            onClick={() => onRemovePendingInvite(invite.id)}
                            aria-label={`Remove pending addition for ${invite.displayName}`}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {members.map((persona) => {
                    const isManager = managerIds.has(persona.id)
                    const canRemoveMember = canManageMembers && (!isManager || canManageManagers)

                    return (
                      <div key={persona.id} className="flex items-center gap-2 py-1.5 pl-2 pr-0 rounded">
                        <Avatar name={persona.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <span className="text-body-0-regular text-foreground truncate block">{persona.name}</span>
                          <span className="text-label-0-regular text-foreground-dim truncate block">{persona.email}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isManager && (
                            <span className="text-label-0-bold text-foreground-dim">Manager</span>
                          )}
                          {canManageManagers && (
                            isManager ? (
                              <Button
                                variant="secondary"
                                compact
                                onClick={() => onDemoteManager(team.id, persona.id)}
                              >
                                Demote
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                compact
                                onClick={() => onPromoteManager(team.id, persona.id)}
                              >
                                Make manager
                              </Button>
                            )
                          )}
                          {canRemoveMember && (
                            <Button
                              variant="secondary"
                              compact
                              onClick={() => onRemoveWorkspaceMember(team.id, persona.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {members.length === 0 && (
                    <p className="text-label-0-regular text-foreground-dim py-2 px-2 text-center">No members yet.</p>
                  )}
                  <div className="rounded-lg border border-border-dim px-3 py-3">
                    <AccessSummary
                      resourceId={resourceRef.id}
                      resourceRef={resourceRef}
                      resourceName={team.name}
                    />
                  </div>
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
  const visible = roleGroups.filter(rg => rg.id !== 'link-viewer')

  return (
    <div className="space-y-4">
      <p className="text-body-0-regular text-foreground-dim">
        Role groups define what actions users can take. Assign a role group to a person, team, or release audience to grant capabilities.
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

// --- Security tab ---

function SecurityTab({
  projectLocked,
  projectLockInfo,
  onLock,
  onUnlock,
  orphanedCollections,
  onTransferOwnership,
  onArchiveCollection,
  readOnly = false,
}: {
  projectLocked: boolean
  projectLockInfo: { locked: boolean; lockedBy?: string; lockedAt?: string }
  onLock: () => void
  onUnlock: () => void
  orphanedCollections: { id: string; name: string; createdBy?: string }[]
  onTransferOwnership: (collectionId: string, newOwnerEmail: string) => void
  onArchiveCollection: (collectionName: string) => void
  readOnly?: boolean
}) {
  return (
    <div className="space-y-4">
      <p className="text-body-0-regular text-foreground-dim">
        Emergency controls to restrict project access during a security incident.
      </p>

      <div
        className={cn(
          'rounded-lg border p-4 space-y-3',
          projectLocked
            ? 'bg-red-500/10 border-red-500/40'
            : 'border-border-dim',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              'mt-0.5 flex-shrink-0',
              projectLocked ? 'text-red-400' : 'text-foreground-dim',
            )}>
              {projectLocked ? <Lock className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <p className={cn(
                'text-body-1-bold',
                projectLocked ? 'text-red-400' : 'text-foreground',
              )}>
                {projectLocked ? 'Project is locked' : 'Lock project'}
              </p>
              <p className="text-body-0-regular text-foreground-dim">
                Pause all external access. Vendors and reviewers lose access immediately. Department members can keep working.
              </p>
            </div>
          </div>

          {!projectLocked ? (
            <button
              onClick={onLock}
              disabled={readOnly}
              className={cn(
                'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
                'bg-surface-3',
                readOnly && 'opacity-40 cursor-not-allowed',
              )}
            >
              <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform" />
            </button>
          ) : (
            <button
              onClick={onUnlock}
              disabled={readOnly}
              className={cn(
                'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
                'bg-red-500',
                readOnly && 'opacity-40 cursor-not-allowed',
              )}
            >
              <div className="absolute top-1 left-5 w-4 h-4 rounded-full bg-white transition-transform" />
            </button>
          )}
        </div>

        {projectLocked && projectLockInfo.lockedBy && (
          <div className="flex items-center justify-between pt-2 border-t border-red-500/20">
            <p className="text-label-0-regular text-red-400">
              Locked by {projectLockInfo.lockedBy} on {projectLockInfo.lockedAt}
            </p>
            <Button
              variant="secondary"
              compact
              onClick={onUnlock}
              disabled={readOnly}
            >
              <Unlock className="w-3 h-3 mr-1" />
              Unlock
            </Button>
          </div>
        )}
      </div>

      {orphanedCollections.length > 0 && (
        <OrphanedCollectionsSection
          orphanedCollections={orphanedCollections}
          onTransferOwnership={onTransferOwnership}
          onArchiveCollection={onArchiveCollection}
          readOnly={readOnly}
        />
      )}
    </div>
  )
}

// --- Orphaned collections section ---

function OrphanedCollectionsSection({
  orphanedCollections,
  onTransferOwnership,
  onArchiveCollection,
  readOnly = false,
}: {
  orphanedCollections: { id: string; name: string; createdBy?: string }[]
  onTransferOwnership: (collectionId: string, newOwnerEmail: string) => void
  onArchiveCollection: (collectionName: string) => void
  readOnly?: boolean
}) {
  const [transferTarget, setTransferTarget] = useState<string | null>(null)
  const [transferEmail, setTransferEmail] = useState('')

  return (
    <div className="rounded-lg border border-border-dim p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Archive className="w-5 h-5 text-foreground-dim mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-body-0-bold text-foreground">Orphaned collections</p>
          <p className="text-body-0-regular text-foreground-dim">
            Collections whose creator is no longer an active project member.
          </p>
        </div>
      </div>
      <div className="space-y-1">
        {orphanedCollections.map((col) => (
          <div key={col.id} className="flex items-center justify-between gap-2 py-2 px-2 rounded hover:bg-surface-3/40">
            <div className="min-w-0 flex-1">
              <span className="text-body-0-regular text-foreground truncate block">{col.name}</span>
              <span className="text-label-0-regular text-foreground-dim block">
                Created by {col.createdBy ?? 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {transferTarget === col.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="email"
                    value={transferEmail}
                    onChange={(e) => setTransferEmail(e.target.value)}
                    placeholder="new-owner@email.com"
                    className="w-48"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && transferEmail.trim()) {
                        onTransferOwnership(col.id, transferEmail.trim())
                        setTransferTarget(null)
                        setTransferEmail('')
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    compact
                    disabled={!transferEmail.trim() || readOnly}
                    onClick={() => {
                      onTransferOwnership(col.id, transferEmail.trim())
                      setTransferTarget(null)
                      setTransferEmail('')
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    onClick={() => {
                      setTransferTarget(null)
                      setTransferEmail('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    compact
                    disabled={readOnly}
                    onClick={() => setTransferTarget(col.id)}
                  >
                    <ArrowRightLeft className="w-3 h-3 mr-1" />
                    Transfer
                  </Button>
                  <Button
                    variant="secondary"
                    compact
                    disabled={readOnly}
                    onClick={() => onArchiveCollection(col.name)}
                  >
                    <Archive className="w-3 h-3 mr-1" />
                    Archive
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Audit Log tab (Phase 6) ---

function AuditLogTab({
  getAuditLog,
}: {
  getAuditLog: (filters?: { resourceId?: string; userId?: string; type?: AuditEventType }) => AuditEvent[]
}) {
  const [typeFilter, setTypeFilter] = useState<AuditEventType | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  const events = useMemo(() => {
    const filters: { type?: AuditEventType } = {}
    if (typeFilter) filters.type = typeFilter
    const all = getAuditLog(filters)
    if (!searchQuery.trim()) return all
    const q = searchQuery.toLowerCase()
    return all.filter(e =>
      (e.actorName?.toLowerCase().includes(q)) ||
      (e.targetUserName?.toLowerCase().includes(q)) ||
      (e.resourceLabel?.toLowerCase().includes(q)) ||
      (e.details?.toLowerCase().includes(q))
    )
  }, [getAuditLog, typeFilter, searchQuery])

  const typeOptions = [
    { value: '', label: 'All events' },
    { value: 'grant', label: 'Grant' },
    { value: 'revoke', label: 'Revoke' },
    { value: 'block', label: 'Block' },
    { value: 'unblock', label: 'Unblock' },
    { value: 'lock', label: 'Lock' },
    { value: 'unlock', label: 'Unlock' },
    { value: 'release', label: 'Release' },
  ]

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return timestamp
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-body-0-regular text-foreground-dim">
        Log of all access-related actions on this project.
      </p>

      <div className="flex items-center gap-2">
        <MenuSelect
          className="w-36"
          options={typeOptions}
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as AuditEventType | '')}
          size="standard"
          align="start"
          width="sm"
        />
        <Input
          icon={<Search />}
          iconPosition="left"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events..."
        />
      </div>

      {events.length === 0 ? (
        <p className="text-body-0-regular text-foreground-dim py-4 text-center">
          No audit events recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-label-0-bold uppercase text-foreground-dim py-2 pr-3 pl-2">Time</th>
                <th className="text-left text-label-0-bold uppercase text-foreground-dim py-2 px-3">Action</th>
                <th className="text-left text-label-0-bold uppercase text-foreground-dim py-2 px-3">Actor</th>
                <th className="text-left text-label-0-bold uppercase text-foreground-dim py-2 px-3">Target</th>
                <th className="text-left text-label-0-bold uppercase text-foreground-dim py-2 px-3">Resource</th>
                <th className="text-left text-label-0-bold uppercase text-foreground-dim py-2 pl-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-surface-1 transition-colors border-t border-border-dim">
                  <td className="py-2 pr-3 pl-2 text-label-0-regular text-foreground-dim whitespace-nowrap">{formatTime(event.timestamp)}</td>
                  <td className="py-2 px-3">
                    <span className={cn(
                      'text-label-0-bold uppercase px-1.5 py-0.5 rounded',
                      event.type === 'grant' && 'text-foreground-system-success bg-surface-flat',
                      event.type === 'revoke' && 'text-red-400 bg-surface-flat',
                      event.type === 'block' && 'text-red-400 bg-surface-flat',
                      event.type === 'unblock' && 'text-foreground-dim bg-surface-flat',
                      event.type === 'lock' && 'text-red-400 bg-surface-flat',
                      event.type === 'unlock' && 'text-foreground-system-success bg-surface-flat',
                      event.type === 'release' && 'text-indigo-400 bg-surface-flat',
                    )}>{event.type}</span>
                  </td>
                  <td className="py-2 px-3 text-body-0-regular text-foreground">{event.actorName}</td>
                  <td className="py-2 px-3 text-body-0-regular text-foreground">{event.targetUserName ?? '-'}</td>
                  <td className="py-2 px-3 text-body-0-regular text-foreground truncate max-w-[160px]">{event.resourceLabel ?? '-'}</td>
                  <td className="py-2 pl-3 text-label-0-regular text-foreground-dim truncate max-w-[240px]">{event.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// --- Teams tab ---

function TeamsTab({
  activeUserId,
  canManageProject,
}: {
  activeUserId?: string
  canManageProject: boolean
}) {
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [addMemberQuery, setAddMemberQuery] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [version, setVersion] = useState(0)
  const { showToast } = useToast()

  const manageableTeams = useMemo(() => {
    return TEAMS.filter((team) => team.kind === 'group' && !team.rootFolderId)
  }, [version])
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return manageableTeams
    const q = searchQuery.toLowerCase()
    return manageableTeams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.memberUserIds.some(uid => {
        const p = PERSONAS.find(u => u.id === uid)
        return p?.name.toLowerCase().includes(q) || p?.email?.toLowerCase().includes(q)
      })
    )
  }, [searchQuery, manageableTeams])
  const canManageMembers = useCallback((teamId: string) => (
    canManageProject || (!!activeUserId && isUserTeamManager(activeUserId, teamId))
  ), [activeUserId, canManageProject])

  const handleAddMember = (teamId: string, userId: string) => {
    if (addUserToTeam(userId, teamId)) {
      const persona = PERSONAS.find(p => p.id === userId)
      const team = TEAMS.find(t => t.id === teamId)
      showToast(`Added ${persona?.name ?? userId} to ${team?.name ?? 'team'}`)
      setAddMemberQuery('')
      setVersion(v => v + 1)
    }
  }

  const handleRemoveMember = (teamId: string, userId: string) => {
    const team = TEAMS.find((candidate) => candidate.id === teamId)
    if (!removeUserFromTeam(userId, teamId)) {
      const blockedTeams = team ? getSoleManagedTeams(userId).filter((candidate) => candidate.id === team.id) : []
      if (blockedTeams.length > 0) {
        showToast(`Assign another manager for ${blockedTeams[0]!.name} before removing this member.`)
      }
      return
    }
    setVersion(v => v + 1)
  }

  const handlePromoteManager = (teamId: string, userId: string) => {
    if (addTeamManager(userId, teamId)) {
      const persona = PERSONAS.find((candidate) => candidate.id === userId)
      const team = TEAMS.find((candidate) => candidate.id === teamId)
      showToast(`${persona?.name ?? 'Member'} can now manage ${team?.name ?? 'this group'}`)
      setVersion((v) => v + 1)
    }
  }

  const handleDemoteManager = (teamId: string, userId: string) => {
    const team = TEAMS.find((candidate) => candidate.id === teamId)
    if (!removeTeamManager(userId, teamId)) {
      if (team) {
        showToast(`Assign another manager for ${team.name} before demoting this person.`)
      }
      return
    }
    const persona = PERSONAS.find((candidate) => candidate.id === userId)
    showToast(`${persona?.name ?? 'Member'} no longer manages ${team?.name ?? 'this group'}`)
    setVersion((v) => v + 1)
  }

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return
    if (!activeUserId) {
      showToast('Switch into a project persona before creating a group.')
      return
    }
    const managerIds = activeUserId ? [activeUserId] : []
    createTeam(newTeamName.trim(), managerIds, 'group', managerIds)
    showToast(`Created team "${newTeamName.trim()}"`)
    setNewTeamName('')
    setVersion(v => v + 1)
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-dim" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search teams..."
          className="w-full h-9 pl-9 pr-3 bg-surface-low border border-border-dim rounded text-body-0-regular text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-border-subtle transition-colors"
        />
      </div>
      <div className="space-y-1">
        {filteredTeams.map(team => {
          const isExpanded = expandedTeamId === team.id
          const members = team.memberUserIds
            .map(uid => PERSONAS.find(u => u.id === uid))
            .filter(Boolean) as User[]
          const managers = new Set(team.managerUserIds)
          const teamCanManageMembers = canManageMembers(team.id)
          const addCandidates = addMemberQuery.trim() && isExpanded && teamCanManageMembers
            ? PERSONAS.filter(p =>
                !team.memberUserIds.includes(p.id) &&
                (p.name.toLowerCase().includes(addMemberQuery.toLowerCase()) ||
                 p.email?.toLowerCase().includes(addMemberQuery.toLowerCase()))
              ).slice(0, 5)
            : []
          return (
            <div key={team.id}>
              <button
                onClick={() => { setExpandedTeamId(isExpanded ? null : team.id); setAddMemberQuery('') }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded hover:bg-surface-highlight transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-foreground-dim flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-foreground-dim flex-shrink-0" />}
                  <span className="text-body-0-regular text-foreground truncate">{team.name}</span>
                </div>
                <span className="text-label-0-regular text-foreground-dim flex-shrink-0">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                  {' · '}
                  {team.managerUserIds.length} {team.managerUserIds.length === 1 ? 'manager' : 'managers'}
                </span>
              </button>
              {isExpanded && (
                <div className="pl-9 pb-2 space-y-1">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between gap-2 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={member.name} size="sm" />
                        <div className="min-w-0">
                          <span className="text-body-0-regular text-foreground truncate block">{member.name}</span>
                          {member.email && <span className="text-label-0-regular text-foreground-dim truncate block">{member.email}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {managers.has(member.id) && (
                          <span className="text-label-0-bold text-foreground-dim">Manager</span>
                        )}
                        {member.title && <span className="text-label-0-regular text-foreground-dim">{member.title}</span>}
                        {canManageProject && (
                          managers.has(member.id) ? (
                            <button
                              onClick={() => handleDemoteManager(team.id, member.id)}
                              className="text-label-0-regular text-foreground-dim hover:text-foreground transition-colors"
                            >
                              Demote
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePromoteManager(team.id, member.id)}
                              className="text-label-0-regular text-foreground-dim hover:text-foreground transition-colors"
                            >
                              Make manager
                            </button>
                          )
                        )}
                        {teamCanManageMembers && (!managers.has(member.id) || canManageProject) && (
                          <button
                            onClick={() => handleRemoveMember(team.id, member.id)}
                            className="text-label-0-regular text-foreground-dim hover:text-foreground-system-error transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-body-0-regular text-foreground-dim py-1">No members</p>
                  )}
                  {teamCanManageMembers && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={addMemberQuery}
                        onChange={e => setAddMemberQuery(e.target.value)}
                        placeholder="Add member by name or email..."
                        className="w-full h-8 px-3 bg-surface-low border border-border-dim rounded text-body-0-regular text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-border-subtle transition-colors"
                      />
                      {addCandidates.length > 0 && (
                        <div className="mt-1 border border-border-dim rounded bg-surface-low">
                          {addCandidates.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleAddMember(team.id, p.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-highlight transition-colors"
                            >
                              <Avatar name={p.name} size="sm" />
                              <span className="text-body-0-regular text-foreground">{p.name}</span>
                              {p.email && <span className="text-label-0-regular text-foreground-dim">{p.email}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {filteredTeams.length === 0 && (
          <p className="text-body-0-regular text-foreground-dim py-4 text-center">No teams match your search.</p>
        )}
      </div>
      {canManageProject && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="New team name"
            className="flex-1 h-9 px-3 bg-surface-low border border-border-dim rounded text-body-0-regular text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-border-subtle transition-colors"
            onKeyDown={e => { if (e.key === 'Enter') handleCreateTeam() }}
          />
          <Button variant="secondary" compact onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
            Create
          </Button>
        </div>
      )}
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
    revokeUserAccess,
    canShare,
    canEditAcl,
    getDiscoverySettings,
    setDiscoveryEnabledForType,
    toggleDomainDiscoveryForType,
    getUserAccessSummary,
    projectLocked,
    projectLockInfo,
    lockProject,
    unlockProject,
    getAuditLog,
  } = useAccess()
  const { orphanedCollections, transferCollectionOwnership } = useUserCollections()
  const { showToast } = useToast()
  const { activePersona } = usePersona()
  const activeUserId = activePersona?.id
  const canManageProject = canEditAcl(PROJECT_RESOURCE)
  const workspaceTeams = useMemo(
    () => TEAMS
      .filter((team) => team.kind === 'group' && team.rootFolderId)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  )
  const [activeTab, setActiveTab] = useState('workspaces')
  const [directoryVersion, setDirectoryVersion] = useState(0)
  const [pendingWorkspaceInvites, setPendingWorkspaceInvites] = useState<PendingWorkspaceInvite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedWorkspaceTeamId, setSelectedWorkspaceTeamId] = useState<string>(workspaceTeams[0]?.id ?? '')
  const canManageTeamMembers = useCallback((teamId: string) => (
    canManageProject || (!!activeUserId && isUserTeamManager(activeUserId, teamId))
  ), [activeUserId, canManageProject])
  const canManageWorkspaces = useMemo(
    () => workspaceTeams.some((team) => {
      const resourceRef: ResourceRef = {
        id: team.rootFolderId!,
        type: 'folder',
        domainId: team.domainId,
      }
      return canManageTeamMembers(team.id) || canShare(resourceRef) || canEditAcl(resourceRef)
    }),
    [workspaceTeams, canManageTeamMembers, canShare, canEditAcl],
  )
  const canManageGroups = useMemo(
    () => TEAMS.some((team) => team.kind === 'group' && !team.rootFolderId && canManageTeamMembers(team.id)),
    [canManageTeamMembers, directoryVersion],
  )
  const canManageAnything = canManageProject || canManageWorkspaces || canManageGroups
  const hasPendingWorkspaceInvites = pendingWorkspaceInvites.length > 0
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

  const resetPendingWorkspaceInvites = useCallback(() => {
    setPendingWorkspaceInvites([])
    setInviteEmail('')
  }, [])

  const stageWorkspaceInvite = useCallback(() => {
    const normalizedEmail = inviteEmail.trim().toLowerCase()
    if (!normalizedEmail) return false

    const team = workspaceTeams.find(
      (candidate) => candidate.id === selectedWorkspaceTeamId && canManageTeamMembers(candidate.id),
    ) ?? workspaceTeams.find((candidate) => canManageTeamMembers(candidate.id))
    if (!team) return false

    const existingPersona = PERSONAS.find((candidate) => candidate.email.toLowerCase() === normalizedEmail)
    if (team.memberUserIds.includes(existingPersona?.id ?? '')) {
      setInviteEmail('')
      return false
    }

    setPendingWorkspaceInvites((prev) => {
      const next = prev.filter((invite) => !(invite.email === normalizedEmail && invite.teamId === team.id))
      next.push({
        id: `pending-${team.id}-${normalizedEmail}`,
        email: normalizedEmail,
        teamId: team.id,
        displayName: existingPersona?.name ?? toDisplayNameFromEmail(normalizedEmail),
      })
      return next
    })
    setInviteEmail('')
    return true
  }, [inviteEmail, selectedWorkspaceTeamId, workspaceTeams, canManageTeamMembers])

  const applyPendingWorkspaceInvites = useCallback(() => {
    if (pendingWorkspaceInvites.length === 0) return
    for (const invite of pendingWorkspaceInvites) {
      addUserToWorkspaceTeam(invite.teamId, invite.email)
    }
    setDirectoryVersion((prev) => prev + 1)
    resetPendingWorkspaceInvites()
  }, [pendingWorkspaceInvites, resetPendingWorkspaceInvites])

  const handleRemoveWorkspaceMember = useCallback((teamId: string, userId: string) => {
    const removedPersona = removeWorkspaceMember(teamId, userId)
    if (!removedPersona) {
      const blockedTeam = TEAMS.find((team) => team.id === teamId)
      if (blockedTeam) {
        showToast(`Assign another manager for ${blockedTeam.name} before removing this member.`)
      }
      return
    }
    setDirectoryVersion((prev) => prev + 1)
  }, [showToast])

  const handlePromoteWorkspaceManager = useCallback((teamId: string, userId: string) => {
    if (!addTeamManager(userId, teamId)) return
    const persona = PERSONAS.find((candidate) => candidate.id === userId)
    const team = TEAMS.find((candidate) => candidate.id === teamId)
    showToast(`${persona?.name ?? 'Member'} can now manage ${team?.name ?? 'this workspace group'}`)
    setDirectoryVersion((prev) => prev + 1)
  }, [showToast])

  const handleDemoteWorkspaceManager = useCallback((teamId: string, userId: string) => {
    const team = TEAMS.find((candidate) => candidate.id === teamId)
    if (!removeTeamManager(userId, teamId)) {
      if (team) {
        showToast(`Assign another manager for ${team.name} before demoting this person.`)
      }
      return
    }
    const persona = PERSONAS.find((candidate) => candidate.id === userId)
    showToast(`${persona?.name ?? 'Member'} no longer manages ${team?.name ?? 'this workspace group'}`)
    setDirectoryVersion((prev) => prev + 1)
  }, [showToast])

  const handleModalOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      resetPendingWorkspaceInvites()
    }
    onOpenChange(nextOpen)
  }, [onOpenChange, resetPendingWorkspaceInvites])

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
                {canManageWorkspaces || canManageGroups
                  ? 'Project-wide settings are view only. You can still manage the groups and workspace roots where you have rights.'
                  : 'Project-wide settings are managed by project admins.'}
              </p>
            </div>
          )}

          <Tabs
            defaultValue="workspaces"
            value={activeTab}
            onValueChange={setActiveTab}
            className="px-6 pt-4"
          >
            <TabsList>
              <Tab value="workspaces">Workspaces</Tab>
              <Tab value="people">People</Tab>
              <Tab value="teams">Teams</Tab>
              {canManageProject && <Tab value="role-groups">Role Groups</Tab>}
              {canManageProject && <Tab value="settings">Settings</Tab>}
              {canManageProject && <Tab value="security">Security</Tab>}
              {canManageProject && <Tab value="audit-log">Audit Log</Tab>}
            </TabsList>

            <div className="flex-1 overflow-y-auto max-h-[50vh] px-1 pb-4">
              <TabsContent value="people">
                <PeopleTab
                  grants={grants}
                  directoryVersion={directoryVersion}
                  canRemoveParticipants={canManageProject}
                  activeUserId={activePersona?.id}
                  getUserAccessSummary={getUserAccessSummary}
                  onRemoveParticipant={(userId) => {
                    const persona = PERSONAS.find((candidate) => candidate.id === userId)
                    const name = persona?.name ?? 'this person'
                    const blockingTeams = getSoleManagedTeams(userId)
                    if (blockingTeams.length > 0) {
                      showToast(
                        `Assign another manager for ${blockingTeams.map((team) => team.name).join(', ')} before removing ${name}.`,
                      )
                      return
                    }
                    const confirmed = window.confirm(
                      `Remove ${name} from the project? This removes direct shares and removes workspace and team membership.`,
                    )
                    if (!confirmed) return
                    revokeUserAccess(userId)
                    removePersonFromDirectory(userId)
                    setDirectoryVersion((prev) => prev + 1)
                  }}
                />
              </TabsContent>
              <TabsContent value="teams">
                <TeamsTab activeUserId={activeUserId} canManageProject={canManageProject} />
              </TabsContent>
              <TabsContent value="workspaces">
                <WorkspaceRootsTab
                  pendingInvites={pendingWorkspaceInvites}
                  inviteEmail={inviteEmail}
                  onInviteEmailChange={setInviteEmail}
                  selectedTeamId={selectedWorkspaceTeamId}
                  onSelectedTeamChange={setSelectedWorkspaceTeamId}
                  onStageInvite={stageWorkspaceInvite}
                  onRemovePendingInvite={(inviteId) => {
                    setPendingWorkspaceInvites((prev) => prev.filter((invite) => invite.id !== inviteId))
                  }}
                  onRemoveWorkspaceMember={handleRemoveWorkspaceMember}
                  onPromoteManager={handlePromoteWorkspaceManager}
                  onDemoteManager={handleDemoteWorkspaceManager}
                  canManageTeamMembers={canManageTeamMembers}
                  canManageTeamManagers={() => canManageProject}
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
              {canManageProject && (
                <TabsContent value="security">
                  <SecurityTab
                    projectLocked={projectLocked}
                    projectLockInfo={projectLockInfo}
                    onLock={lockProject}
                    onUnlock={unlockProject}
                    orphanedCollections={orphanedCollections}
                    onTransferOwnership={(collectionId, newOwnerEmail) => {
                      transferCollectionOwnership(collectionId, newOwnerEmail)
                      showToast(`Collection ownership transferred to ${newOwnerEmail}`)
                    }}
                    onArchiveCollection={(collectionName) => {
                      showToast(`Collection "${collectionName}" archived`)
                    }}
                  />
                </TabsContent>
              )}
              {canManageProject && (
                <TabsContent value="audit-log">
                  <AuditLogTab getAuditLog={getAuditLog} />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border-dim">
          {hasPendingWorkspaceInvites ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  resetPendingWorkspaceInvites()
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  applyPendingWorkspaceInvites()
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
