import fs from 'fs'
import path from 'path'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])

/** Recursively scan public/images/ for all image files */
function scanImages(dir: string, prefix: string = ''): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const results: string[] = []
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        results.push(...scanImages(path.join(dir, entry.name), rel))
      } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
        results.push(`/images/${rel}`)
      }
    }
    return results
  } catch {
    return []
  }
}

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function pick(images: string[], seed: string, count: number = 1): string[] {
  if (images.length === 0) return []
  const results: string[] = []
  for (let i = 0; i < count; i++) {
    const idx = hashCode(`${seed}:${i}`) % images.length
    results.push(images[idx])
  }
  return results
}

/** All images found under public/images/ — the workspace thumbnail pool */
export const allImages = scanImages(path.join(process.cwd(), 'public', 'images'))
