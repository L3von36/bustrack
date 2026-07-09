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
    const search = searchParams.get('search') || '';
    const today = new Date().toISOString().split('T')[0];

    const where: any = { active: true };
    if (search) {
      where.OR = [
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Non-admin users only see routes from their station
    if (auth.role !== 'SUPERADMIN' && auth.stationId) {
      where.stationId = auth.stationId;
    }

    const routes = await db.route.findMany({
      where,
      include: {
        schedules: {
          where: { departureDate: today },
          include: {
            bus: true,
            _count: { select: { bookings: true } },
          },
          orderBy: { departureTime: 'asc' },
        },
      },
      orderBy: { origin: 'asc' },
    });

    const result = routes.map((r) => ({
      ...r,
      baseFare: r.baseFare / 100,
      schedules: r.schedules.map((s) => ({
        ...s,
        fare: s.fare / 100,
      })),
    }));

    return NextResponse.json({ routes: result });
  } catch (error) {
    console.error('Routes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}