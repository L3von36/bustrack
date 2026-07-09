import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';
import { validateBody, createBookingSchema } from '@/lib/validations';
import { emitBookingCreated } from '@/lib/realtime-emit';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateBody(createBookingSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { scheduleId, passengerName, passengerPhone, seatNumber, fare } = parsed.data;

    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
      include: { bus: true },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const existing = await db.booking.findFirst({
      where: { scheduleId, seatNumber, status: { not: 'CANCELLED' } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Seat already booked' }, { status: 409 });
    }

    const reference = `BT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const fareCents = Math.round(fare * 100);

    const booking = await db.booking.create({
      data: {
        reference,
        scheduleId,
        staffId: auth.staffId,
        passengerName,
        passengerPhone,
        seatNumber,
        fare: fareCents,
        status: 'PENDING_PAYMENT',
      },
      include: {
        schedule: { include: { route: true, bus: true } },
        staff: { select: { name: true } },
      },
    });

    // Realtime: notify other dashboards about the new booking
    emitBookingCreated({
      scheduleId,
      seatNumber,
      passengerName,
      routeName: `${booking.schedule.route.origin} → ${booking.schedule.route.destination}`,
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
  } catch (error: any) {
    console.error('Booking error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Seat already booked' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = parsePagination(request, 20);
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const where: any = {};
    if (statusFilter) {
      where.status = statusFilter;
    } else {
      where.status = 'PENDING_PAYMENT';
    }

    // Non-admin users only see their station's bookings
    if (auth.role !== 'SUPERADMIN' && auth.stationId) {
      where.schedule = { stationId: auth.stationId };
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          schedule: { include: { route: true, bus: true } },
          staff: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      db.booking.count({ where }),
    ]);

    const result = bookings.map((b) => ({
      ...b,
      fare: b.fare / 100,
      schedule: {
        ...b.schedule,
        fare: b.schedule.fare / 100,
      },
    }));

    return NextResponse.json(paginatedResponse(result, total, params));
  } catch (error) {
    console.error('Bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}