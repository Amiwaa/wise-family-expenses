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
      'SELECT * FROM savings WHERE family_id = $1 ORDER BY created_at DESC',
      [familyId]
    )

    return NextResponse.json(result.rows.map(row => ({
      id: row.id.toString(),
      amount: parseFloat(row.amount),
      description: row.description,
      goal: row.goal ? parseFloat(row.goal) : null,
      addedBy: row.added_by,
      createdAt: row.created_at,
    })))
  } catch (error: any) {
    console.error('Error fetching savings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch savings' },
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
    const { familyId, amount, description, goal, addedBy } = body

    if (!familyId || !amount) {
      return NextResponse.json(
        { error: 'Family ID and amount are required' },
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
      `INSERT INTO savings (family_id, amount, description, goal, added_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, amount, description, goal, added_by as "addedBy", created_at as "createdAt"`,
      [familyId, amount, description || null, goal || null, addedBy || null]
    )

    return NextResponse.json({
      success: true,
      saving: {
        id: result.rows[0].id.toString(),
        amount: parseFloat(result.rows[0].amount),
        description: result.rows[0].description,
        goal: result.rows[0].goal ? parseFloat(result.rows[0].goal) : null,
        addedBy: result.rows[0].addedBy,
        createdAt: result.rows[0].createdAt,
      },
    })
  } catch (error: any) {
    console.error('Error creating saving:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create saving' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Saving ID is required' },
        { status: 400 }
      )
    }

    // Verify that the user is a member of the family that owns this saving
    const savingResult = await query('SELECT family_id FROM savings WHERE id = $1', [id])
    if (savingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Saving not found' },
        { status: 404 }
      )
    }

    const member = await verifyFamilyMember(savingResult.rows[0].family_id, user.email)
    if (!member) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not a member of this family.' },
        { status: 403 }
      )
    }

    await query('DELETE FROM savings WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting saving:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete saving' },
      { status: 500 }
    )
  }
}


