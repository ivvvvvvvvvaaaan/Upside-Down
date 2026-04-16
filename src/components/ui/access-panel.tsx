'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Users, Search, Info, Link2, AlertTriangle, Globe, ShieldOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from './tooltip'
import { Input } from './input'
import { Select } from './select'
import { Button } from './button'
import { RoleSelect } from './role-select'
import { MenuSelect } from './menu-select'
import { Avatar } from './avatar'
import { DepartmentAvatar, ReleaseDomainAvatar } from './department-avatar'
import { PrincipalAvatar } from './principal-avatar'
import { Toggle } from './switch'
import { GrantBadge } from './grant-badge'
import { Modal } from './modal'
import { Tabs, TabsList, Tab, TabsContent } from './tabs'
import { Checkbox } from './checkbox'
import { Card } from './card'
import { domainConfigs } from '@/lib/domain-configs'
import { useAccess, useFileTree, usePersona } from '@/hooks'
import type { Block, Grant, AccessProfileId, ResourceRef, PrincipalRef } from '@/hooks/useAccess'
import { useToast } from './toast'
import { getRoleGroup, roleGroupOptions } from '@/lib/grants'
import type { RoleGroup, ShareMode } from '@/lib/grants'
import { buildAccessDisplayEntries } from './access-display'
import type { AccessDisplayEntry } from './access-display'
import { buildShareSearchResults } from '@/lib/share-search'
import type { GuestLinkSeed } from '@/lib/scenario'
import { getAssetIdVariants } from '@/lib/data'
import { isGrantActive } from '@/lib/grants'
import { useUserCollections } from '@/hooks/useUserCollections'
import { useSmartCollections } from '@/hooks'
import { TEAMS } from '@/lib/teams'
import { PERSONAS } from '@/lib/personas'
import { profileLabel, RELEASE_DOMAINS } from '@/lib/grants'
import type { DomainId } from '@/components/department/types'

function buildVersionLabel(grant: Grant): string | undefined {
  const parts: string[] = []
  if (grant.version) {
    parts.push(`v${grant.version}${grant.versionNote ? ` \u2014 ${grant.versionNote}` : ''}`)
  }
  if (grant.lockedToVersion != null) {
    parts.push(`Locked to v${grant.lockedToVersion}`)
  }
  return parts.length > 0 ? parts.join(' · ') : undefined
}

interface AccessPanelProps {
  resourceId: string
  resourceRef?: ResourceRef
  /** Batch mode: share to multiple resources at once */
  batchResourceRefs?: ResourceRef[]
  readOnly?: boolean
  emptyLabel?: string
  inheritedGrants?: { grant: Grant; fromResourceName: string }[]
  /** Called when dirty state changes — lets parent render Save/Cancel */
  onDirtyChange?: (dirty: boolean, handlers: { save: () => void; cancel: () => void }) => void
  /** Called when pending state changes — lets parent render Add/Cancel in footer */
  onPendingChange?: (pending: boolean, handlers: { confirm: () => void; cancel: () => void }) => void
}

function roleOptionsForResource(roleGroups: RoleGroup[], resourceType?: Grant['resource']['type']) {
  const options = roleGroupOptions(roleGroups)
  if (resourceType !== 'folder') return options

  return options
    .filter((option) => option.value === 'manager' || option.value === 'viewer')
    .map((option) => option.value === 'viewer'
      ? { ...option, label: 'View only', description: 'Open and preview content' }
      : option)
}

function roleLabelForResource(roleGroups: RoleGroup[], profileId: AccessProfileId, resourceType?: Grant['resource']['type']) {
  if (resourceType === 'folder' && profileId === 'viewer') return 'View only'
  return getRoleGroup(roleGroups, profileId)?.name ?? profileId
}


