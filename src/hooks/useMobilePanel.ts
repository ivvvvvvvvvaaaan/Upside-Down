'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  const [isInfoParam, setIsInfoParam] = useState(false)

  const isOpen = isMobile ? isInfoParam : sidePanelOpen

  useEffect(() => {
    if (!isMobile) {
      setIsInfoParam(false)
      return
    }

    const syncFromLocation = () => {
      setIsInfoParam(new URLSearchParams(window.location.search).get('info') === '1')
    }

    syncFromLocation()
    window.addEventListener('popstate', syncFromLocation)
    return () => window.removeEventListener('popstate', syncFromLocation)
  }, [isMobile, pathname])

  const toggle = useCallback(() => {
    if (isMobile) {
      if (isInfoParam) {
        setIsInfoParam(false)
        router.back()
      } else {
        setIsInfoParam(true)
        router.push(`${pathname}?info=1`)
      }
    } else {
      setSidePanelOpen(!sidePanelOpen)
    }
  }, [isMobile, isInfoParam, router, pathname, sidePanelOpen, setSidePanelOpen])

  const close = useCallback(() => {
    if (isMobile && isInfoParam) {
      setIsInfoParam(false)
      router.back()
    } else {
      setSidePanelOpen(false)
    }
  }, [isMobile, isInfoParam, router, setSidePanelOpen])

  return { isOpen, toggle, close }
}
