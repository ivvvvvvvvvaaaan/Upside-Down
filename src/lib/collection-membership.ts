export function mergeCollectionAssetIds(existing: string[], additions: string[]): string[] {
  return Array.from(new Set([...existing, ...additions]))
}
