'use client'

import { useMemo } from 'react'
import { X, ArrowRight, LayoutGrid, FileText, Film, Clock, Link2, Lock } from 'lucide-react'
import { Modal } from './modal'
import { Tag } from './tag'
import { Avatar } from './avatar'
import { SCENARIO } from '@/lib/scenario'
import { PERSONAS } from '@/lib/personas'
import { cn } from '@/lib/utils'

interface UserJourneyModalProps {
  open: boolean
  onClose: () => void
}

const ROLE_COLORS: Record<string, string> = {
  'studio-exec': 'bg-amber-500',
  'creative': 'bg-purple-500',
  'manager': 'bg-blue-500',
  'artist': 'bg-green-500',
  'vendor': 'bg-orange-500',
}

function getPersona(id: string) {
  return PERSONAS.find(p => p.id === id)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ResourceIcon({ type }: { type: string }) {
  if (type === 'collection' || type === 'smart-collection') return <LayoutGrid className="w-3.5 h-3.5" />
  if (type === 'cut') return <Film className="w-3.5 h-3.5" />
  return <FileText className="w-3.5 h-3.5" />
}

export function UserJourneyModal({ open, onClose }: UserJourneyModalProps) {
  const events = useMemo(() => {
    const shareEvents = SCENARIO.shares.map(share => {
      const sharer = getPersona(share.by)
      const recipients = share.grants.map(g => {
        if ('to' in g) {
          const p = getPersona(g.to)
          return { type: 'user' as const, label: p?.name ?? g.to, title: p?.title, role: p?.role }
        }
        const teamId = (g as { toTeam: string }).toTeam
        return { type: 'team' as const, label: SCENARIO.teams.find(t => t.id === teamId)?.name ?? teamId, title: undefined, role: undefined }
      })
      return {
        kind: 'share' as const,
        date: share.date,
        label: share.label,
        resourceType: share.resource.type,
        dept: share.resource.dept,
        sharerName: sharer?.name ?? share.by,
        sharerTitle: sharer?.title,
        sharerRole: sharer?.role ?? 'unknown',
        sharerId: share.by,
        recipients,
        context: share.context,
        revoked: share.revoked ?? false,
        expiresAt: share.expiresAt,
        shareMode: share.shareMode,
        allowUpload: share.allowUpload,
      }
    })

    const linkEvents = SCENARIO.guestLinks.map(link => {
      const creator = getPersona(link.createdBy)
      return {
        kind: 'guest-link' as const,
        date: link.date,
        label: link.label,
        resourceType: link.resource.type,
        dept: link.resource.dept,
        sharerName: creator?.name ?? link.createdBy,
        sharerTitle: creator?.title,
        sharerRole: creator?.role ?? 'unknown',
        sharerId: link.createdBy,
        recipients: [] as { type: 'user' | 'team'; label: string; title?: string; role?: string }[],
        context: link.context,
        revoked: false,
        expiresAt: link.expiresAt,
        allowDownload: link.allowDownload,
        passcode: link.passcode,
      }
    })

    return [...shareEvents, ...linkEvents].sort((a, b) => a.date.localeCompare(b.date))
  }, [])

  // Group by date
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof events>()
    for (const e of events) {
      const existing = groups.get(e.date) ?? []
      existing.push(e)
      groups.set(e.date, existing)
    }
    return Array.from(groups.entries())
  }, [events])

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} size="md">
      <div className="max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border-dim">
          <div>
            <h2 className="text-body-1-bold text-foreground">Project Sharing Timeline</h2>
            <p className="text-body-0-regular text-foreground-dim">{SCENARIO.projectName} — {events.length} sharing events</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-surface-3 text-foreground-dim hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-6">
            {Object.entries(ROLE_COLORS).map(([role, color]) => (
              <div key={role} className="flex items-center gap-1.5">
                <div className={cn('w-2 h-2 rounded-full', color)} />
                <span className="text-body-0-regular text-foreground-dim capitalize">{role.replace('-', ' ')}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-gray-500" />

            <div className="space-y-0">
              {grouped.map(([date, dayEvents], gi) => (
                <div key={date}>
                  {/* Events for this date */}
                  <div className="space-y-2 mb-4">
                    {dayEvents.map((event, ei) => (
                      <div key={`${gi}-${ei}`} className="flex items-start gap-3">
                        <div className="w-[72px] shrink-0 text-right pt-2">
                          {ei === 0 && <span className="text-body-0-bold text-foreground">{formatDate(date)}</span>}
                        </div>
                        <div className="w-2 h-2 rounded-full bg-gray-500 z-10 shrink-0 mt-3" />
                        <div className={cn(
                          'flex-1 rounded p-3 space-y-2',
                          event.revoked ? 'bg-surface-2 opacity-60' : 'bg-surface-2',
                        )}>
                          {/* Sharer → Resource → Recipients */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Sharer */}
                            <div className="flex items-center gap-1.5">
                              <div className={cn('w-2 h-2 rounded-full shrink-0', ROLE_COLORS[event.sharerRole] ?? 'bg-foreground-dim')} />
                              <Avatar name={event.sharerName} size="compact" />
                              <span className="text-body-0-regular text-foreground">{event.sharerName}</span>
                              {event.sharerTitle && <span className="text-body-0-regular text-foreground-dim">({event.sharerTitle})</span>}
                            </div>

                            <ArrowRight className="w-3.5 h-3.5 text-foreground-dim shrink-0" />

                            {/* Resource */}
                            <div className="flex items-center gap-1 text-body-0-regular text-foreground">
                              <ResourceIcon type={event.resourceType} />
                              <span>{event.label}</span>
                              {event.revoked && (
                                <Tag size="compact" type="negative" variant="border">Revoked</Tag>
                              )}
                              {event.expiresAt && !event.revoked && (
                                <Tag size="compact" type="notice" variant="border">
                                  <Clock className="w-3 h-3 mr-0.5 inline" />
                                  Expires {formatDate(event.expiresAt)}
                                </Tag>
                              )}
                              {event.kind === 'guest-link' && (
                                <Tag size="compact" type="neutral" variant="border">
                                  <Link2 className="w-3 h-3 mr-0.5 inline" />
                                  Link
                                </Tag>
                              )}
                              {'passcode' in event && event.passcode && (
                                <Tag size="compact" type="neutral" variant="border">
                                  <Lock className="w-3 h-3 mr-0.5 inline" />
                                  Passcode
                                </Tag>
                              )}
                              {'shareMode' in event && event.shareMode === 'snapshot' && (
                                <Tag size="compact" type="informative" variant="border">Snapshot</Tag>
                              )}
                              {'shareMode' in event && event.shareMode === 'live' && (
                                <Tag size="compact" type="positive" variant="border">Live</Tag>
                              )}
                              {'allowUpload' in event && event.allowUpload && (
                                <Tag size="compact" type="announcement" variant="border">Upload</Tag>
                              )}
                            </div>

                            {event.recipients.length > 0 && (
                              <ArrowRight className="w-3.5 h-3.5 text-foreground-dim shrink-0" />
                            )}

                            {/* Recipients */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {event.recipients.map((r, ri) => (
                                <div key={ri} className="flex items-center gap-1.5">
                                  {r.role && <div className={cn('w-2 h-2 rounded-full shrink-0', ROLE_COLORS[r.role] ?? 'bg-foreground-dim')} />}
                                  <Avatar name={r.label} size="compact" />
                                  <span className="text-body-0-regular text-foreground">{r.label}</span>
                                  {r.title && <span className="text-body-0-regular text-foreground-dim">({r.title})</span>}
                                </div>
                              ))}
                            </div>
                          </div>

                          {event.context && (
                            <p className="text-body-0-regular text-foreground-dim">{event.context}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
