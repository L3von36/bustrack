import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { verifyToken, type JwtPayload } from '@/lib/auth';

export interface AuthContext {
  staffId: string;
  role: string;
  stationId: string | null;
}

// RBAC: which roles can access which API path prefixes
const ROLE_ACCESS: Record<string, string[]> = {
  '/api/admin': ['SUPERADMIN'],
  '/api/gate': ['GATEMAN', 'MANAGER', 'SUPERADMIN'],
  '/api/bookings': ['TICKETER', 'CASHIER', 'MANAGER', 'SUPERADMIN'],
  '/api/payments': ['CASHIER', 'MANAGER', 'SUPERADMIN'],
  '/api/dashboard': ['MANAGER', 'SUPERADMIN'],
  '/api/schedules': ['TICKETER', 'CASHIER', 'MANAGER', 'SUPERADMIN', 'GATEMAN'],
  '/api/routes': ['TICKETER', 'CASHIER', 'MANAGER', 'SUPERADMIN'],
  '/api/luggage': ['TICKETER', 'CASHIER', 'MANAGER', 'SUPERADMIN', 'GATEMAN'],
  '/api/notifications': ['TICKETER', 'CASHIER', 'MANAGER', 'SUPERADMIN', 'GATEMAN'],
};

/**
 * Get the authenticated staff member from the Authorization header.
 * Performs JWT verification AND RBAC enforcement using the request path.
 * Returns null if unauthorized or insufficient permissions.
 */
export async function getAuthStaff(): Promise<AuthContext | null> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const payload: JwtPayload | null = verifyToken(token);

  if (!payload) return null;

  const auth: AuthContext = {
    staffId: payload.staffId,
    role: payload.role,
    stationId: payload.stationId,
  };

  // Auto-detect request path from Next.js headers for RBAC
  const xPath = headersList.get('x-nextjs-path') || headersList.get('x-invoke-path') || '';
  if (xPath) {
    for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ACCESS)) {
      if (xPath.startsWith(routePrefix)) {
        if (!allowedRoles.includes(auth.role)) {
          return null; // Insufficient permissions
        }
        break;
      }
    }
  }

  return auth;
}

/**
 * Get the full staff record with station relation.
 */
export async function getAuthStaffFull() {
  const auth = await getAuthStaff();
  if (!auth) return null;

  return db.staff.findUnique({
    where: { id: auth.staffId },
    include: { station: true },
  });
}

/**
 * Ensure the authenticated user has one of the required roles.
 * Returns the auth context if authorized, null otherwise.
 */
export async function requireRole(...roles: string[]): Promise<AuthContext | null> {
  const auth = await getAuthStaff();
  if (!auth) return null;
  if (!roles.includes(auth.role)) return null;
  return auth;
}