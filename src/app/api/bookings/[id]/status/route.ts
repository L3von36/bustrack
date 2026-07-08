import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!status || !['CONFIRMED', 'CANCELLED', 'BOARDED', 'NO_SHOW'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const booking = await db.booking.update({
      where: { id },
      data: {
        status,
        ...(status === 'BOARDED' ? { boardedAt: new Date() } : {}),
      },
      include: {
        schedule: { include: { route: true, bus: true } },
        staff: { select: { name: true } },
      },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Booking status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}