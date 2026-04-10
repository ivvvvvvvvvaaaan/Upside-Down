import { NextResponse } from 'next/server'
import { getAssetsByDomainAndCollection } from '@/lib/data'
import type { DomainId } from '@/lib/data'

export async function GET(
  _request: Request,
  { params }: { params: { departmentId: string; collectionId: string } }
) {
  try {
    const assets = getAssetsByDomainAndCollection(
      params.departmentId as DomainId,
      params.collectionId
    )
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error fetching domain collection assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}
