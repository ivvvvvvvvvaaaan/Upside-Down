'use client'

import { FilePlus, UserMinus, Layers, Upload, Pencil } from 'lucide-react'
import { ShareIcon } from './share-icon'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface ActivityEvent {
  id: string
  icon: 'share' | 'unshare' | 'file-add' | 'upload' | 'collection-add' | 'collection-remove' | 'edit'
  text: string
  date: string
  detail?: string
}

const LUCIDE_ICON_MAP: Record<string, typeof FilePlus> = {
  'unshare': UserMinus,
  'file-add': FilePlus,
  'upload': Upload,
  'collection-add': Layers,
  'collection-remove': Layers,
  'edit': Pencil,
}

function EventIcon({ icon }: { icon: ActivityEvent['icon'] }) {
  if (icon === 'share') return <ShareIcon size={14} className="opacity-50" />
  const LucideIcon = LUCIDE_ICON_MAP[icon]
  if (!LucideIcon) return null
  return <LucideIcon className={cn('w-3.5 h-3.5', icon === 'unshare' || icon === 'collection-remove' ? 'text-foreground-system-error' : 'text-foreground-dim')} />
}

export function ActivityFeed({ events, className }: { events: ActivityEvent[]; className?: string }) {
  if (events.length === 0) return null

  return (
    <section className={cn('space-y-2', className)}>
      <h3 className="text-body-0-bold text-foreground-dim">Activity</h3>
      <div className="space-y-0">
        {events.map((event) => {
          return (
            <div key={event.id} className="flex gap-2 py-1.5">
              <div className="flex-shrink-0 mt-0.5">
                <EventIcon icon={event.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-body-0-regular text-foreground truncate">{event.text}</p>
                {event.detail && (
                  <p className="text-body-0-regular text-foreground-dim mt-0.5">{event.detail}</p>
                )}
                <p className="text-label-0-regular text-foreground-subtle">{formatDate(event.date)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
