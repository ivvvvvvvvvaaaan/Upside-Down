'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, Check, Circle, ArrowRight, BookOpen, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { useAccess, usePersona } from '@/hooks'
import { useUserCollections } from '@/hooks/useUserCollections'
import { useFileTree } from '@/hooks'
import { PHASES, getCurrentPhase, getPhaseForPersona } from '@/lib/scenario-phases'
import type { Phase, PhaseStep } from '@/lib/scenario-phases'
import { PERSONAS } from '@/lib/personas'

const GUIDE_STORAGE_KEY = 'scenario-guide-collapsed'
const COMPLETED_STEPS_KEY = 'scenario-completed-steps'

function useCompletedSteps() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPLETED_STEPS_KEY)
      if (stored) setCompletedSteps(new Set(JSON.parse(stored)))
    } catch {}
  }, [])

  const markCompleted = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.add(stepId)
      try { localStorage.setItem(COMPLETED_STEPS_KEY, JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    // Nuclear reset: enable phase mode, clear all app state, reload
    try {
      localStorage.setItem('scenario-phase-mode', 'true')
      const keysToRemove = [
        COMPLETED_STEPS_KEY,
        GUIDE_STORAGE_KEY,
        // Grants
        'access-grants',
        'access-grants-version',
        'access-role-groups',
        // Collections
        'user-collections',
        'user-collections-version',
        'smart-collections',
        'smart-collections-version',
        // File tree
        'unified-workspace-files',
        'unified-workspace-files-version',
        // Nav / UI
        'nav-expanded',
        'nav-scroll-top',
        'sidebar-width',
        // Guest links, blocks, etc.
        'guest-links',
        'user-blocks',
        'read-share-ids',
      ]
      for (const key of keysToRemove) localStorage.removeItem(key)
    } catch {}
    window.location.reload()
  }, [])

  return { completedSteps, markCompleted, resetAll }
}

function StepRow({ step, isCompleted, isActive }: { step: PhaseStep; isCompleted: boolean; isActive: boolean }) {
  return (
    <div className="flex gap-2 py-1.5">
      <div className="flex-shrink-0 mt-[5px]">
        {isCompleted ? (
          <div className="w-3 h-3 rounded-full bg-white flex items-center justify-center">
            <Check className="w-2 h-2 text-black" strokeWidth={3} />
          </div>
        ) : isActive ? (
          <div className="w-3 h-3 rounded-full border-[1.5px] border-white" />
        ) : (
          <Circle className="w-3 h-3 text-white/30" />
        )}
      </div>
      <span className={cn('text-body-0-regular', isCompleted ? 'line-through text-foreground' : isActive ? 'text-foreground' : 'text-white/40')}>
        {step.instruction}
      </span>
    </div>
  )
}

