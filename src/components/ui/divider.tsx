import { cn } from '@/lib/utils'

/*
 * ===========================================
 * DIVIDER COMPONENT
 * ===========================================
 * Visual separator.
 */

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical'
}

function Divider({ 
  className, 
  orientation = 'horizontal',
  ...props 
}: DividerProps) {
  return (
    <hr
      className={cn(
        'border-border shrink-0',
        orientation === 'horizontal' 
          ? 'w-full border-t' 
          : 'h-full border-l',
        className
      )}
      {...props}
    />
  )
}

export { Divider }
