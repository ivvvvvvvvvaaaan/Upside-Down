'use client'

import { Share2, FilePlus, UserPlus, UserMinus, Layers, FolderInput, Upload, Pencil } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface ActivityEvent {
  id: string
  icon: 'share' | 'unshare' | 'file-add' | 'upload' | 'collection-add' | 'collection-remove' | 'edit'
  text: string
  date: string
  detail?: string
}

const ICON_MAP = {
  'share': Share2,
  'unshare': UserMinus,
  'file-add': FilePlus,
  'upload': Upload,
  'collection-add': Layers,
  'collection-remove': Layers,
  'edit': Pencil,
}

export function ActivityFeed({ events, className }: { events: ActivityEvent[]; className?: string }) {
  if (events.length === 0) return null

  return (
    <section className={cn('space-y-2', className)}>
      <h3 className="text-body-0-bold text-foreground-dim">Activity</h3>
      <div className="space-y-0">
        {events.map((event) => {
          const Icon = ICON_MAP[event.icon]
          return (
            <div key={event.id} className="flex gap-2 py-1.5">
              <div className="flex-shrink-0 mt-0.5">
                <Icon className={cn('w-3.5 h-3.5', event.icon === 'unshare' || event.icon === 'collection-remove' ? 'text-foreground-system-error' : 'text-foreground-dim')} />
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
