import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';
import { validateBody, validateTicketSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateBody(validateTicketSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { reference, scheduleId } = parsed.data;

    const booking = await db.booking.findUnique({
      where: { reference: reference.toUpperCase() },
      include: { schedule: true },
    });

    if (!booking) {
      await db.gateLog.create({
        data: {
          bookingId: 'unknown',
          scheduleId,
          staffId: auth.staffId,
          result: 'INVALID',
          reason: 'Reference not found',
        },
      });
      return NextResponse.json({ result: 'INVALID', reason: 'Booking reference not found' });
    }

    if (booking.status === 'CANCELLED') {
      await db.gateLog.create({
        data: { bookingId: booking.id, scheduleId, staffId: auth.staffId, result: 'CANCELLED', reason: 'Booking was cancelled' },
      });
      return NextResponse.json({ result: 'CANCELLED', reason: 'This booking has been cancelled' });
    }

    if (booking.scheduleId !== scheduleId) {
      await db.gateLog.create({
        data: { bookingId: booking.id, scheduleId, staffId: auth.staffId, result: 'WRONG_GATE', reason: `Booking is for a different schedule` },
      });
      return NextResponse.json({ result: 'WRONG_GATE', reason: 'This ticket is for a different bus/route' });
    }

    const existingLog = await db.gateLog.findFirst({
      where: { bookingId: booking.id, result: 'VALID' },
    });

    if (existingLog || booking.status === 'BOARDED') {
      await db.gateLog.create({
        data: { bookingId: booking.id, scheduleId, staffId: auth.staffId, result: 'ALREADY_BOARDED', reason: 'Already boarded' },
      });
      return NextResponse.json({ result: 'ALREADY_BOARDED', reason: 'Passenger has already boarded' });
    }

    await db.gateLog.create({
      data: { bookingId: booking.id, scheduleId, staffId: auth.staffId, result: 'VALID' },
    });

    await db.booking.update({
      where: { id: booking.id },
      data: { status: 'BOARDED', boardedAt: new Date() },
    });

    return NextResponse.json({
      result: 'VALID',
      passengerName: booking.passengerName,
      seatNumber: booking.seatNumber,
      reference: booking.reference,
    });
  } catch (error) {
    console.error('Gate validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}