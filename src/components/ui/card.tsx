import * as React from 'react'
import { cn } from '@/lib/utils'

/*
 * Card - Composable container with Card.Body and Card.Footer
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: 'default' | 'elevated' | 'outlined'
}

function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-surface-low',
    elevated: 'bg-surface-mid shadow-mid',
    outlined: 'bg-surface-low border border-border-dim',
  }

  return (
    <div
      className={cn(
        'rounded',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg'
}

function CardBody({
  className,
  padding = 'lg',
  children,
  ...props
}: CardBodyProps) {
  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <div className={cn(paddings[padding], className)} {...props}>
      {children}
    </div>
  )
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardFooter({
  className,
  children,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn(
        'px-6 py-4',
        'flex justify-end gap-2',
        'bg-surface-highlight rounded-b',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Body = CardBody
Card.Footer = CardFooter

export { Card }
