'use client'

import { AppLayout } from '@/components/layouts'
import { Stack, PageHeader, EmptyState } from '@/components/ui'

interface PlaceholderViewProps {
  title: string
  section?: string
}

export function PlaceholderView({ title, section }: PlaceholderViewProps) {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <PageHeader
                  title={title}
                  description={section ? `${section} section` : 'Coming soon'}
                />
                <EmptyState
                  title="Coming Soon"
                  message="This section is under development"
                />
              </Stack>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
