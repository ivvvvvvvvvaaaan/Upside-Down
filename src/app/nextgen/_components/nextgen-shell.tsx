'use client'

import { usePathname } from 'next/navigation'
import { AppLayout } from '@/components/layouts'

export function NextgenShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isShelllessRoute = pathname === '/nextgen/menu'
    || pathname.startsWith('/nextgen/menu/')
    || pathname === '/nextgen/desktop'
    || pathname.startsWith('/nextgen/desktop/')
  const hideNav = pathname.startsWith('/nextgen/assets/')

  if (isShelllessRoute) {
    return <>{children}</>
  }

  return (
    <AppLayout hideNav={hideNav}>
      {children}
    </AppLayout>
  )
}
