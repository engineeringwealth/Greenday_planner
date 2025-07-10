import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@sentry/nextjs'

export async function middleware(request: NextRequest) {
  // Sentry SDK auto-instrumentation will catch this, no need to do anything here.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
