'use client'

import { Button } from './button'
import { cn } from '@/lib/utils'
import type { ReviewNoteSummary } from '@/lib/review-notes'

interface CreativeReviewCardProps {
  summary: ReviewNoteSummary
}

export function CreativeReviewCard({ summary }: CreativeReviewCardProps) {
  return (
    <div
      className="rounded-lg border border-indigo-500/10 p-5 space-y-4"
      style={{ background: 'linear-gradient(135deg, rgb(var(--indigo-500) / 0.02), rgb(var(--indigo-500) / 0.08))' }}
    >
      <div>
        <span className={cn(
          'text-label-0-bold',
          summary.active ? 'text-green-500' : 'text-foreground-dim'
        )}>
          {summary.active ? 'Active' : 'Completed'}
        </span>
        <p className="text-body-2-bold text-foreground">Review Session</p>
      </div>

      <p className="text-body-0-regular text-foreground">{summary.latestSummary}</p>

      <p className="text-label-0-regular">
        <span className="text-foreground-dim">{summary.totalNotes} notes</span>
        <span className="text-foreground-dim"> · </span>
        <span className={summary.unresolvedCount > 0 ? 'text-orange-500' : 'text-foreground-dim'}>
          {summary.unresolvedCount} unresolved
        </span>
        <span className="text-foreground-dim"> · </span>
        <span className="text-foreground-dim">
          {new Date(summary.updatedAt).toLocaleDateString()}
        </span>
      </p>

      <Button variant="secondary" compact asChild>
        <a href={summary.externalUrl} target="_blank" rel="noreferrer">
          Open in Creative Review
        </a>
      </Button>
    </div>
  )
}
