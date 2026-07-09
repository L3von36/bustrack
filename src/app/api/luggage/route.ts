import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';
import { validateBody } from '@/lib/validations';
import { z } from 'zod';
import { log } from '@/lib/logger';

const createLuggageSchema = z.object({
  tagNumber: z.string().min(1, 'Tag number required').max(50),
  bookingId: z.string().min(1, 'Booking ID required'),
  weightKg: z.number().int().min(1, 'Weight must be at least 1kg').max(100, 'Weight must be under 100kg'),
  notes: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId query parameter required' }, { status: 400 });
    }

    const luggage = await db.luggage.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    log('info', 'Luggage listing fetched', { bookingId, count: luggage.length, staffId: auth.staffId });

    return NextResponse.json({ luggage });
  } catch (error) {
    log('error', 'Failed to fetch luggage', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateBody(createLuggageSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { tagNumber, bookingId, weightKg, notes } = parsed.data;

    // Verify booking exists
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check for duplicate tag number
    const existing = await db.luggage.findUnique({
      where: { tagNumber },
    });

    if (existing) {
      return NextResponse.json({ error: 'Tag number already in use' }, { status: 409 });
    }

    const luggage = await db.luggage.create({
      data: {
        tagNumber,
        bookingId,
        weightKg,
        notes,
      },
    });

    log('info', 'Luggage checked in', { tagNumber, bookingId, weightKg, staffId: auth.staffId });

    return NextResponse.json({ luggage }, { status: 201 });
  } catch (error: any) {
    log('error', 'Failed to create luggage', { error: String(error) });
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Tag number already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}