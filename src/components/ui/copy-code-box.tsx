'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CopyCodeBoxProps {
  code: string
  className?: string
}

export function CopyCodeBox({ code, className }: CopyCodeBoxProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'group relative w-full rounded border border-border-dim bg-surface-low p-4 text-left transition-colors hover:bg-surface-mid hover:border-border-subtle',
        className
      )}
    >
      <code className="block text-body-mono-1-regular text-foreground">
        {code}
      </code>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {copied ? (
          <>
            <span className="text-label-0-regular text-green-500">Copied!</span>
            <Check className="w-4 h-4 text-green-500" />
          </>
        ) : (
          <>
            <span className="text-label-0-regular text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity">
              Click to copy
            </span>
            <Copy className="w-4 h-4 text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        )}
      </div>
    </button>
  )
}
