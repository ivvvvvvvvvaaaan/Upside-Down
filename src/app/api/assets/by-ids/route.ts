import { NextRequest, NextResponse } from 'next/server'
import { getAssetsByIds } from '@/lib/data'

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids must be an array' }, { status: 400 })
    }

    const assets = await getAssetsByIds(ids)
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Failed to fetch assets by IDs:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}
