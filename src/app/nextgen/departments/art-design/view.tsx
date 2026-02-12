'use client'

import { DepartmentHomeView } from '@/components/department'
import { getDepartmentConfig } from '@/lib/department-configs'
import type { Collection } from '@/lib/data'

interface ArtDesignViewProps {
  initialCollections: Collection[]
}

const config = getDepartmentConfig('art-design')

export function ArtDesignView({ initialCollections }: ArtDesignViewProps) {
  return (
    <DepartmentHomeView
      config={config}
      initialCollections={initialCollections}
    />
  )
}
