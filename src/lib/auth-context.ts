import { headers } from 'next/headers';
import { db } from '@/lib/db';

export interface AuthContext {
  staffId: string;
  role: string;
  stationId: string | null;
}

/**
 * Get the authenticated staff member from request headers.
 * Call this inside API route handlers (after middleware has validated the JWT).
 */
export async function getAuthStaff(): Promise<AuthContext | null> {
  const headersList = await headers();
  const staffId = headersList.get('x-staff-id');
  const role = headersList.get('x-staff-role');
  const stationId = headersList.get('x-station-id') || null;

  if (!staffId || !role) return null;
  return { staffId, role, stationId };
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