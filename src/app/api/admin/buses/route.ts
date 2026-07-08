import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
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
    const { plateNumber, busType, totalSeats, rows, cols } = await request.json();

    if (!plateNumber || !busType || !totalSeats || !rows || !cols) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const bus = await db.bus.create({
      data: {
        plateNumber,
        busType,
        totalSeats: parseInt(totalSeats),
        rows: parseInt(rows),
        cols: parseInt(cols),
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