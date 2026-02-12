'use client'

import { DepartmentHomeView } from '@/components/department'
import { getDepartmentConfig } from '@/lib/department-configs'
import type { Collection } from '@/lib/data'

interface CameraViewProps {
  initialCollections: Collection[]
}

const config = getDepartmentConfig('camera')

export function CameraView({ initialCollections }: CameraViewProps) {
  return (
    <DepartmentHomeView
      config={config}
      initialCollections={initialCollections}
    />
  )
}
