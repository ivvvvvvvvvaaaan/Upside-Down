'use client'

import { useEffect, useState, useMemo, useRef, type ReactNode } from 'react'
import { X, Search, Info, Link2, ShieldOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Textarea } from './textarea'
import { Button } from './button'
import { ROLE_DESCRIPTIONS, RoleSelect } from './role-select'
import { MenuSelect } from './menu-select'
import { Avatar } from './avatar'
import { DepartmentAvatar, ReleaseDomainAvatar } from './department-avatar'
import { Toggle } from './switch'
import { Modal } from './modal'
import { Tabs, TabsList, Tab } from './tabs'
import { Card } from './card'
import { Popover, PopoverAnchor, PopoverContent } from './popover'
import {
  CollectionAccessSourceRow,
  FolderAccessSourceRow,
  getAccessSourcePeopleLabel,
} from './collection-access-source-row'
import { useAccess, useFileTree, usePersona } from '@/hooks'
import type { Block, Grant, AccessProfileId, ResourceRef, PrincipalRef } from '@/hooks/useAccess'
import { useToast } from './toast'
import {
  isGrantActive,
  profileLabel,
  RELEASE_DOMAINS,
  roleLabelForResource,
  roleOptionsForResource,
} from '@/lib/grants'
import type { RoleGroup, ShareMode } from '@/lib/grants'
import { buildAccessDisplayEntries } from './access-display'
import type { AccessDisplayEntry } from './access-display'
import { buildShareSearchResults } from '@/lib/share-search'
import type { GuestLinkSeed } from '@/lib/scenario'
import { getAssetIdVariants } from '@/lib/data'
import { useUserCollections } from '@/hooks/useUserCollections'
import { useSmartCollections } from '@/hooks'
import { TEAMS } from '@/lib/teams'
import { PERSONAS } from '@/lib/personas'
import type { DomainId } from '@/components/department/types'

interface AccessPanelProps {
  resourceId: string
  resourceRef?: ResourceRef
  /** Batch mode: share to multiple resources at once */
  batchResourceRefs?: ResourceRef[]
  readOnly?: boolean
  inheritedGrants?: { grant: Grant; fromResourceName: string }[]
  /** Called when dirty state changes — lets parent render Save/Cancel */
  onDirtyChange?: (dirty: boolean, handlers: { save: () => void; cancel: () => void }) => void
  /** Called when pending state changes — lets parent render confirm/cancel in footer */
  onPendingChange?: (
    pending: boolean,
    handlers: { confirm: () => void; cancel: () => void; confirmLabel?: string; cancelLabel?: string },
  ) => void
  /** Lets the parent swap its modal/panel header — used when the panel takes
   *  over the chrome for a sub-flow (e.g. the two-step Grant access add). */
  onHeaderChange?: (override: { title: string; subtitle?: string; onBack: () => void } | null) => void
}

const SHARE_MODE_OPTIONS: { value: ShareMode; label: string; description: string }[] = [
  { value: 'snapshot', label: 'Snapshot',    description: 'Current items only' },
  { value: 'live',     label: 'Auto-update', description: 'Includes future additions' },
]

/**
 * Picks how a collection share stays scoped over time: a frozen snapshot
 * or a live link that auto-includes new additions. Rendered as a sibling
 * dropdown to the role select so each decision has its own visible trigger.
 */
function ShareModeSelect({ mode, onChange }: { mode: ShareMode; onChange: (mode: ShareMode) => void }) {
  return (
    <MenuSelect
      size="compact"
      value={mode}
      options={SHARE_MODE_OPTIONS}
      onChange={(value) => onChange(value as ShareMode)}
    />
  )
}

function ShareModeState({ mode }: { mode: ShareMode }) {
  if (mode === 'snapshot') return null

  return (
    <span className="text-body-0-regular text-foreground-dim">
      Auto-update
    </span>
  )
}

