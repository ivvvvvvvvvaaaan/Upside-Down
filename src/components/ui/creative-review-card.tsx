'use client'

import { ExternalLink } from 'lucide-react'
import { Tag } from './tag'
import { cn } from '@/lib/utils'
import type { ReviewNoteSummary } from '@/lib/review-notes'

interface CreativeReviewCardProps {
  summary: ReviewNoteSummary
}

export function CreativeReviewCard({ summary }: CreativeReviewCardProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-body-0-bold text-foreground-dim">Creative Review</h4>
        <Tag
          size="compact"
          type={summary.active ? 'positive' : 'neutral'}
          variant="fill"
        >
          {summary.active ? 'Active' : 'Complete'}
        </Tag>
      </div>

      <div className="rounded border border-indigo-500/20 bg-indigo-500/5 p-3 space-y-2">
        <p className="text-body-0-regular text-foreground">{summary.latestSummary}</p>

        <div className="flex items-center justify-between">
          <p className="text-label-0-regular text-foreground-dim">
            {summary.totalNotes} notes
            <span className="mx-1">·</span>
            <span className={cn(summary.unresolvedCount > 0 && 'text-orange-500')}>
              {summary.unresolvedCount} unresolved
            </span>
            <span className="mx-1">·</span>
            {new Date(summary.updatedAt).toLocaleDateString()}
          </p>

          <a
            href={summary.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-label-0-bold text-foreground-dim hover:text-foreground-system-link transition-colors"
          >
            Open
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  )
}
