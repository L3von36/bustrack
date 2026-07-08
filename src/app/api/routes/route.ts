import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({ routes });
  } catch (error) {
    console.error('Routes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}