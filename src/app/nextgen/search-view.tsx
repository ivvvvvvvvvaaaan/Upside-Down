'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { AppLayout } from '@/components/layouts'

/**
 * Media Library Search View
 *
 * Placeholder page with a prominent search bar
 * Following Hawkins design system
 */
export function MediaLibrarySearchView() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery)
  }

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="w-full max-w-2xl space-y-6">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-heading-4 text-foreground mb-2">
              Media Library
            </h1>
            <p className="text-body-1-regular text-foreground-subtle">
              Search across all collections and assets
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collections, assets, characters..."
                className="w-full h-14 pl-12 pr-4 bg-surface-low border border-border rounded text-body-1-regular text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-border-selected focus:ring-1 focus:ring-border-selected transition-colors"
              />
            </div>
          </form>

          {/* Placeholder hint */}
          <p className="text-center text-label-0-regular text-foreground-dim">
            Try searching for characters, locations, or scenes
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
