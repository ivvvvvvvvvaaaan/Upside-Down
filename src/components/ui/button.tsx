/**
 * Button Component
 * 
 * Interactive button with multiple variants and sizes.
 * 
 * VARIANTS:
 * - primary: Main actions (CTA, submit forms)
 * - secondary: Supporting actions (cancel, back)
 * - destructive: Dangerous actions (delete, remove)
 * - tertiary: Low emphasis actions (links, text buttons)
 * - icon: Icon-only buttons (toolbar actions)
 * 
 * PROPS:
 * - variant: Visual style (primary, secondary, destructive, tertiary, icon)
 * - size: Button dimensions (default, compact, icon)
 * - compact: Boolean alternative to size="compact"
 * - icon: React node to display before button text
 * - dropdown: Displays chevron icon after text
 * 
 * DIFFERENCES FROM PRODUCTION HAWKINS:
 * - Production includes genai-primary, genai-secondary, icon-reverse, tertiary-reverse variants
 * - Production supports executing/loading states with spinners
 * - Production includes tooltipProps for accessibility
 * - Production has href/to props for automatic Link/RouterLink composition
 * - Production uses leftIcon/rightIcon instead of single icon prop
 * 
 * STYLING:
 * - Uses tokens from tailwind.config.ts
 * - Avoids arbitrary color values
 * - Follows semantic naming conventions
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-[4px] font-sans text-center ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        secondary: "bg-transparent border border-border-subtle text-foreground dark:border-border-inverse-subtle dark:text-foreground hover:bg-surface-highlight dark:hover:bg-white/10 disabled:bg-transparent disabled:opacity-40 disabled:border-opacity-20",
        "secondary-destructive":
          "bg-transparent border border-destructive-secondary-border border-opacity-40 text-destructive-secondary-foreground hover:bg-destructive/10",
        tertiary: "bg-transparent text-foreground hover:bg-surface-highlight dark:hover:bg-white/10",
        icon: "bg-transparent text-foreground hover:bg-surface-highlight dark:hover:bg-white/10",
      },
      size: {
        default: "h-10 px-3 py-[10px] text-base font-semibold",
        compact: "py-1 px-2 text-xs font-semibold",
        icon: "h-10 w-10",
      },
    },
    compoundVariants: [
      {
        variant: "icon",
        size: "icon",
        className: "[&_svg]:size-6",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)

/**
 * Button component props
 * 
 * @example
 * <Button variant="primary">Save Changes</Button>
 * <Button variant="secondary" icon={<PlusIcon />}>Add Item</Button>
 * <Button variant="icon" size="icon"><TrashIcon /></Button>
 * <Button compact>Compact Action</Button>
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child component for composition with other elements */
  asChild?: boolean
  /** Icon to display before button text */
  icon?: React.ReactNode
  /** Show dropdown chevron after button text */
  dropdown?: boolean
  /** Apply compact spacing (Hawkins-compatible API) */
  compact?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, compact, asChild = false, children, icon, dropdown, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const finalSize = compact ? 'compact' : size
    return (
      <Comp className={cn(buttonVariants({ variant, size: finalSize, className }))} ref={ref} {...props}>
        {icon}
        {children}
        {dropdown && (
          <svg
            className="size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
