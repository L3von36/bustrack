import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const revenueByRoute = await db.$queryRaw<Array<{
      routeName: string;
      revenue: number;
      passengers: number;
    }>>`
      SELECT 
        r.origin || ' → ' || r.destination as routeName,
        COALESCE(SUM(p.amount), 0) as revenue,
        COUNT(DISTINCT b.id) as passengers
      FROM Payment p
      JOIN Booking b ON p.bookingId = b.id
      JOIN Schedule s ON b.scheduleId = s.id
      JOIN Route r ON s.routeId = r.id
      WHERE p.status = 'COMPLETED'
        AND p."createdAt" >= ${`${today}T00:00:00.000Z`}
        AND p."createdAt" < ${`${today}T23:59:59.999Z`}
      GROUP BY r.id, r.origin, r.destination
      ORDER BY revenue DESC
    `;

    const totalPassengers = revenueByRoute.reduce((sum, r) => sum + r.passengers, 0);

    const seatOccupancy = revenueByRoute.map((r) => ({
      name: r.routeName,
      value: r.passengers,
      percentage: totalPassengers > 0 ? Math.round((r.passengers / totalPassengers) * 100) : 0,
    }));

    return NextResponse.json({
      revenueByRoute: revenueByRoute.map((r) => ({
        ...r,
        revenue: Number(r.revenue),
        passengers: Number(r.passengers),
      })),
      seatOccupancy,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}