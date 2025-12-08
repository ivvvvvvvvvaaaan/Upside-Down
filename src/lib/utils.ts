import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx
 * Use this for conditional and dynamic class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