function getGrantRoleTriggerLabel(grant: Grant, roleGroups: RoleGroup[]) {
  const roleName = grant.templateId ? roleLabelForResource(roleGroups, grant.templateId) : 'Custom'
  let extras = 0
  if (grant.resource.type !== 'folder') {
    if (grant.allowDownload) extras++
    if (grant.allowComment) extras++
  }
  if (grant.lockedToVersion != null) extras++
  return extras > 0 ? `${roleName} +${extras}` : roleName
}

/** Visual radio row used in the two-step Add Access flow. */
function PermissionRadio({
  selected,
  title,
  description,
  onClick,
}: { selected: boolean; title: string; description?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-md text-left transition-colors',
        selected ? 'bg-primary/5' : 'hover:bg-surface-highlight',
      )}
    >
      <div className={cn(
        'mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
        selected ? 'border-primary' : 'border-border-subtle',
      )}>
        <div className={cn(
          'w-2 h-2 rounded-full bg-primary transition-transform',
          selected ? 'scale-100' : 'scale-0',
        )} />
      </div>
      <div className="flex flex-col">
        <span className="text-body-1-bold text-foreground">{title}</span>
        {description && (
          <span className="text-label-1-regular text-foreground-dim">{description}</span>
        )}
      </div>
    </button>
  )
}

