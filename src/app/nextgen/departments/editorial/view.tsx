'use client'

import { DepartmentHomeView } from '@/components/department'
import { getDepartmentConfig } from '@/lib/department-configs'
import type { Collection } from '@/lib/data'

interface EditorialViewProps {
  initialCollections: Collection[]
}

const config = getDepartmentConfig('editorial')

export function EditorialView({ initialCollections }: EditorialViewProps) {
  return (
    <DepartmentHomeView
      config={config}
      initialCollections={initialCollections}
    />
  )
}
