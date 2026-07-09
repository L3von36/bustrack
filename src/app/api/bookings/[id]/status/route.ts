import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';
import { validateBody, updateBookingStatusSchema } from '@/lib/validations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = validateBody(updateBookingStatusSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { status } = parsed.data;

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

    return NextResponse.json({
      booking: {
        ...booking,
        fare: booking.fare / 100,
        schedule: {
          ...booking.schedule,
          fare: booking.schedule.fare / 100,
        },
      },
    });
  } catch (error) {
    console.error('Booking status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}