import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Fetch all non-cancelled bookings for this schedule
    const allBookings = await db.booking.findMany({
      where: {
        scheduleId,
        status: { not: 'CANCELLED' },
      },
      orderBy: { boardedAt: 'asc' },
    });

    const boarded = allBookings.filter((b) => b.status === 'BOARDED');
    const confirmed = allBookings.filter((b) => b.status === 'CONFIRMED');
    const noShow = allBookings.filter((b) => b.status === 'NO_SHOW');
    const totalActive = allBookings.length;

    // Backward-compatible boarded list (used by gateman left panel)
    const boardedCompat = boarded.map((b) => ({
      id: b.id,
      passengerName: b.passengerName,
      seatNumber: b.seatNumber,
    }));

    // Full manifest entries with status
    const toManifestEntry = (b: typeof allBookings[0]) => ({
      passengerName: b.passengerName,
      seatNumber: b.seatNumber,
      status: b.status as 'CONFIRMED' | 'BOARDED' | 'NO_SHOW',
      bookedAt: b.createdAt.toISOString(),
      boardedAt: b.boardedAt?.toISOString() || null,
    });

    return NextResponse.json({
      schedule: {
        ...schedule,
        fare: schedule.fare / 100,
      },
      // Backward compat fields used by gateman-interface
      boarded: boardedCompat,
      boardedCount: boarded.length,
      totalActive,
      totalSeats: schedule.bus.totalSeats,
      // New structured manifest data
      passengers: {
        confirmed: confirmed.map(toManifestEntry),
        boarded: boarded.map(toManifestEntry),
        noShow: noShow.map(toManifestEntry),
      },
      summary: {
        totalBooked: totalActive,
        boardedCount: boarded.length,
        confirmedCount: confirmed.length,
        noShowCount: noShow.length,
        totalSeats: schedule.bus.totalSeats,
        boardingProgress: totalActive > 0
          ? Math.round((boarded.length / totalActive) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('Boarding info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}