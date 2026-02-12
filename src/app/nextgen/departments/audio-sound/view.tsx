'use client'

import { DepartmentHomeView } from '@/components/department'
import { getDepartmentConfig } from '@/lib/department-configs'
import type { Collection } from '@/lib/data'

interface AudioSoundViewProps {
  initialCollections: Collection[]
}

const config = getDepartmentConfig('audio-sound')

export function AudioSoundView({ initialCollections }: AudioSoundViewProps) {
  return (
    <DepartmentHomeView
      config={config}
      initialCollections={initialCollections}
    />
  )
}
