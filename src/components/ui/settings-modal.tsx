'use client'

import { useState, useMemo } from 'react'
import { Search, RotateCcw, ChevronDown, Plus, Users, X, Shield } from 'lucide-react'
import { Modal } from './modal'
import { Button } from './button'
import { Tag } from './tag'
import { useAccess, usePersona } from '@/hooks'
import { cn } from '@/lib/utils'
import { PERSONAS, initials } from '@/lib/personas'
import { TEAMS, getTeamsForUser, getTeamById } from '@/lib/teams'
import { getRoleGroup, profileLabel } from '@/lib/grants'
import type { Permission, RoleGroup, Grant, AccessProfileId, PrincipalRef } from '@/lib/grants'

type TabId = 'people' | 'departments' | 'role-groups'

// --- Permission labels for the Role Groups matrix ---

const CAPABILITY_GROUPS = [
  {
    label: 'Core',
    permissions: [
      { id: 'open' as Permission, name: 'Read' },
      { id: 'write' as Permission, name: 'Write' },
      { id: 'delete' as Permission, name: 'Delete' },
    ],
  },
  {
    label: 'Collaborate',
    permissions: [
      { id: 'comment' as Permission, name: 'Comment' },
      { id: 'share' as Permission, name: 'Share' },
      { id: 'download' as Permission, name: 'Download' },
    ],
  },
  {
    label: 'Admin',
    permissions: [
      { id: 'edit-acl' as Permission, name: 'Manage Access' },
    ],
  },
]

// --- Shared components ---

function PermissionCheckbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'w-5 h-5 rounded-sm border flex items-center justify-center transition-colors',
        checked
          ? 'bg-indigo-500 border-indigo-500'
          : 'bg-surface-flat border-border-subtle',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && !checked && 'hover:border-foreground-dim',
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

