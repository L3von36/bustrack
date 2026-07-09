import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

// Public paths that bypass rate limiting and auth
const PUBLIC_PATHS = ['/api/auth/login', '/api/health'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths without rate limiting
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Only apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  // Pass through all requests — auth verification is handled
  // in each route handler (runs in Node.js runtime with full env access)
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};