import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Protect Customer routes -> Redirect to /auth
  if ((path.startsWith('/wallet') || path.startsWith('/profile')) && !token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Protect Merchant/Business routes -> Redirect to /merchant/auth
  if ((path.startsWith('/merchant/dashboard') || path.startsWith('/merchant/customers') || path.startsWith('/merchant/rewards') || path.startsWith('/merchant/settings')) && !token) {
    return NextResponse.redirect(new URL('/merchant/auth', request.url));
  }

  // Legacy fallback: protect old dashboard route if requested
  if (path.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/merchant/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/wallet/:path*', 
    '/profile/:path*',
    '/merchant/:path*'
  ],
};
