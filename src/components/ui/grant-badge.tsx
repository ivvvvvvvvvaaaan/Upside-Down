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

function getGrantExtras(grant: Grant): string[] {
  const extras: string[] = []
  if (grant.allowUpload) extras.push('Upload')
  if (grant.shareMode === 'live') extras.push('Include new assets')
  if (grant.lockedToVersion != null) extras.push(`Locked to v${grant.lockedToVersion}`)
  return extras
}

export function GrantBadge({ grant, roleGroups }: { grant: Grant; roleGroups: RoleGroup[] }) {
  const role = profileLabel(grant.templateId, roleGroups)
  const extras = getGrantExtras(grant)
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
        {role} <span className="text-foreground-subtle">+{extraCount}</span>
      </span>
    </Tooltip>
  )
}
