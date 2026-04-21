'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Shield, Map, Monitor } from 'lucide-react'
import Link from 'next/link'
import { UserJourneyModal } from './user-journey-modal'
import { usePersona } from '@/hooks'
import type { User } from '@/lib/personas'
import { Avatar } from './avatar'
import { cn } from '@/lib/utils'

export function PersonaPicker({
  compact = false,
  showLabel = false,
  avatarOnly = false,
  personas,
  allowAdmin = true,
  compactSingleLine = false,
}: {
  compact?: boolean
  showLabel?: boolean
  avatarOnly?: boolean
  personas?: User[]
  allowAdmin?: boolean
  compactSingleLine?: boolean
} = {}) {
  const { activePersona, setActivePersona, allPersonas } = usePersona()
  const [open, setOpen] = useState(false)
  const [journeyOpen, setJourneyOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const visiblePersonas = personas ?? allPersonas

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      {avatarOnly ? (
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-border-subtle transition-all"
          aria-label="Switch persona"
        >
          {activePersona ? (
            <Avatar name={activePersona.name} size="md" />
          ) : (
            <div className="w-full h-full bg-indigo-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
          )}
        </button>
      ) : compact ? (
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'flex items-center transition-colors',
            compactSingleLine ? 'gap-1.5' : 'gap-2',
            showLabel ? 'rounded px-1 -mx-1 hover:bg-surface-2' : 'w-7 h-7 rounded-full justify-center hover:ring-2 hover:ring-border-subtle',
          )}
          aria-label="Switch persona"
        >
          {activePersona ? (
            <>
              <Avatar name={activePersona.name} size={compactSingleLine ? 'compact' : 'sm'} />
              {showLabel && (
                compactSingleLine ? (
                  <span className="hidden md:block text-label-0-regular text-foreground truncate max-w-40 text-left">
                    {activePersona.name}
                  </span>
                ) : (
                  <span className="hidden md:flex flex-col leading-tight text-left">
                    <span className="text-label-0-regular text-foreground">{activePersona.name}</span>
                    <span className="text-label-0-regular text-foreground-dim">{activePersona.title}</span>
                  </span>
                )
              )}
            </>
          ) : (
            <>
              <span className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center">
                <Shield className="w-4 h-4 text-foreground-dim" />
              </span>
              {showLabel && (
                compactSingleLine ? (
                  <span className="hidden md:block text-label-0-regular text-foreground truncate max-w-40 text-left">
                    Admin
                  </span>
                ) : (
                  <span className="hidden md:flex flex-col leading-tight text-left">
                    <span className="text-label-0-regular text-foreground">Admin</span>
                    <span className="text-label-0-regular text-foreground-dim">All access</span>
                  </span>
                )
              )}
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded transition-colors text-body-0-bold min-w-0',
            'border border-border-dim hover:bg-surface-2',
            activePersona ? 'text-foreground' : 'text-foreground-dim'
          )}
        >
          {activePersona ? (
            <>
              <Avatar name={activePersona.name} size="sm" />
              <span className="truncate">{activePersona.name}</span>
              <span className="text-label-0-regular text-foreground-dim truncate hidden sm:inline">
                {activePersona.title}
              </span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>Admin (All Access)</span>
            </>
          )}
          <ChevronDown className="w-3 h-3 flex-shrink-0 text-foreground-dim" />
        </button>
      )}

      {open && (
        <div className={cn(
          'absolute w-72 bg-surface-1 border border-border-dim rounded shadow-lg z-50 overflow-hidden max-h-[70vh] overflow-y-auto',
          avatarOnly ? 'bottom-0 left-full ml-2' : compact ? 'top-full right-0 mt-1' : 'bottom-full left-0 mb-1'
        )}>
          {/* Admin option */}
          {allowAdmin && (
            <>
              <button
                onClick={() => { setActivePersona(null); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-2 transition-colors',
                  !activePersona && 'bg-indigo-500/10'
                )}
              >
                <span className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-foreground-dim" />
                </span>
                <div className="min-w-0">
                  <div className="text-body-0-bold text-foreground">Admin</div>
                  <div className="text-label-0-regular text-foreground-dim">All access — no restrictions</div>
                </div>
              </button>

              <div className="border-t border-border-dim" />
            </>
          )}

          {visiblePersonas.map(persona => (
            <button
              key={persona.id}
              onClick={() => { setActivePersona(persona); setOpen(false) }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-2 transition-colors',
                activePersona?.id === persona.id && 'bg-indigo-500/10'
              )}
            >
              <Avatar name={persona.name} size="md" />
              <div className="min-w-0">
                <div className="text-body-0-bold text-foreground">{persona.name}</div>
                <div className="text-label-0-regular text-foreground-dim">{persona.title}</div>
                <div className="text-label-0-regular text-foreground-dim truncate">{persona.email}</div>
              </div>
            </button>
          ))}

          <div className="border-t border-border-dim" />
          <Link
            href="/nextgen/desktop"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0">
              <Monitor className="w-4 h-4 text-foreground-dim" />
            </span>
            <div className="min-w-0">
              <div className="text-body-0-bold text-foreground">Desktop Environment</div>
            </div>
          </Link>
        </div>
      )}

      <UserJourneyModal open={journeyOpen} onClose={() => setJourneyOpen(false)} />
    </div>
  )
}
