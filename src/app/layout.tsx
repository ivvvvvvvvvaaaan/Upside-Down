'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { THEME_STORAGE_KEY, THEMES } from '@/lib/constants'
import './globals.css'

/*
 * ===========================================
 * ROOT LAYOUT
 * ===========================================
 * Provides theme context and toggle.
 * All pages inherit dark/light mode from here.
 * 
 * DEFAULT: Dark mode
 * - Persists theme preference in localStorage
 * - Toggle button in top-right corner on all pages
 * - Uses mounted state to prevent hydration mismatch
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Start with dark theme to match server render
  const [theme, setTheme] = useState<'light' | 'dark'>(THEMES.DARK)
  const [mounted, setMounted] = useState(false)
  
  // Load theme from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null
    if (saved) {
      setTheme(saved)
    }
  }, [])
  
  // Sync theme to DOM and localStorage
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === THEMES.DARK)
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT)
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        {/* Theme toggle - fixed position next to settings gear */}
        <button
          onClick={toggleTheme}
          className="fixed bottom-4 right-16 z-50 bg-surface-low border border-border-subtle rounded-full p-2 shadow-high hover:bg-surface-highlight transition-colors"
          aria-label="Toggle theme"
        >
          {theme === THEMES.LIGHT ? <Moon className="w-4 h-4 text-foreground-dim" /> : <Sun className="w-4 h-4 text-foreground-dim" />}
        </button>
        
        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
