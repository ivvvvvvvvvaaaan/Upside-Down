'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import './globals.css'

/*
 * ===========================================
 * ROOT LAYOUT
 * ===========================================
 * Provides theme context and toggle.
 * All pages inherit dark/light mode from here.
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  // Apply theme class to html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Theme toggle - fixed position on all pages */}
        <button
          onClick={toggleTheme}
          className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-surface-tertiary transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        
        {/* Page content */}
        <main className="min-h-screen bg-surface-primary">
          {children}
        </main>
      </body>
    </html>
  )
}
