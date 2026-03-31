'use client'

import { useState, useMemo } from 'react'
import { X, Users, ChevronDown } from 'lucide-react'
import { Button } from './button'
import { Tag } from './tag'
import { cn } from '@/lib/utils'
import { useAccess } from '@/hooks'
import type { Grant, AccessProfileId, ResourceRef, PrincipalRef } from '@/hooks/useAccess'
import { PERSONAS, initials } from '@/lib/personas'
import { getTeamById } from '@/lib/teams'
import { getRoleGroup, profileLabel } from '@/lib/grants'
import type { Permission, RoleGroup } from '@/lib/grants'

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

interface AccessPanelProps {
  resourceId: string
  resourceRef?: ResourceRef
  readOnly?: boolean
  emptyLabel?: string
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

  // Exclude 'owner' from assignable options
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


export function AccessPanel({ resourceId, resourceRef, readOnly = false, emptyLabel = 'Not shared' }: AccessPanelProps) {
  const { getResourceGrants, createGrant, revokeGrant, updateGrantProfile, roleGroups } = useAccess()
  const [newEmail, setNewEmail] = useState('')

  const grants = getResourceGrants(resourceId)

  const handleAddPerson = () => {
    const email = newEmail.trim().toLowerCase()
    if (!email || !resourceRef) return

    const persona = PERSONAS.find((p) => p.email === email)
    if (!persona) return

    // Don't add if already has a grant
    if (grants.some((g) => {
      if (g.principal.type !== 'user') return false
      return g.principal.userId === persona.id
    })) return

    const principal: PrincipalRef = { type: 'user', userId: persona.id }
    createGrant(resourceRef, principal, 'viewer')
    setNewEmail('')
  }

  const handleRemoveGrant = (grantId: string) => {
    revokeGrant(grantId)
  }

  return (
    <section className="space-y-2">
      <h3 className="text-label-0-bold uppercase text-foreground-dim">People</h3>
      <div className="space-y-3">
        {grants.length === 0 && (
          <p className="text-label-1-regular text-foreground-dim">{emptyLabel}</p>
        )}
        <div className="space-y-1">
          {grants.map((grant) => {
            const isOwner = grant.templateId === 'owner'
            const principal = grant.principal
            let name: string
            let subtitle: string | undefined
            if (principal.type === 'user') {
              const persona = PERSONAS.find((p) => p.id === principal.userId)
              name = persona?.name ?? principal.userId
              subtitle = persona?.email
            } else {
              const team = getTeamById(principal.teamId)
              name = team ? `${team.name}` : principal.teamId
              subtitle = team ? `${team.memberUserIds.length} members` : undefined
            }

            const group = getRoleGroup(roleGroups, grant.templateId)

            return (
              <div key={grant.id} className="py-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-label-0-bold flex-shrink-0">
                      {grant.principal.type === 'user'
                        ? initials(name)
                        : name[0].toUpperCase()
                      }
                    </span>
                    <div className="min-w-0">
                      <span className="text-body-0-regular text-foreground truncate block">{name}</span>
                      {subtitle && (
                        <span className="text-label-0-regular text-foreground-dim truncate block">{subtitle}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!readOnly ? (
                      <>
                        <PermissionDropdown
                          value={grant.templateId ?? 'viewer'}
                          onChange={(value) => updateGrantProfile(grant.id, value)}
                          disabled={isOwner}
                          roleGroups={roleGroups}
                        />
                        {!isOwner && (
                          <button
                            onClick={() => handleRemoveGrant(grant.id)}
                            className="p-1 rounded hover:bg-surface-3 text-foreground-dim hover:text-foreground transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-label-0-regular text-foreground-dim px-2 py-1">
                        {profileLabel(grant.templateId, roleGroups)}
                      </span>
                    )}
                  </div>
                </div>
                {grant.permissions.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-8">
                    {grant.permissions.map((perm) => (
                      <Tag key={perm} size="compact" type={PERM_TAG_TYPE[perm]}>
                        {PERM_SHORT[perm]}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add person */}
        {!readOnly && resourceRef && (
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddPerson()}
            placeholder="Add person by email..."
            className={cn(
              'w-full px-2 py-1.5 rounded text-body-0-regular',
              'bg-surface-flat border border-border-dim text-foreground placeholder:text-foreground-dim',
              'focus:outline-none focus:border-indigo-500'
            )}
          />
        )}
      </div>
    </section>
  )
}
