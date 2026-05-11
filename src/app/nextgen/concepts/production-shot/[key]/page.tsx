import { ProductionShotDetailView } from './view'

interface Props {
  params: { key: string }
}

/**
 * Production Shot detail page (Composite Concept).
 *
 * Renders a Production Shot Concept (e.g., 'EP301-S05-T03A') along with its
 * constituent Media Assets (camera clip + audio clip + dailies proxy) grouped
 * by Media Asset Type.
 *
 * Part of the Phase B stress test of the asset-taxonomy spec — proves the
 * data layer's Composite Concept pattern (Concept node + Media Asset
 * components connected via aiMeta) actually renders end-to-end.
 */
export default function ProductionShotPage({ params }: Props) {
  return <ProductionShotDetailView shotKey={decodeURIComponent(params.key)} />
}
