import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthenticatedUser, verifyFamilyMember } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getAuthenticatedUser(request)
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Google.' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const familyId = searchParams.get('familyId')

    if (!familyId) {
      return NextResponse.json(
        { error: 'Family ID is required' },
        { status: 400 }
      )
    }

    // Verify that the user is a member of this family
    const member = await verifyFamilyMember(Number(familyId), user.email)
    if (!member) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not a member of this family.' },
        { status: 403 }
      )
    }

    const result = await query(
      'SELECT name FROM categories WHERE family_id = $1 ORDER BY name',
      [familyId]
    )

    return NextResponse.json(result.rows.map(row => row.name))
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getAuthenticatedUser(request)
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Google.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { familyId, name } = body

    if (!familyId || !name) {
      return NextResponse.json(
        { error: 'Family ID and category name are required' },
        { status: 400 }
      )
    }

    // Verify that the user is a member of this family
    const member = await verifyFamilyMember(Number(familyId), user.email)
    if (!member) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not a member of this family.' },
        { status: 403 }
      )
    }

    await query(
      'INSERT INTO categories (family_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [familyId, name]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    )
  }
}


