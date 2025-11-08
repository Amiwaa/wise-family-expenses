import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthenticatedUser, verifyFamilyAdmin } from '@/lib/api-auth'

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
    const { familyId, email, name } = body

    if (!familyId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify that the authenticated user is an admin of this family
    const admin = await verifyFamilyAdmin(Number(familyId), user.email)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Only family admins can add members.' },
        { status: 403 }
      )
    }

    // Check if member already exists
    const existing = await query(
      'SELECT id FROM family_members WHERE family_id = $1 AND email = $2',
      [familyId, email.toLowerCase()]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Member already exists' },
        { status: 400 }
      )
    }

    // Add member
    const result = await query(
      `INSERT INTO family_members (family_id, email, name, is_admin)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, is_admin as "isAdmin", joined_at as "joinedAt"`,
      [familyId, email.toLowerCase(), name, false]
    )

    return NextResponse.json({
      success: true,
      member: result.rows[0],
    })
  } catch (error: any) {
    console.error('Error adding family member:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add family member' },
      { status: 500 }
    )
  }
}


