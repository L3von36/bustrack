import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const routes = await db.route.findMany({
      include: {
        _count: { select: { schedules: true } },
        station: { select: { name: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ routes });
  } catch (error) {
    console.error('Admin routes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, distanceKm, baseFare, estimatedMin, stationId } = await request.json();

    if (!origin || !destination || !distanceKm || !baseFare || !estimatedMin || !stationId) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const route = await db.route.create({
      data: {
        origin,
        destination,
        distanceKm: parseInt(distanceKm),
        baseFare: parseFloat(baseFare),
        estimatedMin: parseInt(estimatedMin),
        stationId,
      },
    });

    return NextResponse.json({ route }, { status: 201 });
  } catch (error) {
    console.error('Create route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}