import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const staff = await db.staff.findUnique({
      where: { email },
      include: { station: true },
    });

    if (!staff || staff.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!staff.active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    const { password: _, ...staffData } = staff;
    return NextResponse.json({ user: staffData });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}