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
  /** Hide the title on mobile (shown in MobileToolbar instead) */
  hideTitleOnMobile?: boolean
}

/**
 * Standard page header with title, optional description, and optional back button
 */
export function PageHeader({ title, description, backHref, className, hideTitleOnMobile }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-0.5 min-w-0', className)}>
      <div className={cn('flex items-center', backHref && 'gap-3', hideTitleOnMobile && 'hidden md:flex')}>
        {backHref && (
          <Button asChild variant="icon" size="icon" aria-label="Back" className="-my-4">
            <Link href={backHref}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        )}
        <h2 className="truncate text-lg font-bold md:text-2xl">
          {title}
        </h2>
      </div>
      {description && (
        <Text variant="body-2" color="secondary">
          {description}
        </Text>
      )}
    </div>
  )
}
