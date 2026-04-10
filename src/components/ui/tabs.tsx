'use client'

import { cn } from '@/lib/utils'
import { createContext, useContext, useState } from 'react'

/**
 * Tabs Component (Hawkins TabbedInterface)
 *
 * Content organization with horizontal tabbed navigation.
 *
 * TOKENS USED (Hawkins):
 * - text-tab: Tab text (14px/21px/600)
 * - text-foreground: Active tab text color
 * - text-foreground-dim: Inactive tab text color
 * - border-border-dim: Divider line under tabs
 * - border-border-selected: Active tab underline (blue)
 *
 * Usage:
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <Tab value="tab1">First</Tab>
 *     <Tab value="tab2">Second</Tab>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 */

interface TabsContextType {
  value: string
  onChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tabs components must be used within <Tabs>')
  return context
}

// Root
export interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value ?? internalValue

  const handleChange = (newValue: string) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

// Tab List - horizontal container with bottom divider
function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-stretch border-b border-border-dim',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

// Individual Tab
export interface TabProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

function Tab({ value, children, className, disabled = false }: TabProps) {
  const { value: currentValue, onChange } = useTabs()
  const isActive = currentValue === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      className={cn(
        // Base styles
        'relative px-4 pt-3 pb-2 text-label-1-bold transition-colors',
        // Bottom border indicator positioning
        '-mb-px',
        // All tabs get a 2px bottom border to prevent layout shift
        'border-b-2',
        // Active state: foreground text + white underline
        isActive && 'text-foreground border-foreground',
        // Inactive state: dim text, transparent border
        !isActive && 'text-foreground-dim hover:text-foreground border-transparent',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        className
      )}
    >
      {children}
    </button>
  )
}

// Tab Content Panel
export interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: currentValue } = useTabs()

  if (currentValue !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn('pt-4', className)}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, Tab, TabsContent }
