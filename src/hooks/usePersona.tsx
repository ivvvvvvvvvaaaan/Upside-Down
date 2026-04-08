'use client'

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import type { User } from '@/lib/personas'
import { PERSONAS, DIRECTORY_UPDATED_EVENT } from '@/lib/personas'

// Keep backward compat: Persona = User
type Persona = User

interface PersonaContextValue {
  activePersona: Persona | null
  setActivePersona: (persona: Persona | null) => void
  allPersonas: Persona[]
  /** True once the persona has been hydrated from localStorage */
  hydrated: boolean
  /** True when in admin mode (no persona selected) */
  isAdmin: boolean
}

const PersonaContext = createContext<PersonaContextValue | null>(null)

const STORAGE_KEY = 'active-persona-id'

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [activePersona, setActivePersonaState] = useState<Persona | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [directoryVersion, setDirectoryVersion] = useState(0)

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const persona = PERSONAS.find(p => p.id === stored) ?? null
        setActivePersonaState(persona)
      }
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return
      const nextPersona = event.newValue
        ? PERSONAS.find((persona) => persona.id === event.newValue) ?? null
        : null
      setActivePersonaState(nextPersona)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    function handleDirectoryUpdate() {
      setDirectoryVersion((prev) => prev + 1)
      setActivePersonaState((current) => {
        if (!current) return current
        return PERSONAS.find((persona) => persona.id === current.id) ?? current
      })
    }

    window.addEventListener(DIRECTORY_UPDATED_EVENT, handleDirectoryUpdate)
    return () => window.removeEventListener(DIRECTORY_UPDATED_EVENT, handleDirectoryUpdate)
  }, [])

  const setActivePersona = useCallback((persona: Persona | null) => {
    setActivePersonaState(persona)
    try {
      if (persona) {
        localStorage.setItem(STORAGE_KEY, persona.id)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {}
  }, [])

  const isAdmin = !activePersona
  const allPersonas = useMemo(() => {
    void directoryVersion
    return [...PERSONAS]
  }, [directoryVersion])

  const contextValue = useMemo(() => ({
    activePersona,
    setActivePersona,
    allPersonas,
    hydrated,
    isAdmin,
  }), [activePersona, setActivePersona, allPersonas, hydrated, isAdmin])

  return (
    <PersonaContext.Provider value={contextValue}>
      {children}
    </PersonaContext.Provider>
  )
}

export function usePersona(): PersonaContextValue {
  const context = useContext(PersonaContext)
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider')
  }
  return context
}
