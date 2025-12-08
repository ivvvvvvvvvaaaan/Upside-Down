'use client'

import { cn } from '@/lib/utils'
import { createContext, useContext, useState } from 'react'

/*
 * ===========================================
 * TABS COMPONENT
 * ===========================================
 * Content organization with tabbed navigation.
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
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

// Tab List
function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={cn(
        'flex gap-1 border-b border-border',
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
}

function Tab({ value, children, className }: TabProps) {
  const { value: currentValue, onChange } = useTabs()
  const isActive = currentValue === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onChange(value)}
      className={cn(
        'px-4 py-2 text-body-2 font-medium transition-colors -mb-px',
        'border-b-2 border-transparent',
        isActive 
          ? 'text-primary-500 border-primary-500' 
          : 'text-content-secondary hover:text-content-primary',
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
      className={cn('py-4', className)}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, Tab, TabsContent }
