import { cn } from '@/lib/utils'

/*
 * ===========================================
 * TEXT COMPONENT
 * ===========================================
 * All text rendering. Use instead of raw HTML tags.
 * 
 * Variants (from Hawkins type scale):
 * - display-1, display-2: Hero text
 * - headline-1 through headline-4: Headings
 * - body-1, body-2: Body text
 * - caption: Small text
 * - overline: Category labels (uppercase)
 */

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 
    | 'display-1' | 'display-2'
    | 'headline-1' | 'headline-2' | 'headline-3' | 'headline-4'
    | 'body-1' | 'body-2' 
    | 'caption' | 'overline'
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label'
}

function Text({ 
  className, 
  variant = 'body-1', 
  color = 'primary',
  weight,
  as,
  children,
  ...props 
}: TextProps) {
  // Map variants to design system typography tokens with fallbacks
  // Primary: Design system classes (text-caption, text-body-1, etc.)
  // Fallback: Standard Tailwind classes ensure layout works
  const variantStyles = {
    'display-1': 'text-display-1 text-5xl',
    'display-2': 'text-display-2 text-4xl',
    'headline-1': 'text-headline-1 text-3xl',
    'headline-2': 'text-headline-2 text-2xl',
    'headline-3': 'text-headline-3 text-xl',
    'headline-4': 'text-headline-4 text-lg',
    'body-1': 'text-body-1 text-base',
    'body-2': 'text-body-2 text-sm',
    'caption': 'text-caption',
    'overline': 'text-overline uppercase tracking-wider',
  }
  
  const colorStyles = {
    primary: 'text-foreground',
    secondary: 'text-foreground-dim',
    tertiary: 'text-foreground-subtle',
    error: 'text-foreground-system-error',
    success: 'text-foreground-system-success',
  }
  
  const weightStyles = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }
  
  // Auto-select semantic element based on variant
  const defaultElement = {
    'display-1': 'h1',
    'display-2': 'h1',
    'headline-1': 'h1',
    'headline-2': 'h2',
    'headline-3': 'h3',
    'headline-4': 'h4',
    'body-1': 'p',
    'body-2': 'p',
    'caption': 'span',
    'overline': 'span',
  } as const

  const Component = as || defaultElement[variant] || 'p'

  return (
    <Component
      className={cn(
        variantStyles[variant],
        colorStyles[color],
        weight && weightStyles[weight],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export { Text }
