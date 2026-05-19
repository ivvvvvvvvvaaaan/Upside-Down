'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * useSubmitToSearch — push to the canonical /nextgen/search route with a
 * query, optionally prefixed by a context phrase that the parser will pin
 * as a chip on arrival (e.g. submitting from a character page prepends the
 * character name so it lands as a Character: chip).
 *
 * Local-filter behavior is unchanged for the consumer — they keep their own
 * onValueChange wired to instant substring filtering. This helper only fires
 * on explicit submit (Enter, button click, etc.).
 */
export function useSubmitToSearch() {
  const router = useRouter()
  return useCallback((query: string, contextPhrase?: string) => {
    const ctx = contextPhrase?.trim() ?? ''
    const q = query.trim()
    const combined = [ctx, q].filter(Boolean).join(' ')
    if (!combined) {
      router.push('/nextgen/search')
      return
    }
    router.push(`/nextgen/search?q=${encodeURIComponent(combined)}`)
  }, [router])
}
