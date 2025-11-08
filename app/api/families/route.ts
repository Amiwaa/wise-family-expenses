import { NextRequest, NextResponse } from 'next/server'
import { query, initDatabase } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/api-auth'

// Initialize database on first request
let dbInitialized = false

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/families - Starting request')
    
    if (!dbInitialized) {
      console.log('Initializing database...')
      try {
        await initDatabase()
        dbInitialized = true
        console.log('Database initialized successfully')
      } catch (dbError: any) {
        console.error('Database initialization error:', dbError)
        return NextResponse.json(
          { error: `Database initialization failed: ${dbError.message}` },
          { status: 500 }
        )
      }
    }

    // Verify user is authenticated via Google OAuth
    console.log('Checking authentication...')
    const user = await getAuthenticatedUser(request)
    if (!user || !user.email) {
      console.error('Authentication failed - no user or email')
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Google.' },
        { status: 401 }
      )
    }
    console.log('User authenticated:', user.email)

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
    console.log('Creating family:', familyName)
    let familyResult
    try {
      familyResult = await query(
        'INSERT INTO families (family_name) VALUES ($1) RETURNING id',
        [familyName]
      )
      console.log('Family created with ID:', familyResult.rows[0].id)
    } catch (dbError: any) {
      console.error('Database error creating family:', dbError)
      return NextResponse.json(
        { error: `Database error: ${dbError.message}. Please check if database tables are initialized.` },
        { status: 500 }
      )
    }
    const familyId = familyResult.rows[0].id

    // Add first member as admin
    console.log('Adding family member:', email, memberName)
    try {
      await query(
        `INSERT INTO family_members (family_id, email, name, is_admin)
         VALUES ($1, $2, $3, $4)`,
        [familyId, email.toLowerCase(), memberName, true]
      )
      console.log('Family member added successfully')
    } catch (dbError: any) {
      console.error('Database error adding member:', dbError)
      return NextResponse.json(
        { error: `Database error adding member: ${dbError.message}` },
        { status: 500 }
      )
    }

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

    console.log('Adding default categories...')
    try {
      for (const category of defaultCategories) {
        await query(
          'INSERT INTO categories (family_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [familyId, category]
        )
      }
      console.log('Default categories added')
    } catch (dbError: any) {
      console.error('Database error adding categories:', dbError)
      // Don't fail the entire request if categories fail, just log it
    }

    console.log('Family creation completed successfully')
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
    console.log('GET /api/families - Starting request')
    
    if (!dbInitialized) {
      console.log('Initializing database...')
      try {
        await initDatabase()
        dbInitialized = true
        console.log('Database initialized successfully')
      } catch (dbError: any) {
        console.error('Database initialization error:', dbError)
        return NextResponse.json(
          { error: `Database initialization failed: ${dbError.message}. Please check if DATABASE_URL is set correctly and run the database migration SQL.` },
          { status: 500 }
        )
      }
    }

    // Verify user is authenticated via Google OAuth
    console.log('Checking authentication...')
    const user = await getAuthenticatedUser(request)
    if (!user || !user.email) {
      console.error('Authentication failed - no user or email')
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Google.' },
        { status: 401 }
      )
    }
    console.log('User authenticated:', user.email)

    // Use authenticated user's email (security: users can only access their own family)
    const email = user.email

    // Find family by member email
    console.log('Looking for family for email:', email.toLowerCase())
    let result
    try {
      result = await query(
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
    } catch (dbError: any) {
      console.error('Database query error:', dbError)
      return NextResponse.json(
        { error: `Database error: ${dbError.message}. Please check if database tables are initialized.` },
        { status: 500 }
      )
    }

    if (result.rows.length === 0) {
      console.log('No family found for email:', email.toLowerCase())
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const family = result.rows[0]
    console.log('Returning family data for:', email)
    return NextResponse.json({
      id: family.id,
      familyName: family.family_name,
      members: family.members,
      createdAt: family.created_at,
    })
  } catch (error: any) {
    console.error('Error fetching family:', error)
    console.error('Error stack:', error.stack)
    // Ensure we always return valid JSON
    const errorMessage = error?.message || 'Failed to fetch family'
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


