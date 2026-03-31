'use client'

import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Folder, FileText, LayoutGrid } from 'lucide-react'
import { PageHeader, Tag, SharedSidePanel, EmptyState } from '@/components/ui'
import { ToggleButtonGroup } from '@/components/ui/toggle-button-group'
import { AppLayout } from '@/components/layouts'
import { useAccess, usePersona } from '@/hooks'
import type { GrantView } from '@/lib/grants'
import { kindLabel, kindTagType } from '@/lib/access'
import type { AccessEntryKind } from '@/lib/access'
import { profileLabel } from '@/lib/grants'
import { PERSONAS } from '@/lib/personas'
import { cn, formatDate } from '@/lib/utils'

type ShareTab = 'mine' | 'all'

function kindIcon(kind: AccessEntryKind) {
  if (kind === 'folder') return <Folder className="w-4 h-4 text-foreground-dim flex-shrink-0" />
  if (kind === 'collection' || kind === 'smart-collection') return <LayoutGrid className="w-4 h-4 text-foreground-dim flex-shrink-0" />
  return <FileText className="w-4 h-4 text-foreground-dim flex-shrink-0" />
}


function ShareTable({
  entries,
  selectedId,
  onRowClick,
}: {
  entries: GrantView[]
  selectedId: string | null
  onRowClick: (entry: GrantView) => void
}) {
  if (entries.length === 0) return null

  return (
    <div>
      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_100px_140px_120px] gap-4 px-3 py-2 text-label-0-bold uppercase text-foreground-dim border-b border-border-dim">
        <span>Name</span>
        <span>Type</span>
        <span>Permission</span>
        <span>Shared by</span>
        <span>Date</span>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-border-dim">
        {entries.map(entry => {
          const isSelected = selectedId === entry.id
          const kind = entry.resourceType as AccessEntryKind
          const granterName = (() => {
            const persona = PERSONAS.find((p) => p.id === entry.grantedByUserId)
            return persona?.name ?? entry.grantedByUserId
          })()

          return (
            <button
              key={entry.id}
              onClick={() => onRowClick(entry)}
              className={cn(
                'w-full grid grid-cols-[1fr_100px_100px_140px_120px] gap-4 px-3 py-3 text-left transition-colors',
                isSelected
                  ? 'bg-indigo-500/10'
                  : 'hover:bg-surface-2'
              )}
            >
              {/* Name */}
              <span className="flex items-center gap-2 min-w-0">
                {kindIcon(kind)}
                <span className="text-body-0-bold text-foreground truncate">
                  {entry.label}
                </span>
              </span>

              {/* Type */}
              <span className="flex items-center">
                <Tag size="compact" type={kindTagType(kind)}>
                  {kindLabel(kind)}
                </Tag>
              </span>

              {/* Permission */}
              <span className="flex items-center">
                <Tag size="compact" type="neutral">
                  {profileLabel(entry.templateId)}
                </Tag>
              </span>

              {/* Shared by */}
              <span className="text-body-0-regular text-foreground-subtle truncate flex items-center">
                {granterName}
              </span>

              {/* Date */}
              <span className="text-body-0-regular text-foreground-subtle flex items-center">
                {formatDate(entry.grantedAt)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const TAB_OPTIONS = [
  { value: 'mine' as const, label: 'My Shares' },
  { value: 'all' as const, label: 'All Shares' },
]

export function SharedView() {
  const searchParams = useSearchParams()
  const initialSelected = searchParams.get('selected')
  const { sharesCreatedByMe, allProjectShares, revokeShare } = useAccess()
  const { activePersona, isAdmin, hydrated } = usePersona()
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected)
  const [activeTab, setActiveTab] = useState<ShareTab>(!activePersona ? 'all' : 'mine')

  const displayEntries = activeTab === 'all' && isAdmin ? allProjectShares : sharesCreatedByMe

  const selectedEntry = displayEntries.find(e => e.id === selectedId) ?? null
  const isCreatorOfSelected = selectedEntry?.grantedByUserId === activePersona?.id

  const handleRowClick = useCallback((entry: GrantView) => {
    setSelectedId(prev => prev === entry.id ? null : entry.id)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedId(null)
  }, [])

  const handleRevokeShare = useCallback((resourceId: string) => {
    revokeShare(resourceId)
    setSelectedId(null)
  }, [revokeShare])

  const totalCount = isAdmin ? allProjectShares.length : sharesCreatedByMe.length

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <PageHeader
                title="Shared"
                description={`${totalCount} shared item${totalCount !== 1 ? 's' : ''}`}
              />
              {isAdmin && (
                <ToggleButtonGroup<ShareTab>
                  options={TAB_OPTIONS}
                  value={activeTab}
                  onChange={(v) => setActiveTab(v)}
                  compact
                />
              )}
            </div>
          </div>

          {!hydrated ? (
            <div className="flex-1" />
          ) : displayEntries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="No shared items" message="Items you've shared will appear here." />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <ShareTable
                entries={displayEntries}
                selectedId={selectedId}
                onRowClick={handleRowClick}
              />
            </div>
          )}
        </div>

        {/* Side panel */}
        {selectedEntry && (
          <SharedSidePanel
            entry={selectedEntry}
            onClose={handleClosePanel}
            isCreator={isCreatorOfSelected}
            onRevokeShare={handleRevokeShare}
          />
        )}
      </div>
    </AppLayout>
  )
}
