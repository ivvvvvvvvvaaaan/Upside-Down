/**
 * Client-safe image utilities.
 * No fs/path dependencies — safe for use in 'use client' components.
 *
 * Images are organized by department and dimension so that previews
 * match the context of the entity they represent.
 */

import type { DomainId } from './data-client'

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Deterministic pick from an image array using a string seed */
export function pick(images: string[], seed: string, count: number = 1): string[] {
  if (images.length === 0) return []
  const results: string[] = []
  for (let i = 0; i < count; i++) {
    const idx = hashCode(`${seed}:${i}`) % images.length
    results.push(images[idx])
  }
  return results
}

// Per-domain image pools

const ART_IMAGES = [
  '/images/art/concepts/adf11e68-7898-48cf-a7c0-d0b36816360b.jpeg',
  '/images/art/concepts/eb59e93b-11ec-41ef-ba06-3d226cb56e96.jpeg',
  '/images/art/storyboards/23ace3be-36cb-4ba5-95bc-a479112cb5e6.jpeg',
]

const VFX_IMAGES: string[] = [
  '/images/vfx/s3-poster-alt.jpg',
]

const CAMERA_IMAGES: string[] = [
  '/images/camera/broll/netflix-f1-drive-to-survive-season-7_f.webp',
  '/images/camera/scenes/s8e6-the-duel.jpg',
  '/images/camera/scenes/s8e8-call-me-chucky.jpg',
]

const EDITORIAL_IMAGES = [
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
]

const AUDIO_IMAGES: string[] = [
  // Drop waveform screenshots, DAW sessions into /images/audio/
]

const DOMAIN_POOLS: Record<DomainId, string[]> = {
  'art-design': ART_IMAGES,
  'vfx': VFX_IMAGES,
  'camera': CAMERA_IMAGES,
  'editorial': EDITORIAL_IMAGES,
  'audio-sound': AUDIO_IMAGES,
  'marketing': [],
  'legal': [],
  'globalization': [],
}

// Per-dimension image pools (for smart collection cards)

const CHARACTER_IMAGES = [
  '/images/characters/545c203dbd67064a6f0a3a9c47e1bcae82639e8b.webp',
  '/images/characters/max.jpeg',
  '/images/characters/MV5BZDFiMTc2YmMtODJmZS00YTAxLThhODYtYTZlY2RjZjE5M2NmXkEyXkFqcGdeQWRpZWdtb25n._V1_QL75_UX500_CR0,0,500,281_.jpg',
  '/images/characters/netflix-f1-drive-to-survive-season-7_f.webp',
  '/images/characters/perez.jpeg',
  '/images/characters/toto-wolff-kimi-antonelli-george-russell.jpg',
]

const LOCATION_IMAGES = [
  '/images/location/56f5d5fe-c73f-45b4-9350-4014d5303d87.jpeg',
  '/images/location/7c55bc99-922b-4c28-a2b6-aa0c66ad3df3.jpeg',
  '/images/location/b365728d-fc40-48cf-82cf-355312db50c8.jpeg',
  '/images/location/ea3b7291-d502-4351-8ae0-6f3355cd1a33.jpeg',
]

const SCENE_IMAGES = [
  '/images/scene/img1.png',
  '/images/scene/img2.png',
  '/images/scene/img3.png',
  '/images/scene/img4.png',
]

export type ImageDimension = 'characters' | 'scenes' | 'locations'

const DIMENSION_POOLS: Record<ImageDimension, string[]> = {
  characters: CHARACTER_IMAGES,
  scenes: SCENE_IMAGES,
  locations: LOCATION_IMAGES,
}

// Combined fallback pool (all images)

export const IMAGE_POOL = [
  ...ART_IMAGES,
  ...VFX_IMAGES,
  ...CAMERA_IMAGES,
  ...EDITORIAL_IMAGES,
  ...AUDIO_IMAGES,
  ...CHARACTER_IMAGES,
  ...LOCATION_IMAGES,
  ...SCENE_IMAGES,
]

// Smart pick helpers

/** Pick from the domain-specific pool, falling back to the combined pool */
export function pickForDomain(domain: DomainId | undefined, seed: string, count: number = 1): string[] {
  const pool = domain ? DOMAIN_POOLS[domain] : null
  return pick(pool && pool.length > 0 ? pool : IMAGE_POOL, seed, count)
}

/** Pick from the dimension-specific pool (for smart collection cards) */
export function pickForDimension(dimension: ImageDimension | undefined, seed: string, count: number = 1): string[] {
  const pool = dimension ? DIMENSION_POOLS[dimension] : null
  return pick(pool && pool.length > 0 ? pool : IMAGE_POOL, seed, count)
}
