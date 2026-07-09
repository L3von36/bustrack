import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';

export async function GET() {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MANAGER', 'SUPERADMIN'].includes(auth.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    const scheduleWhere: any = { departureDate: today };
    if (auth.role !== 'SUPERADMIN' && auth.stationId) {
      scheduleWhere.stationId = auth.stationId;
    }

    const schedules = await db.schedule.findMany({
      where: scheduleWhere,
      include: {
        route: true,
        bus: true,
        _count: {
          select: {
            bookings: { where: { status: { not: 'CANCELLED' } } },
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });

    const departures = schedules.map((s) => ({
      id: s.id,
      routeName: `${s.route.origin} → ${s.route.destination}`,
      busPlate: s.bus.plateNumber,
      busType: s.bus.busType,
      totalSeats: s.bus.totalSeats,
      bookedCount: s._count.bookings,
      occupancy: Math.round((s._count.bookings / s.bus.totalSeats) * 100),
      departureTime: s.departureTime,
      fare: s.fare / 100,
      status: s.status,
      gateNumber: s.gateNumber,
      actualDeparture: s.actualDeparture,
    }));

    return NextResponse.json({ departures });
  } catch (error) {
    console.error('Departures error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}