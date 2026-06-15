'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const CHANGES = [
  ['Manual PIX upload for every cut', 'File lands in library from AVID export — one upload'],
  ['Notes in Google Doc, distributed by email', 'Notes on the asset in the library, delivered automatically'],
  ['Post Supervisor mines and forwards notes', 'Notes surfaced in library; Post Supervisor still decides how to share'],
  ['Double upload at picture lock (PIX + Content Hub)', 'CR approval fires auto-release — one action covers both destinations'],
  ['Manual notification to each downstream team', 'Auto-release grants access simultaneously on approval'],
  ['Content Hub as separate destination', 'Content Hub IS the library — no second system'],
]

type Tab = 'today' | 'new-world' | 'changes' | 'lifecycle' | 'containers'

const TABS: { id: Tab; label: string; accent: string }[] = [
  { id: 'today', label: 'Today', accent: 'text-red-400' },
  { id: 'new-world', label: 'New World', accent: 'text-blue-400' },
  { id: 'changes', label: 'What Changes', accent: 'text-foreground' },
  { id: 'lifecycle', label: 'Asset Lifecycle', accent: 'text-violet-400' },
  { id: 'containers', label: 'Containers', accent: 'text-emerald-400' },
]

export function WorkflowView({ svgs }: {
  svgs: Record<Tab, string>
}) {
  const [active, setActive] = useState<Tab>('today')

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">

      {/* Header */}
      <div className="flex-none border-b border-zinc-800 px-8 pt-7 pb-0">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Platform Architecture · Non-Fiction Editorial</p>
        <h1 className="text-xl font-semibold text-zinc-100 mb-5">Unified Media Library + Creative Review</h1>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                'px-4 py-2 text-sm rounded-t-md transition-colors relative',
                active === tab.id
                  ? `bg-zinc-900 ${tab.accent} font-medium`
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              )}
            >
              {tab.label}
              {active === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-current" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-zinc-900">
        {active === 'changes' ? (
          <div className="max-w-4xl mx-auto px-8 py-8">
            <div className="rounded-lg overflow-hidden border border-zinc-800">
              <div className="grid grid-cols-2 border-b border-zinc-800">
                <div className="px-5 py-3 bg-red-950/20">
                  <p className="text-xs text-red-400 uppercase tracking-widest font-medium">Today</p>
                </div>
                <div className="px-5 py-3 bg-blue-950/20 border-l border-zinc-800">
                  <p className="text-xs text-blue-400 uppercase tracking-widest font-medium">New World</p>
                </div>
              </div>
              {CHANGES.map(([before, after], i) => (
                <div key={i} className="grid grid-cols-2 border-b border-zinc-800 last:border-b-0">
                  <div className="px-5 py-4 bg-red-950/10">
                    <p className="text-sm text-zinc-400 line-through decoration-red-500/50">{before}</p>
                  </div>
                  <div className="px-5 py-4 bg-blue-950/10 border-l border-zinc-800">
                    <p className="text-sm text-zinc-200">{after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-center min-h-full p-8">
            <div
              className="w-full max-w-5xl"
              dangerouslySetInnerHTML={{ __html: svgs[active] }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
