import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';

export async function GET() {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    const stationFilter = (auth.role !== 'SUPERADMIN' && auth.stationId)
      ? `AND s."stationId" = '${auth.stationId}'`
      : '';

    const sql = `
      SELECT 
        r.origin || ' → ' || r.destination as "routeName",
        COALESCE(SUM(p.amount), 0) as revenue,
        COUNT(DISTINCT b.id) as passengers
      FROM "Payment" p
      JOIN "Booking" b ON p."bookingId" = b.id
      JOIN "Schedule" s ON b."scheduleId" = s.id
      JOIN "Route" r ON s."routeId" = r.id
      WHERE p.status = 'COMPLETED'
        AND p."createdAt" >= '${today}T00:00:00.000Z'
        AND p."createdAt" < '${today}T23:59:59.999Z'
        ${stationFilter}
      GROUP BY r.id, r.origin, r.destination
      ORDER BY revenue DESC
    `;

    const revenueByRoute = await db.$queryRawUnsafe<
      Array<{ routeName: string; revenue: bigint; passengers: bigint }>
    >(sql);

    const revenueData = revenueByRoute.map((r) => ({
      routeName: r.routeName,
      revenue: Number(r.revenue) / 100,
      passengers: Number(r.passengers),
    }));

    const totalPassengers = revenueData.reduce((sum, r) => sum + r.passengers, 0);

    const seatOccupancy = revenueData.map((r) => ({
      name: r.routeName,
      value: r.passengers,
      percentage: totalPassengers > 0 ? Math.round((r.passengers / totalPassengers) * 100) : 0,
    }));

    return NextResponse.json({
      revenueByRoute: revenueData,
      seatOccupancy,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}