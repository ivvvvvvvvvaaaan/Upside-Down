'use client'

import { useMemo } from 'react'
import { X, ArrowRight, LayoutGrid, FileText, Folder, XCircle } from 'lucide-react'
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
  'studio-exec': 'border-amber-500',
  'creative': 'border-purple-500',
  'manager': 'border-blue-500',
  'artist': 'border-green-500',
  'vendor': 'border-orange-500',
}

const ROLE_BG: Record<string, string> = {
  'studio-exec': 'bg-amber-500/10',
  'creative': 'bg-purple-500/10',
  'manager': 'bg-blue-500/10',
  'artist': 'bg-green-500/10',
  'vendor': 'bg-orange-500/10',
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
  if (type === 'folder') return <Folder className="w-3.5 h-3.5" />
  return <FileText className="w-3.5 h-3.5" />
}

export function UserJourneyModal({ open, onClose }: UserJourneyModalProps) {
  const events = useMemo(() => {
    return SCENARIO.shares
      .map(share => {
        const sharer = getPersona(share.by)
        const recipients = share.grants.map(g => {
          if ('to' in g) return { type: 'user' as const, label: getPersona(g.to)?.name ?? g.to }
          return { type: 'team' as const, label: SCENARIO.teams.find(t => t.id === g.toTeam)?.name ?? g.toTeam }
        })
        return {
          date: share.date,
          label: share.label,
          resourceType: share.resource.type,
          dept: share.resource.dept,
          sharerName: sharer?.name ?? share.by,
          sharerRole: sharer?.role ?? 'unknown',
          sharerId: share.by,
          recipients,
          context: share.context,
          revoked: share.revoked ?? false,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))
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
                <div className={cn('w-3 h-3 rounded-full border-2', color)} />
                <span className="text-body-0-regular text-foreground-dim capitalize">{role.replace('-', ' ')}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line — aligned with dot centers at 72px + 12px gap + 6px radius */}
            <div className="absolute left-[90px] top-0 bottom-0 w-px bg-border-dim" />

            <div className="space-y-0">
              {grouped.map(([date, dayEvents], gi) => (
                <div key={date}>
                  {/* Date marker */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-[72px] text-right text-body-0-bold text-foreground shrink-0">
                      {formatDate(date)}
                    </div>
                    <div className="w-3 h-3 rounded-full bg-surface-3 border-2 border-border-dim z-10 shrink-0" />
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-2 mb-6">
                    {dayEvents.map((event, ei) => (
                      <div key={`${gi}-${ei}`} className="flex items-start gap-3">
                        <div className="w-[72px] shrink-0" />
                        <div className="w-3 shrink-0" />
                        <div className={cn(
                          'flex-1 rounded p-3 space-y-2',
                          event.revoked ? 'bg-surface-2 opacity-60' : 'bg-surface-2',
                        )}>
                          {/* Sharer → Resource → Recipients */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Sharer */}
                            <div className={cn(
                              'flex items-center gap-1.5 px-2 py-0.5 rounded-full border',
                              ROLE_COLORS[event.sharerRole] ?? 'border-border-dim',
                              ROLE_BG[event.sharerRole] ?? '',
                            )}>
                              <Avatar name={event.sharerName} size="compact" />
                              <span className="text-body-0-regular text-foreground">{event.sharerName}</span>
                            </div>

                            <ArrowRight className="w-3.5 h-3.5 text-foreground-dim shrink-0" />

                            {/* Resource */}
                            <div className="flex items-center gap-1 text-body-0-regular text-foreground">
                              <ResourceIcon type={event.resourceType} />
                              <span>{event.label}</span>
                              {event.revoked && (
                                <XCircle className="w-3.5 h-3.5 text-red-500 ml-1" />
                              )}
                            </div>

                            <ArrowRight className="w-3.5 h-3.5 text-foreground-dim shrink-0" />

                            {/* Recipients */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {event.recipients.map((r, ri) => (
                                <Tag key={ri} size="compact" variant="border" type={r.type === 'team' ? 'informative' : 'neutral'}>
                                  {r.label}
                                </Tag>
                              ))}
                            </div>
                          </div>

                          {event.context && (
                            <p className="text-body-0-regular text-foreground-dim">{event.context}</p>
                          )}
                          {event.revoked && (
                            <span className="text-body-0-regular text-red-400">Revoked</span>
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
