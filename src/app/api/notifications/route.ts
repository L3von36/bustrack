import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthStaff } from '@/lib/auth-context';

export interface NotificationItem {
  id: string;
  type: 'booking_created' | 'payment_completed' | 'gate_validated' | 'gate_invalid';
  message: string;
  timestamp: string;
  read: boolean;
}

export async function GET() {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Build station filter for non-superadmin
    const stationFilter =
      auth.role !== 'SUPERADMIN' && auth.stationId
        ? { stationId: auth.stationId }
        : {};

    // 1. Recent bookings (last 24h)
    const recentBookings = await db.booking.findMany({
      where: {
        createdAt: { gte: since },
        status: { not: 'CANCELLED' },
        schedule: stationFilter,
      },
      include: { schedule: { include: { route: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 2. Recent completed payments (last 24h)
    const recentPayments = await db.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: since },
        booking: { schedule: stationFilter },
      },
      include: {
        booking: { include: { schedule: { include: { route: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 3. Recent gate logs (last 24h)
    const recentGateLogs = await db.gateLog.findMany({
      where: {
        createdAt: { gte: since },
        schedule: stationFilter,
      },
      include: {
        booking: true,
        schedule: { include: { route: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Merge into unified notification feed
    const notifications: NotificationItem[] = [];

    for (const b of recentBookings) {
      const routeName = b.schedule.route
        ? `${b.schedule.route.origin} → ${b.schedule.route.destination}`
        : 'Unknown route';
      notifications.push({
        id: `booking-${b.id}`,
        type: 'booking_created',
        message: `New booking: Seat ${b.seatNumber} — ${b.passengerName} (${routeName})`,
        timestamp: b.createdAt.toISOString(),
        read: false,
      });
    }

    for (const p of recentPayments) {
      const amount = (p.amount / 100).toLocaleString('en-ET', {
        minimumFractionDigits: 2,
      });
      const routeName = p.booking.schedule.route
        ? `${p.booking.schedule.route.origin} → ${p.booking.schedule.route.destination}`
        : 'Unknown route';
      notifications.push({
        id: `payment-${p.id}`,
        type: 'payment_completed',
        message: `ETB ${amount} payment completed — ${routeName}`,
        timestamp: p.createdAt.toISOString(),
        read: false,
      });
    }

    for (const g of recentGateLogs) {
      const isValid = g.result === 'VALID';
      const passengerName =
        g.booking?.passengerName || 'Unknown passenger';
      notifications.push({
        id: `gate-${g.id}`,
        type: isValid ? 'gate_validated' : 'gate_invalid',
        message: isValid
          ? `Gate scan: ${passengerName} boarded successfully`
          : `Gate scan: ${passengerName} — ${g.result.replace(/_/g, ' ').toLowerCase()}${g.reason ? ` (${g.reason})` : ''}`,
        timestamp: g.createdAt.toISOString(),
        read: false,
      });
    }

    // Sort by timestamp descending, limit to 20
    notifications.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(notifications.slice(0, 20));
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthStaff();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body as { ids?: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required' },
        { status: 400 }
      );
    }

    // Notifications are derived (not stored), so we just acknowledge the read.
    // The client will track read state locally.
    return NextResponse.json({ success: true, readCount: ids.length });
  } catch (error) {
    console.error('Notifications patch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}