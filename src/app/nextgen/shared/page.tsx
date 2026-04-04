import { SharedView } from './shared-view'

export default function SharedPage({
  searchParams,
}: {
  searchParams?: { selected?: string | string[] }
}) {
  const selected = Array.isArray(searchParams?.selected)
    ? searchParams?.selected[0] ?? null
    : searchParams?.selected ?? null

  return <SharedView initialSelectedId={selected} />
}
