import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId required' }, { status: 400 });
    }

    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
      include: { route: true, bus: true },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const boardedBookings = await db.booking.findMany({
      where: {
        scheduleId,
        status: 'BOARDED',
      },
      orderBy: { boardedAt: 'asc' },
    });

    const allActiveBookings = await db.booking.count({
      where: {
        scheduleId,
        status: { in: ['CONFIRMED', 'BOARDED'] },
      },
    });

    return NextResponse.json({
      schedule,
      boarded: boardedBookings,
      boardedCount: boardedBookings.length,
      totalActive: allActiveBookings,
      totalSeats: schedule.bus.totalSeats,
    });
  } catch (error) {
    console.error('Boarding info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}