function RoleDropdown({
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
        Owner
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
        <div className="absolute right-0 top-full mt-1 bg-surface-1 border border-border-dim rounded shadow-lg z-50 min-w-[160px]">
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

// --- People tab ---

function PeopleTab({
  grants,
  roleGroups,
  onRoleChange,
  onRemove,
  onAdd,
}: {
  grants: Grant[]
  roleGroups: RoleGroup[]
  onRoleChange: (grantId: string, profileId: AccessProfileId) => void
  onRemove: (grantId: string) => void
  onAdd: (principal: PrincipalRef, profileId: AccessProfileId) => void
}) {
  const [search, setSearch] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return grants
    const q = search.toLowerCase()
    return grants.filter((g) => {
      const principal = g.principal
      if (principal.type !== 'user') return false
      const persona = PERSONAS.find((p) => p.id === principal.userId)
      if (!persona) return false
      return persona.name.toLowerCase().includes(q) || persona.email.toLowerCase().includes(q)
    })
  }, [grants, search])

  const handleAdd = () => {
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    const persona = PERSONAS.find((p) => p.email === email)
    if (!persona) return
    if (grants.some((g) => g.principal.type === 'user' && g.principal.userId === persona.id)) return
    onAdd({ type: 'user', userId: persona.id }, 'viewer')
    setNewEmail('')
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-dim" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter people..."
          className={cn(
            'w-full pl-9 pr-3 py-2 rounded text-body-0-regular',
            'bg-surface-flat border border-border-dim text-foreground placeholder:text-foreground-dim',
            'focus:outline-none focus:border-indigo-500',
          )}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-body-0-regular text-foreground-dim py-4 text-center">No people found.</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((grant) => {
            const principal = grant.principal
            if (principal.type !== 'user') return null
            const persona = PERSONAS.find((p) => p.id === principal.userId)
            if (!persona) return null
            const isOwner = grant.templateId === 'owner'
            const teams = getTeamsForUser(persona.id)

            return (
              <div key={grant.id} className="flex items-center justify-between gap-2 py-2 px-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-label-0-bold flex-shrink-0">
                    {initials(persona.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-body-0-regular text-foreground truncate">{persona.name}</span>
                      {persona.title && (
                        <span className="text-label-0-regular text-foreground-dim truncate hidden sm:inline">{persona.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-label-0-regular text-foreground-dim truncate">{persona.email}</span>
                      {teams.length > 0 && (
                        <span className="text-label-0-regular text-foreground-dim">
                          · {teams.map(t => t.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <RoleDropdown
                    value={grant.templateId ?? 'viewer'}
                    onChange={(v) => onRoleChange(grant.id, v)}
                    disabled={isOwner}
                    roleGroups={roleGroups}
                  />
                  {!isOwner && (
                    <button
                      onClick={() => onRemove(grant.id)}
                      className="p-1 rounded hover:bg-surface-3 text-foreground-dim hover:text-foreground-negative transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-1 pt-2 border-t border-border-dim">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add person by email..."
          className={cn(
            'flex-1 px-2 py-1 rounded text-body-0-regular',
            'bg-surface-flat border border-border-dim text-foreground placeholder:text-foreground-dim',
            'focus:outline-none focus:border-indigo-500',
          )}
        />
        <Button variant="icon" compact onClick={handleAdd} disabled={!newEmail.trim()}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

// --- Teams tab ---

function TeamsTab({
  grants,
  roleGroups,
  onRoleChange,
  onRemove,
  onAdd,
}: {
  grants: Grant[]
  roleGroups: RoleGroup[]
  onRoleChange: (grantId: string, profileId: AccessProfileId) => void
  onRemove: (grantId: string) => void
  onAdd: (principal: PrincipalRef, profileId: AccessProfileId) => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  const grantedTeamIds = useMemo(
    () => new Set(grants.map((g) => g.principal.type === 'team' ? g.principal.teamId : '').filter(Boolean)),
    [grants],
  )

  const availableTeams = useMemo(
    () => TEAMS.filter((t) => !grantedTeamIds.has(t.id)),
    [grantedTeamIds],
  )

  return (
    <div className="space-y-3">
      <p className="text-body-0-regular text-foreground-dim">
        Teams control who can access content. All members inherit the team's permissions and content scope.
      </p>

      {grants.length === 0 ? (
        <p className="text-body-0-regular text-foreground-dim py-4 text-center">No teams added yet.</p>
      ) : (
        <div className="space-y-1">
          {grants.map((grant) => {
            if (grant.principal.type !== 'team') return null
            const team = getTeamById(grant.principal.teamId)
            if (!team) return null
            const isExpanded = expandedTeams.has(team.id)
            const members = team.memberUserIds
              .map(uid => PERSONAS.find(p => p.id === uid))
              .filter(Boolean)

            return (
              <div key={grant.id} className="rounded border border-border-dim">
                <div className="flex items-center justify-between gap-2 py-3 px-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      onClick={() => toggleTeam(team.id)}
                      className="w-7 h-7 rounded-full bg-surface-3 text-foreground-dim flex items-center justify-center flex-shrink-0 hover:bg-surface-highlight transition-colors"
                    >
                      <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', !isExpanded && '-rotate-90')} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => toggleTeam(team.id)} className="text-body-0-bold text-foreground truncate hover:underline">
                        {team.name}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-label-0-regular text-foreground-dim">
                          {members.length} {members.length === 1 ? 'member' : 'members'}
                        </span>
                        {team.departmentId && (
                          <Tag size="compact" type="neutral">{team.departmentId}</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <RoleDropdown
                      value={grant.templateId ?? 'viewer'}
                      onChange={(v) => onRoleChange(grant.id, v)}
                      disabled={false}
                      roleGroups={roleGroups}
                    />
                    <button
                      onClick={() => onRemove(grant.id)}
                      className="p-1 rounded hover:bg-surface-3 text-foreground-dim hover:text-foreground-negative transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-border-dim px-3 py-2 space-y-1 bg-surface-flat">
                    {members.map(persona => persona && (
                      <div key={persona.id} className="flex items-center gap-2 py-1.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-label-0-bold flex-shrink-0 text-[10px]">
                          {initials(persona.name)}
                        </span>
                        <span className="text-body-0-regular text-foreground truncate flex-1">{persona.name}</span>
                        <span className="text-label-0-regular text-foreground-dim truncate">{persona.title}</span>
                        <span className="text-label-0-regular text-foreground-dim truncate">{persona.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {availableTeams.length > 0 && (
        <div className="relative pt-2 border-t border-border-dim">
          <Button variant="secondary" compact onClick={() => setAddOpen(!addOpen)}>
            <Plus className="w-3 h-3 mr-1" />
            Add Team
          </Button>
          {addOpen && (
            <div className="absolute left-0 top-full mt-1 bg-surface-1 border border-border-dim rounded shadow-lg z-50 min-w-[240px]">
              {availableTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    onAdd({ type: 'team', teamId: team.id }, 'viewer')
                    setAddOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-body-0-regular hover:bg-surface-2 transition-colors flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-foreground-dim" />
                  <span className="text-foreground flex-1">{team.name}</span>
                  <span className="text-label-0-regular text-foreground-dim">{team.memberUserIds.length} members</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Role Groups tab ---

function RoleGroupsTab({
  roleGroups,
  onUpdate,
  onReset,
}: {
  roleGroups: RoleGroup[]
  onUpdate: (id: string, permissions: Permission[]) => void
  onReset: () => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-body-0-regular text-foreground-dim">
        Role groups define what actions users can take. Assign a role group to a person or team to grant capabilities.
      </p>

      {CAPABILITY_GROUPS.map((group) => (
        <div key={group.label}>
          <h4 className="text-label-0-bold uppercase text-foreground-dim mb-2">{group.label}</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-dim">
                  <th className="text-left text-label-0-regular text-foreground-dim py-2 pr-4 pl-2 w-[200px]">
                    Role
                  </th>
                  {group.permissions.map((perm) => (
                    <th key={perm.id} className="text-center text-label-0-regular text-foreground-dim py-2 px-4">
                      {perm.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roleGroups.map((rg) => {
                  const isOwner = rg.id === 'owner'
                  return (
                    <tr key={rg.id} className="border-b border-border-dim hover:bg-surface-1 transition-colors">
                      <td className="py-2.5 pr-4 pl-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-foreground-dim" />
                          <span className="text-body-0-regular text-foreground">{rg.name}</span>
                          {isOwner && (
                            <Tag size="compact" type="neutral">system</Tag>
                          )}
                        </div>
                      </td>
                      {group.permissions.map((perm) => (
                        <td key={perm.id} className="py-2.5 px-4 text-center">
                          <div className="flex justify-center">
                            <PermissionCheckbox
                              checked={rg.permissions.includes(perm.id)}
                              disabled={isOwner}
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw className="w-3 h-3 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}

// --- Main modal ---

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('people')
  const {
    roleGroups,
    updateRoleGroup,
    resetRoleGroups,
    projectUserGrants,
    projectTeamGrants,
    createProjectGrant,
    updateGrantProfile,
    revokeGrant,
  } = useAccess()

  const tabs: { id: TabId; label: string }[] = [
    { id: 'people', label: 'People' },
    { id: 'teams', label: 'Teams' },
    { id: 'role-groups', label: 'Role Groups' },
  ]

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <div className="flex flex-col max-h-[80vh]">
        <div className="p-6 pb-0 space-y-5">
          <div>
            <h2 className="text-heading-2 text-foreground">Access Control</h2>
            <p className="text-body-0-regular text-foreground-dim mt-1">
              Manage who can access content and what actions they can take.
            </p>
          </div>

          <div className="flex gap-1 border-b border-border-dim">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2 text-body-0-bold transition-colors border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'border-indigo-500 text-foreground'
                    : 'border-transparent text-foreground-dim hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'people' && (
            <PeopleTab
              grants={projectUserGrants}
              roleGroups={roleGroups}
              onRoleChange={updateGrantProfile}
              onRemove={revokeGrant}
              onAdd={createProjectGrant}
            />
          )}
          {activeTab === 'teams' && (
            <TeamsTab
              grants={projectTeamGrants}
              roleGroups={roleGroups}
              onRoleChange={updateGrantProfile}
              onRemove={revokeGrant}
              onAdd={createProjectGrant}
            />
          )}
          {activeTab === 'role-groups' && (
            <RoleGroupsTab
              roleGroups={roleGroups}
              onUpdate={updateRoleGroup}
              onReset={resetRoleGroups}
            />
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-border-dim">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
