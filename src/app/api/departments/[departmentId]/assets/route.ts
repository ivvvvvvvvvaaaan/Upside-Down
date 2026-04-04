import { NextResponse } from 'next/server'
import { getAssetsByDepartment } from '@/lib/data'
import type { DepartmentId } from '@/lib/data'

export async function GET(
  _request: Request,
  { params }: { params: { departmentId: string } }
) {
  try {
    const assets = getAssetsByDepartment(params.departmentId as DepartmentId)
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error fetching department assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}
