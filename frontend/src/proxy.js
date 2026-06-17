import { NextResponse } from 'next/server';

export function proxy(request) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // 1. Prevent redirect loops & handle authenticated users on auth pages
  if (path === '/merchant/auth' || path === '/auth') {
    const expired = request.nextUrl.searchParams.get('expired');
    if (expired === 'true') {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-pathname', path);
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      response.cookies.delete('token');
      return response;
    }

    if (token) {
      if (path === '/merchant/auth') {
        return NextResponse.redirect(new URL('/merchant/dashboard', request.url));
      }
      if (path === '/auth') {
        return NextResponse.redirect(new URL('/wallet', request.url));
      }
    }
    // Forward the path to server components via a header
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', path);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. Route protection redirects
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

  // Forward the path to server components via a header for allowed requests
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', path);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/wallet/:path*', 
    '/profile/:path*',
    '/merchant/:path*',
    '/auth'
  ],
};
