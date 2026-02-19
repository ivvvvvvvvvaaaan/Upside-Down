import { NextResponse } from 'next/server'
import { getAssetsByDepartmentAndCollection } from '@/lib/data'
import type { DepartmentId } from '@/lib/data'

export async function GET(
  request: Request,
  { params }: { params: { departmentId: string; collectionId: string } }
) {
  try {
    const assets = await getAssetsByDepartmentAndCollection(
      params.departmentId as DepartmentId,
      params.collectionId
    )
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error fetching department collection assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}