export function ScenarioGuide() {
  const pathname = usePathname()
  const { activePersona } = usePersona()
  const { getResourceGrants, grants: allGrants } = useAccess()
  const { collections } = useUserCollections()
  const { tree: fileTree } = useFileTree()
  const { completedSteps, markCompleted, resetAll } = useCompletedSteps()

  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number; dragged: boolean } | null>(null)

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(GUIDE_STORAGE_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  useEffect(() => {
    try {
      if (localStorage.getItem(GUIDE_STORAGE_KEY) === 'true') setCollapsed(true)
    } catch {}
  }, [])

  // Drag behavior — listeners on window so drag works outside the card
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragState.current) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.dragged = true
      if (dragState.current.dragged) {
        setPosition({ x: dragState.current.origX + dx, y: dragState.current.origY + dy })
      }
    }
    const handleUp = () => { dragState.current = null }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [])

  // Determine completed phases
  const completedPhaseIds = useMemo(() => {
    const ids = new Set<string>()
    for (const phase of PHASES) {
      if (phase.steps.every(step => completedSteps.has(step.id))) {
        ids.add(phase.id)
      }
    }
    return ids
  }, [completedSteps])

  const currentPhase = getCurrentPhase(completedPhaseIds)
  const personaPhase = activePersona ? getPhaseForPersona(activePersona.id, completedPhaseIds) : null
  // Only show another persona's phase if no persona is selected (admin mode)
  const displayPhase = activePersona ? personaPhase : currentPhase
  const phaseIndex = displayPhase ? PHASES.indexOf(displayPhase) : -1
  const allDone = !currentPhase

  // Find the current active step (first incomplete)
  const activeStep = displayPhase?.steps.find(s => !completedSteps.has(s.id))
  // Which persona should be active for the current step?
  const neededPersonaId = activeStep?.personaId ?? activeStep?.checkpoint.type === 'persona-switch'
    ? (activeStep?.checkpoint as { personaId: string }).personaId
    : displayPhase?.personaId
  const isWrongPersona = !!neededPersonaId && !!activePersona && neededPersonaId !== activePersona.id
  const expectedPersona = neededPersonaId ? PERSONAS.find(p => p.id === neededPersonaId) : null

  // Auto-detect checkpoints — only check the next incomplete step
  useEffect(() => {
    if (!displayPhase || !activePersona) return

    for (const step of displayPhase.steps) {
      if (completedSteps.has(step.id)) continue
      const cp = step.checkpoint
      let matched = false

      // Persona-switch: just check if the right persona is active
      if (cp.type === 'persona-switch') {
        matched = activePersona.id === cp.personaId
      }
      // For other checkpoints, only check if the right persona is active
      if (cp.type !== 'persona-switch' && step.personaId && step.personaId !== activePersona.id) break

      if (cp.type === 'grant') {
        const grants = getResourceGrants(cp.resourceId)
        matched = grants.some(g => {
          if (cp.principalType === 'user') return g.principal.type === 'user' && g.principal.userId === cp.principalId
          if (cp.principalType === 'team') return g.principal.type === 'team' && g.principal.teamId === cp.principalId
          if (cp.principalType === 'domain') return g.principal.type === 'domain' && g.principal.domainId === cp.principalId
          return false
        })
      }
      if (cp.type === 'any-grant-to') {
        matched = allGrants.some(g => {
          if (g.grantedByUserId !== activePersona.id) return false
          if (cp.principalType === 'user') return g.principal.type === 'user' && g.principal.userId === cp.principalId
          if (cp.principalType === 'team') return g.principal.type === 'team' && g.principal.teamId === cp.principalId
          return false
        })
      }
      if (cp.type === 'collection-created') {
        matched = collections.some(c => c.name.toLowerCase().includes(cp.nameContains.toLowerCase()))
      }
      if (cp.type === 'file-created') {
        const isUserCreated = (id: string) => /^ws-\d{13}/.test(id)
        const hasUserFile = (nodes: typeof fileTree): boolean => {
          for (const node of nodes) {
            if (node.type === 'file' && isUserCreated(node.id)) return true
            if (node.children && hasUserFile(node.children)) return true
          }
          return false
        }
        const findFolder = (nodes: typeof fileTree, id: string): typeof fileTree[0] | null => {
          for (const node of nodes) {
            if (node.id === id) return node
            if (node.children) {
              const found = findFolder(node.children, id)
              if (found) return found
            }
          }
          return null
        }
        const targetFolder = findFolder(fileTree, cp.parentFolderId)
        if (targetFolder?.children && hasUserFile(targetFolder.children)) {
          matched = true
        }
      }
      if (cp.type === 'visit-page') {
        matched = pathname.startsWith(cp.pathPrefix)
      }
      if (matched) markCompleted(step.id)
      break
    }
  }, [displayPhase, activePersona, completedSteps, getResourceGrants, allGrants, collections, fileTree, pathname, markCompleted])

  if (!displayPhase && !allDone) return null

  return (
    <div
      ref={containerRef}
      className={cn('fixed z-50', collapsed ? 'w-auto' : 'w-80')}
      style={position ? { left: position.x, top: position.y } : { top: 8, right: 16 }}
    >
      <div className="bg-black border border-border-dim rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center">
          {/* Drag handle */}
          <div
            onMouseDown={(e) => {
              if (!containerRef.current) return
              const rect = containerRef.current.getBoundingClientRect()
              dragState.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top, dragged: false }
              e.preventDefault()
            }}
            className="flex items-center justify-center px-1.5 py-2 cursor-grab active:cursor-grabbing text-foreground-dim hover:text-foreground transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          {/* Click to toggle */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              'flex-1 flex items-center text-left hover:bg-white/5 transition-colors',
              collapsed ? 'py-2 pr-2 gap-1 group' : 'justify-between gap-2 py-2 pr-3',
            )}
          >
            {collapsed ? (
              <>
                <span className="text-body-0-bold text-foreground">Manual</span>
                <ChevronRight className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
              </>
            ) : (
              <>
                <span className="text-body-0-bold text-foreground truncate">
                  {allDone ? 'All scenarios done' : displayPhase!.title}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
              </>
            )}
          </button>
        </div>

        {/* Body — collapsible */}
        {!collapsed && (
          <div className="px-3 pb-3 space-y-3">
            {allDone ? (
              <p className="text-body-0-regular text-foreground-dim">
                You've completed all scenario phases. Reset to start over.
              </p>
            ) : (
              <>
                <p className="text-body-0-regular text-foreground">
                  {displayPhase!.description}
                </p>

                {isWrongPersona && expectedPersona && (
                  <div className="bg-white/5 rounded px-3 py-2 flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
                    <span className="text-body-0-regular text-foreground">
                      Switch to {expectedPersona.name} to continue
                    </span>
                  </div>
                )}

                {!isWrongPersona && (
                  <div className="space-y-0">
                    {displayPhase!.steps.map((step, i) => {
                      const isDone = completedSteps.has(step.id)
                      const isActive = !isDone && displayPhase!.steps.slice(0, i).every(s => completedSteps.has(s.id))
                      return <StepRow key={step.id} step={step} isCompleted={isDone} isActive={isActive} />
                    })}
                  </div>
                )}
              </>
            )}

            <div className="pt-1 flex justify-end">
              <Button variant="tertiary" compact onClick={resetAll}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
