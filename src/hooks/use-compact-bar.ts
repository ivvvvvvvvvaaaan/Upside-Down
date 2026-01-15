import { useState, useEffect, useRef, RefObject } from 'react'

/**
 * Hook to manage compact bar visibility based on scroll position.
 * Shows compact bar when the header element scrolls out of view.
 */
export function useCompactBar(): {
  scrollRef: RefObject<HTMLDivElement>
  headerRef: RefObject<HTMLDivElement>
  showCompactBar: boolean
} {
  const scrollRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [showCompactBar, setShowCompactBar] = useState(false)

  useEffect(() => {
    const scrollEl = scrollRef.current
    const headerEl = headerRef.current
    if (!scrollEl || !headerEl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowCompactBar(!entry.isIntersecting)
      },
      { root: scrollEl, threshold: 0, rootMargin: '-8px 0px 0px 0px' }
    )

    observer.observe(headerEl)
    return () => observer.disconnect()
  }, [])

  return { scrollRef, headerRef, showCompactBar }
}
