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

/** All images found under public/images/ — server-only (uses fs) */
export const allImages = scanImages(path.join(process.cwd(), 'public', 'images'))

/**
 * Static image pool for client-side use (no fs dependency).
 * Must match the contents of public/images/ — update when images change.
 */
export const CLIENT_IMAGE_POOL = [
  '/images/characters/23ace3be-36cb-4ba5-95bc-a479112cb5e6.jpeg',
  '/images/characters/545c203dbd67064a6f0a3a9c47e1bcae82639e8b.webp',
  '/images/characters/MV5BZDFiMTc2YmMtODJmZS00YTAxLThhODYtYTZlY2RjZjE5M2NmXkEyXkFqcGdeQWRpZWdtb25n._V1_QL75_UX500_CR0,0,500,281_.jpg',
  '/images/characters/adf11e68-7898-48cf-a7c0-d0b36816360b.jpeg',
  '/images/characters/eb59e93b-11ec-41ef-ba06-3d226cb56e96.jpeg',
  '/images/characters/max.jpeg',
  '/images/characters/netflix-f1-drive-to-survive-season-7_f.webp',
  '/images/characters/perez.jpeg',
  '/images/characters/toto-wolff-kimi-antonelli-george-russell.jpg',
  '/images/edit/s1e1-all-to-play-for.jpg',
  '/images/edit/s3-poster-alt.jpg',
  '/images/edit/s3-poster.jpg',
  '/images/edit/s4e1-clash-of-the-titans.jpg',
  '/images/edit/s6e1-money-talks.jpg',
  '/images/edit/s7e1-business-as-usual.jpg',
  '/images/edit/s8e1-new-kids-on-the-track.jpg',
  '/images/edit/s8e2-strictly-business.jpg',
  '/images/edit/s8e3-the-number-1-problem.jpg',
  '/images/edit/s8e4-a-bull-with-no-horns.jpg',
  '/images/edit/s8e5-the-skys-the-limit.jpg',
  '/images/edit/s8e6-the-duel.jpg',
  '/images/edit/s8e7-what-happens-in-vegas.jpg',
  '/images/edit/s8e8-call-me-chucky.jpg',
  '/images/location/56f5d5fe-c73f-45b4-9350-4014d5303d87.jpeg',
  '/images/location/7c55bc99-922b-4c28-a2b6-aa0c66ad3df3.jpeg',
  '/images/location/b365728d-fc40-48cf-82cf-355312db50c8.jpeg',
  '/images/location/ea3b7291-d502-4351-8ae0-6f3355cd1a33.jpeg',
  '/images/scene/img1.png',
  '/images/scene/img2.png',
  '/images/scene/img3.png',
  '/images/scene/img4.png',
]
