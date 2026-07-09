import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const schedule = await db.schedule.findUnique({
      where: { id },
      include: {
        route: true,
        bus: true,
        station: true,
        bookings: {
          include: { staff: { select: { name: true } } },
          orderBy: { seatNumber: 'asc' },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const bookedSeats = schedule.bookings
      .filter((b) => b.status !== 'CANCELLED')
      .map((b) => ({
        seatNumber: b.seatNumber,
        passengerName: b.passengerName,
        status: b.status,
      }));

    return NextResponse.json({
      ...schedule,
      fare: schedule.fare / 100,
      route: {
        ...schedule.route,
        baseFare: schedule.route.baseFare / 100,
      },
      bookedSeats,
      availableSeats: schedule.bus.totalSeats - bookedSeats.length,
    });
  } catch (error) {
    console.error('Schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}