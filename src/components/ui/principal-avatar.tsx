'use client'

import { Avatar } from './avatar'
import { DepartmentAvatar, ReleaseDomainAvatar } from './department-avatar'
import { TEAMS } from '@/lib/teams'
import { principalLabel } from '@/lib/grants'
import type { PrincipalRef } from '@/lib/grants'

interface PrincipalAvatarProps {
  principal: PrincipalRef
  size?: 'compact' | 'sm' | 'md'
}

export function PrincipalAvatar({ principal, size = 'compact' }: PrincipalAvatarProps) {
  if (principal.type === 'team') {
    const team = TEAMS.find(t => t.id === principal.teamId)
    return <DepartmentAvatar domainId={team?.domainId} size={size} />
  }
  if (principal.type === 'domain') {
    return <ReleaseDomainAvatar size={size} />
  }
  return <Avatar name={principalLabel(principal)} size={size} />
}
