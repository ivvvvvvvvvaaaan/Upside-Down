'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NavSidebar, PrimaryNavRail } from '@/components/ui'

export default function MobileNavPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('return') || '/nextgen/collections'

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const handleChange = () => {
      if (media.matches) {
        router.replace(returnTo)
      }
    }

    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [router, returnTo])

  return (
    <div className="h-screen bg-surface-flat flex">
      <PrimaryNavRail />
      <NavSidebar className="flex-1 w-auto border-r-0 overflow-auto" />
    </div>
  )
}
