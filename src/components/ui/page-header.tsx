import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Text } from './text'
import { Button } from './button'

export interface PageHeaderProps {
  title: string
  description?: string
  className?: string
  /** When provided, shows a back arrow button linking to this href */
  backHref?: string
}

/**
 * Standard page header with title, optional description, and optional back button
 */
export function PageHeader({ title, description, backHref, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className={cn('flex items-center', backHref && 'gap-3')}>
        {backHref && (
          <Button asChild variant="icon" size="icon" aria-label="Back" className="-my-4">
            <Link href={backHref}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        )}
        <Text variant="headline-1" weight="bold">
          {title}
        </Text>
      </div>
      {description && (
        <Text variant="body-2" color="secondary">
          {description}
        </Text>
      )}
    </div>
  )
}
