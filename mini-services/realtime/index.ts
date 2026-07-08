import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// In-memory state for real-time tracking
const scheduleBookedCounts = new Map<string, number>();
const gateBoardingCounts = new Map<string, { boarded: number; total: number }>();
const recentActivity: Array<{ type: string; message: string; timestamp: Date; role?: string }> = [];

function addActivity(type: string, message: string, role?: string) {
  recentActivity.unshift({ type, message, timestamp: new Date(), role });
  if (recentActivity.length > 50) recentActivity.pop();
}

io.on('connection', (socket) => {
  console.log(`[Realtime] Client connected: ${socket.id}`);

  // Join a schedule room to get seat updates
  socket.on('join-schedule', (scheduleId: string) => {
    socket.join(`schedule:${scheduleId}`);
    console.log(`[Realtime] ${socket.id} joined schedule:${scheduleId}`);
  });

  // Leave a schedule room
  socket.on('leave-schedule', (scheduleId: string) => {
    socket.leave(`schedule:${scheduleId}`);
  });

  // Join gate room for boarding updates
  socket.on('join-gate', (scheduleId: string) => {
    socket.join(`gate:${scheduleId}`);
    console.log(`[Realtime] ${socket.id} joined gate:${scheduleId}`);
  });

  // Join manager room for dashboard updates
  socket.on('join-dashboard', () => {
    socket.join('dashboard');
    console.log(`[Realtime] ${socket.id} joined dashboard`);
  });

  // ─── Booking Events ─────────────────────────────────────────
  socket.on('booking:created', (data: { scheduleId: string; seatNumber: string; passengerName: string; routeName: string }) => {
    const { scheduleId, seatNumber, passengerName, routeName } = data;

    // Notify everyone watching this schedule
    io.to(`schedule:${scheduleId}`).emit('seat:booked', {
      scheduleId,
      seatNumber,
      passengerName,
      timestamp: new Date().toISOString(),
    });

    // Notify dashboard
    io.to('dashboard').emit('dashboard:booking-created', {
      scheduleId,
      routeName,
      seatNumber,
      passengerName,
      timestamp: new Date().toISOString(),
    });

    addActivity('booking', `${passengerName} booked seat ${seatNumber} on ${routeName}`, 'TICKETER');
  });

  // ─── Payment Events ─────────────────────────────────────────
  socket.on('payment:completed', (data: { bookingRef: string; amount: number; method: string; passengerName: string; routeName: string }) => {
    const { bookingRef, amount, method, passengerName, routeName } = data;

    // Notify cashier screens
    io.emit('cashier:payment-done', {
      bookingRef,
      amount,
      method,
      timestamp: new Date().toISOString(),
    });

    // Notify ticketers (seat can show as confirmed)
    io.to('dashboard').emit('dashboard:payment-completed', {
      bookingRef,
      amount,
      method,
      passengerName,
      routeName,
      timestamp: new Date().toISOString(),
    });

    addActivity('payment', `KES ${amount} payment via ${method} for ${passengerName}`, 'CASHIER');
  });

  // ─── Gate Events ────────────────────────────────────────────
  socket.on('gate:validated', (data: { scheduleId: string; result: string; passengerName: string; seatNumber: string; reference: string }) => {
    const { scheduleId, result, passengerName, seatNumber, reference } = data;

    io.to(`gate:${scheduleId}`).emit('gate:scan-result', {
      scheduleId,
      result,
      passengerName,
      seatNumber,
      reference,
      timestamp: new Date().toISOString(),
    });

    io.to('dashboard').emit('dashboard:gate-event', {
      scheduleId,
      result,
      passengerName,
      seatNumber,
      timestamp: new Date().toISOString(),
    });

    if (result === 'VALID') {
      addActivity('boarding', `${passengerName} boarded (Seat ${seatNumber})`, 'GATEMAN');
    }
  });

  // ─── Request current activity feed ──────────────────────────
  socket.on('activity:fetch', () => {
    socket.emit('activity:feed', { activities: recentActivity });
  });

  socket.on('disconnect', () => {
    console.log(`[Realtime] Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`[Realtime] Socket error (${socket.id}):`, error);
  });
});

const PORT = 3004;
httpServer.listen(PORT, () => {
  console.log(`[BusTrack Realtime] Socket.IO server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[BusTrack Realtime] Shutting down...');
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[BusTrack Realtime] Shutting down...');
  httpServer.close(() => process.exit(0));
});