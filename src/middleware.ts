import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Only apply middleware to protected routes
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to dashboard for any authenticated user
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token;
        }
        
        // Admin routes require admin privileges
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return !!token && (token.isAdmin === true || token.email === 'admin@yadaphone.com');
        }
        
        return true;
      }
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
}