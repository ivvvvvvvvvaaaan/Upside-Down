import { getAssets } from '@/lib/data'
import { CharactersPocView } from './view'

/*
 * ===========================================
 * CHARACTERS POC - ASSET GALLERY
 * ===========================================
 */

export default async function CharactersPocPage() {
  // Fetch data (Mock or Real depending on environment)
  const assets = await getAssets()
  
  return <CharactersPocView title="Characters Poc" assets={assets} />
}
