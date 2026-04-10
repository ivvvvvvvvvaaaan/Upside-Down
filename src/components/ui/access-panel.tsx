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
import { DepartmentAvatar } from './department-avatar'
import { Toggle } from './switch'
import { Modal } from './modal'
import { Card } from './card'
import { domainConfigs } from '@/lib/domain-configs'
import { useAccess, usePersona } from '@/hooks'
import type { Block, Grant, AccessProfileId, ResourceRef, PrincipalRef } from '@/hooks/useAccess'
import { useToast } from './toast'
import { getRoleGroup, roleGroupOptions } from '@/lib/grants'
import type { RoleGroup, ShareMode } from '@/lib/grants'
import { buildAccessDisplayEntries } from './access-display'
import type { AccessDisplayEntry } from './access-display'
import { buildShareSearchResults } from '@/lib/share-search'
import type { GuestLinkSeed } from '@/lib/scenario'
import { resolveCollectionAssetIds, getAssetIdVariants } from '@/lib/data'
import { isGrantActive } from '@/lib/grants'
import { useUserCollections } from '@/hooks/useUserCollections'
import { useShareAsCollection } from '@/hooks/useShareAsCollection'
import { DOMAIN_FOLDER_MAP } from '@/lib/workspace-data'
import { TEAMS } from '@/lib/teams'
import { PERSONAS } from '@/lib/personas'
import { profileLabel, RELEASE_DOMAINS } from '@/lib/grants'
import type { DomainId } from '@/components/department/types'

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


