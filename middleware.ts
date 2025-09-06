import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './src/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Check if user is authenticated
  const isAuthenticated = token ? verifyToken(token) !== null : false;

  // If accessing root path
  if (pathname === '/') {
    if (isAuthenticated) {
      // User is logged in, show homepage
      return NextResponse.next();
    } else {
      // User is not logged in, redirect to login
      return NextResponse.redirect(new URL('/auth', request.url));
    }
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
