import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthenticatedUser, verifyFamilyMember } from '@/lib/api-auth'

// GET /api/custom-sections?familyId=123
// Returns all custom sections for a family with transaction counts and totals
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

    // Get all custom sections for the family
    const sectionsResult = await query(
      'SELECT * FROM custom_sections WHERE family_id = $1 ORDER BY created_at DESC',
      [familyId]
    )

    // For each section, get transactions and calculate totals
    const sections = await Promise.all(
      sectionsResult.rows.map(async (section) => {
        // Get transactions for this section
        const transactionsResult = await query(
          'SELECT * FROM custom_section_transactions WHERE section_id = $1 ORDER BY created_at DESC',
          [section.id]
        )

        const transactions = transactionsResult.rows.map(row => ({
          id: row.id.toString(),
          amount: parseFloat(row.amount),
          description: row.description,
          addedBy: row.added_by,
          createdAt: row.created_at,
        }))

        // Calculate total
        const total = transactions.reduce((sum, t) => sum + t.amount, 0)

        return {
          id: section.id.toString(),
          name: section.name,
          type: section.type,
          familyId: section.family_id,
          transactions,
          transactionCount: transactions.length,
          total,
          createdAt: section.created_at,
        }
      })
    )

    return NextResponse.json(sections)
  } catch (error: any) {
    console.error('Error fetching custom sections:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch custom sections' },
      { status: 500 }
    )
  }
}

// POST /api/custom-sections
// Creates a new custom section
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
    const { familyId, name, type } = body

    if (!familyId || !name || !type) {
      return NextResponse.json(
        { error: 'Family ID, name, and type are required' },
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

    if (type !== 'expense' && type !== 'saving') {
      return NextResponse.json(
        { error: "Type must be 'expense' or 'saving'" },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO custom_sections (family_id, name, type)
       VALUES ($1, $2, $3)
       RETURNING id, name, type, family_id, created_at`,
      [familyId, name.trim(), type]
    )

    const section = result.rows[0]
    return NextResponse.json({
      success: true,
      section: {
        id: section.id.toString(),
        name: section.name,
        type: section.type,
        familyId: section.family_id,
        transactions: [],
        transactionCount: 0,
        total: 0,
        createdAt: section.created_at,
      },
    })
  } catch (error: any) {
    console.error('Error creating custom section:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create custom section' },
      { status: 500 }
    )
  }
}

// DELETE /api/custom-sections?id=123
// Deletes a custom section (transactions are cascade deleted)
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
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

    // Verify that the user is a member of the family that owns this section
    const sectionResult = await query('SELECT family_id FROM custom_sections WHERE id = $1', [id])
    if (sectionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    const member = await verifyFamilyMember(sectionResult.rows[0].family_id, user.email)
    if (!member) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not a member of this family.' },
        { status: 403 }
      )
    }

    await query('DELETE FROM custom_sections WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting custom section:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete custom section' },
      { status: 500 }
    )
  }
}

