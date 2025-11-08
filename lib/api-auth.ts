import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { query } from './db'

// Verify that the user is authenticated and get their email
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Check if NEXTAUTH_SECRET is set
    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET is not set in environment variables')
      return null
    }

    // Get token - NextAuth will auto-detect cookie name based on environment
    // In production (HTTPS), it uses __Secure-next-auth.session-token
    // In development (HTTP), it uses next-auth.session-token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      // Don't specify cookieName - let NextAuth auto-detect based on protocol
    })

    if (!token) {
      // Log available cookies for debugging (without sensitive data)
      const cookieHeader = request.headers.get('cookie')
      console.log('No token found. Cookies present:', cookieHeader ? 'Yes' : 'No')
      if (cookieHeader) {
        const cookieNames = cookieHeader.split(';').map(c => c.split('=')[0].trim())
        console.log('Cookie names:', cookieNames.filter(c => c.includes('auth') || c.includes('session')))
      }
      console.log('NEXTAUTH_SECRET set:', !!process.env.NEXTAUTH_SECRET)
      console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
      return null
    }

    if (!token.email) {
      console.error('Token found but no email in token:', Object.keys(token))
      return null
    }

    console.log('User authenticated successfully:', token.email)
    return {
      email: token.email as string,
      name: token.name as string | undefined,
    }
  } catch (error: any) {
    console.error('Error getting authenticated user:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
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

