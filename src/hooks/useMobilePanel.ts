'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useIsMobile } from './useMediaQuery'

/**
 * useMobilePanel
 *
 * On mobile, opening the info panel pushes a ?info=1 search param so that
 * the browser back button dismisses it (feels like a page transition).
 * On desktop, delegates to the regular sidePanelOpen state.
 */
export function useMobilePanel(sidePanelOpen: boolean, setSidePanelOpen: (open: boolean) => void) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isInfoParam = searchParams.get('info') === '1'
  const isOpen = isMobile ? isInfoParam : sidePanelOpen

  const toggle = useCallback(() => {
    if (isMobile) {
      if (isInfoParam) {
        router.back()
      } else {
        router.push(`${pathname}?info=1`)
      }
    } else {
      setSidePanelOpen(!sidePanelOpen)
    }
  }, [isMobile, isInfoParam, router, pathname, sidePanelOpen, setSidePanelOpen])

  const close = useCallback(() => {
    if (isMobile && isInfoParam) {
      router.back()
    } else {
      setSidePanelOpen(false)
    }
  }, [isMobile, isInfoParam, router, setSidePanelOpen])

  return { isOpen, toggle, close }
}
