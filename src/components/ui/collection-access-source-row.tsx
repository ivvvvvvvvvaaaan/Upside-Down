'use client'

import { Folder, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RELEASE_DOMAINS, roleLabelForResource, roleOptionsForResource } from '@/lib/grants'
import type { AccessProfileId, Grant, ResourceType, RoleGroup } from '@/lib/grants'
import { TEAMS } from '@/lib/teams'
import { RoleSelect } from './role-select'

function getGrantRoleTriggerLabel(grant: Grant, roleGroups: RoleGroup[]) {
  const roleName = grant.templateId ? roleLabelForResource(roleGroups, grant.templateId) : 'Custom'
  let extras = 0
  if (grant.allowDownload) extras++
  if (grant.allowComment) extras++
  if (grant.lockedToVersion != null) extras++
  return extras > 0 ? `${roleName} +${extras}` : roleName
}

function getAccessSourceSummary(grants: Grant[], roleGroups: RoleGroup[]) {
  const labels = new Set(grants.map((grant) => getGrantRoleTriggerLabel(grant, roleGroups)))
  if (labels.size === 0) return 'No access'
  if (labels.size === 1) return Array.from(labels)[0]
  return 'Mixed access'
}

export function getAccessSourcePeopleLabel(grants: Grant[]) {
  const userIds = new Set<string>()
  let fallbackCount = 0

  grants.forEach((grant) => {
    const principal = grant.principal
    if (principal.type === 'user') {
      userIds.add(principal.userId)
      return
    }

    if (principal.type === 'team') {
      const team = TEAMS.find((candidate) => candidate.id === principal.teamId)
      if (!team) {
        fallbackCount += 1
        return
      }
      team.memberUserIds.forEach((userId) => userIds.add(userId))
      return
    }

    const domain = RELEASE_DOMAINS.find((candidate) => candidate.id === principal.domainId)
    if (!domain) {
      fallbackCount += 1
      return
    }
    domain.granteeUserIds?.forEach((userId) => userIds.add(userId))
    domain.granteeTeamIds.forEach((teamId) => {
      const team = TEAMS.find((candidate) => candidate.id === teamId)
      if (team) team.memberUserIds.forEach((userId) => userIds.add(userId))
    })
  })

  const count = userIds.size + fallbackCount
  return `Shared with ${count} ${count === 1 ? 'person' : 'people'}`
}

type AccessSourceRowProps = {
  name: string
  href?: string
  metadata?: string
  grants: Grant[]
  roleGroups: RoleGroup[]
  sourceType: 'collection' | 'folder'
  resourceType: ResourceType
  roleDisplay?: 'select' | 'text'
  className?: string
}

type PublicAccessSourceRowProps = Omit<AccessSourceRowProps, 'sourceType' | 'resourceType'>

function AccessSourceRow({
  name,
  href,
  metadata,
  grants,
  roleGroups,
  sourceType,
  resourceType,
  roleDisplay = 'select',
  className,
}: AccessSourceRowProps) {
  const firstGrant = grants[0]
  const selectedValue = (firstGrant?.templateId ?? 'viewer') as AccessProfileId
  const triggerLabel = getAccessSourceSummary(grants, roleGroups)
  const showAutoUpdate = grants.some((grant) => grant.shareMode === 'live')
  const SourceIcon = sourceType === 'folder' ? Folder : Layers
  const nameNode = href ? (
    <a href={href} className="text-body-0-regular text-foreground hover:text-foreground-system-link transition-colors truncate block">
      {name}
    </a>
  ) : (
    <span className="text-body-0-regular text-foreground truncate block">{name}</span>
  )
  const roleNode = (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {showAutoUpdate && (
        <span className="text-body-0-regular text-foreground-dim">Auto-update</span>
      )}
      {roleDisplay === 'text' ? (
        <span className="text-body-0-regular text-foreground-dim">{triggerLabel}</span>
      ) : (
        <RoleSelect
          options={roleOptionsForResource(roleGroups, resourceType)}
          value={selectedValue}
          onChange={() => {}}
          triggerLabel={triggerLabel}
          disabled
        />
      )}
    </div>
  )

  if (roleDisplay === 'text') {
    return (
      <div className={cn('py-1', className)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-surface-high text-foreground-dim">
              <SourceIcon className="h-3 w-3" />
            </span>
            <div className="min-w-0">{nameNode}</div>
          </div>
          <div className="flex h-5 items-center flex-shrink-0">{roleNode}</div>
        </div>
        {metadata && (
          <span className="pl-7 text-body-0-regular text-foreground-dim block">
            {metadata}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-between gap-2 py-1', className)}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-surface-high text-foreground-dim">
          <SourceIcon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          {nameNode}
          {metadata && (
            <span className="text-body-0-regular text-foreground-dim truncate block">
              {metadata}
            </span>
          )}
        </div>
      </div>
      {roleNode}
    </div>
  )
}

export function CollectionAccessSourceRow(props: PublicAccessSourceRowProps) {
  return <AccessSourceRow {...props} sourceType="collection" resourceType="collection" />
}

export function FolderAccessSourceRow(props: PublicAccessSourceRowProps) {
  return <AccessSourceRow {...props} sourceType="folder" resourceType="folder" />
}
