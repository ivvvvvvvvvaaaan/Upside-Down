'use client'

import { Tooltip } from './tooltip'
import { profileLabel } from '@/lib/grants'
import type { Grant, RoleGroup } from '@/lib/grants'

/**
 * Compact grant display: shows the role name and a +N suffix for extra capabilities.
 * Hovering reveals a tooltip with the full list.
 *
 * Examples:
 *   Can View
 *   Can Edit +1
 *   Can Manage +2
 */

function getGrantExtras(grant: Grant, includeShareModeExtra: boolean): string[] {
  const extras: string[] = []
  if (grant.resource.type === 'folder') return extras

  if (grant.allowDownload) extras.push('Download')
  if (grant.allowComment) extras.push('Comment')
  if (includeShareModeExtra && grant.shareMode === 'live') extras.push('Auto-update')
  if (grant.lockedToVersion != null) extras.push(`Locked to v${grant.lockedToVersion}`)
  return extras
}

export function GrantBadge({
  grant,
  roleGroups,
  includeShareModeExtra = true,
}: {
  grant: Grant
  roleGroups: RoleGroup[]
  includeShareModeExtra?: boolean
}) {
  const role = grant.resource.type === 'folder' && grant.templateId === 'viewer'
    ? 'View only'
    : profileLabel(grant.templateId, roleGroups)
  const extras = getGrantExtras(grant, includeShareModeExtra)
  const extraCount = extras.length

  if (extraCount === 0) {
    return <span className="text-body-0-regular text-foreground-dim">{role}</span>
  }

  return (
    <Tooltip
      label={role}
      description={extras.join(' · ')}
      position="top"
    >
      <span className="text-body-0-regular text-foreground-dim cursor-default">
        {role} +{extraCount}
      </span>
    </Tooltip>
  )
}
