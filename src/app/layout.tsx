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
        {/* Theme toggle - fixed position on all pages */}
        <button
          onClick={toggleTheme}
          className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-surface-1 border border-border flex items-center justify-center text-foreground-dim hover:text-foreground hover:bg-surface-2 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === THEMES.LIGHT ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        
        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
