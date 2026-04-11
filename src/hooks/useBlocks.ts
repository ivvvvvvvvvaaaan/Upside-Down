'use client'

import { useState, useCallback } from 'react'
import { DEFAULT_BLOCKS, getResourceLabel } from '@/lib/grants'
import type { Block } from '@/lib/grants'
import { logAuditEvent } from '@/lib/audit-log'
import { PERSONAS } from '@/lib/personas'
import type { User } from '@/lib/personas'

function defaultResolveAuditTarget(principal: { type: 'user'; userId: string }): { name: string; userId?: string } {
  const persona = PERSONAS.find(p => p.id === principal.userId)
  return { name: persona?.name ?? principal.userId, userId: principal.userId }
}

export function useBlocks(activePersona: User | null) {
  const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS)

  const userId = activePersona?.id ?? null

  const blockUser = useCallback((targetUserId: string, resourceId: string, reason?: string) => {
    if (!userId) return
    const auditTarget = defaultResolveAuditTarget({ type: 'user', userId: targetUserId })
    logAuditEvent({
      type: 'block',
      actorId: userId,
      actorName: activePersona?.name ?? 'System',
      targetUserId,
      targetUserName: auditTarget.name,
      resourceId,
      resourceLabel: getResourceLabel(resourceId),
      details: `Blocked ${auditTarget.name} on ${getResourceLabel(resourceId)}${reason ? `: ${reason}` : ''}`,
    })
    setBlocks((prev) => {
      if (prev.some(b => b.userId === targetUserId && b.resourceId === resourceId)) return prev
      return [...prev, {
        id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: targetUserId,
        resourceId,
        blockedByUserId: userId,
        blockedAt: new Date().toISOString(),
        reason,
      }]
    })
  }, [userId, activePersona])

  const unblockUser = useCallback((targetUserId: string, resourceId: string) => {
    const auditTarget = defaultResolveAuditTarget({ type: 'user', userId: targetUserId })
    logAuditEvent({
      type: 'unblock',
      actorId: userId ?? 'system',
      actorName: activePersona?.name ?? 'System',
      targetUserId,
      targetUserName: auditTarget.name,
      resourceId,
      resourceLabel: getResourceLabel(resourceId),
      details: `Unblocked ${auditTarget.name} on ${getResourceLabel(resourceId)}`,
    })
    setBlocks((prev) => prev.filter(b => !(b.userId === targetUserId && b.resourceId === resourceId)))
  }, [userId, activePersona])

  const isBlocked = useCallback((targetUserId: string, resourceId: string): boolean => {
    return blocks.some(b => b.userId === targetUserId && b.resourceId === resourceId)
  }, [blocks])

  const getBlocksForResource = useCallback((resourceId: string): Block[] => {
    return blocks.filter(b => b.resourceId === resourceId)
  }, [blocks])

  return {
    blocks,
    blockUser,
    unblockUser,
    isBlocked,
    getBlocksForResource,
  }
}
