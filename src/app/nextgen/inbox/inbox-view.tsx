'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader, Tag, SharedSidePanel, EmptyState, Button, ToggleButtonGroup } from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import { useAccess, usePersona } from '@/hooks'
import type { GrantView } from '@/lib/grants'
import { kindLabel, kindTagType } from '@/lib/access'
import type { AccessEntryKind } from '@/lib/access'
import { profileLabel } from '@/lib/grants'
import { PERSONAS, initials as getInitials } from '@/lib/personas'
import { cn, formatDate } from '@/lib/utils'

export function InboxView() {
  const { sharesReceivedByMe, revokeShare, readShareIds, markShareRead } = useAccess()
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
  const selectedEntryHref = useMemo(() => {
    if (!selectedEntry) return undefined
    const kind = selectedEntry.resourceType as AccessEntryKind
    if (kind === 'collection') return `/nextgen/collections/${selectedEntry.resourceId}`
    if (kind === 'smart-collection') return `/nextgen/smart-collections/${selectedEntry.resourceId}`
    if (kind === 'folder') return selectedEntry.departmentId ? `/nextgen/workspace/${selectedEntry.departmentId}` : '/nextgen/workspace'
    return undefined
  }, [selectedEntry])

  const handleRowClick = useCallback((entry: GrantView) => {
    setSelectedId(entry.id)
    markShareRead(entry.id)
  }, [markShareRead])

  if (!hydrated) {
    return (
      <AppLayout>
        <div className="flex h-full">
          <div className="flex-1" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Entry list */}
        <div className="w-1/2 min-w-0 flex flex-col overflow-hidden border-r border-border-dim">
          <div className="p-6 pb-0">
            <div className="flex items-start justify-between gap-4">
              <PageHeader
                title="Inbox"
                description={filter === 'unread'
                  ? `${unreadCount} unread`
                  : `${sortedEntries.length} total`}
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
                  const senderInitials = getInitials(senderName)
                  const href =
                    kind === 'collection'
                      ? `/nextgen/collections/${entry.resourceId}`
                      : kind === 'folder'
                        ? entry.departmentId
                          ? `/nextgen/workspace/${entry.departmentId}`
                          : '/nextgen/workspace'
                        : null

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
                      {/* Unread dot */}
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}

                      {/* Avatar circle */}
                      <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0">
                        <span className="text-label-0-bold text-foreground-dim">{senderInitials}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            isRead ? 'text-body-0-regular text-foreground-subtle' : 'text-body-0-bold text-foreground',
                          )}>
                            {senderName}
                          </span>
                          <span className="text-body-0-regular text-foreground-subtle">
                            shared
                          </span>
                          {href ? (
                            <Link
                              href={href}
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                'truncate underline decoration-foreground-dim/30 hover:decoration-foreground-dim',
                                isRead ? 'text-body-0-regular text-foreground-subtle' : 'text-body-0-bold text-foreground',
                              )}
                            >
                              &lsquo;{entry.label}&rsquo;
                            </Link>
                          ) : (
                            <span className={cn(
                              'truncate',
                              isRead ? 'text-body-0-regular text-foreground-subtle' : 'text-body-0-bold text-foreground',
                            )}>
                              &lsquo;{entry.label}&rsquo;
                            </span>
                          )}
                          <Tag size="compact" type={kindTagType(kind)}>
                            {kindLabel(kind)}
                          </Tag>
                          <Tag size="compact" type="neutral">
                            {profileLabel(entry.templateId)}
                          </Tag>
                        </div>
                        <span className="text-label-0-regular text-foreground-dim">
                          {formatDate(entry.grantedAt)}
                        </span>
                      </div>

                      {/* Open link for folder/collection shares */}
                      {href && (
                        <Button
                          variant="secondary"
                          compact
                          asChild
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <Link href={href}>
                            Open {kindLabel(kind).toLowerCase()}
                          </Link>
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Detail panel — always visible */}
        {selectedEntry ? (
          <SharedSidePanel
            entry={selectedEntry}
            onClose={() => setSelectedId(null)}
            isCreator={false}
            href={selectedEntryHref}
            panelClassName="!w-1/2"
          />
        ) : (
          <div className="w-1/2 flex-shrink-0 hidden md:flex items-center justify-center">
            <span className="text-body-0-regular text-foreground-dim">Select a notification</span>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
