'use client'

import { AppLayout } from '@/components/layouts'
import { Stack, PageHeader, EmptyState } from '@/components/ui'

interface PlaceholderViewProps {
  title: string
  section?: string
  /** Variant determines the empty state message */
  variant?: 'coming-soon' | 'no-permission'
}

export function PlaceholderView({ title, section, variant = 'no-permission' }: PlaceholderViewProps) {
  const isNoPermission = variant === 'no-permission'

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <PageHeader
                  title={title}
                  description={section ? `${section} section` : undefined}
                />
                <EmptyState
                  title={isNoPermission ? "No Access" : "Coming Soon"}
                  message={isNoPermission
                    ? "You don't have permission to view this department"
                    : "This section is under development"
                  }
                />
              </Stack>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
