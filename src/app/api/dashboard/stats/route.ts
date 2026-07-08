import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todayPayments = await db.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(`${today}T00:00:00.000Z`),
          lt: new Date(`${today}T23:59:59.999Z`),
        },
      },
    });

    const totalRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    const todayBookings = await db.booking.findMany({
      where: {
        createdAt: {
          gte: new Date(`${today}T00:00:00.000Z`),
          lt: new Date(`${today}T23:59:59.999Z`),
        },
        status: { not: 'CANCELLED' },
      },
    });

    const totalPassengers = todayBookings.length;

    const todaySchedules = await db.schedule.findMany({
      where: { departureDate: today },
    });

    const busesDeparted = todaySchedules.filter((s) => s.status === 'DEPARTED').length;

    const onTimeSchedules = todaySchedules.filter(
      (s) => s.status === 'DEPARTED' && s.actualDeparture
    ).length;
    const totalDeparted = todaySchedules.filter((s) => s.status === 'DEPARTED').length;
    const onTimeRate = totalDeparted > 0 ? Math.round((onTimeSchedules / totalDeparted) * 100) : 100;

    const bookingsByRoute = await db.$queryRaw<Array<{ routeName: string; count: number; revenue: number }>>`
      SELECT 
        r.origin || ' → ' || r.destination as routeName,
        COUNT(b.id) as count,
        SUM(COALESCE((SELECT SUM(p.amount) FROM Payment p WHERE p.bookingId = b.id AND p.status = 'COMPLETED'), 0)) as revenue
      FROM Booking b
      JOIN Schedule s ON b.scheduleId = s.id
      JOIN Route r ON s.routeId = r.id
      WHERE b."createdAt" >= ${`${today}T00:00:00.000Z`}
        AND b."createdAt" < ${`${today}T23:59:59.999Z`}
        AND b.status != 'CANCELLED'
      GROUP BY r.id, r.origin, r.destination
      ORDER BY revenue DESC
    `;

    return NextResponse.json({
      totalRevenue,
      totalPassengers,
      busesDeparted,
      totalBuses: todaySchedules.length,
      onTimeRate,
      bookingsByRoute,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}