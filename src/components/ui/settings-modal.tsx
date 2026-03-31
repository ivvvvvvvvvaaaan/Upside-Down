'use client'

import { useState, useMemo } from 'react'
import { Search, RotateCcw, X, ChevronDown, Plus, Users } from 'lucide-react'
import { Modal } from './modal'
import { Button } from './button'
import { Tag } from './tag'
import { useAccess, usePersona } from '@/hooks'
import { cn } from '@/lib/utils'
import { PERSONAS, initials } from '@/lib/personas'
import { TEAMS, getTeamById } from '@/lib/teams'
import { getRoleGroup, profileLabel } from '@/lib/grants'
import type { Permission, RoleGroup, Grant, AccessProfileId, PrincipalRef } from '@/lib/grants'

const ALL_PERMISSIONS: Permission[] = [
  'open',
  'download',
  'write',
  'delete',
  'comment',
  'share',
  'edit-acl',
]

const PERM_LABELS: Record<Permission, string> = {
  'discover': 'View',
  'open': 'View',
  'download': 'Save',
  'write': 'Edit',
  'delete': 'Delete',
  'comment': 'Note',
  'share': 'Share',
  'edit-acl': 'Admin',
}

const PERM_TAG_TYPE: Record<Permission, 'neutral'> = {
  'discover': 'neutral',
  'open': 'neutral',
  'download': 'neutral',
  'write': 'neutral',
  'delete': 'neutral',
  'comment': 'neutral',
  'share': 'neutral',
  'edit-acl': 'neutral',
}

const PERM_SHORT: Record<Permission, string> = {
  'discover': 'View',
  'open': 'View',
  'download': 'Save',
  'write': 'Edit',
  'delete': 'Delete',
  'comment': 'Note',
  'share': 'Share',
  'edit-acl': 'Admin',
}

type TabId = 'people' | 'groups' | 'role-groups'

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

function PermissionBadges({ permissions }: { permissions: Permission[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {permissions.map((perm) => (
        <Tag key={perm} size="compact" type={PERM_TAG_TYPE[perm]}>
          {PERM_SHORT[perm]}
        </Tag>
      ))}
    </div>
  )
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
      if (g.principal.type !== 'user') return false
      const principal = g.principal
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
    // Don't add if already has a project grant
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
            if (grant.principal.type !== 'user') return null
            const principal = grant.principal
            const persona = PERSONAS.find((p) => p.id === principal.userId)
            if (!persona) return null
            const isOwner = grant.templateId === 'owner'

            return (
              <div key={grant.id} className="flex items-center justify-between gap-2 py-2 px-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-label-0-bold flex-shrink-0">
                    {initials(persona.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-body-0-regular text-foreground truncate">{persona.name}</span>
                      <PermissionBadges permissions={grant.permissions} />
                    </div>
                    <span className="text-label-0-regular text-foreground-dim truncate block">{persona.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <PermissionDropdown
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

      {/* Add person */}
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

// --- Groups tab ---

function GroupsTab({
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
      {grants.length === 0 ? (
        <p className="text-body-0-regular text-foreground-dim py-4 text-center">No teams added yet.</p>
      ) : (
        <div className="space-y-1">
          {grants.map((grant) => {
            if (grant.principal.type !== 'team') return null
            const team = getTeamById(grant.principal.teamId)
            if (!team) return null
            return (
              <div key={grant.id} className="flex items-center justify-between gap-2 py-2 px-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-7 h-7 rounded-full bg-surface-3 text-foreground-dim flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-body-0-regular text-foreground truncate">{team.name}</span>
                      <PermissionBadges permissions={grant.permissions} />
                    </div>
                    <span className="text-label-0-regular text-foreground-dim">
                      {team.memberUserIds.length} {team.memberUserIds.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <PermissionDropdown
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
            )
          })}
        </div>
      )}

      {/* Add group */}
      {availableTeams.length > 0 && (
        <div className="relative pt-2 border-t border-border-dim">
          <Button variant="secondary" compact onClick={() => setAddOpen(!addOpen)}>
            <Plus className="w-3 h-3 mr-1" />
            Add Group
          </Button>
          {addOpen && (
            <div className="absolute left-0 top-full mt-1 bg-surface-1 border border-border-dim rounded shadow-lg z-50 min-w-[200px]">
              {availableTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    onAdd({ type: 'team', teamId: team.id }, 'viewer')
                    setAddOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-body-0-regular hover:bg-surface-2 transition-colors flex items-center gap-2"
                >
                  <Users className="w-3 h-3 text-foreground-dim" />
                  <span className="text-foreground">{team.name}</span>
                  <span className="text-label-0-regular text-foreground-dim ml-auto">{team.memberUserIds.length} members</span>
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-dim">
              <th className="text-left text-label-0-bold uppercase text-foreground-dim py-3 pr-4 pl-2">
                Role Group
              </th>
              {ALL_PERMISSIONS.map((perm) => (
                <th key={perm} className="text-center text-label-0-bold uppercase text-foreground-dim py-3 px-3">
                  {PERM_LABELS[perm]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roleGroups.map((group) => {
              const isOwner = group.id === 'owner'
              return (
                <tr key={group.id} className="border-b border-border-dim hover:bg-surface-1 transition-colors">
                  <td className="py-3 pr-4 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="text-body-0-bold text-foreground">{group.name}</span>
                      {isOwner && (
                        <span className="text-label-0-regular text-foreground-dim">(system)</span>
                      )}
                    </div>
                  </td>
                  {ALL_PERMISSIONS.map((perm) => (
                    <td key={perm} className="py-3 px-3 text-center">
                      <div className="flex justify-center">
                        <PermissionCheckbox
                          checked={group.permissions.includes(perm)}
                          disabled={isOwner}
                          onChange={(checked) => {
                            const next = checked
                              ? [...group.permissions, perm]
                              : group.permissions.filter((p) => p !== perm)
                            onUpdate(group.id, next)
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

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-2 text-foreground">Permissions Settings</h2>
            <p className="text-body-0-regular text-foreground-dim mt-1">
              Manage project roles, teams, and permission templates.
            </p>
          </div>
          <Button variant="icon" compact onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border-dim">
          {([
            { id: 'people' as TabId, label: 'People' },
            { id: 'groups' as TabId, label: 'Groups' },
            { id: 'role-groups' as TabId, label: 'Role Groups' },
          ]).map((tab) => (
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

        {/* Tab content */}
        {activeTab === 'people' && (
          <PeopleTab
            grants={projectUserGrants}
            roleGroups={roleGroups}
            onRoleChange={updateGrantProfile}
            onRemove={revokeGrant}
            onAdd={createProjectGrant}
          />
        )}
        {activeTab === 'groups' && (
          <GroupsTab
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
    </Modal>
  )
}
