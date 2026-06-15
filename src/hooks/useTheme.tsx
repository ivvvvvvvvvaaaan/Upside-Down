'use client'

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { THEME_STORAGE_KEY, THEMES } from '@/lib/constants'

type Theme = (typeof THEMES)[keyof typeof THEMES]

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start dark to match the server render (<html className="dark">)
  const [theme, setTheme] = useState<Theme>(THEMES.DARK)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved === THEMES.LIGHT || saved === THEMES.DARK) setTheme(saved)
    } catch {}
    setHydrated(true)
  }, [])

  // Sync theme to the DOM + localStorage once hydrated
  useEffect(() => {
    if (!hydrated) return
    document.documentElement.classList.toggle('dark', theme === THEMES.DARK)
    try { localStorage.setItem(THEME_STORAGE_KEY, theme) } catch {}
  }, [theme, hydrated])

  // Keep theme in sync across tabs
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY) return
      if (event.newValue === THEMES.LIGHT || event.newValue === THEMES.DARK) {
        setTheme(event.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT)
  }, [])

  const contextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
