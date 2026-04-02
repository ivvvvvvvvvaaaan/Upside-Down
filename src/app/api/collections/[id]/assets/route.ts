import { NextResponse } from 'next/server'
import { getAssetsByCollection } from '@/lib/data'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assets = getAssetsByCollection(params.id)
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}
