import { NextResponse } from 'next/server'
import { getAssets } from '@/lib/data'

export async function GET() {
  try {
    const assets = getAssets()
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}
