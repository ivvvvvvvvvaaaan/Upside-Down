'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, Plus, X } from 'lucide-react'
import { Modal } from './modal'
import { Button } from './button'
import { Input } from './input'
import { Select } from './select'
import { Avatar } from './avatar'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import { useAccess } from '@/hooks'
import { cn } from '@/lib/utils'
import { PERSONAS } from '@/lib/personas'
import { TEAMS, getTeamsForUser } from '@/lib/teams'
import { getRoleGroup } from '@/lib/grants'
import type { Permission, RoleGroup, Grant, AccessProfileId, PrincipalRef, ResourceRef } from '@/lib/grants'
import type { DepartmentId } from '@/components/department/types'
import { DEPARTMENT_FOLDER_MAP } from '@/lib/workspace-data'

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
                  <Avatar name={persona.name} size="sm" />
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
                    borderless
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
  roleGroups,
  getResourceGrants,
  onRoleChange,
  onAddOverride,
  onRemoveOverride,
  canShareResource,
  canEditResource,
}: {
  roleGroups: RoleGroup[]
  getResourceGrants: (resourceId: string) => Grant[]
  onRoleChange: (grantId: string, profileId: AccessProfileId) => void
  onAddOverride: (resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId) => void
  onRemoveOverride: (grantId: string) => void
  canShareResource: (resource: ResourceRef) => boolean
  canEditResource: (resource: ResourceRef) => boolean
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

  const options = useMemo(() => roleGroupOptions(roleGroups), [roleGroups])
  const departments = useMemo(
    () => (Object.keys(DEPARTMENT_FOLDER_MAP) as DepartmentId[]).map((departmentId) => ({
      departmentId,
      folder: DEPARTMENT_FOLDER_MAP[departmentId],
      team: TEAMS.find((candidate) => candidate.departmentId === departmentId),
    })),
    [],
  )

  return (
    <div className="space-y-3">
      <p className="text-body-0-regular text-foreground-dim">
        Departments control who can access content. Members inherit the department's permissions and content scope.
      </p>

      <div className="space-y-1">
        {departments.map(({ departmentId, folder, team }) => {
          const isOpen = expanded.has(departmentId)
          const members = (team?.memberUserIds ?? [])
            .map(uid => PERSONAS.find(p => p.id === uid))
            .filter(Boolean)
          const resourceRef: ResourceRef = { id: folder.id, type: 'folder', departmentId }
          const rootGrants = getResourceGrants(resourceRef.id)
          const grant = team
            ? rootGrants.find(g => g.principal.type === 'team' && g.principal.teamId === team.id)
            : undefined
          const canShareDepartment = canShareResource(resourceRef)
          const canEditDepartment = canEditResource(resourceRef)
          const inheritedRoleLabel = grant
            ? getRoleGroup(roleGroups, grant.templateId ?? 'viewer')?.name ?? grant.templateId ?? 'Viewer'
            : 'No default access'

          return (
            <div key={departmentId} className="rounded">
              <div className="flex items-center justify-between gap-2 py-2 px-2 rounded hover:bg-surface-1 transition-colors">
                <button
                  onClick={() => toggle(departmentId)}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <ChevronDown className={cn('w-3.5 h-3.5 text-foreground-dim transition-transform flex-shrink-0', !isOpen && '-rotate-90')} />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-body-0-bold text-foreground truncate block">{folder.name}</span>
                    <span className="text-label-0-regular text-foreground-dim block">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </button>
                {grant ? (
                  <Select
                    options={options}
                    value={grant.templateId ?? 'viewer'}
                    onChange={(v) => onRoleChange(grant.id, v as AccessProfileId)}
                    size="compact"
                    borderless
                    className="w-auto flex-shrink-0"
                    disabled={!canEditDepartment}
                  />
                ) : (
                  <span className="text-label-0-regular text-foreground-dim flex-shrink-0">
                    No default access
                  </span>
                )}
              </div>
              {isOpen && (
                <div className="relative py-1">
                  {members.filter(Boolean).map((persona, i, arr) => persona && (
                    <div key={persona.id} className="relative flex items-center gap-2 py-1.5 pl-4 pr-2 rounded hover:bg-surface-1 transition-colors">
                      {/* Vertical trunk: top half always, bottom half except last */}
                      <div className="absolute left-1.5 top-0 h-1/2 border-l border-border-dim" />
                      {i < arr.length - 1 && (
                        <div className="absolute left-1.5 top-1/2 bottom-0 border-l border-border-dim" />
                      )}
                      {/* Horizontal branch */}
                      <div className="absolute left-1.5 top-1/2 w-2.5 border-t border-border-dim" />
                      <Avatar name={persona.name} size="sm" className="relative" />
                      <div className="min-w-0 flex-1">
                        <span className="text-body-0-regular text-foreground truncate block">{persona.name}</span>
                        <span className="text-label-0-regular text-foreground-dim truncate block">{persona.email}</span>
                      </div>
                      {(() => {
                        const overrideGrant = rootGrants.find(
                          (candidate) => candidate.principal.type === 'user' && candidate.principal.userId === persona.id,
                        )
                        const memberOptions = [
                          { value: '__inherit__', label: grant ? `Inherits ${inheritedRoleLabel}` : inheritedRoleLabel },
                          ...options,
                        ]

                        return (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Select
                              options={memberOptions}
                              value={overrideGrant?.templateId ?? '__inherit__'}
                              onChange={(value) => {
                                if (value === '__inherit__') {
                                  if (overrideGrant) onRemoveOverride(overrideGrant.id)
                                  return
                                }

                                if (overrideGrant) {
                                  onRoleChange(overrideGrant.id, value as AccessProfileId)
                                  return
                                }

                                onAddOverride(
                                  resourceRef,
                                  { type: 'user', userId: persona.id },
                                  value as AccessProfileId,
                                )
                              }}
                              size="compact"
                              borderless
                              className="w-auto min-w-[160px]"
                              disabled={overrideGrant ? !canEditDepartment : !canShareDepartment}
                            />
                            {overrideGrant && canEditDepartment && (
                              <Button variant="icon" size="compact-icon" onClick={() => onRemoveOverride(overrideGrant.id)}>
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-label-0-regular text-foreground-dim py-2 pl-4 text-center">No members yet</p>
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
    getResourceGrants,
    projectUserGrants,
    createProjectGrant,
    createGrant,
    updateGrantProfile,
    revokeGrant,
    canShare,
    canEditAcl,
    discoveryEnabled,
    setDiscoveryEnabled,
    discoveryDisabledDepartments,
    toggleDepartmentDiscovery,
  } = useAccess()

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <div className="flex flex-col max-h-[80vh]">
        <div className="pb-0">
          <Modal.Header
            title="Access Control"
            subtitle="Manage who can access content and what actions they can take."
          />

          <Tabs defaultValue="people" className="px-6 pt-4">
            <TabsList>
              <Tab value="people">People</Tab>
              <Tab value="departments">Departments</Tab>
              <Tab value="role-groups">Role Groups</Tab>
              <Tab value="settings">Settings</Tab>
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
                  roleGroups={roleGroups}
                  getResourceGrants={getResourceGrants}
                  onRoleChange={updateGrantProfile}
                  onAddOverride={createGrant}
                  onRemoveOverride={revokeGrant}
                  canShareResource={canShare}
                  canEditResource={canEditAcl}
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
              <TabsContent value="settings">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-0-bold text-foreground">Asset Discovery</p>
                      <p className="text-body-0-regular text-foreground-dim">
                        Allow users to see restricted assets as blurred tiles and request access
                      </p>
                    </div>
                    <button
                      onClick={() => setDiscoveryEnabled(!discoveryEnabled)}
                      className={cn(
                        'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
                        discoveryEnabled ? 'bg-indigo-500' : 'bg-surface-3'
                      )}
                    >
                      <div className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                        discoveryEnabled ? 'left-5' : 'left-1'
                      )} />
                    </button>
                  </div>
                  {discoveryEnabled && (
                    <div className="space-y-1">
                      <p className="text-label-1-bold text-foreground-dim">Department overrides</p>
                      {(Object.keys(DEPARTMENT_FOLDER_MAP) as DepartmentId[]).map((deptId) => {
                        const disabled = discoveryDisabledDepartments.has(deptId)
                        return (
                          <div key={deptId} className="flex items-center justify-between py-1">
                            <span className="text-body-0-regular text-foreground">{DEPARTMENT_FOLDER_MAP[deptId].name}</span>
                            <button
                              onClick={() => toggleDepartmentDiscovery(deptId)}
                              className={cn(
                                'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
                                !disabled ? 'bg-indigo-500' : 'bg-surface-3'
                              )}
                            >
                              <div className={cn(
                                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                                !disabled ? 'left-5' : 'left-1'
                              )} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
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
