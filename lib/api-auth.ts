import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { query } from './db'

// Verify that the user is authenticated and get their email
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Try to get token without specifying cookie name first (let NextAuth auto-detect)
    let token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
    })

    // If no token, try with explicit cookie name for development
    if (!token && process.env.NODE_ENV === 'development') {
      token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token',
      })
    }

    if (!token || !token.email) {
      return null
    }

    return {
      email: token.email as string,
      name: token.name as string | undefined,
    }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

// Verify that the user is a member of the family
export async function verifyFamilyMember(familyId: number, userEmail: string) {
  try {
    const result = await query(
      'SELECT id, email, is_admin FROM family_members WHERE family_id = $1 AND email = $2',
      [familyId, userEmail.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return null
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      isAdmin: result.rows[0].is_admin,
    }
  } catch (error) {
    console.error('Error verifying family member:', error)
    return null
  }
}

// Verify that the user is an admin of the family
export async function verifyFamilyAdmin(familyId: number, userEmail: string) {
  const member = await verifyFamilyMember(familyId, userEmail)
  if (!member || !member.isAdmin) {
    return null
  }
  return member
}

