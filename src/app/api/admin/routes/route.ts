import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';
import { validateBody, createRouteSchema } from '@/lib/validations';

export async function GET() {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const routes = await db.route.findMany({
      include: {
        _count: { select: { schedules: true } },
        station: { select: { name: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = routes.map((r) => ({
      ...r,
      baseFare: r.baseFare / 100,
    }));

    return NextResponse.json({ routes: result });
  } catch (error) {
    console.error('Admin routes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = validateBody(createRouteSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { origin, destination, distanceKm, baseFare, estimatedMin, stationId } = parsed.data;

    // baseFare is already in cents from the schema (z.number().int())
    const route = await db.route.create({
      data: {
        origin,
        destination,
        distanceKm,
        baseFare,
        estimatedMin,
        stationId,
      },
    });

    return NextResponse.json({
      route: {
        ...route,
        baseFare: route.baseFare / 100,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}