import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Bookings ─────────────────────────────────────────────────
export const createBookingSchema = z.object({
  scheduleId: z.string().min(1, 'Schedule ID required'),
  passengerName: z.string().min(2, 'Passenger name must be at least 2 characters').max(100),
  passengerPhone: z.string().regex(/^\+251\d{9}$/, 'Phone must be +251XXXXXXXXX format'),
  seatNumber: z.string().min(1, 'Seat number required'),
  fare: z.number().positive('Fare must be positive'),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'BOARDED', 'NO_SHOW']),
});

// ─── Payments ─────────────────────────────────────────────────
export const createPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID required'),
  method: z.enum(['CASH', 'MOBILE_MONEY', 'CARD', 'QR_CODE']),
  cashReceived: z.number().min(0).optional(),
});

// ─── Gate ─────────────────────────────────────────────────────
export const validateTicketSchema = z.object({
  reference: z.string().min(1, 'Booking reference required'),
  scheduleId: z.string().min(1, 'Schedule ID required'),
  gateNumber: z.string().optional(),
});

// ─── Admin: Staff ─────────────────────────────────────────────
export const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^\+251\d{9}$/, 'Phone must be +251XXXXXXXXX format').optional().or(z.literal('')),
  role: z.enum(['TICKETER', 'CASHIER', 'GATEMAN', 'MANAGER', 'SUPERADMIN']),
  stationId: z.string().min(1, 'Station ID required'),
});

// ─── Admin: Routes ────────────────────────────────────────────
export const createRouteSchema = z.object({
  origin: z.string().min(2, 'Origin required').max(100),
  destination: z.string().min(2, 'Destination required').max(100),
  distanceKm: z.number().int().positive('Distance must be positive'),
  baseFare: z.number().int().positive('Fare must be positive (in cents)'),
  estimatedMin: z.number().int().positive('Estimated time must be positive'),
  stationId: z.string().min(1, 'Station ID required'),
});

// ─── Admin: Buses ─────────────────────────────────────────────
export const createBusSchema = z.object({
  plateNumber: z.string().regex(/^AA\d{4}[A-Z]{0,2}$/, 'Plate must be AA format (e.g. AA1234AB)'),
  busType: z.enum(['STANDARD', 'EXECUTIVE', 'VIP', 'PREMIUM']),
  totalSeats: z.number().int().min(10).max(60, 'Seats must be 10-60'),
  rows: z.number().int().min(5).max(15, 'Rows must be 5-15'),
  cols: z.number().int().min(2).max(5, 'Columns must be 2-5'),
});

// ─── Helpers ──────────────────────────────────────────────────
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return { success: false as const, error: errors };
  }
  return { success: true as const, data: result.data };
}