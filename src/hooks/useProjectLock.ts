'use client'

import { useState, useCallback } from 'react'
import { logAuditEvent } from '@/lib/audit-log'
import type { User } from '@/lib/personas'

export type ProjectLockInfo = {
  locked: boolean
  lockedBy?: string
  lockedAt?: string
}

export function useProjectLock(activePersona: User | null) {
  const [projectLockInfo, setProjectLockInfo] = useState<ProjectLockInfo>(() => {
    if (typeof window === 'undefined') return { locked: false }
    try {
      const stored = localStorage.getItem('project-locked')
      if (stored) return JSON.parse(stored) as ProjectLockInfo
    } catch { /* fall through */ }
    return { locked: false }
  })

  const lockProject = useCallback(() => {
    const info: ProjectLockInfo = {
      locked: true,
      lockedBy: activePersona?.name ?? 'Unknown',
      lockedAt: new Date().toISOString().slice(0, 10),
    }
    setProjectLockInfo(info)
    try { localStorage.setItem('project-locked', JSON.stringify(info)) } catch { /* ignore */ }

    logAuditEvent({
      type: 'lock',
      actorId: activePersona?.id ?? 'system',
      actorName: activePersona?.name ?? 'System',
      resourceId: 'project',
      resourceLabel: 'Project',
      details: `Project locked by ${activePersona?.name ?? 'System'}`,
    })
  }, [activePersona])

  const unlockProject = useCallback(() => {
    const info: ProjectLockInfo = { locked: false }
    setProjectLockInfo(info)
    try { localStorage.setItem('project-locked', JSON.stringify(info)) } catch { /* ignore */ }

    logAuditEvent({
      type: 'unlock',
      actorId: activePersona?.id ?? 'system',
      actorName: activePersona?.name ?? 'System',
      resourceId: 'project',
      resourceLabel: 'Project',
      details: `Project unlocked by ${activePersona?.name ?? 'System'}`,
    })
  }, [activePersona])

  return {
    projectLocked: projectLockInfo.locked,
    projectLockInfo,
    lockProject,
    unlockProject,
  }
}
