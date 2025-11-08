import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthenticatedUser, verifyFamilyMember } from '@/lib/api-auth'

// GET /api/custom-sections/transactions?sectionId=123
// Returns all transactions for a custom section
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
    const sectionId = searchParams.get('sectionId')

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

    // Verify that the user is a member of the family that owns this section
    const sectionResult = await query(
      'SELECT family_id FROM custom_sections WHERE id = $1',
      [sectionId]
    )
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

    const result = await query(
      'SELECT * FROM custom_section_transactions WHERE section_id = $1 ORDER BY created_at DESC',
      [sectionId]
    )

    return NextResponse.json(
      result.rows.map(row => ({
        id: row.id.toString(),
        sectionId: row.section_id.toString(),
        amount: parseFloat(row.amount),
        description: row.description,
        addedBy: row.added_by,
        createdAt: row.created_at,
      }))
    )
  } catch (error: any) {
    console.error('Error fetching custom section transactions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST /api/custom-sections/transactions
// Creates a new transaction in a custom section
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
    const { sectionId, amount, description, addedBy } = body

    if (!sectionId || !amount) {
      return NextResponse.json(
        { error: 'Section ID and amount are required' },
        { status: 400 }
      )
    }

    // Verify that the user is a member of the family that owns this section
    const sectionResult = await query(
      'SELECT family_id FROM custom_sections WHERE id = $1',
      [sectionId]
    )
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

    const result = await query(
      `INSERT INTO custom_section_transactions (section_id, amount, description, added_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, section_id, amount, description, added_by, created_at`,
      [sectionId, amount, description || null, addedBy || null]
    )

    const transaction = result.rows[0]
    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id.toString(),
        sectionId: transaction.section_id.toString(),
        amount: parseFloat(transaction.amount),
        description: transaction.description,
        addedBy: transaction.added_by,
        createdAt: transaction.created_at,
      },
    })
  } catch (error: any) {
    console.error('Error creating custom section transaction:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

// DELETE /api/custom-sections/transactions?id=123
// Deletes a transaction from a custom section
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
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Verify that the user is a member of the family that owns this transaction
    const transactionResult = await query(
      `SELECT cs.family_id 
       FROM custom_section_transactions cst
       JOIN custom_sections cs ON cst.section_id = cs.id
       WHERE cst.id = $1`,
      [id]
    )
    if (transactionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const member = await verifyFamilyMember(transactionResult.rows[0].family_id, user.email)
    if (!member) {
      return NextResponse.json(
        { error: 'Unauthorized. You are not a member of this family.' },
        { status: 403 }
      )
    }

    await query('DELETE FROM custom_section_transactions WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting custom section transaction:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}

