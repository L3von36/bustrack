import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPassword, signToken } from '@/lib/auth';
import { validateBody, loginSchema } from '@/lib/validations';

// POST /api/auth/login — Authenticate and return JWT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validateBody(loginSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const staff = await db.staff.findUnique({
      where: { email },
      include: { station: true },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!staff.active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    // Check if password is still plaintext (legacy) — auto-upgrade to bcrypt
    let passwordValid = false;
    if (staff.password.startsWith('$2')) {
      // Already hashed with bcrypt
      passwordValid = await verifyPassword(password, staff.password);
    } else {
      // Legacy plaintext password — verify and upgrade
      passwordValid = staff.password === password;
      if (passwordValid) {
        const hashed = await hashPassword(password);
        await db.staff.update({ where: { id: staff.id }, data: { password: hashed } });
      }
    }

    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Sign JWT
    const token = signToken({
      staffId: staff.id,
      email: staff.email,
      role: staff.role,
      stationId: staff.stationId,
    });

    const { password: _, ...staffData } = staff;
    return NextResponse.json({ token, user: staffData });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}