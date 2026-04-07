'use client'

import { useAccess, usePersona } from '@/hooks'
import { EmptyState } from '@/components/ui'
import { AppLayout } from '@/components/layouts'
import { PERSONAS } from '@/lib/personas'

interface Props {
  params: { linkId: string }
}

/**
 * Review Page — focused review surface for reviewer personas.
 *
 * Resolves a review link ID to a grant, verifies the current user
 * is the grant recipient, and shows a focused view of the shared resource.
 *
 * In production this would show playback, comments, and ontology navigation.
 * In the prototype it shows the resource details and confirms access.
 */
export default function ReviewPage({ params }: Props) {
  const { linkId } = params
  const { getGrantByReviewLinkId } = useAccess()
  const { activePersona, hydrated } = usePersona()

  if (!hydrated) {
    return <AppLayout><div className="flex-1" /></AppLayout>
  }

  const grant = getGrantByReviewLinkId(linkId)

  if (!grant) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Review link not found"
            message="This link may have expired or been revoked."
          />
        </div>
      </AppLayout>
    )
  }

  // Verify the current persona is the grant recipient
  const isRecipient = activePersona && (
    (grant.principal.type === 'user' && grant.principal.userId === activePersona.id) ||
    (grant.principal.type === 'team' && activePersona.teamIds?.some(t => t === (grant.principal as { type: 'team'; teamId: string }).teamId))
  )

  if (!isRecipient && activePersona) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Access denied"
            message="This review link was shared with a different user."
          />
        </div>
      </AppLayout>
    )
  }

  const sharer = PERSONAS.find(p => p.id === grant.grantedByUserId)

  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-lg text-center space-y-4">
          <h1 className="text-heading-2 text-foreground">Review</h1>
          <p className="text-body-1-regular text-foreground-dim">
            {sharer?.name ?? 'Someone'} shared a {grant.resource.type} for your review.
          </p>
          <div className="space-y-2 text-left bg-surface-2 rounded p-4">
            <div className="flex justify-between text-body-0-regular">
              <span className="text-foreground-dim">Resource</span>
              <span className="text-foreground">{grant.resource.id}</span>
            </div>
            <div className="flex justify-between text-body-0-regular">
              <span className="text-foreground-dim">Permission</span>
              <span className="text-foreground">{grant.templateId}</span>
            </div>
            <div className="flex justify-between text-body-0-regular">
              <span className="text-foreground-dim">Shared by</span>
              <span className="text-foreground">{sharer?.name ?? grant.grantedByUserId}</span>
            </div>
            {grant.expiresAt && (
              <div className="flex justify-between text-body-0-regular">
                <span className="text-foreground-dim">Expires</span>
                <span className="text-foreground">{grant.expiresAt}</span>
              </div>
            )}
          </div>
          <p className="text-body-0-regular text-foreground-dim">
            In production, this page would show playback, timestamped comments, and ontology navigation for the shared content.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