function GrantRow({ grant, readOnly, roleGroups, expanded, onToggleExpanded, onRemove, onBlock, onUpdateProfile, onSetMemberOverride, name, subtitle, members, domainId }: {
  grant: Grant
  readOnly: boolean
  roleGroups: RoleGroup[]
  expanded?: boolean
  onToggleExpanded?: () => void
  onRemove?: (grantId: string) => void
  onBlock?: (grantId: string) => void
  onUpdateProfile?: (grantId: string, profileId: AccessProfileId) => void
  onSetMemberOverride?: (memberUserId: string, profileId: AccessProfileId, existingGrantId?: string) => void
  name: string
  subtitle?: ReactNode
  members?: AccessDisplayEntry['members']
  domainId?: DomainId
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
            const showShareModeState = grant.resource.type === 'collection' && grant.shareMode !== undefined
            return (
            <>
              {showShareModeState && grant.shareMode !== undefined && (
                <ShareModeState mode={grant.shareMode} />
              )}
              <RoleSelect
                options={roleOptionsForResource(roleGroups, grant.resource.type)}
                value={grant.templateId ?? 'viewer'}
                onChange={(value) => onUpdateProfile(grant.id, value as AccessProfileId)}
                triggerLabel={getGrantRoleTriggerLabel(grant, roleGroups)}
              />
            </>
            )
          })() : (
            <>
              {grant.resource.type === 'collection' && grant.shareMode !== undefined && (
                <ShareModeState mode={grant.shareMode} />
              )}
              <RoleSelect
                options={roleOptionsForResource(roleGroups, grant.resource.type)}
                value={grant.templateId ?? 'viewer'}
                onChange={() => {}}
                triggerLabel={getGrantRoleTriggerLabel(grant, roleGroups)}
                disabled
              />
            </>
          ))}
          {canEdit && onRemove && (
            <Button variant="secondary" compact onClick={() => onRemove(grant.id)}>
              Remove
            </Button>
          )}
          {canEdit && onBlock && (
            <Button variant="secondary-destructive" compact onClick={() => onBlock(grant.id)}>
              Block
            </Button>
          )}
        </div>
      </div>
      {(() => {
        const lines: { label: string; value?: string }[] = []
        if (grant.resource.type !== 'folder') {
          if (grant.allowDownload) lines.push({ label: 'Download', value: 'Yes' })
          if (grant.allowComment) lines.push({ label: 'Comment', value: 'Yes' })
        }
        if (grant.lockedToVersion != null) lines.push({ label: 'Version', value: `Locked to v${grant.lockedToVersion}` })
        if (lines.length === 0) return null
        return (
          <div className="pl-8 space-y-0.5">
            {lines.map((line) => (
              <div key={line.label} className="flex justify-between text-label-0-regular gap-4">
                <span className="text-foreground-dim whitespace-nowrap">{line.label}</span>
                <span className="text-foreground-subtle text-right truncate">{line.value}</span>
              </div>
            ))}
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
                    triggerLabel={roleLabelForResource(roleGroups, member.roleValue ?? grant.templateId ?? 'viewer')}
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

export function AccessPanel({ resourceId, resourceRef, batchResourceRefs, readOnly = false, inheritedGrants, onDirtyChange, onPendingChange, onHeaderChange }: AccessPanelProps) {
  const isBatch = Boolean(batchResourceRefs && batchResourceRefs.length > 1)
  const {
    getResourceGrants,
    createGrant,
    revokeGrant,
    updateGrantProfile,
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
    getRemainingAccessPaths,
    blockUser,
    unblockUser,
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
  // Two-step add flow: when a principal is picked from the search dropdown,
  // the panel switches into "add" mode (step 2) where the user picks one
  // permission (and sharing mode) that applies to every staged recipient,
  // then commits with Share. Editing existing grants still happens inline
  // via the dropdowns on each row.
  type AddingPrincipal = { principal: PrincipalRef; name: string; kind: 'user' | 'team' | 'domain'; key: string }
  const [addingPrincipals, setAddingPrincipals] = useState<AddingPrincipal[]>([])
  const [addingRole, setAddingRole] = useState<AccessProfileId | null>(null)
  const [addingShareMode, setAddingShareMode] = useState<ShareMode>('snapshot')
  const [addingNote, setAddingNote] = useState('')
  const [addingRoleWarning, setAddingRoleWarning] = useState(false)
  const addingActive = addingPrincipals.length > 0
  const [shareNote, setShareNote] = useState('')
  const [showReleaseWarning, setShowReleaseWarning] = useState(false)
  const [flaggedReleaseRecipients, setFlaggedReleaseRecipients] = useState<{ name: string; reason: string }[]>([])
  const handleConfirmPendingRef = useRef(() => {})
  const handleCancelPendingRef = useRef(() => {})
  const commitAddRef = useRef(() => {})
  const addInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (addingPrincipals.length > 0) {
      requestAnimationFrame(() => addInputRef.current?.focus())
    }
  }, [addingPrincipals.length])

  const grants = getResourceGrants(resourceId)
  const canAddGrants = Boolean(resourceRef) && canShare(resourceRef)
  const canManageAllGrants = Boolean(resourceRef) && canEditAcl(resourceRef)

  // Dirty tracking — snapshot grants on first change, restore on cancel
  const [dirty, setDirty] = useState(false)
  const grantsSnapshotRef = useRef<Map<string, Grant[]> | null>(null)
  const guestLinksSnapshotRef = useRef<Map<string, GuestLinkSeed[]> | null>(null)

  const handleSave = () => {
    grantsSnapshotRef.current = null
    guestLinksSnapshotRef.current = null
    setDirty(false)
    onDirtyChange?.(false, { save: handleSave, cancel: handleCancel })
  }

  const handleCancel = () => {
    if (grantsSnapshotRef.current) {
      grantsSnapshotRef.current.forEach((snapshot, id) => {
        restoreResourceGrants(id, snapshot)
      })
    }
    if (guestLinksSnapshotRef.current) {
      guestLinksSnapshotRef.current.forEach((snapshot, id) => {
        restoreResourceGuestLinks(id, snapshot)
      })
    }
    grantsSnapshotRef.current = null
    guestLinksSnapshotRef.current = null
    setDirty(false)
    onDirtyChange?.(false, { save: handleSave, cancel: handleCancel })
  }

  const markDirty = (targets?: ResourceRef[]) => {
    const ids = new Set<string>([resourceId])
    batchResourceRefs?.forEach((target) => ids.add(target.id))
    targets?.forEach((target) => ids.add(target.id))

    if (!grantsSnapshotRef.current) grantsSnapshotRef.current = new Map()
    if (!guestLinksSnapshotRef.current) guestLinksSnapshotRef.current = new Map()

    ids.forEach((id) => {
      if (!grantsSnapshotRef.current!.has(id)) {
        grantsSnapshotRef.current!.set(id, getResourceGrants(id).map(g => ({ ...g })))
      }
      if (!guestLinksSnapshotRef.current!.has(id)) {
        guestLinksSnapshotRef.current!.set(id, getResourceGuestLinks(id).map((link) => ({ ...link })))
      }
    })

    if (!dirty) {
      setDirty(true)
      onDirtyChange?.(true, { save: handleSave, cancel: handleCancel })
    }
  }

  // Role + share mode + expiration
  const shareMode: ShareMode = 'snapshot'
  const expires = false
  const expiresInDays = 7
  const { getCollection, collections, createCollection } = useUserCollections()
  const { getCollection: getSmartCollection, filterAssets, scopedAssets } = useSmartCollections()
  const isCollectionResource = resourceRef?.type === 'collection'
  const isAssetResource = resourceRef?.type === 'asset' || resourceRef?.type === 'cut'
  const resolveShareTarget = (rawTarget: ResourceRef): ResourceRef => {
    if (rawTarget.type !== 'smart-collection') return rawTarget

    const smartColl = getSmartCollection(rawTarget.id)
    if (!smartColl) return rawTarget

    const assets = filterAssets(scopedAssets, smartColl.id)
    const curated = createCollection(smartColl.name, assets.map(asset => asset.id), {
      sourceSmartCollectionId: smartColl.id,
    })
    return { id: curated.id, type: 'collection' }
  }

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
  }, [isAssetResource, resourceId, collections, getResourceGrants, inheritedGrants, resolveCollectionAssetIds])

  const addRoleOptions = useMemo(() => {
    if (!resourceRef) return roleOptionsForResource(roleGroups)
    const allowedProfiles = new Set(getGrantableProfiles(resourceRef))
    return roleOptionsForResource(roleGroups, resourceRef.type).filter((option) => allowedProfiles.has(option.value as AccessProfileId))
  }, [resourceRef, roleGroups, getGrantableProfiles])

  // Scoped visibility: what can the current user see in this access panel?
  const canSeeFullAccessList = canAddGrants || canManageAllGrants



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

    // Smart defaults based on recipient type
    const defaultRole: AccessProfileId = 'viewer'
    let defaultShareMode: ShareMode = shareMode

    if (kind === 'domain') {
      defaultShareMode = 'live'
    } else if (principal.type === 'user') {
      const persona = PERSONAS.find(p => p.id === principal.userId)
      if (persona?.role === 'vendor') {
        defaultShareMode = 'snapshot'
      }
    }

    // Domain (release) shares keep the original pending-row flow — they have
    // their own confirmation gating (release warnings, etc.) and a separate
    // "Send" footer that batches all picked domains.
    if (kind === 'domain') {
      const key = (principal as { domainId: string }).domainId
      if (pendingGrants.some(p => p.id === key)) return
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
      onPendingChange?.(true, { confirm: () => handleConfirmPendingRef.current(), cancel: () => handleCancelPendingRef.current() })
      return
    }

    // People / teams use the two-step "Grant access" flow. The first pick
    // enters step 2; subsequent picks while in step 2 append more chips so
    // one permission can be granted to many recipients at once.
    const key = principal.type === 'user'
      ? principal.userId
      : (principal as { teamId: string }).teamId
    if (addingPrincipals.some(p => p.key === key)) return
    const isFirstAdd = addingPrincipals.length === 0
    setAddingPrincipals(prev => [...prev, { principal, name, kind, key }])
    if (isFirstAdd) {
      setAddingRole(null)
      setAddingRoleWarning(false)
      setAddingShareMode(defaultShareMode)
      onPendingChange?.(true, {
        confirm: () => commitAddRef.current(),
        cancel: () => cancelAdd(),
        confirmLabel: 'Add',
      })
      onHeaderChange?.({ title: 'Grant access', onBack: () => cancelAdd() })
    }
    setQuery('')
    setShowDropdown(false)
  }

  const cancelAdd = () => {
    setAddingPrincipals([])
    setAddingRole(null)
    setAddingRoleWarning(false)
    setAddingNote('')
    setQuery('')
    setShowDropdown(false)
    onPendingChange?.(false, { confirm: () => {}, cancel: () => {} })
    onHeaderChange?.(null)
  }

  const removeAddingPrincipal = (key: string) => {
    setAddingPrincipals(prev => {
      const next = prev.filter(p => p.key !== key)
      // Removing the last chip exits step 2 entirely.
      if (next.length === 0) {
        setAddingRole(null)
        setAddingRoleWarning(false)
        onPendingChange?.(false, { confirm: () => {}, cancel: () => {} })
        onHeaderChange?.(null)
      }
      return next
    })
  }

  const commitPendingGrants = () => {
    const rawTargets = isBatch && batchResourceRefs ? batchResourceRefs : (resourceRef ? [resourceRef] : [])
    if (rawTargets.length === 0) return
    const targets = rawTargets.map(resolveShareTarget)
    markDirty(targets)

    for (const pending of pendingGrants) {
      for (const target of targets) {
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
          note: shareNote || undefined,
        })
      }
    }
    setPendingGrants([])
    setShareNote('')
    onPendingChange?.(false, { confirm: () => {}, cancel: () => {} })
  }

  const commitAdd = () => {
    if (addingPrincipals.length === 0) return
    if (!addingRole) {
      setAddingRoleWarning(true)
      return
    }
    const rawTargets = isBatch && batchResourceRefs ? batchResourceRefs : (resourceRef ? [resourceRef] : [])
    if (rawTargets.length === 0) return
    const targets = rawTargets.map(resolveShareTarget)
    markDirty(targets)

    for (const adding of addingPrincipals) {
      for (const target of targets) {
        const targetGrants = getResourceGrants(target.id)
        if (adding.principal.type === 'user' && targetGrants.some(g => g.principal.type === 'user' && g.principal.userId === (adding.principal as { userId: string }).userId)) continue
        if (adding.principal.type === 'team' && targetGrants.some(g => g.principal.type === 'team' && g.principal.teamId === (adding.principal as { teamId: string }).teamId)) continue

        const isCollection = target.type === 'collection'
        const collection = isCollection ? getCollection(target.id) : undefined
        const snapshotAssetIds = addingShareMode === 'snapshot' && collection
          ? resolveCollectionAssetIds(collection)
          : undefined
        createGrant(target, adding.principal, addingRole, {
          expiresInDays: expires ? expiresInDays : undefined,
          shareMode: isCollection ? addingShareMode : undefined,
          snapshotAssetIds,
          note: addingNote.trim() || undefined,
        })
      }
    }
    setAddingPrincipals([])
    setAddingRole(null)
    setAddingRoleWarning(false)
    setAddingNote('')
    setQuery('')
    onPendingChange?.(false, { confirm: () => {}, cancel: () => {} })
    onHeaderChange?.(null)
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
            flagged.push({ name: pending.name, reason: `~${memberCount} people` })
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
  commitAddRef.current = commitAdd

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

    return buildAccessDisplayEntries(
      directRaw,
      roleGroups,
      activePersona?.id,
    )
  }, [grants, canManageGrant, roleGroups, activePersona?.id])

  const directEntries = useMemo(() => allEntries.filter(e => !e.sourceName), [allEntries])

  const userEntries = useMemo(() =>
    directEntries.filter((entry) => entry.grant.principal.type === 'user'),
    [directEntries],
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
  const pendingPeopleCount = pendingGrants.filter(p => p.kind !== 'domain').length

  /* ---- Shared sub-sections ---- */

  const isDropdownOpen = showDropdown && query.trim().length > 0
  const searchSection = !readOnly && resourceRef && canAddGrants && addRoleOptions.length > 0 && (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <Popover open={isDropdownOpen} onOpenChange={setShowDropdown}>
          <PopoverAnchor asChild>
            <div>
              <Input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
                onFocus={() => { if (query.trim()) setShowDropdown(true) }}
                placeholder="Add people or teams..."
                icon={<Search className="w-4 h-4" />}
                iconPosition="left"
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            sideOffset={4}
            // Keep keyboard focus in the input so the user can keep typing.
            onOpenAutoFocus={(e) => e.preventDefault()}
            // Don't close when clicking back into the input.
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement
              if (target.closest('input')) e.preventDefault()
            }}
            className="w-[var(--radix-popover-trigger-width)] max-h-[240px] overflow-y-auto bg-surface-1 border border-border-dim p-0 shadow-lg"
          >
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
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )

  const haveAccessHeader = (userEntries.length > 0 || teamEntries.length > 0) && (
    <h3 className="text-body-0-bold text-foreground-dim">Have access</h3>
  )

  const userEntriesSection = userEntries.length > 0 && (
    <div className="space-y-2">
        {userEntries.map((entry) => (
          <GrantRow
            key={entry.key}
            grant={entry.grant}
            readOnly={entry.readOnly}
            roleGroups={roleGroups}
            name={entry.name}
            subtitle={entry.subtitle}
            members={entry.members}
            domainId={entry.domainId}
            onRemove={!entry.sourceName && !entry.readOnly ? handleRevokeGrant : undefined}
            onBlock={!entry.sourceName && !entry.readOnly && isAdmin && entry.grant.principal.type === 'user' ? handleBlockUser : undefined}
            onUpdateProfile={!entry.sourceName && !entry.readOnly ? handleUpdateProfile : undefined}
          />
        ))}
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
    <div className="space-y-2">
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
          members={entry.members}
          domainId={entry.domainId}
          onRemove={!entry.sourceName && !entry.readOnly ? handleRevokeGrant : undefined}
          onUpdateProfile={!entry.sourceName && !entry.readOnly ? handleUpdateProfile : undefined}
        />
      ))}
    </div>
  )

  const inheritedFolderSources = useMemo(() => {
    const sources = new Map<string, { id: string; name: string; grants: Grant[] }>()
    for (const { grant, fromResourceName } of inheritedGrants ?? []) {
      if (!isGrantActive(grant)) continue
      const id = grant.resource.id
      const existing = sources.get(id)
      if (existing) {
        existing.grants.push(grant)
      } else {
        sources.set(id, { id, name: fromResourceName, grants: [grant] })
      }
    }
    return Array.from(sources.values())
  }, [inheritedGrants])

  const inheritedEntriesSection = inheritedFolderSources.length > 0 && (
    <div>
      <div className="pb-2">
        <h3 className="text-body-0-bold text-foreground-dim">Access from parent folders</h3>
      </div>
      {inheritedFolderSources.map((source) => (
        <FolderAccessSourceRow
          key={source.id}
          name={source.name}
          grants={source.grants}
          roleGroups={roleGroups}
        />
      ))}
    </div>
  )

  const sharedViaCollectionsSection = sharedViaCollections.length > 0 && (
    <div>
      <div className="pb-2">
        <h3 className="text-body-0-bold text-foreground-dim">Access from collections</h3>
      </div>
      {sharedViaCollections.map(({ collection, grants: collGrants }) => (
        <CollectionAccessSourceRow
          key={collection.id}
          name={collection.name}
          grants={collGrants}
          roleGroups={roleGroups}
          metadata={getAccessSourcePeopleLabel(collGrants)}
        />
      ))}
    </div>
  )

  const pendingPeople = pendingGrants.filter(p => p.kind !== 'domain')
  const pendingPeopleSection = pendingPeople.length > 0 && (
    <div className="space-y-3">
      <h3 className="text-body-0-bold text-foreground-dim">Adding</h3>
      <div className="rounded-lg bg-surface-mid p-3 space-y-1">
        {pendingPeople.map(pending => (
          <div key={pending.id} className="flex items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              {pending.kind === 'user' ? (
                <Avatar name={pending.name} size="sm" />
              ) : (
                <DepartmentAvatar size="sm" />
              )}
              <span className="text-body-0-regular text-foreground truncate">{pending.name}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <RoleSelect
                options={pending.kind === 'domain'
                  ? addRoleOptions.filter(o => o.value === 'viewer')
                  : addRoleOptions}
                value={pending.role}
                onChange={(value) => setPendingGrants(prev => prev.map(p => p.id === pending.id ? { ...p, role: value as AccessProfileId } : p))}
              />
              {isCollectionResource && pending.kind !== 'domain' && (
                <ShareModeSelect
                  mode={pending.shareMode}
                  onChange={(mode) => setPendingGrants(prev => prev.map(p => p.id === pending.id ? { ...p, shareMode: mode } : p))}
                />
              )}
              <Button variant="icon" compact onClick={() => handleRemovePending(pending.id)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Textarea
        value={shareNote}
        onChange={(e) => setShareNote(e.target.value)}
        placeholder="Add a note (optional)"
        rows={2}
      />
    </div>
  )

  const peopleEmptyState = inheritedFolderSources.length === 0 && userEntries.length === 0 && teamEntries.length === 0 && getResourceGuestLinks(resourceId).length === 0 && sharedViaCollections.length === 0 && pendingPeopleCount === 0 && (
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

  // Step 2 of the add flow — once at least one person/team has been picked
  // from the search dropdown, the panel switches into an explicit-permission
  // picker. The chip-input below accepts more recipients so a single
  // permission can be granted to many at once.
  if (addingActive) {
    const isTeamRecipient = addingPrincipals.some(p => p.kind === 'team')
    return (
      <div className="space-y-5">
        {/* Multi-chip recipient input. Reuses the same search results
            Popover anchored to the box, with PopoverAnchor wrapping the
            whole chip area so the dropdown lines up with its width. */}
        <Popover open={isDropdownOpen} onOpenChange={setShowDropdown}>
          <PopoverAnchor asChild>
            <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-md bg-surface-flat dark:bg-white/[0.04] ring-1 ring-inset ring-border-dim focus-within:ring-2 focus-within:ring-border-system-focus transition-colors min-h-[40px]">
              {addingPrincipals.map(adding => (
                <div key={adding.key} className="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-surface-highlight">
                  {adding.kind === 'user' ? <Avatar name={adding.name} size="sm" /> : <DepartmentAvatar size="sm" />}
                  <span className="text-body-0-regular text-foreground">{adding.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAddingPrincipal(adding.key)}
                    className="flex items-center justify-center w-4 h-4 rounded hover:bg-surface-3 text-foreground-dim"
                    aria-label={`Remove ${adding.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <input
                ref={addInputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowDropdown(true) }}
                onFocus={() => { if (query.trim()) setShowDropdown(true) }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && query === '' && addingPrincipals.length > 0) {
                    removeAddingPrincipal(addingPrincipals[addingPrincipals.length - 1].key)
                  }
                }}
                placeholder={addingPrincipals.length > 0 ? 'Add another…' : 'Add people or teams…'}
                className="flex-1 min-w-[8rem] h-7 bg-transparent text-body-0-regular text-foreground placeholder:text-foreground-dim focus:outline-none"
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement
              if (target.closest('input')) e.preventDefault()
            }}
            className="w-[var(--radix-popover-trigger-width)] max-h-[240px] overflow-y-auto bg-surface-1 border border-border-dim p-0 shadow-lg"
          >
            {results.map((result) => (
              <button
                key={result.key}
                onClick={() => handleSelectPrincipal(result.principal, result.name, result.kind)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
              >
                {result.kind === 'user' ? <Avatar name={result.name} size="sm" /> : <DepartmentAvatar size="sm" />}
                <div className="min-w-0">
                  <span className="text-body-0-regular text-foreground truncate block">{result.name}</span>
                  <span className="text-body-0-regular text-foreground-dim truncate block">{result.subtitle}</span>
                </div>
              </button>
            ))}
            {!hasResults && (
              <div className="px-3 py-2 text-body-0-regular text-foreground-dim">No matches</div>
            )}
          </PopoverContent>
        </Popover>

        <p className="text-body-0-regular text-foreground-dim">
          {isTeamRecipient ? 'Team members' : 'They'} will get a notification that they&apos;ve received access
        </p>

        <div className="space-y-1">
          {addRoleOptions.map(option => (
            <PermissionRadio
              key={option.value}
              selected={addingRole === option.value}
              title={option.label}
              description={ROLE_DESCRIPTIONS[option.value]}
              onClick={() => {
                setAddingRole(option.value as AccessProfileId)
                setAddingRoleWarning(false)
              }}
            />
          ))}
          {addingRoleWarning && (
            <p role="alert" className="text-label-1-regular text-foreground-system-error">
              Choose an access level before sharing
            </p>
          )}
        </div>

        {isCollectionResource && (
          <label className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-surface-highlight">
            <div className="flex-1 min-w-0">
              <p className="text-body-1-bold text-foreground">Auto-update</p>
              <p className="text-label-1-regular text-foreground-dim">Include new items as they&apos;re added to the collection</p>
            </div>
            <Toggle
              checked={addingShareMode === 'live'}
              onChange={(checked) => setAddingShareMode(checked ? 'live' : 'snapshot')}
              aria-label="Auto-update"
            />
          </label>
        )}

        <Textarea
          value={addingNote}
          onChange={(e) => setAddingNote(e.target.value)}
          placeholder="Add a note (optional)"
          rows={2}
        />
      </div>
    )
  }

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
        <div className="sticky -top-6 z-10 bg-surface-low -mx-6 -mt-4 px-6 pt-2 pb-2">
          <Tabs defaultValue="people" value={shareTab} onValueChange={(v) => setShareTab(v as 'people' | 'release')}>
            <TabsList>
              <Tab value="people">People {peopleCount > 0 && <span className="text-foreground-subtle ml-2">{peopleCount}</span>}</Tab>
              <Tab value="release">Release {domainCount > 0 && <span className="text-foreground-subtle ml-2">{domainCount}</span>}</Tab>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* People content — always rendered, hidden when release tab is active */}
      {(!showTabs || shareTab === 'people') && (
        <>
          {canSeeFullAccessList && searchSection}

          {canSeeFullAccessList ? (
            <div className="space-y-4">
              {inheritedEntriesSection}
              {isAssetResource && sharedViaCollectionsSection}
              {(userEntries.length > 0 || teamEntries.length > 0 || resourceBlocks.length > 0) && (
                <div>
                  {haveAccessHeader && <div className="pb-2">{haveAccessHeader}</div>}
                  <div className="space-y-2">
                    {userEntriesSection}
                    {blockedSection}
                    {teamEntriesSection}
                  </div>
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
        <Modal.Header title="Confirm release" />
        <Modal.Body>
          <div className="space-y-3">
            <p className="text-body-0-regular text-foreground-dim">
              You are releasing to {flaggedReleaseRecipients.length === 1 ? 'this audience' : 'these audiences'}:
            </p>
            <div className="space-y-2">
              {flaggedReleaseRecipients.map(({ name, reason }) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-body-0-regular text-foreground">{name}</span>
                  <span className="text-body-0-regular text-foreground-dim"> — {reason}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal.Body>
        <Card.Footer>
          <Button variant="secondary" onClick={() => setShowReleaseWarning(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setShowReleaseWarning(false); commitPendingGrants() }}>Confirm</Button>
        </Card.Footer>
      </Modal>

    </div>
  )
}
