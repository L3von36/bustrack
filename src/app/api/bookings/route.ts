import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { scheduleId, staffId, passengerName, passengerPhone, seatNumber, fare } = await request.json();

    if (!scheduleId || !staffId || !passengerName || !passengerPhone || !seatNumber || !fare) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
      include: { bus: true },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const existing = await db.booking.findFirst({
      where: { scheduleId, seatNumber, status: { not: 'CANCELLED' } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Seat already booked' }, { status: 409 });
    }

    const reference = `BT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const booking = await db.booking.create({
      data: {
        reference,
        scheduleId,
        staffId,
        passengerName,
        passengerPhone,
        seatNumber,
        fare: parseFloat(fare),
        status: 'PENDING_PAYMENT',
      },
      include: {
        schedule: { include: { route: true, bus: true } },
        staff: { select: { name: true } },
      },
    });

    return NextResponse.json({ booking });
  } catch (error: any) {
    console.error('Booking error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Seat already booked' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const bookings = await db.booking.findMany({
      where: { status: 'PENDING_PAYMENT' },
      include: {
        schedule: { include: { route: true, bus: true } },
        staff: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}