function GrantRow({ grant, readOnly, roleGroups, expanded, onToggleExpanded, onRemove, onBlock, onUpdateProfile, onUpdateShareMode, onReshareSnapshot, onSetMemberOverride, name, subtitle, roleLabel, members, domainId, versionLabel }: {
  grant: Grant
  readOnly: boolean
  roleGroups: RoleGroup[]
  expanded?: boolean
  onToggleExpanded?: () => void
  onRemove?: (grantId: string) => void
  onBlock?: (grantId: string) => void
  onUpdateProfile?: (grantId: string, profileId: AccessProfileId) => void
  onUpdateShareMode?: (grantId: string, mode: ShareMode) => void
  onReshareSnapshot?: (grant: Grant) => void
  onSetMemberOverride?: (memberUserId: string, profileId: AccessProfileId, existingGrantId?: string) => void
  name: string
  subtitle?: string
  roleLabel: string
  members?: AccessDisplayEntry['members']
  domainId?: DomainId
  versionLabel?: string
}) {
  const principal = grant.principal
  const canEdit = !readOnly
  const hideGroupRoleLabel = principal.type === 'team' && expanded && Boolean(members?.length)

  return (
    <div className="py-1 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {principal.type === 'user' ? (
            <Avatar name={name} size="sm" />
          ) : (
            <DepartmentAvatar domainId={domainId} size="sm" />
          )}
          <div className="min-w-0 [&>*]:leading-none">
            <span className="text-body-0-regular text-foreground truncate block">{name}</span>
            {subtitle && (
              <span className="text-body-0-regular text-foreground-dim truncate">
                {subtitle}
                {principal.type === 'team' && members && members.length > 0 && onToggleExpanded && (
                  <>
                    {' '}
                    <span role="button" onClick={onToggleExpanded} className="text-foreground hover:underline cursor-pointer">
                      {expanded ? 'Collapse' : 'See all'}
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!hideGroupRoleLabel && (canEdit && onUpdateProfile ? (() => {
            const roleName = roleLabelForResource(roleGroups, grant.templateId ?? 'viewer', grant.resource.type)
            let extras = 0
            if (grant.resource.type !== 'folder') {
              if (grant.shareMode === 'live') extras++
              if (grant.allowDownload) extras++
              if (grant.allowComment) extras++
            }
            if (grant.lockedToVersion != null) extras++
            const label = extras > 0 ? `${roleName} +${extras}` : roleName
            const showGrantOptions = grant.resource.type === 'collection' && grant.shareMode !== undefined
            return (
            <RoleSelect
              options={roleOptionsForResource(roleGroups, grant.resource.type)}
              value={grant.templateId ?? 'viewer'}
              onChange={(value) => onUpdateProfile(grant.id, value as AccessProfileId)}
              triggerLabel={label}
              footer={showGrantOptions ? (
                <div className="space-y-2">
                  {grant.shareMode !== undefined && (
                    <label className="flex items-center justify-between text-body-0-regular text-foreground-dim cursor-pointer">
                      Include new
                      <Toggle
                        checked={grant.shareMode === 'live'}
                        onChange={() => { if (onUpdateShareMode) onUpdateShareMode(grant.id, grant.shareMode === 'live' ? 'snapshot' : 'live') }}
                        aria-label="Include new"
                      />
                    </label>
                  )}
                </div>
              ) : undefined}
            />
            )
          })() : (
            <GrantBadge grant={grant} roleGroups={roleGroups} />
          ))}
          {canEdit && onRemove && (
            <Button variant="secondary" compact onClick={() => onRemove(grant.id)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {(() => {
        const lines: { label: string; value?: string }[] = []
        if (grant.resource.type !== 'folder') {
          if (grant.allowDownload) lines.push({ label: 'Download', value: 'Yes' })
          if (grant.allowComment) lines.push({ label: 'Comment', value: 'Yes' })
          if (grant.shareMode) lines.push({ label: 'New assets', value: grant.shareMode === 'live' ? 'Included' : 'Snapshot' })
        }
        if (grant.lockedToVersion != null) lines.push({ label: 'Version', value: `Locked to v${grant.lockedToVersion}` })
        const showReshare = canEdit && grant.resource.type === 'collection' && grant.shareMode === 'snapshot' && onReshareSnapshot
        if (lines.length === 0 && !versionLabel) return null
        return (
          <div className="pl-8 space-y-0.5">
            {lines.map((line) => (
              <div key={line.label} className="flex justify-between text-label-0-regular gap-4">
                <span className="text-foreground-dim whitespace-nowrap">{line.label}</span>
                <span className="text-foreground-subtle text-right truncate">{line.value}</span>
              </div>
            ))}
            {versionLabel && (
              <div className="flex justify-between text-label-0-regular gap-4">
                <span className="text-foreground-dim whitespace-nowrap">Version</span>
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-foreground-subtle truncate">{versionLabel}</span>
                  {showReshare && (
                    <button
                      onClick={() => onReshareSnapshot!(grant)}
                      className="text-foreground-dim hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      Re-share
                    </button>
                  )}
                </span>
              </div>
            )}
          </div>
        )
      })()}
      {principal.type === 'team' && members && members.length > 0 && expanded && (
        <div className="relative ml-1">
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
                {onSetMemberOverride ? (
                  <RoleSelect
                    options={[
                      ...roleOptionsForResource(roleGroups, grant.resource.type),
                      ...(member.grantId ? [{ value: '__inherit__', label: 'Use group access', description: 'Remove local override', separated: true }] : []),
                    ]}
                    value={member.roleValue ?? grant.templateId ?? 'viewer'}
                    triggerLabel={roleLabelForResource(roleGroups, member.roleValue ?? grant.templateId ?? 'viewer', grant.resource.type)}
                    onChange={(value) => {
                      if (value === '__inherit__') {
                        if (member.grantId && onRemove) onRemove(member.grantId)
                        return
                      }
                      if (!member.grantId && value === (grant.templateId ?? 'viewer')) return
                      onSetMemberOverride(member.id, value as AccessProfileId, member.grantId)
                    }}
                  />
                ) : !readOnly && member.grantId && onUpdateProfile ? (
                  <RoleSelect
                    options={[
                      ...roleOptionsForResource(roleGroups, grant.resource.type),
                      ...(onRemove ? [{ value: '__remove__', label: 'Remove', destructive: true }] : []),
                    ]}
                    value={member.roleValue ?? 'viewer'}
                    onChange={(value) => {
                      if (value === '__remove__' && onRemove) {
                        onRemove(member.grantId!)
                      } else {
                        onUpdateProfile(member.grantId!, value as AccessProfileId)
                      }
                    }}
                  />
                ) : member.roleValue ? (
                  <RoleSelect
                    options={roleOptionsForResource(roleGroups, grant.resource.type)}
                    value={member.roleValue}
                    onChange={() => {}}
                    disabled
                  />
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
  canManageGuestLink,
  getResourceGuestLinks,
  createGuestLink,
  updateGuestLink,
  revokeGuestLink,
}: {
  resourceId: string
  resourceRef?: ResourceRef
  readOnly: boolean
  canAddGrants: boolean
  canManageGuestLink: (link: GuestLinkSeed) => boolean
  getResourceGuestLinks: (id: string) => GuestLinkSeed[]
  createGuestLink: (resource: ResourceRef, options: { allowDownload: boolean; passcode: boolean; expiresInDays: number }) => void
  updateGuestLink: (linkId: string, updates: Partial<Pick<GuestLinkSeed, 'allowDownload' | 'passcode' | 'expiresAt'>>) => void
  revokeGuestLink: (linkId: string) => void
}) {
  const links = getResourceGuestLinks(resourceId)

  if (links.length > 0) {
    return (
      <div className="rounded-lg bg-surface-mid p-3 space-y-3">
        {links.map(link => {
          const canEdit = !readOnly && canManageGuestLink(link)
          const expiresDate = new Date(link.expiresAt)
          const now = new Date()
          const diffDays = Math.max(1, Math.round((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          const closestOption = [1, 7, 14, 30, 90].reduce((prev, curr) =>
            Math.abs(curr - diffDays) < Math.abs(prev - diffDays) ? curr : prev
          )

          return (
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
                  {canEdit && (
                    <Button
                      variant="secondary-destructive"
                      compact
                      onClick={() => revokeGuestLink(link.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between h-8">
                  <span className="text-body-0-regular text-foreground">Allow download</span>
                  {canEdit ? (
                    <Toggle
                      checked={link.allowDownload}
                      onChange={(v) => updateGuestLink(link.id, { allowDownload: v })}
                      aria-label="Allow download"
                    />
                  ) : (
                    <span className="text-body-0-regular text-foreground-dim">{link.allowDownload ? 'Yes' : 'No'}</span>
                  )}
                </div>
                <div className="flex items-center justify-between h-8">
                  <span className="text-body-0-regular text-foreground">Passcode</span>
                  {canEdit ? (
                    <Toggle
                      checked={link.passcode}
                      onChange={(v) => updateGuestLink(link.id, { passcode: v })}
                      aria-label="Passcode"
                    />
                  ) : (
                    <span className="text-body-0-regular text-foreground-dim">{link.passcode ? 'Required' : 'No'}</span>
                  )}
                </div>
                <div className="flex items-center justify-between h-8">
                  <span className="text-body-0-regular text-foreground">Expires</span>
                  {canEdit ? (
                    <MenuSelect
                      value={String(closestOption)}
                      options={[
                        { value: '1', label: '1 day' },
                        { value: '7', label: '7 days' },
                        { value: '14', label: '14 days' },
                        { value: '30', label: '30 days' },
                        { value: '90', label: '90 days' },
                      ]}
                      onChange={v => {
                        const d = new Date()
                        d.setDate(d.getDate() + Number(v))
                        updateGuestLink(link.id, { expiresAt: d.toISOString().slice(0, 10) })
                      }}
                      size="compact"
                      width="sm"
                    />
                  ) : (
                    <span className="text-body-0-regular text-foreground-dim">{link.expiresAt}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
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
        Create guest link
      </Button>
    )
  }

  return null
}

export function AccessPanel({ resourceId, resourceRef, batchResourceRefs, readOnly = false, emptyLabel = 'Not shared', inheritedGrants, onDirtyChange, onPendingChange }: AccessPanelProps) {
  const isBatch = Boolean(batchResourceRefs && batchResourceRefs.length > 1)
  const {
    getResourceGrants,
    createGrant,
    revokeGrant,
    updateGrantProfile,
    updateGrantShareMode,
    roleGroups,
    canShare,
    canEditAcl,
    getGrantableProfiles,
    getResourceGuestLinks,
    canManageGrant,
    canManageGuestLink,
    createGuestLink,
    updateGuestLink,
    revokeGuestLink,
    restoreResourceGrants,
    restoreResourceGuestLinks,
    getCollectionShareCeiling,
    requestAccess,
    getRemainingAccessPaths,
    blockUser,
    unblockUser,
    isBlocked,
    getBlocksForResource,
  } = useAccess()
  const { resolveCollectionAssetIds } = useFileTree()
  const { showToast } = useToast()
  const { activePersona } = usePersona()
  const [shareTab, setShareTab] = useState<'people' | 'release'>('people')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const toggleGroupExpanded = (id: string) => setExpandedGroups(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  type PendingGrant = { id: string; principal: PrincipalRef; name: string; kind: 'user' | 'team' | 'domain'; role: AccessProfileId; shareMode: ShareMode; expires: boolean; expiresInDays: number; note: string }
  const [pendingGrants, setPendingGrants] = useState<PendingGrant[]>([])
  const [showReleaseWarning, setShowReleaseWarning] = useState(false)
  const [flaggedReleaseRecipients, setFlaggedReleaseRecipients] = useState<{ name: string; reason: string }[]>([])
  const handleConfirmPendingRef = useRef(() => {})
  const handleCancelPendingRef = useRef(() => {})
  const dropdownRef = useRef<HTMLDivElement>(null)

  const grants = getResourceGrants(resourceId)
  const canAddGrants = Boolean(resourceRef) && canShare(resourceRef)
  const canManageAllGrants = Boolean(resourceRef) && canEditAcl(resourceRef)

  // Dirty tracking — snapshot grants on first change, restore on cancel
  const [dirty, setDirty] = useState(false)
  const grantsSnapshotRef = useRef<Grant[] | null>(null)
  const guestLinksSnapshotRef = useRef<GuestLinkSeed[] | null>(null)

  const handleSave = () => {
    grantsSnapshotRef.current = null
    guestLinksSnapshotRef.current = null
    setDirty(false)
    onDirtyChange?.(false, { save: handleSave, cancel: handleCancel })
  }

  const handleCancel = () => {
    if (grantsSnapshotRef.current) {
      restoreResourceGrants(resourceId, grantsSnapshotRef.current)
    }
    if (guestLinksSnapshotRef.current) {
      restoreResourceGuestLinks(resourceId, guestLinksSnapshotRef.current)
    }
    grantsSnapshotRef.current = null
    guestLinksSnapshotRef.current = null
    setDirty(false)
    onDirtyChange?.(false, { save: handleSave, cancel: handleCancel })
  }

  const markDirty = () => {
    if (!dirty) {
      grantsSnapshotRef.current = grants.map(g => ({ ...g }))
      guestLinksSnapshotRef.current = getResourceGuestLinks(resourceId).map((link) => ({ ...link }))
      setDirty(true)
      onDirtyChange?.(true, { save: handleSave, cancel: handleCancel })
    }
  }

  // Role + share mode + expiration
  const [addAsRole, setAddAsRole] = useState<AccessProfileId>('viewer')
  const [shareMode, setShareMode] = useState<ShareMode>('snapshot')
  const [expires, setExpires] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(7)
  const { getCollection, collections, createCollection } = useUserCollections()
  const { getCollection: getSmartCollection, filterAssets, scopedAssets } = useSmartCollections()
  const isCollectionResource = resourceRef?.type === 'collection'
  const isFolderResource = resourceRef?.type === 'folder'
  const isAssetResource = resourceRef?.type === 'asset' || resourceRef?.type === 'cut'

  // Collection-mediated access for assets — "Shared via" section
  // Exclude grants whose principals already appear in inherited/domain grants
  const sharedViaCollections = useMemo(() => {
    if (!isAssetResource) return []
    const variants = new Set(getAssetIdVariants(resourceId))

    // Build set of principals already covered by domain/inherited access
    const coveredPrincipals = new Set<string>()
    for (const ig of (inheritedGrants ?? [])) {
      const p = ig.grant.principal
      coveredPrincipals.add(
        p.type === 'user' ? `user:${p.userId}` : p.type === 'team' ? `team:${p.teamId}` : `domain:${p.domainId}`,
      )
      // If a team grant covers domain members, mark individual members as covered
      if (p.type === 'team') {
        const team = TEAMS.find(t => t.id === p.teamId)
        if (team) {
          for (const uid of team.memberUserIds) coveredPrincipals.add(`user:${uid}`)
        }
      }
    }

    const results: { collection: { id: string; name: string }; grants: Grant[] }[] = []
    for (const collection of collections) {
      const collectionAssetIds = new Set(resolveCollectionAssetIds(collection))
      const hasAsset = Array.from(variants).some(v => collectionAssetIds.has(v))
      if (!hasAsset) continue
      const collGrants = getResourceGrants(collection.id)
        .filter(g => isGrantActive(g))
        .filter(g => {
          const key = g.principal.type === 'user' ? `user:${g.principal.userId}` : g.principal.type === 'team' ? `team:${g.principal.teamId}` : `domain:${g.principal.domainId}`
          return !coveredPrincipals.has(key)
        })
      if (collGrants.length === 0) continue
      results.push({ collection: { id: collection.id, name: collection.name }, grants: collGrants })
    }
    return results
  }, [isAssetResource, resourceId, collections, getResourceGrants, inheritedGrants])

  const addRoleOptions = useMemo(() => {
    if (!resourceRef) return roleOptionsForResource(roleGroups)
    const allowedProfiles = new Set(getGrantableProfiles(resourceRef))
    return roleOptionsForResource(roleGroups, resourceRef.type).filter((option) => allowedProfiles.has(option.value as AccessProfileId))
  }, [resourceRef, roleGroups, getGrantableProfiles])

  // Scoped visibility: what can the current user see in this access panel?
  const canSeeFullAccessList = canAddGrants || canManageAllGrants


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
    const existingDomainIds = new Set(
      grants
        .filter((grant): grant is Grant & { principal: { type: 'domain'; domainId: string } } => grant.principal.type === 'domain')
        .map((grant) => grant.principal.domainId),
    )

    // Domains are shown in a separate checklist, not in search results
    return buildShareSearchResults({
      query,
      activeUserId: activePersona?.id,
      existingUserIds,
      existingTeamIds: existingGroupIds,
      existingDomainIds: new Set(RELEASE_DOMAINS.map(d => d.id)),
    })
  }, [query, activePersona, grants])

  const hasResults = results.length > 0

  const handleSelectPrincipal = (principal: PrincipalRef, name: string, kind: 'user' | 'team' | 'domain') => {
    if (principal.type === 'user' && principal.userId === activePersona?.id) return
    // Don't add duplicates
    const key = principal.type === 'user'
      ? principal.userId
      : principal.type === 'team'
        ? principal.teamId
        : principal.domainId
    if (pendingGrants.some(p => p.id === key)) return

    // Smart defaults based on recipient type
    let defaultRole = addAsRole
    let defaultShareMode = shareMode

    if (kind === 'domain') {
      defaultRole = 'viewer'
      defaultShareMode = 'live'
    } else if (principal.type === 'user') {
      const persona = PERSONAS.find(p => p.id === principal.userId)
      if (persona?.role === 'vendor') {
        defaultRole = isFolderResource ? 'manager' : 'viewer'
        defaultShareMode = 'snapshot'
      }
    }

    setPendingGrants(prev => [...prev, {
      id: key,
      principal,
      name,
      kind,
      role: defaultRole,
      shareMode: defaultShareMode,
      expires,
      expiresInDays,
      note: '',
    }])
    setQuery('')
    setShowDropdown(false)
    onPendingChange?.(true, { confirm: () => handleConfirmPendingRef.current(), cancel: () => handleCancelPendingRef.current() })
  }

  const commitPendingGrants = () => {
    const rawTargets = isBatch && batchResourceRefs ? batchResourceRefs : (resourceRef ? [resourceRef] : [])
    if (rawTargets.length === 0) return

    for (const pending of pendingGrants) {
      for (const rawTarget of rawTargets) {
        let target = rawTarget

        // Smart collections get snapshotted into curated collections
        if (rawTarget.type === 'smart-collection') {
          const smartColl = getSmartCollection(rawTarget.id)
          if (smartColl) {
            const assets = filterAssets(scopedAssets, smartColl.id)
            const assetIds = assets.map(a => a.id)
            const curated = createCollection(smartColl.name, assetIds, {
              sourceSmartCollectionId: smartColl.id,
            })
            target = { id: curated.id, type: 'collection' }
          }
        }

        const targetGrants = getResourceGrants(target.id)
        if (pending.principal.type === 'user' && targetGrants.some(g => g.principal.type === 'user' && g.principal.userId === (pending.principal as { userId: string }).userId)) continue
        if (pending.principal.type === 'team' && targetGrants.some(g => g.principal.type === 'team' && g.principal.teamId === (pending.principal as { teamId: string }).teamId)) continue
        if (pending.principal.type === 'domain' && targetGrants.some(g => g.principal.type === 'domain' && g.principal.domainId === (pending.principal as { domainId: string }).domainId)) continue

        const isCollection = target.type === 'collection'
        const collection = isCollection ? getCollection(target.id) : undefined
        const snapshotAssetIds = pending.shareMode === 'snapshot' && collection
          ? resolveCollectionAssetIds(collection)
          : undefined
        createGrant(target, pending.principal, pending.role, {
          expiresInDays: pending.expires ? pending.expiresInDays : undefined,
          shareMode: isCollection ? pending.shareMode : undefined,
          snapshotAssetIds,
          note: pending.note || undefined,
        })
      }
    }
    setPendingGrants([])
    onPendingChange?.(false, { confirm: () => {}, cancel: () => {} })
  }

  const handleConfirmPending = () => {
    if (pendingGrants.length === 0) return

    // Release shares are broader audiences than normal people/team shares.
    const hasDomainRecipient = pendingGrants.some(p => p.principal.type === 'domain')
    if (hasDomainRecipient) {
      const flagged: { name: string; reason: string }[] = []
      for (const pending of pendingGrants) {
        const p = pending.principal
        if (p.type === 'domain') {
          const domain = RELEASE_DOMAINS.find(d => d.id === p.domainId)
          if (domain) {
            const memberCount = domain.granteeTeamIds.reduce((sum, tid) => {
              const t = TEAMS.find(t2 => t2.id === tid)
              return sum + (t?.memberUserIds?.length ?? 0)
            }, 0) + (domain.granteeUserIds?.length ?? 0)
            flagged.push({ name: pending.name, reason: `Release to ${domain.group} — visible to ~${memberCount} people` })
          }
        }
      }
      if (flagged.length > 0) {
        setFlaggedReleaseRecipients(flagged)
        setShowReleaseWarning(true)
        return
      }
    }

    commitPendingGrants()
  }

  const handleCancelPending = () => {
    setPendingGrants([])
    onPendingChange?.(false, { confirm: () => {}, cancel: () => {} })
  }

  const handleRemovePending = (id: string) => {
    setPendingGrants(prev => {
      const next = prev.filter(p => p.id !== id)
      if (next.length === 0) onPendingChange?.(false, { confirm: () => {}, cancel: () => {} })
      return next
    })
  }

  handleConfirmPendingRef.current = handleConfirmPending
  handleCancelPendingRef.current = handleCancelPending

  const handleRevokeGrant = (grantId: string) => {
    // Capture the grant info before revoking so we can show feedback
    const grant = grants.find(g => g.id === grantId)

    markDirty()
    revokeGrant(grantId)

    // Show revocation feedback
    if (grant) {
      const principal = grant.principal
      let principalName: string
      let checkUserId: string | undefined

      if (principal.type === 'user') {
        const user = PERSONAS.find(p => p.id === principal.userId)
        principalName = user?.name ?? principal.userId
        checkUserId = principal.userId
      } else if (principal.type === 'team') {
        const team = TEAMS.find(t => t.id === principal.teamId)
        principalName = team?.name ?? principal.teamId
        // Check access for first team member as representative
        checkUserId = team?.memberUserIds[0]
      } else {
        const domain = RELEASE_DOMAINS.find(d => d.id === principal.domainId)
        principalName = domain?.name ?? principal.domainId
        checkUserId = undefined
      }

      if (checkUserId) {
        const remaining = getRemainingAccessPaths(checkUserId, resourceId, [grantId])
        if (remaining.length === 0) {
          showToast(`Access fully removed for ${principalName}.`)
        } else {
          const pathCount = remaining.length
          showToast(
            `Removed. ${principalName} still has access through ${pathCount} other path${pathCount === 1 ? '' : 's'}.`,
            'info',
          )
        }
      } else {
        showToast(`Access removed for ${principalName}.`)
      }
    }
  }

  const handleUpdateProfile = (grantId: string, profileId: AccessProfileId) => {
    markDirty()
    updateGrantProfile(grantId, profileId)
  }

  const handleSetMemberOverride = (memberUserId: string, profileId: AccessProfileId, existingGrantId?: string) => {
    if (!resourceRef) return

    markDirty()
    if (existingGrantId) {
      updateGrantProfile(existingGrantId, profileId)
      return
    }

    createGrant(resourceRef, { type: 'user', userId: memberUserId }, profileId)
  }

  const handleUpdateShareMode = (grantId: string, mode: ShareMode) => {
    markDirty()
    updateGrantShareMode(grantId, mode)
  }

  const handleReshareSnapshot = (grant: Grant) => {
    if (grant.resource.type !== 'collection' || grant.shareMode !== 'snapshot') return

    const collection = getCollection(grant.resource.id)
    if (!collection) return

    markDirty()
    createGrant(grant.resource, grant.principal, grant.templateId ?? 'viewer', {
      permissions: grant.templateId ? undefined : grant.permissions,
      shareMode: 'snapshot',
      snapshotAssetIds: resolveCollectionAssetIds(collection),
      expiresAt: grant.expiresAt,
    })
    showToast(`Re-shared "${collection.name}" as a new snapshot version.`)
  }

  const handleBlockUser = (grantId: string) => {
    const grant = grants.find(g => g.id === grantId)
    if (!grant || grant.principal.type !== 'user') return
    const targetUserId = grant.principal.userId
    blockUser(targetUserId, resourceId)
    markDirty()
    revokeGrant(grantId)
    const user = PERSONAS.find(p => p.id === targetUserId)
    showToast(`${user?.name ?? targetUserId} has been blocked.`)
  }

  const handleUnblockUser = (block: Block) => {
    unblockUser(block.userId, block.resourceId)
    markDirty()
    const user = PERSONAS.find(p => p.id === block.userId)
    showToast(`${user?.name ?? block.userId} has been unblocked.`)
  }

  const resourceBlocks = getBlocksForResource(resourceId)
  const isAdmin = activePersona?.isAdmin === true

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
  }, [grants, canManageGrant, inheritedGrants, roleGroups, activePersona?.id, isAssetResource])

  const directEntries = useMemo(() => allEntries.filter(e => !e.sourceName), [allEntries])
  const inheritedEntries = useMemo(() => allEntries.filter(e => !!e.sourceName), [allEntries])

  const inheritedTeamMemberIds = useMemo(() => {
    const memberIds = new Set<string>()
    for (const entry of inheritedEntries) {
      if (entry.grant.principal.type !== 'team') continue
      entry.members?.forEach((member) => memberIds.add(member.id))
    }
    return memberIds
  }, [inheritedEntries])

  const localUserOverrides = useMemo(() => {
    const overrides = new Map<string, Grant>()
    for (const grant of grants) {
      if (!isGrantActive(grant) || grant.principal.type !== 'user') continue
      overrides.set(grant.principal.userId, grant)
    }
    return overrides
  }, [grants])

  const applyLocalMemberOverrides = (entry: AccessDisplayEntry): AccessDisplayEntry => ({
    ...entry,
    members: entry.members?.map((member) => {
      const override = localUserOverrides.get(member.id)
      if (!override) return member
      return {
        ...member,
        grantId: override.id,
        roleValue: override.templateId,
        roleLabel: override.templateId
          ? roleLabelForResource(roleGroups, override.templateId, resourceRef?.type)
          : undefined,
      }
    }),
  })

  const userEntries = useMemo(() =>
    directEntries.filter((entry) => {
      if (entry.grant.principal.type !== 'user') return false
      return !inheritedTeamMemberIds.has(entry.grant.principal.userId)
    }),
    [directEntries, inheritedTeamMemberIds],
  )
  const teamEntries = useMemo(() =>
    directEntries.filter(e => e.grant.principal.type === 'team'),
    [directEntries],
  )
  const domainEntries = useMemo(() =>
    directEntries.filter(e => e.grant.principal.type === 'domain'),
    [directEntries],
  )

  const showTabs = resourceRef?.type === 'asset' || resourceRef?.type === 'cut'
  const peopleCount = userEntries.length + teamEntries.length
  const domainCount = domainEntries.length
  const pendingDomainCount = pendingGrants.filter(p => p.kind === 'domain').length
  const pendingPeopleCount = pendingGrants.filter(p => p.kind !== 'domain').length

  /* ---- Shared sub-sections ---- */

  const searchSection = !readOnly && resourceRef && canAddGrants && addRoleOptions.length > 0 && (
    <div className="flex items-start gap-2">
      <div ref={dropdownRef} className="relative flex-1">
        <Input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
          onFocus={() => { if (query.trim()) setShowDropdown(true) }}
          placeholder="Add people or teams..."
          icon={<Search className="w-4 h-4" />}
          iconPosition="left"
        />
        {showDropdown && query.trim() && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-surface-1 border border-border-dim rounded shadow-lg z-50 max-h-[240px] overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.key}
                onClick={() => handleSelectPrincipal(result.principal, result.name, result.kind)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
              >
                {result.kind === 'user' ? (
                  <Avatar name={result.name} size="sm" />
                ) : (
                  <DepartmentAvatar size="sm" />
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
    </div>
  )

  const haveAccessHeader = (userEntries.length > 0 || teamEntries.length > 0 || sharedViaCollections.length > 0) && (
    <h3 className="text-body-0-bold text-foreground-dim">Have access</h3>
  )

  const userEntriesSection = userEntries.length > 0 && (
    <div className="space-y-0">
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
            domainId={entry.domainId}
            onRemove={!entry.sourceName && !entry.readOnly ? handleRevokeGrant : undefined}
            onBlock={!entry.sourceName && !entry.readOnly && isAdmin && entry.grant.principal.type === 'user' ? handleBlockUser : undefined}
            onUpdateProfile={!entry.sourceName && !entry.readOnly ? handleUpdateProfile : undefined}
            onUpdateShareMode={!entry.readOnly ? handleUpdateShareMode : undefined}
            onReshareSnapshot={!entry.sourceName && !entry.readOnly ? handleReshareSnapshot : undefined}
            versionLabel={buildVersionLabel(entry.grant)}
          />
        ))}
      </div>
    </div>
  )

  const blockedSection = resourceBlocks.length > 0 && (
    <div className="space-y-1">
      <h3 className="text-body-0-bold text-red-400">Blocked</h3>
      <div className="space-y-1">
        {resourceBlocks.map((block) => {
          const blockedUser = PERSONAS.find(p => p.id === block.userId)
          const blockedBy = PERSONAS.find(p => p.id === block.blockedByUserId)
          return (
            <div key={block.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-red-500/10">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldOff className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-body-0-regular text-red-400 truncate block">
                    Blocked: {blockedUser?.name ?? block.userId}
                    {blockedBy ? ` (by ${blockedBy.name}, ${block.blockedAt.slice(0, 10)})` : ` (${block.blockedAt.slice(0, 10)})`}
                  </span>
                  {block.reason && (
                    <span className="text-label-0-regular text-foreground-dim truncate block">{block.reason}</span>
                  )}
                </div>
              </div>
              {isAdmin && (
                <Button variant="secondary-destructive" compact onClick={() => handleUnblockUser(block)}>
                  Unblock
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const teamEntriesSection = teamEntries.length > 0 && (
    <div className="space-y-0">
      {teamEntries.map((entry) => (
        <GrantRow
          key={entry.key}
          grant={entry.grant}
          readOnly={entry.readOnly}
          roleGroups={roleGroups}
          expanded={expandedGroups.has(entry.grant.id)}
          onToggleExpanded={() => toggleGroupExpanded(entry.grant.id)}
          name={entry.name}
          subtitle={entry.subtitle}
          roleLabel={entry.roleLabel}
          members={entry.members}
          domainId={entry.domainId}
          onRemove={!entry.sourceName && !entry.readOnly ? handleRevokeGrant : undefined}
          onUpdateProfile={!entry.sourceName && !entry.readOnly ? handleUpdateProfile : undefined}
          onUpdateShareMode={!entry.readOnly ? handleUpdateShareMode : undefined}
          onReshareSnapshot={!entry.sourceName && !entry.readOnly ? handleReshareSnapshot : undefined}
          versionLabel={buildVersionLabel(entry.grant)}
        />
      ))}
    </div>
  )

  const inheritedEntriesSection = inheritedEntries.length > 0 && (
    <div className="space-y-0">
      <h3 className="text-body-0-bold text-foreground-dim pb-2">Access from parent folders</h3>
      {inheritedEntries.map((entry) => {
        const entryWithOverrides = applyLocalMemberOverrides(entry)
        return (
          <GrantRow
            key={entry.key}
            grant={entryWithOverrides.grant}
            readOnly
            roleGroups={roleGroups}
            expanded={expandedGroups.has(entry.grant.id)}
            onToggleExpanded={() => toggleGroupExpanded(entry.grant.id)}
            name={entryWithOverrides.name}
            subtitle={entryWithOverrides.subtitle}
            roleLabel={entryWithOverrides.roleLabel}
            members={entryWithOverrides.members}
            domainId={entryWithOverrides.domainId}
            onRemove={!readOnly && canManageAllGrants ? handleRevokeGrant : undefined}
            onSetMemberOverride={!readOnly && canManageAllGrants ? handleSetMemberOverride : undefined}
            versionLabel={buildVersionLabel(entry.grant)}
          />
        )
      })}
    </div>
  )

  const sharedViaCollectionsSection = sharedViaCollections.map(({ collection, grants: collGrants }) => {
    const collRef: ResourceRef = { id: collection.id, type: 'collection' }
    const canManageCollection = canEditAcl(collRef)
    const canShareCollection = canShare(collRef)
    return (
      <div key={collection.id} className="space-y-1">
        <h3 className="text-body-0-bold text-foreground-dim">Via <a href={`/nextgen/collections/${collection.id}`} className="hover:text-foreground transition-colors underline">{collection.name}</a></h3>
        <div className="space-y-0">
          {collGrants.map(grant => {
            const principal = grant.principal
            const name = principal.type === 'user'
              ? PERSONAS.find(p => p.id === principal.userId)?.name ?? principal.userId
              : principal.type === 'team'
                ? TEAMS.find(t => t.id === principal.teamId)?.name ?? principal.teamId
                : (() => { const d = RELEASE_DOMAINS.find(d => d.id === principal.domainId); return d ? `${d.name} (${d.group})` : principal.domainId })()
            const domId = principal.type === 'team'
              ? TEAMS.find(t => t.id === principal.teamId)?.domainId
              : principal.type === 'user'
                ? PERSONAS.find(p => p.id === principal.userId)?.domainId
                : undefined
            const canRevoke = canManageCollection || (canShareCollection && activePersona && grant.grantedByUserId === activePersona.id)
            return (
              <GrantRow
                key={grant.id}
                grant={grant}
                readOnly={!canRevoke}
                roleGroups={roleGroups}
                name={name}
                roleLabel={profileLabel(grant.templateId, roleGroups)}
                domainId={domId}
                onRemove={canRevoke ? (id) => { markDirty(); revokeGrant(id) } : undefined}
                onUpdateProfile={canRevoke ? (id, pid) => { markDirty(); updateGrantProfile(id, pid) } : undefined}
                onReshareSnapshot={canRevoke ? handleReshareSnapshot : undefined}
              />
            )
          })}
        </div>
      </div>
    )
  })

  const pendingPeopleSection = pendingGrants.filter(p => p.kind !== 'domain').length > 0 && (
    <div className="space-y-2">
      <h3 className="text-body-0-bold text-foreground-dim">Adding</h3>
      {pendingGrants.filter(p => p.kind !== 'domain').map(pending => (
        <div key={pending.id} className="rounded-lg bg-surface-mid p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {pending.kind === 'user' ? (
                <Avatar name={pending.name} size="sm" />
              ) : (
                <DepartmentAvatar size="sm" />
              )}
              <span className="text-body-0-regular text-foreground truncate">{pending.name}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isCollectionResource && pending.kind !== 'domain' && (
                <label className="flex items-center gap-1.5 mr-2 text-label-0-regular text-foreground-dim cursor-pointer">
                  <Toggle
                    checked={pending.shareMode === 'live'}
                    onChange={(v) => setPendingGrants(prev => prev.map(p => p.id === pending.id ? { ...p, shareMode: v ? 'live' : 'snapshot' } : p))}
                    aria-label="Include new"
                  />
                  <span>Include new</span>
                  <Tooltip label="Show new assets as they're added">
                    <Info className="w-3 h-3 text-foreground-dim" />
                  </Tooltip>
                </label>
              )}
              <RoleSelect
                options={pending.kind === 'domain'
                  ? addRoleOptions.filter(o => o.value === 'viewer')
                  : addRoleOptions}
                value={pending.role}
                onChange={(value) => setPendingGrants(prev => prev.map(p => p.id === pending.id ? { ...p, role: value as AccessProfileId } : p))}
              />
              <Button variant="icon" compact onClick={() => handleRemovePending(pending.id)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <input
            type="text"
            value={pending.note}
            onChange={(e) => setPendingGrants(prev => prev.map(p => p.id === pending.id ? { ...p, note: e.target.value } : p))}
            placeholder="Add a note (optional)"
            className="w-full px-3 py-1.5 bg-surface-low border border-border-dim rounded text-body-0-regular text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-border-subtle transition-colors"
          />
          {isCollectionResource && resourceRef && (() => {
            const ceiling = getCollectionShareCeiling(resourceRef.id, pending.role)
            if (ceiling.total === 0 || ceiling.capped === 0) return null
            const roleName = roleGroups.find(r => r.id === pending.role)?.name?.replace('Can ', '') ?? pending.role
            return (
              <p className="text-label-0-regular text-foreground-subtle px-1">
                {ceiling.atLevel} of {ceiling.total} assets at {roleName}. {ceiling.capped} limited to lower access.{' '}
                <button
                  className="text-foreground-dim hover:text-foreground underline transition-colors"
                  onClick={() => {
                    for (const assetId of ceiling.cappedAssetIds) {
                      requestAccess(assetId, { id: assetId, type: 'asset' })
                    }
                  }}
                >
                  Request higher access
                </button>
              </p>
            )
          })()}
        </div>
      ))}
    </div>
  )

  const peopleEmptyState = inheritedEntries.length === 0 && userEntries.length === 0 && teamEntries.length === 0 && getResourceGuestLinks(resourceId).length === 0 && sharedViaCollections.length === 0 && pendingPeopleCount === 0 && (
    <p className="text-body-0-regular text-foreground-subtle py-2">Use the search above to share with people or teams.</p>
  )

  const guestLinksSection = (
    <div className="pt-2">
      <GuestLinksSection
        resourceId={resourceId}
        resourceRef={resourceRef}
        readOnly={readOnly}
        canAddGrants={canAddGrants}
        canManageGuestLink={canManageGuestLink}
        getResourceGuestLinks={getResourceGuestLinks}
        createGuestLink={(...args) => { markDirty(); return createGuestLink(...args) }}
        updateGuestLink={(...args) => { markDirty(); updateGuestLink(...args) }}
        revokeGuestLink={(...args) => { markDirty(); revokeGuestLink(...args) }}
      />
    </div>
  )

  /* ---- Release tab: unified checklist ---- */

  const releaseChecklist = (() => {
    const releasedDomainGrants = new Map<string, typeof domainEntries[number]>()
    for (const entry of domainEntries) {
      const p = entry.grant.principal as { type: 'domain'; domainId: string }
      releasedDomainGrants.set(p.domainId, entry)
    }
    const pendingDomainIds = new Set(pendingGrants.filter(p => p.kind === 'domain').map(p => p.id))
    const groups = ['Studio', 'Wide', 'Other'] as const
    const domainsByGroup = groups.map(group => ({
      group,
      domains: RELEASE_DOMAINS.filter(d => d.group === group),
    })).filter(g => g.domains.length > 0)
    const domainRoleOptions = addRoleOptions.filter(o => o.value === 'viewer')

    return (
      <div className="space-y-4">
        {domainsByGroup.map(({ group, domains }) => {
          const releasedInGroup = domains.filter(d => releasedDomainGrants.has(d.id))
          const unreleasedInGroup = domains.filter(d => !releasedDomainGrants.has(d.id) && !pendingDomainIds.has(d.id))
          const hasUnreleased = unreleasedInGroup.length > 0

          return (
          <div key={group} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-body-0-bold text-foreground-dim">{group}</span>
              {!readOnly && hasUnreleased && (
                <Button
                  variant="tertiary"
                  compact
                  onClick={() => {
                    for (const d of unreleasedInGroup) {
                      handleSelectPrincipal({ type: 'domain', domainId: d.id }, d.name, 'domain')
                    }
                  }}
                >
                  Release all
                </Button>
              )}
            </div>
            {/* Already released */}
            {releasedInGroup.map(domain => {
              const existingEntry = releasedDomainGrants.get(domain.id)!
              return (
                <div key={domain.id} className="flex items-center gap-2 py-1">
                  <ReleaseDomainAvatar size="sm" />
                  <span className="text-body-0-regular text-foreground flex-1 min-w-0">{domain.name}</span>
                  <RoleSelect
                    options={domainRoleOptions}
                    value={existingEntry.grant.templateId ?? 'viewer'}
                    onChange={(value) => handleUpdateProfile(existingEntry.grant.id, value as AccessProfileId)}
                    disabled={existingEntry.readOnly}
                  />
                  {!existingEntry.readOnly && (
                    <Button variant="secondary" compact onClick={() => handleRevokeGrant(existingEntry.grant.id)}>
                      Remove
                    </Button>
                  )}
                </div>
              )
            })}
            {/* Pending (staged for release) */}
            {domains.filter(d => !releasedDomainGrants.has(d.id) && pendingDomainIds.has(d.id)).map(domain => (
              <div key={domain.id} className="flex items-center gap-2 py-1">
                <span className="text-body-0-regular text-foreground flex-1 min-w-0">{domain.name}</span>
                <RoleSelect
                  options={domainRoleOptions}
                  value={pendingGrants.find(p => p.id === domain.id)?.role ?? 'viewer'}
                  onChange={(value) => setPendingGrants(prev => prev.map(p => p.id === domain.id ? { ...p, role: value as AccessProfileId } : p))}
                />
                <Button variant="secondary" compact onClick={() => handleRemovePending(domain.id)}>
                  Remove
                </Button>
              </div>
            ))}
            {/* Not yet released */}
            {domains.filter(d => !releasedDomainGrants.has(d.id) && !pendingDomainIds.has(d.id)).map(domain => (
              <div key={domain.id} className="flex items-center gap-2 py-1">
                <ReleaseDomainAvatar size="sm" />
                <span className="text-body-0-regular text-foreground flex-1 min-w-0">{domain.name}</span>
                {!readOnly && (
                  <Button variant="primary" compact onClick={() => handleSelectPrincipal({ type: 'domain', domainId: domain.id }, domain.name, 'domain')}>
                    Release
                  </Button>
                )}
              </div>
            ))}
          </div>
        )})}
      </div>
    )
  })()

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

      {showTabs && canSeeFullAccessList && (
        <Tabs defaultValue="people" value={shareTab} onValueChange={(v) => setShareTab(v as 'people' | 'release')}>
          <TabsList>
            <Tab value="people">People {peopleCount > 0 && <span className="text-foreground-subtle ml-2">{peopleCount}</span>}</Tab>
            <Tab value="release">Release {domainCount > 0 && <span className="text-foreground-subtle ml-2">{domainCount}</span>}</Tab>
          </TabsList>
        </Tabs>
      )}

      {/* People content — always rendered, hidden when release tab is active */}
      {(!showTabs || shareTab === 'people') && (
        <>
          {canSeeFullAccessList && searchSection}

          {canSeeFullAccessList ? (
            <div className="space-y-4">
              {inheritedEntriesSection}
              {(userEntries.length > 0 || teamEntries.length > 0 || resourceBlocks.length > 0) && (
                <div>
                  {haveAccessHeader && <div className="pb-2">{haveAccessHeader}</div>}
                  {userEntriesSection}
                  {blockedSection}
                  {teamEntriesSection}
                </div>
              )}
            </div>
          ) : (
            activePersona && (() => {
              const myGrant = grants.find(g =>
                g.principal.type === 'user' && g.principal.userId === activePersona.id
              )
              const myTeamGrant = grants.find(g =>
                g.principal.type === 'team' && TEAMS.some(t => t.id === (g.principal as { teamId: string }).teamId && t.memberUserIds.includes(activePersona.id))
              )
              const grant = myGrant ?? myTeamGrant
              if (!grant) return null
              const grantLabel = profileLabel(grant.templateId, roleGroups)
              const sharedBy = PERSONAS.find(p => p.id === grant.grantedByUserId)
              return (
                <div className="pt-2">
                  <p className="text-body-0-regular text-foreground-subtle">
                    Shared with you by {sharedBy?.name ?? 'someone'} · {grantLabel}
                  </p>
                </div>
              )
            })()
          )}
          {/* Collection grants shown only for collection modals, not assets */}
          {!isAssetResource && canSeeFullAccessList && sharedViaCollectionsSection}
          {canSeeFullAccessList && pendingPeopleSection}
          {canSeeFullAccessList && peopleEmptyState}
          {canSeeFullAccessList && guestLinksSection}
        </>
      )}

      {/* Release content — only when release tab is active */}
      {showTabs && canSeeFullAccessList && shareTab === 'release' && (
        <div className="space-y-4">
          {releaseChecklist}
        </div>
      )}

      {/* Release warning (modal — outside tabs) */}
      <Modal open={showReleaseWarning} onOpenChange={setShowReleaseWarning} size="sm">
        <Modal.Header title="Share to a release audience" />
        <Modal.Body>
          <div className="space-y-3">
            <p className="text-body-0-regular text-foreground-dim">
              {flaggedReleaseRecipients.length === 1 ? 'This release audience is' : 'These release audiences are'} broader than a normal workspace share:
            </p>
            <div className="space-y-2">
              {flaggedReleaseRecipients.map(({ name, reason }) => (
                <div key={name} className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-body-0-regular text-foreground">{name}</span>
                  <span className="text-body-0-regular text-foreground-dim">— {reason}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal.Body>
        <Card.Footer>
          <Button variant="secondary" onClick={() => setShowReleaseWarning(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setShowReleaseWarning(false); commitPendingGrants() }}>Share anyway</Button>
        </Card.Footer>
      </Modal>

    </div>
  )
}
