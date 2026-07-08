import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, staffId, amount, method, cashReceived, changeGiven } = await request.json();

    if (!bookingId || !staffId || !amount || !method) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking is cancelled' }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        bookingId,
        staffId,
        amount: parseFloat(amount),
        method,
        status: 'COMPLETED',
        cashReceived: cashReceived ? parseFloat(cashReceived) : null,
        changeGiven: changeGiven ? parseFloat(changeGiven) : null,
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

    return NextResponse.json({ payment, booking: updatedBooking });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}