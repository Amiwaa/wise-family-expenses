import { NextRequest, NextResponse } from 'next/server'
import { query, initDatabase } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/api-auth'

// Initialize database on first request
let dbInitialized = false

export async function POST(request: NextRequest) {
  try {
    if (!dbInitialized) {
      await initDatabase()
      dbInitialized = true
    }

    // Verify user is authenticated via Google OAuth
    const user = await getAuthenticatedUser(request)
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Google.' },
        { status: 401 }
      )
    }

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      )
    }

    const { familyName, memberName } = body
    const email = user.email // Use authenticated user's email

    if (!familyName || !memberName) {
      return NextResponse.json(
        { error: 'Family name and member name are required' },
        { status: 400 }
      )
    }

    // Create family
    const familyResult = await query(
      'INSERT INTO families (family_name) VALUES ($1) RETURNING id',
      [familyName]
    )
    const familyId = familyResult.rows[0].id

    // Add first member as admin
    await query(
      `INSERT INTO family_members (family_id, email, name, is_admin)
       VALUES ($1, $2, $3, $4)`,
      [familyId, email.toLowerCase(), memberName, true]
    )

    // Add default categories
    const defaultCategories = [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Bills & Utilities',
      'Entertainment',
      'Healthcare',
      'Education',
      'Other',
    ]

    for (const category of defaultCategories) {
      await query(
        'INSERT INTO categories (family_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [familyId, category]
      )
    }

    return NextResponse.json({
      success: true,
      familyId,
      message: 'Family created successfully',
    })
  } catch (error: any) {
    console.error('Error creating family:', error)
    // Ensure we always return valid JSON
    const errorMessage = error?.message || 'Failed to create family'
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!dbInitialized) {
      await initDatabase()
      dbInitialized = true
    }

    // Verify user is authenticated via Google OAuth
    const user = await getAuthenticatedUser(request)
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Google.' },
        { status: 401 }
      )
    }

    // Use authenticated user's email (security: users can only access their own family)
    const email = user.email

    // Find family by member email
    console.log('Looking for family for email:', email.toLowerCase())
    const result = await query(
      `SELECT f.*, 
              json_agg(
                json_build_object(
                  'id', fm.id,
                  'email', fm.email,
                  'name', fm.name,
                  'isAdmin', fm.is_admin,
                  'joinedAt', fm.joined_at
                )
              ) as members
       FROM families f
       JOIN family_members fm ON f.id = fm.family_id
       WHERE fm.email = $1
       GROUP BY f.id`,
      [email.toLowerCase()]
    )

    console.log('Family query result:', result.rows.length, 'families found')

    if (result.rows.length === 0) {
      console.log('No family found for email:', email.toLowerCase())
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const family = result.rows[0]
    return NextResponse.json({
      id: family.id,
      familyName: family.family_name,
      members: family.members,
      createdAt: family.created_at,
    })
  } catch (error: any) {
    console.error('Error fetching family:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch family' },
      { status: 500 }
    )
  }
}


