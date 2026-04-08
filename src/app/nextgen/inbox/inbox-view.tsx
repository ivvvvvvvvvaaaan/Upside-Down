'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Folder, LayoutGrid, FileText, Film } from 'lucide-react'
import { PageHeader, EmptyState, ToggleButtonGroup, Card, MobileToolbar } from '@/components/ui'
import { SharedDetailContent } from '@/components/ui/shared-side-panel'
import { useAccess, usePersona } from '@/hooks'
import type { GrantView } from '@/lib/grants'
import type { AccessEntryKind } from '@/lib/access'
import { PERSONAS } from '@/lib/personas'
import { Avatar } from '@/components/ui/avatar'
import { cn, formatDate } from '@/lib/utils'

export function InboxView() {
  const { sharesReceivedByMe, readShareIds, markShareRead } = useAccess()
  const { hydrated } = usePersona()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'unread' | 'all'>('unread')

  const sortedEntries = useMemo(
    () => [...sharesReceivedByMe].sort((a, b) => {
      return b.grantedAt.localeCompare(a.grantedAt)
    }),
    [sharesReceivedByMe],
  )

  // Snapshot unread IDs when filter switches to 'unread' so marking items
  // read while browsing doesn't remove them from the list mid-session.
  const [unreadSnapshot, setUnreadSnapshot] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    if (filter === 'unread') {
      setUnreadSnapshot(new Set(sortedEntries.filter(e => !readShareIds.has(e.id)).map(e => e.id)))
    }
  // Only re-snapshot when filter changes, not when readShareIds changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sortedEntries])

  const entries = useMemo(
    () => filter === 'unread'
      ? sortedEntries.filter((e) => unreadSnapshot.has(e.id))
      : sortedEntries,
    [filter, sortedEntries, unreadSnapshot],
  )

  const unreadCount = useMemo(
    () => sortedEntries.filter((e) => !readShareIds.has(e.id)).length,
    [sortedEntries, readShareIds],
  )

  // Auto-select first entry when entries change and nothing is selected
  useEffect(() => {
    if (entries.length > 0 && (!selectedId || !entries.find(e => e.id === selectedId))) {
      setSelectedId(entries[0].id)
      markShareRead(entries[0].id)
    }
  }, [entries, selectedId, markShareRead])

  const selectedEntry = entries.find(e => e.id === selectedId) ?? null

  const handleRowClick = useCallback((entry: GrantView) => {
    setSelectedId(entry.id)
    markShareRead(entry.id)
  }, [markShareRead])

  if (!hydrated) {
    return (
      <div className="flex h-full">
        <div className="flex-1" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Entry list */}
      <div className="w-1/3 min-w-[280px] flex flex-col overflow-hidden">
        <div className="p-6 pb-0 space-y-3">
          <MobileToolbar title="Inbox" />
          <div className="flex items-start justify-between gap-4">
            <PageHeader
              title="Inbox"
              description={filter === 'unread'
                ? `${unreadCount} unread`
                : `${sortedEntries.length} total`}
              hideTitleOnMobile
            />
            <ToggleButtonGroup
              compact
              options={[
                { value: 'unread' as const, label: 'Unread' },
                { value: 'all' as const, label: 'All' },
              ]}
              value={filter}
              onChange={(v) => { setSelectedId(null); setFilter(v as 'unread' | 'all') }}
            />
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState title="No notifications yet" message="Shares sent to you will appear here." />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            <div className="space-y-1">
              {entries.map(entry => {
                const isSelected = selectedId === entry.id
                const isRead = readShareIds.has(entry.id)
                const kind = entry.resourceType as AccessEntryKind
                const senderPersona = PERSONAS.find((p) => p.id === entry.grantedByUserId)
                const senderName = senderPersona?.name ?? entry.grantedByUserId

                return (
                  <div
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowClick(entry)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(entry) } }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded transition-colors text-left cursor-pointer',
                      isSelected
                        ? 'bg-indigo-500/10'
                        : 'hover:bg-surface-2'
                    )}
                  >
                    <Avatar name={senderName} size="md" />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          'truncate',
                          isRead ? 'text-body-0-regular text-foreground-subtle' : 'text-body-0-bold text-foreground',
                        )}>
                          {senderName}
                        </span>
                        <span className="text-body-0-regular text-foreground-subtle flex-shrink-0">
                          shared
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {kind === 'folder' && <Folder className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />}
                        {(kind === 'collection' || kind === 'smart-collection') && <LayoutGrid className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />}
                        {kind === 'cut' && <Film className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />}
                        {(kind !== 'folder' && kind !== 'collection' && kind !== 'smart-collection' && kind !== 'cut') && <FileText className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />}
                        <span className={cn(
                          'truncate',
                          isRead ? 'text-body-0-regular text-foreground-subtle' : 'text-body-0-bold text-foreground',
                        )}>
                          {entry.label}
                        </span>
                      </div>
                    </div>

                    {/* Date + unread dot */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-label-0-regular text-foreground-dim">
                        {formatDate(entry.grantedAt)}
                      </span>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail card — always visible */}
      <div className="flex-1 hidden md:flex">
        {selectedEntry ? (
          <Card className="flex-1 overflow-y-auto m-4">
            <SharedDetailContent
              entry={selectedEntry}
              showAccess={false}
            />
          </Card>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-body-0-regular text-foreground-dim">Select a notification</span>
          </div>
        )}
      </div>
    </div>
  )
}
