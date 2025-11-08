import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // For API routes, let them handle their own authentication and return JSON errors
    // Don't redirect to sign-in page for API routes
    if (req.nextUrl.pathname.startsWith('/api/') && !req.nextUrl.pathname.startsWith('/api/auth')) {
      return NextResponse.next()
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages and API auth routes without authentication
        if (req.nextUrl.pathname.startsWith('/api/auth')) {
          return true
        }
        if (req.nextUrl.pathname.startsWith('/auth')) {
          return true
        }
        // For API routes, let them through (they'll handle auth and return JSON)
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return true
        }
        // Require authentication for all other routes (pages)
        return !!token
      },
    },
    pages: {
      signIn: '/auth',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

