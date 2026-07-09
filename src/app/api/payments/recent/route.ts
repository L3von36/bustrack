import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';

export async function GET() {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    const where: any = {
      status: 'COMPLETED',
      createdAt: {
        gte: new Date(`${today}T00:00:00.000Z`),
        lt: new Date(`${today}T23:59:59.999Z`),
      },
    };

    // Non-admin users only see their station's payments
    if (auth.role !== 'SUPERADMIN' && auth.stationId) {
      where.booking = { schedule: { stationId: auth.stationId } };
    }

    const payments = await db.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            schedule: { include: { route: true } },
          },
        },
        staff: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const result = payments.map((p) => ({
      ...p,
      amount: p.amount / 100,
      cashReceived: p.cashReceived != null ? p.cashReceived / 100 : null,
      changeGiven: p.changeGiven != null ? p.changeGiven / 100 : null,
      booking: {
        ...p.booking,
        fare: p.booking.fare / 100,
      },
    }));

    return NextResponse.json({ payments: result });
  } catch (error) {
    console.error('Recent payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}