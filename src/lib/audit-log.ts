export type AuditEventType = 'grant' | 'revoke' | 'block' | 'unblock' | 'lock' | 'unlock' | 'release'

export type AuditEvent = {
  id: string
  type: AuditEventType
  actorId: string
  actorName: string
  targetUserId?: string
  targetUserName?: string
  resourceId?: string
  resourceLabel?: string
  timestamp: string
  details: string
}

let auditLog: AuditEvent[] = []

export function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
  auditLog.push({
    ...event,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  })
}

export function getAuditLog(filters?: { resourceId?: string; userId?: string; type?: AuditEventType }): AuditEvent[] {
  let results = [...auditLog]
  if (filters?.resourceId) results = results.filter(e => e.resourceId === filters.resourceId)
  if (filters?.userId) results = results.filter(e => e.targetUserId === filters.userId || e.actorId === filters.userId)
  if (filters?.type) results = results.filter(e => e.type === filters.type)
  return results.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function getAuditLogCount(): number {
  return auditLog.length
}
