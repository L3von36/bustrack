import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const schedules = await db.schedule.findMany({
      where: { departureDate: today },
      include: {
        route: true,
        bus: true,
        _count: {
          select: {
            bookings: {
              where: { status: { not: 'CANCELLED' } },
            },
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });

    const result = schedules.map((s) => ({
      id: s.id,
      routeName: `${s.route.origin} → ${s.route.destination}`,
      routeId: s.route.id,
      busPlate: s.bus.plateNumber,
      busType: s.bus.busType,
      totalSeats: s.bus.totalSeats,
      bookedCount: s._count.bookings,
      departureTime: s.departureTime,
      fare: s.fare,
      status: s.status,
      gateNumber: s.gateNumber,
    }));

    return NextResponse.json({ schedules: result });
  } catch (error) {
    console.error('Today schedules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}