import { Suspense } from 'react'
import { SharedView } from './shared-view'

export default function SharedPage() {
  return (
    <Suspense>
      <SharedView />
    </Suspense>
  )
}
