import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';

export async function GET() {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // ── Helper to build day ranges ──
    const dayRange = (dateStr: string) => ({
      gte: new Date(`${dateStr}T00:00:00.000Z`),
      lt: new Date(`${dateStr}T23:59:59.999Z`),
    });

    // ── Station filter for non-superadmin ──
    const stationFilter =
      auth.role !== 'SUPERADMIN' && auth.stationId
        ? { stationId: auth.stationId }
        : {};

    const scheduleStationFilter =
      auth.role !== 'SUPERADMIN' && auth.stationId
        ? { schedule: { stationId: auth.stationId } }
        : {};

    // ── Today's payments ──
    const todayPayments = await db.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: dayRange(today),
        booking: scheduleStationFilter,
      },
    });

    const totalRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0) / 100;

    // ── Yesterday's payments ──
    const yesterdayPayments = await db.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: dayRange(yesterday),
        booking: scheduleStationFilter,
      },
    });

    const previousRevenue = yesterdayPayments.reduce((sum, p) => sum + p.amount, 0) / 100;

    // ── Today's bookings ──
    const todayBookings = await db.booking.findMany({
      where: {
        createdAt: dayRange(today),
        status: { not: 'CANCELLED' },
        schedule: stationFilter,
      },
    });

    const totalPassengers = todayBookings.length;

    // ── Yesterday's bookings ──
    const yesterdayBookings = await db.booking.findMany({
      where: {
        createdAt: dayRange(yesterday),
        status: { not: 'CANCELLED' },
        schedule: stationFilter,
      },
    });

    const previousPassengers = yesterdayBookings.length;

    // ── Today's schedules ──
    const todaySchedules = await db.schedule.findMany({
      where: {
        departureDate: today,
        ...stationFilter,
      },
    });

    const busesDeparted = todaySchedules.filter((s) => s.status === 'DEPARTED').length;

    // ── Yesterday's schedules ──
    const yesterdaySchedules = await db.schedule.findMany({
      where: {
        departureDate: yesterday,
        ...stationFilter,
      },
    });

    const previousDepartures = yesterdaySchedules.filter((s) => s.status === 'DEPARTED').length;

    // ── On-time rate (today) ──
    const totalDeparted = todaySchedules.filter((s) => s.status === 'DEPARTED').length;
    const onTimeDeparted = todaySchedules.filter(
      (s) => s.status === 'DEPARTED' && s.actualDeparture
    ).length;
    const onTimeRate = totalDeparted > 0 ? Math.round((onTimeDeparted / totalDeparted) * 100) : 100;

    // ── On-time rate (yesterday) ──
    const prevTotalDeparted = yesterdaySchedules.filter((s) => s.status === 'DEPARTED').length;
    const prevOnTimeDeparted = yesterdaySchedules.filter(
      (s) => s.status === 'DEPARTED' && s.actualDeparture
    ).length;
    const previousOnTime = prevTotalDeparted > 0 ? Math.round((prevOnTimeDeparted / prevTotalDeparted) * 100) : 100;

    // ── Compute change percentages ──
    function pctChange(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }

    const revenueChange = pctChange(totalRevenue, previousRevenue);
    const passengersChange = pctChange(totalPassengers, previousPassengers);
    const departuresChange = pctChange(busesDeparted, previousDepartures);
    const onTimeChange = onTimeRate - previousOnTime;

    // ── Revenue by route query ──
    const stationSql =
      auth.role !== 'SUPERADMIN' && auth.stationId
        ? `AND s."stationId" = '${auth.stationId}'`
        : '';

    const sql = `
      SELECT
        r.origin || ' → ' || r.destination as "routeName",
        COUNT(b.id) as count,
        SUM(COALESCE((SELECT SUM(p.amount) FROM "Payment" p WHERE p."bookingId" = b.id AND p.status = 'COMPLETED'), 0)) as revenue
      FROM "Booking" b
      JOIN "Schedule" s ON b."scheduleId" = s.id
      JOIN "Route" r ON s."routeId" = r.id
      WHERE b."createdAt" >= '${today}T00:00:00.000Z'
        AND b."createdAt" < '${today}T23:59:59.999Z'
        AND b.status != 'CANCELLED'
        ${stationSql}
      GROUP BY r.id, r.origin, r.destination
      ORDER BY revenue DESC
    `;

    const bookingsByRoute = await db.$queryRawUnsafe<
      Array<{ routeName: string; count: bigint; revenue: bigint }>
    >(sql);

    return NextResponse.json({
      totalRevenue,
      totalPassengers,
      busesDeparted,
      totalBuses: todaySchedules.length,
      onTimeRate,
      previousRevenue,
      previousPassengers,
      previousDepartures,
      previousOnTime,
      revenueChange,
      passengersChange,
      departuresChange,
      onTimeChange,
      bookingsByRoute: bookingsByRoute.map((r) => ({
        ...r,
        count: Number(r.count),
        revenue: Number(r.revenue) / 100,
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}