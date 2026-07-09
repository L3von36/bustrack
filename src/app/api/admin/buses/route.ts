import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';
import { validateBody, createBusSchema } from '@/lib/validations';

export async function GET() {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const buses = await db.bus.findMany({
      include: {
        _count: { select: { schedules: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ buses });
  } catch (error) {
    console.error('Admin buses error:', error);
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
    const parsed = validateBody(createBusSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { plateNumber, busType, totalSeats, rows, cols } = parsed.data;

    const bus = await db.bus.create({
      data: {
        plateNumber,
        busType,
        totalSeats,
        rows,
        cols,
      },
    });

    return NextResponse.json({ bus }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Plate number already exists' }, { status: 409 });
    }
    console.error('Create bus error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}