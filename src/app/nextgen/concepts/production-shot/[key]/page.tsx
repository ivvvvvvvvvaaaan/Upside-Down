import { redirect } from 'next/navigation'

interface Props {
  params: { key: string }
}

/**
 * Production Shot Concepts are now projected as Assets (kind: 'production-shot')
 * and live at the canonical asset detail URL. This route exists only to keep
 * old links working — it forwards to `/nextgen/assets/[key]` where the
 * canonical AssetDetailView reads the projected Asset.
 */
export default function ProductionShotPage({ params }: Props) {
  redirect(`/nextgen/assets/${encodeURIComponent(decodeURIComponent(params.key))}`)
}
