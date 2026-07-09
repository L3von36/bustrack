import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';
import { validateBody, createStaffSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const staff = await db.staff.findMany({
      include: {
        station: { select: { name: true } },
        _count: { select: { bookings: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = staff.map(({ password: _, ...rest }) => rest);
    return NextResponse.json({ staff: result });
  } catch (error) {
    console.error('Admin staff error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = validateBody(createStaffSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { name, email, password, role, phone, stationId } = parsed.data;
    const hashedPassword = await hashPassword(password);

    const staff = await db.staff.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        stationId,
      },
    });

    const { password: _, ...result } = staff;
    return NextResponse.json({ staff: result }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    console.error('Create staff error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}