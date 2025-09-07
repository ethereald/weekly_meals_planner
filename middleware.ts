import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime for JWT verification
export const runtime = 'nodejs';

// Try to import Node.js auth, fallback to edge-compatible version
let verifyToken: (token: string) => { userId: string; username: string } | null;

try {
  // Use Node.js version if available
  const auth = require('./src/lib/auth');
  verifyToken = auth.verifyToken;
} catch (error) {
  // Fallback to edge-compatible version
  const authEdge = require('./src/lib/auth-edge');
  verifyToken = authEdge.verifyTokenEdge;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Check if user is authenticated
  const isAuthenticated = token ? verifyToken(token) !== null : false;

  // Allow root path to handle its own authentication
  if (pathname === '/') {
    return NextResponse.next();
  }

  // For protected routes (you can add more as needed)
  if (pathname.startsWith('/meal-planning')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
