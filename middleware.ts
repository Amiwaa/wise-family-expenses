import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
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
        // Require authentication for all other routes
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

