import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';
import { validateBody, createPaymentSchema } from '@/lib/validations';
import { emitPaymentCompleted } from '@/lib/realtime-emit';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateBody(createPaymentSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { bookingId, method, cashReceived } = parsed.data;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking is cancelled' }, { status: 400 });
    }

    // Convert cash values from ETB to cents
    const cashReceivedCents = cashReceived != null ? Math.round(cashReceived * 100) : null;
    const changeCents = cashReceivedCents != null ? cashReceivedCents - booking.fare : null;

    const payment = await db.payment.create({
      data: {
        bookingId,
        staffId: auth.staffId,
        amount: booking.fare,
        method,
        status: 'COMPLETED',
        cashReceived: cashReceivedCents,
        changeGiven: changeCents != null && changeCents > 0 ? changeCents : null,
      },
    });

    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
      include: {
        schedule: { include: { route: true, bus: true } },
        staff: { select: { name: true } },
      },
    });

    // Realtime: notify dashboards about payment completion
    emitPaymentCompleted({
      bookingRef: updatedBooking.reference,
      amount: booking.fare / 100,
      method,
      passengerName: updatedBooking.passengerName,
      routeName: `${updatedBooking.schedule.route.origin} → ${updatedBooking.schedule.route.destination}`,
    });

    return NextResponse.json({
      payment: {
        ...payment,
        amount: payment.amount / 100,
        cashReceived: payment.cashReceived != null ? payment.cashReceived / 100 : null,
        changeGiven: payment.changeGiven != null ? payment.changeGiven / 100 : null,
      },
      booking: {
        ...updatedBooking,
        fare: updatedBooking.fare / 100,
        schedule: {
          ...updatedBooking.schedule,
          fare: updatedBooking.schedule.fare / 100,
        },
      },
    });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}