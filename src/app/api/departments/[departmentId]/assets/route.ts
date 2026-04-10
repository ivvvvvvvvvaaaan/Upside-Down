import { NextResponse } from 'next/server'
import { getAssetsByDomain } from '@/lib/data'
import type { DomainId } from '@/lib/data'

export async function GET(
  _request: Request,
  { params }: { params: { departmentId: string } }
) {
  try {
    const assets = getAssetsByDomain(params.departmentId as DomainId)
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error fetching domain assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}
