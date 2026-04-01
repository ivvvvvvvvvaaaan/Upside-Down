'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, Plus, X } from 'lucide-react'
import { Modal } from './modal'
import { Button } from './button'
import { Input } from './input'
import { Select } from './select'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import { useAccess } from '@/hooks'
import { cn } from '@/lib/utils'
import { PERSONAS, initials } from '@/lib/personas'
import { TEAMS, getTeamsForUser } from '@/lib/teams'
import { getRoleGroup } from '@/lib/grants'
import type { Permission, RoleGroup, Grant, AccessProfileId, PrincipalRef } from '@/lib/grants'

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
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'w-5 h-5 rounded-sm border flex items-center justify-center transition-colors',
        checked
          ? 'bg-indigo-500 border-indigo-500'
          : 'bg-surface-flat border-border-subtle hover:border-foreground-dim',
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
  const [newEmail, setNewEmail] = useState('')

  const handleAdd = () => {
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    const persona = PERSONAS.find((p) => p.email === email)
    if (!persona) return
    if (grants.some((g) => g.principal.type === 'user' && g.principal.userId === persona.id)) return
    onAdd({ type: 'user', userId: persona.id }, 'viewer')
    setNewEmail('')
  }

  const options = useMemo(() => roleGroupOptions(roleGroups), [roleGroups])

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h4 className="text-label-1-bold text-foreground">Search Users</h4>
        <div className="flex gap-2">
          <Input
            icon={<Search />}
            iconPosition="left"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Search..."
          />
          <Button variant="secondary" onClick={handleAdd} disabled={!newEmail.trim()}>
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {grants.length === 0 ? (
        <p className="text-body-0-regular text-foreground-dim py-4 text-center">No people added yet.</p>
      ) : (
        <div className="space-y-1">
          {grants.map((grant) => {
            const principal = grant.principal
            if (principal.type !== 'user') return null
            const persona = PERSONAS.find((p) => p.id === principal.userId)
            if (!persona) return null
            const teams = getTeamsForUser(persona.id)

            return (
              <div key={grant.id} className="flex items-center justify-between gap-2 py-2 px-2 rounded hover:bg-surface-1 transition-colors">
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
                  <Select
                    options={options}
                    value={grant.templateId ?? 'viewer'}
                    onChange={(v) => onRoleChange(grant.id, v as AccessProfileId)}
                    size="compact"
                    className="w-auto flex-shrink-0"
                  />
                  <Button variant="icon" size="compact-icon" onClick={() => onRemove(grant.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Departments tab ---

function DepartmentsTab({
  grants,
  roleGroups,
  onRoleChange,
}: {
  grants: Grant[]
  roleGroups: RoleGroup[]
  onRoleChange: (grantId: string, profileId: AccessProfileId) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [customDepts, setCustomDepts] = useState<{ id: string; name: string }[]>([])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const unassignedUsers = useMemo(
    () => {
      const assignedIds = new Set(TEAMS.flatMap(t => t.memberUserIds))
      return PERSONAS.filter(p => !assignedIds.has(p.id))
    },
    [],
  )

  const options = useMemo(() => roleGroupOptions(roleGroups), [roleGroups])

  return (
    <div className="space-y-3">
      <p className="text-body-0-regular text-foreground-dim">
        Departments control who can access content. Members inherit the department's permissions and content scope.
      </p>

      <div className="space-y-1">
        {TEAMS.map((team) => {
          const isOpen = expanded.has(team.id)
          const members = team.memberUserIds
            .map(uid => PERSONAS.find(p => p.id === uid))
            .filter(Boolean)
          const grant = grants.find(
            g => g.principal.type === 'team' && g.principal.teamId === team.id,
          )

          return (
            <div key={team.id} className="rounded">
              <div className="flex items-center justify-between gap-2 py-2 px-2 rounded hover:bg-surface-1 transition-colors">
                <button
                  onClick={() => toggle(team.id)}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <ChevronDown className={cn('w-3.5 h-3.5 text-foreground-dim transition-transform flex-shrink-0', !isOpen && '-rotate-90')} />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-body-0-bold text-foreground truncate block">{team.name}</span>
                    <span className="text-label-0-regular text-foreground-dim block">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </button>
                {grant && (
                  <Select
                    options={options}
                    value={grant.templateId ?? 'viewer'}
                    onChange={(v) => onRoleChange(grant.id, v as AccessProfileId)}
                    size="compact"
                    className="w-auto flex-shrink-0"
                  />
                )}
              </div>
              {isOpen && (
                <div className="ml-6 py-1 space-y-1">
                  {members.map(persona => persona && (
                    <div key={persona.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-1 transition-colors group">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-label-0-bold flex-shrink-0 text-[10px]">
                        {initials(persona.name)}
                      </span>
                      <span className="text-body-0-regular text-foreground truncate flex-1">{persona.name}</span>
                      <span className="text-label-0-regular text-foreground-dim truncate">{persona.title}</span>
                      <span className="text-label-0-regular text-foreground-dim truncate">{persona.email}</span>
                      <Button variant="icon" size="compact-icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-label-0-regular text-foreground-dim py-2 text-center">No members yet</p>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {customDepts.map((dept) => {
          const isOpen = expanded.has(dept.id)
          return (
            <div key={dept.id} className="rounded">
              <div className="flex items-center justify-between gap-2 py-2 px-2 rounded hover:bg-surface-1 transition-colors">
                <button
                  onClick={() => toggle(dept.id)}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <ChevronDown className={cn('w-3.5 h-3.5 text-foreground-dim transition-transform flex-shrink-0', !isOpen && '-rotate-90')} />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-body-0-bold text-foreground truncate block">{dept.name}</span>
                    <span className="text-label-0-regular text-foreground-dim block">0 members</span>
                  </div>
                </button>
                <Button variant="icon" size="compact-icon" onClick={() => setCustomDepts(prev => prev.filter(d => d.id !== dept.id))}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
              {isOpen && (
                <div className="ml-6 py-2">
                  <p className="text-label-0-regular text-foreground-dim text-center">No members yet</p>
                </div>
              )}
            </div>
          )
        })}

        {unassignedUsers.length > 0 && (
          <div className="rounded">
            <div className="flex items-center gap-2 py-2 px-2 rounded hover:bg-surface-1 transition-colors">
              <button
                onClick={() => toggle('unassigned')}
                className="flex items-center gap-2 min-w-0 flex-1"
              >
                <ChevronDown className={cn('w-3.5 h-3.5 text-foreground-dim transition-transform flex-shrink-0', !expanded.has('unassigned') && '-rotate-90')} />
                <div className="min-w-0 flex-1 text-left">
                  <span className="text-body-0-bold text-foreground-dim truncate block">Not in a department</span>
                  <span className="text-label-0-regular text-foreground-dim block">
                    {unassignedUsers.length} {unassignedUsers.length === 1 ? 'person' : 'people'}
                  </span>
                </div>
              </button>
            </div>
            {expanded.has('unassigned') && (
              <div className="ml-6 py-1 space-y-1">
                {unassignedUsers.map(persona => (
                  <div key={persona.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-1 transition-colors">
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
        )}
      </div>

      <Button variant="secondary" onClick={() => {
        const name = prompt('Department name')
        if (name?.trim()) {
          const id = `custom-${name.trim().toLowerCase().replace(/\s+/g, '-')}`
          if (!customDepts.some(d => d.id === id)) {
            setCustomDepts(prev => [...prev, { id, name: name.trim() }])
          }
        }
      }}>
        <Plus className="w-3 h-3 mr-1" />
        New Department
      </Button>
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
}: {
  roleGroups: RoleGroup[]
  onUpdate: (id: string, permissions: Permission[]) => void
  onRename: (id: string, name: string) => void
  onAdd: (name: string, permissions: Permission[]) => void
  onRemove: (id: string) => void
}) {
  const visible = roleGroups.filter(rg => rg.id !== 'owner' && rg.id !== 'link-viewer')

  return (
    <div className="space-y-4">
      <p className="text-body-0-regular text-foreground-dim">
        Role groups define what actions users can take. Assign a role group to a person or department to grant capabilities.
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
                    className="text-body-0-regular text-foreground bg-transparent border-none outline-none w-full hover:bg-surface-2 focus:bg-surface-2 rounded px-1 -mx-1 py-0.5 transition-colors"
                  />
                </td>
                {ALL_PERMISSIONS.map((perm) => (
                  <td key={perm.id} className="py-2.5 px-3 text-center">
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        checked={rg.permissions.includes(perm.id)}
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
                  {!rg.builtIn && (
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

      <Button variant="secondary" onClick={() => {
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
    roleGroups,
    updateRoleGroup,
    renameRoleGroup,
    addRoleGroup,
    removeRoleGroup,
    projectUserGrants,
    projectTeamGrants,
    createProjectGrant,
    updateGrantProfile,
    revokeGrant,
  } = useAccess()

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <div className="flex flex-col max-h-[80vh]">
        <div className="p-6 pb-0">
          <h2 className="text-heading-2 text-foreground">Access Control</h2>
          <p className="text-body-0-regular text-foreground-dim mt-1 mb-4">
            Manage who can access content and what actions they can take.
          </p>

          <Tabs defaultValue="people">
            <TabsList>
              <Tab value="people">People</Tab>
              <Tab value="departments">Departments</Tab>
              <Tab value="role-groups">Role Groups</Tab>
            </TabsList>

            <div className="flex-1 overflow-y-auto max-h-[50vh] px-1 pb-4">
              <TabsContent value="people">
                <PeopleTab
                  grants={projectUserGrants}
                  roleGroups={roleGroups}
                  onRoleChange={updateGrantProfile}
                  onRemove={revokeGrant}
                  onAdd={createProjectGrant}
                />
              </TabsContent>
              <TabsContent value="departments">
                <DepartmentsTab
                  grants={projectTeamGrants}
                  roleGroups={roleGroups}
                  onRoleChange={updateGrantProfile}
                />
              </TabsContent>
              <TabsContent value="role-groups">
                <RoleGroupsTab
                  roleGroups={roleGroups}
                  onUpdate={updateRoleGroup}
                  onRename={renameRoleGroup}
                  onAdd={addRoleGroup}
                  onRemove={removeRoleGroup}
                />
              </TabsContent>
            </div>
          </Tabs>
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
