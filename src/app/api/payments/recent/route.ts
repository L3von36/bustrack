import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const payments = await db.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(`${today}T00:00:00.000Z`),
          lt: new Date(`${today}T23:59:59.999Z`),
        },
      },
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

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Recent payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}