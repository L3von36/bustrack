import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
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
    const { name, email, password, role, phone, stationId } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const staff = await db.staff.create({
      data: {
        name,
        email,
        password,
        role,
        phone: phone || null,
        stationId: stationId || null,
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