function GrantRow({ grant, readOnly, roleGroups, onRemove, onBlock, onUpdateProfile, onUpdateShareMode, name, subtitle, roleLabel, members, domainId, versionLabel }: {
  grant: Grant
  readOnly: boolean
  roleGroups: RoleGroup[]
  onRemove?: (grantId: string) => void
  onBlock?: (grantId: string) => void
  onUpdateProfile?: (grantId: string, profileId: AccessProfileId) => void
  onUpdateShareMode?: (grantId: string, mode: ShareMode) => void
  name: string
  subtitle?: string
  roleLabel: string
  members?: AccessDisplayEntry['members']
  domainId?: DomainId
  versionLabel?: string
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
            <DepartmentAvatar domainId={domainId} size="sm" />
          )}
          <div className="min-w-0">
            <span className="text-body-0-regular text-foreground truncate block">{name}</span>
            {subtitle && (
              <span className="text-body-0-regular text-foreground-dim truncate block">{subtitle}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {grant.allowUpload && (
            <span className="text-label-0-regular text-foreground-dim mr-1">Uploads</span>
          )}
          {grant.shareMode !== undefined && (
            <Tooltip label="Show new assets as they're added">
              <label className="flex items-center gap-1.5 mr-1 text-label-0-regular text-foreground-dim cursor-pointer">
                <span>Include new</span>
                <Info className="w-3 h-3" />
                <Toggle
                  checked={grant.shareMode === 'live'}
                  onChange={() => { if (onUpdateShareMode) onUpdateShareMode(grant.id, grant.shareMode === 'live' ? 'snapshot' : 'live') }}
                  aria-label="Include new"
                />
              </label>
            </Tooltip>
          )}
          {isOwner ? (
            <span className="text-body-0-regular text-foreground-dim px-2 py-1">
              {getRoleGroup(roleGroups, grant.templateId ?? 'owner')?.name ?? 'Owner'}
            </span>
          ) : !readOnly && onUpdateProfile ? (
            <RoleSelect
              options={roleGroupOptions(roleGroups)}
              value={grant.templateId ?? 'view'}
              onChange={(value) => onUpdateProfile(grant.id, value as AccessProfileId)}
            />
          ) : (
            <RoleSelect
              options={roleGroupOptions(roleGroups)}
              value={grant.templateId ?? 'view'}
              onChange={() => {}}
              disabled
            />
          )}
          {!readOnly && !isOwner && onRemove && (
            <button
              onClick={() => onRemove(grant.id)}
              className="text-label-0-regular text-foreground-dim hover:text-red-400 transition-colors flex-shrink-0"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {versionLabel && (
        <div className="pl-9">
          <span className="text-label-0-regular text-foreground-subtle">{versionLabel}</span>
        </div>
      )}
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
                  <RoleSelect
                    options={[
                      ...roleGroupOptions(roleGroups),
                      ...(onRemove ? [{ value: '__remove__', label: 'Remove', destructive: true }] : []),
                    ]}
                    value={member.roleValue ?? 'view'}
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
                    options={roleGroupOptions(roleGroups)}
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
  const { showToast } = useToast()
  const { activePersona } = usePersona()
  const [shareTab, setShareTab] = useState<'people' | 'release'>('people')
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  type PendingGrant = { id: string; principal: PrincipalRef; name: string; kind: 'user' | 'team' | 'domain'; role: AccessProfileId; shareMode: ShareMode; expires: boolean; expiresInDays: number; allowUpload: boolean }
  const [pendingGrants, setPendingGrants] = useState<PendingGrant[]>([])
  const [showCrossDomainWarning, setShowCrossDomainWarning] = useState(false)
  const [flaggedRecipients, setFlaggedRecipients] = useState<{ name: string; reason: string }[]>([])
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
  const [addAsRole, setAddAsRole] = useState<AccessProfileId>('view')
  const [shareMode, setShareMode] = useState<ShareMode>('snapshot')
  const [expires, setExpires] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(7)
  const { getCollection, collections } = useUserCollections()
  const { resolveShareTarget } = useShareAsCollection()
  const isCollectionResource = resourceRef?.type === 'collection'
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

  // Domain access context for workspace-bound collections
  const domainContext = useMemo(() => {
    if (!isCollectionResource || !resourceRef) return null
    const collection = getCollection(resourceRef.id)
    if (!collection?.boundDomainId) return null
    const domId = collection.boundDomainId as DomainId
    const domainFolder = DOMAIN_FOLDER_MAP[domId]
    if (!domainFolder) return null
    const domainRootGrants = getResourceGrants(domainFolder.id)
    if (domainRootGrants.length === 0) return null
    const team = TEAMS.find(t => t.domainId === domId)
    const teamGrant = domainRootGrants.find(g => g.principal.type === 'team' && team && g.principal.teamId === team.id)
    if (!teamGrant) return null
    return {
      teamName: team?.name ?? domainFolder.name,
      roleLabel: profileLabel(teamGrant.templateId, roleGroups),
      domainName: domainFolder.name,
      domId,
    }
  }, [isCollectionResource, resourceRef, getCollection, getResourceGrants, roleGroups])

  const addRoleOptions = useMemo(() => {
    if (!resourceRef) return roleGroupOptions(roleGroups)
    const allowedProfiles = new Set(getGrantableProfiles(resourceRef))
    return roleGroupOptions(roleGroups).filter((option) => allowedProfiles.has(option.value as AccessProfileId))
  }, [resourceRef, roleGroups, getGrantableProfiles])

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
    let defaultAllowUpload = false

    if (kind === 'domain') {
      defaultRole = 'view'
      defaultShareMode = 'live'
    } else if (principal.type === 'user') {
      const persona = PERSONAS.find(p => p.id === principal.userId)
      if (persona?.role === 'vendor') {
        defaultRole = 'add'
        defaultShareMode = 'snapshot'
        defaultAllowUpload = true
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
      allowUpload: defaultAllowUpload,
    }])
    setQuery('')
    setShowDropdown(false)
    onPendingChange?.(true, { confirm: () => handleConfirmPendingRef.current(), cancel: () => handleCancelPendingRef.current() })
  }

  // Determine the resource's domain for cross-domain checks
  const resourceDomainId = useMemo(() => {
    if (resourceRef?.domainId) return resourceRef.domainId
    if (isCollectionResource && resourceRef) {
      const coll = getCollection(resourceRef.id)
      return coll?.boundDomainId as DomainId | undefined
    }
    return undefined
  }, [resourceRef, isCollectionResource, getCollection])

  const resourceDomainName = resourceDomainId ? (domainConfigs[resourceDomainId]?.name ?? resourceDomainId) : undefined

  const commitPendingGrants = () => {
    const rawTargets = isBatch && batchResourceRefs ? batchResourceRefs : (resourceRef ? [resourceRef] : [])
    if (rawTargets.length === 0) return

    for (const pending of pendingGrants) {
      for (const rawTarget of rawTargets) {
        // Folders get converted to workspace collections before granting
        const resolved = rawTarget.type === 'folder'
          ? resolveShareTarget(rawTarget, rawTarget.id)
          : null
        const target = resolved?.resourceRef ?? rawTarget

        const targetGrants = getResourceGrants(target.id)
        if (pending.principal.type === 'user' && targetGrants.some(g => g.principal.type === 'user' && g.principal.userId === (pending.principal as { userId: string }).userId)) continue
        if (pending.principal.type === 'team' && targetGrants.some(g => g.principal.type === 'team' && g.principal.teamId === (pending.principal as { teamId: string }).teamId)) continue

        const isCollection = target.type === 'collection'
        const collection = isCollection ? getCollection(target.id) : undefined
        const snapshotAssetIds = pending.shareMode === 'snapshot' && collection
          ? resolveCollectionAssetIds(collection)
          : undefined
        createGrant(target, pending.principal, pending.role, {
          expiresInDays: pending.expires ? pending.expiresInDays : undefined,
          shareMode: isCollection ? pending.shareMode : undefined,
          snapshotAssetIds,
          allowUpload: pending.allowUpload || undefined,
        })
      }
    }
    setPendingGrants([])
    onPendingChange?.(false, { confirm: () => {}, cancel: () => {} })
  }

  const handleConfirmPending = () => {
    if (pendingGrants.length === 0) return

    // Check for cross-domain, external, or domain-release recipients
    const hasDomainRecipient = pendingGrants.some(p => p.principal.type === 'domain')
    if (resourceDomainId || hasDomainRecipient) {
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
        } else if (p.type === 'user') {
          const persona = PERSONAS.find(u => u.id === p.userId)
          if (persona?.role === 'vendor') {
            flagged.push({ name: pending.name, reason: `External vendor${persona.title ? ` (${persona.title})` : ''}` })
          } else if (!persona?.domainId) {
            flagged.push({ name: pending.name, reason: persona?.title ?? 'No domain' })
          } else if (persona.domainId !== resourceDomainId) {
            const domainName = domainConfigs[persona.domainId]?.name ?? persona.domainId
            flagged.push({ name: pending.name, reason: domainName })
          }
        } else if (p.type === 'team') {
          const team = TEAMS.find(t => t.id === p.teamId)
          if (team?.domainId && team.domainId !== resourceDomainId) {
            const domainName = domainConfigs[team.domainId]?.name ?? team.domainId
            flagged.push({ name: pending.name, reason: domainName })
          } else if (!team?.domainId) {
            flagged.push({ name: pending.name, reason: 'Cross-domain group' })
          }
        }
      }
      if (flagged.length > 0) {
        setFlaggedRecipients(flagged)
        setShowCrossDomainWarning(true)
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

  const handleUpdateShareMode = (grantId: string, mode: ShareMode) => {
    markDirty()
    updateGrantShareMode(grantId, mode)
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
  }, [grants, canManageGrant, inheritedGrants, roleGroups, activePersona?.id])

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
  const domainEntries = useMemo(() =>
    [...directEntries, ...inheritedEntries].filter(e => e.grant.principal.type === 'domain'),
    [directEntries, inheritedEntries],
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

  const haveAccessHeader = (domainContext || userEntries.length > 0 || teamEntries.length > 0 || sharedViaCollections.length > 0) && (
    <h3 className="text-label-1-bold text-foreground-dim">Have access</h3>
  )

  const domainContextRow = domainContext && (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-mid">
      <div className="flex items-center gap-2 min-w-0">
        <DepartmentAvatar domainId={domainContext.domId} size="sm" />
        <div className="min-w-0">
          <span className="text-body-0-regular text-foreground truncate block">{domainContext.teamName}</span>
          <span className="text-label-0-regular text-foreground-dim block">Department access</span>
        </div>
      </div>
      <span className="text-label-0-regular text-foreground-dim flex-shrink-0">{domainContext.roleLabel}</span>
    </div>
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
            versionLabel={entry.grant.version ? `v${entry.grant.version}${entry.grant.versionNote ? ` \u2014 ${entry.grant.versionNote}` : ''}` : undefined}
          />
        ))}
      </div>
    </div>
  )

  const blockedSection = resourceBlocks.length > 0 && (
    <div className="space-y-1">
      <h3 className="text-label-1-bold text-red-400">Blocked</h3>
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
          name={entry.name}
          subtitle={entry.subtitle}
          roleLabel={entry.roleLabel}
          members={entry.members}
          domainId={entry.domainId}
          onRemove={!entry.sourceName && !entry.readOnly ? handleRevokeGrant : undefined}
          onUpdateProfile={!entry.sourceName && !entry.readOnly ? handleUpdateProfile : undefined}
          onUpdateShareMode={!entry.readOnly ? handleUpdateShareMode : undefined}
          versionLabel={entry.grant.version ? `v${entry.grant.version}${entry.grant.versionNote ? ` \u2014 ${entry.grant.versionNote}` : ''}` : undefined}
        />
      ))}
    </div>
  )

  const sharedViaCollectionsSection = sharedViaCollections.map(({ collection, grants: collGrants }) => {
    const collRef: ResourceRef = { id: collection.id, type: 'collection' }
    const canManageCollection = canEditAcl(collRef)
    const canShareCollection = canShare(collRef)
    return (
      <div key={collection.id} className="space-y-1">
        <h3 className="text-label-1-bold text-foreground-dim">Via <a href={`/nextgen/collections/${collection.id}`} className="hover:text-foreground transition-colors underline">{collection.name}</a></h3>
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
              />
            )
          })}
        </div>
      </div>
    )
  })

  const pendingPeopleSection = pendingGrants.filter(p => p.kind !== 'domain').length > 0 && (
    <div className="space-y-2">
      <h3 className="text-label-1-bold text-foreground-dim">Adding</h3>
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
                <>
                <label className="flex items-center gap-1.5 mr-2 text-label-0-regular text-foreground-dim cursor-pointer">
                  <Toggle
                    checked={pending.allowUpload}
                    onChange={(v) => setPendingGrants(prev => prev.map(p => p.id === pending.id ? { ...p, allowUpload: v } : p))}
                    aria-label="Allow uploads"
                  />
                  <span>Uploads</span>
                </label>
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
                </>
              )}
              <RoleSelect
                options={pending.kind === 'domain'
                  ? addRoleOptions.filter(o => o.value === 'view' || o.value === 'comment')
                  : addRoleOptions}
                value={pending.role}
                onChange={(value) => setPendingGrants(prev => prev.map(p => p.id === pending.id ? { ...p, role: value as AccessProfileId } : p))}
              />
              <Button variant="icon" compact onClick={() => handleRemovePending(pending.id)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
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

  const peopleEmptyState = userEntries.length === 0 && teamEntries.length === 0 && getResourceGuestLinks(resourceId).length === 0 && sharedViaCollections.length === 0 && !domainContext && pendingPeopleCount === 0 && (
    <p className="text-body-0-regular text-foreground-dim">{emptyLabel}</p>
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

  /* ---- Release tab sub-sections ---- */

  const domainReleasePills = !readOnly && canAddGrants && resourceRef && (resourceRef.type === 'asset' || resourceRef.type === 'cut') && (() => {
    const releasedDomainIds = new Set(domainEntries.map(e => {
      const p = e.grant.principal as { type: 'domain'; domainId: string }
      return p.domainId
    }))
    const pendingDomainIds = new Set(pendingGrants.filter(p => p.kind === 'domain').map(p => p.id))
    const groups = ['Studio', 'Wide', 'Other'] as const
    const domainsByGroup = groups.map(group => ({
      group,
      domains: RELEASE_DOMAINS.filter(d => d.group === group),
    })).filter(g => g.domains.length > 0)

    return (
      <div className="space-y-2">
        <div className="space-y-1.5">
          {domainsByGroup.map(({ group, domains }) => {
            const unreleased = domains.filter(d => !releasedDomainIds.has(d.id) && !pendingDomainIds.has(d.id))
            const hasUnreleased = unreleased.length > 0
            return (
            <div key={group} className="flex flex-wrap items-center gap-1">
              <span className="text-label-0-regular text-foreground-subtle w-10 flex-shrink-0">{group}</span>
              {hasUnreleased && (
                <button
                  onClick={() => {
                    for (const d of unreleased) {
                      handleSelectPrincipal({ type: 'domain', domainId: d.id }, d.name, 'domain')
                    }
                  }}
                  className="text-label-0-regular text-foreground-subtle hover:text-foreground transition-colors mr-1"
                >
                  all
                </button>
              )}
              {domains.map(domain => {
                const isReleased = releasedDomainIds.has(domain.id)
                const isPending = pendingDomainIds.has(domain.id)
                return (
                  <button
                    key={domain.id}
                    disabled={isReleased}
                    onClick={() => {
                      if (isReleased) return
                      if (isPending) {
                        handleRemovePending(domain.id)
                      } else {
                        handleSelectPrincipal({ type: 'domain', domainId: domain.id }, domain.name, 'domain')
                      }
                    }}
                    className={cn(
                      'px-2 py-0.5 rounded text-label-0-regular transition-colors',
                      isReleased
                        ? 'bg-surface-interactive text-foreground-dim cursor-default'
                        : isPending
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                          : 'bg-surface-mid text-foreground-dim hover:bg-surface-2 hover:text-foreground',
                    )}
                  >
                    {domain.name}
                  </button>
                )
              })}
            </div>
            )
          })}
        </div>
      </div>
    )
  })()

  const domainEntriesSection = domainEntries.length > 0 && (
    <div className="space-y-0">
      {domainEntries.map((entry) => {
        const domainPrincipal = entry.grant.principal as { type: 'domain'; domainId: string }
        const domain = RELEASE_DOMAINS.find(d => d.id === domainPrincipal.domainId)
        const domainRoleOptions = addRoleOptions.filter(o => o.value === 'view' || o.value === 'comment')
        return (
          <div key={entry.key} className="flex items-center gap-2 py-1.5 transition-colors group">
            <div className="w-7 h-7 rounded-full bg-surface-mid flex items-center justify-center flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-foreground-dim" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-body-0-regular text-foreground truncate block">
                Released to {domain?.name ?? domainPrincipal.domainId}
              </span>
              <span className="text-label-0-regular text-foreground-dim">{domain?.group ?? 'Domain'}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <RoleSelect
                options={domainRoleOptions}
                value={entry.grant.templateId ?? 'view'}
                onChange={(value) => handleUpdateProfile(entry.grant.id, value as AccessProfileId)}
                disabled={entry.readOnly}
              />
              {!entry.readOnly && (
                <button
                  onClick={() => handleRevokeGrant(entry.grant.id)}
                  className="text-label-0-regular text-foreground-dim hover:text-red-400 transition-colors flex-shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const releaseEmptyState = domainEntries.length === 0 && pendingDomainCount === 0 && (
    <p className="text-body-0-regular text-foreground-dim">No domains released yet. Select domains above to release.</p>
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

      {showTabs ? (
        <>
          {/* Tabs */}
          <div className="flex gap-0 border-b border-border-dim">
            <button
              onClick={() => setShareTab('people')}
              className={cn(
                'px-3 py-2 text-label-1-bold border-b-2 -mb-px transition-colors',
                shareTab === 'people'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-foreground-dim hover:text-foreground',
              )}
            >
              People {peopleCount > 0 && <span className="text-foreground-subtle ml-1">{peopleCount}</span>}
            </button>
            <button
              onClick={() => setShareTab('release')}
              className={cn(
                'px-3 py-2 text-label-1-bold border-b-2 -mb-px transition-colors',
                shareTab === 'release'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-foreground-dim hover:text-foreground',
              )}
            >
              Release {domainCount > 0 && <span className="text-foreground-subtle ml-1">{domainCount}</span>}
            </button>
          </div>

          {/* People tab */}
          {shareTab === 'people' && (
            <div className="space-y-4">
              {searchSection}
              {haveAccessHeader}
              {domainContextRow}
              {userEntriesSection}
              {blockedSection}
              {teamEntriesSection}
              {sharedViaCollectionsSection}
              {pendingPeopleSection}
              {peopleEmptyState}
              {guestLinksSection}
            </div>
          )}

          {/* Release tab */}
          {shareTab === 'release' && (
            <div className="space-y-4">
              {domainReleasePills}
              {domainEntriesSection}
              {releaseEmptyState}
            </div>
          )}
        </>
      ) : (
        /* No tabs — collections/folders: people content only */
        <>
          {searchSection}
          {haveAccessHeader}
          {domainContextRow}
          {userEntriesSection}
          {blockedSection}
          {teamEntriesSection}
          {sharedViaCollectionsSection}
          {pendingPeopleSection}
          {peopleEmptyState}
          {guestLinksSection}
        </>
      )}

      {/* Cross-domain warning (modal — outside tabs) */}
      <Modal open={showCrossDomainWarning} onOpenChange={setShowCrossDomainWarning} size="sm">
        <Modal.Header title={`Sharing outside ${resourceDomainName ?? 'this department'}`} />
        <Modal.Body>
          <div className="space-y-3">
            <p className="text-body-0-regular text-foreground-dim">
              {flaggedRecipients.length === 1 ? 'This person is' : 'These people are'} not part of {resourceDomainName ?? 'this department'}:
            </p>
            <div className="space-y-2">
              {flaggedRecipients.map(({ name, reason }) => (
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
          <Button variant="secondary" onClick={() => setShowCrossDomainWarning(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setShowCrossDomainWarning(false); commitPendingGrants() }}>Share anyway</Button>
        </Card.Footer>
      </Modal>

    </div>
  )
}
