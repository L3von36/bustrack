/**
 * Server-side socket event emitter.
 * Sends events to the realtime service (mini-services/realtime) via HTTP.
 * The realtime service then broadcasts to connected Socket.IO clients.
 */

const REALTIME_URL = process.env.REALTIME_URL || 'http://localhost:3004';

export async function emitRealtime(event: string, data: Record<string, unknown>) {
  try {
    await fetch(`${REALTIME_URL}/emit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
      signal: AbortSignal.timeout(2000), // Don't block API response
    });
  } catch {
    // Realtime service may not be running — silently degrade
    // The polling fallback in dashboards will still work
  }
}

// Pre-built emitters for common events
export function emitBookingCreated(data: {
  scheduleId: string;
  seatNumber: string;
  passengerName: string;
  routeName: string;
}) {
  return emitRealtime('booking:created', data);
}

export function emitPaymentCompleted(data: {
  bookingRef: string;
  amount: number;
  method: string;
  passengerName: string;
  routeName: string;
}) {
  return emitRealtime('payment:completed', data);
}

export function emitGateValidated(data: {
  scheduleId: string;
  result: string;
  passengerName: string;
  seatNumber: string;
  reference: string;
}) {
  return emitRealtime('gate:validated', data);
}