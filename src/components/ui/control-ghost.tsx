import { cn } from '@/lib/utils'

export interface ControlGhostProps {
  className?: string
  widthClassName?: string
}

export function ControlGhost({ className, widthClassName = 'w-32' }: ControlGhostProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-10 rounded bg-surface-highlight', widthClassName, className)}
    />
  )
}
