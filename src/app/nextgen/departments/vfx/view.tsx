'use client'

import { DepartmentHomeView } from '@/components/department'
import { getDepartmentConfig } from '@/lib/department-configs'
import type { Collection } from '@/lib/data'

interface VfxViewProps {
  initialCollections: Collection[]
}

const config = getDepartmentConfig('vfx')

export function VfxView({ initialCollections }: VfxViewProps) {
  return (
    <DepartmentHomeView
      config={config}
      initialCollections={initialCollections}
    />
  )
}
