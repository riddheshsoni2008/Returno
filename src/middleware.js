import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Simple token presence routing at the edge
  if ((path.startsWith('/dashboard') || path.startsWith('/wallet') || path.startsWith('/admin')) && !token) {
    const loginUrl = new URL('/auth', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/wallet/:path*', 
    '/admin/:path*'
  ],
};
