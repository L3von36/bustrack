import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hasMinRole } from '@/lib/auth';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/api/auth/login', '/api/health'];

// Role-based access control mapping
const ROLE_ACCESS: Record<string, string[]> = {
  '/api/admin': ['SUPERADMIN'],
  '/api/gate': ['GATEMAN', 'MANAGER', 'SUPERADMIN'],
  '/api/bookings': ['TICKETER', 'CASHIER', 'MANAGER', 'SUPERADMIN'],
  '/api/payments': ['CASHIER', 'MANAGER', 'SUPERADMIN'],
  '/api/dashboard': ['MANAGER', 'SUPERADMIN'],
  '/api/schedules': ['TICKETER', 'CASHIER', 'MANAGER', 'SUPERADMIN', 'GATEMAN'],
  '/api/routes': ['TICKETER', 'CASHIER', 'MANAGER', 'SUPERADMIN'],
  '/api/luggage': ['TICKETER', 'CASHIER', 'MANAGER', 'SUPERADMIN', 'GATEMAN'],
};

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Only protect API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Auth check
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // RBAC check
  for (const [path, roles] of Object.entries(ROLE_ACCESS)) {
    if (pathname.startsWith(path)) {
      if (!roles.includes(payload.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      break;
    }
  }

  // Add user info to request headers for downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-staff-id', payload.staffId);
  requestHeaders.set('x-staff-role', payload.role);
  requestHeaders.set('x-station-id', payload.stationId || '');

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};