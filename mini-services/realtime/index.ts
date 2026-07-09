import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// In-memory state for real-time tracking
const recentActivity: Array<{ type: string; message: string; timestamp: Date; role?: string }> = [];

function addActivity(type: string, message: string, role?: string) {
  recentActivity.unshift({ type, message, timestamp: new Date(), role });
  if (recentActivity.length > 50) recentActivity.pop();
}

// ─── Event Processors (shared between socket & HTTP bridge) ────

function processBookingCreated(data: { scheduleId: string; seatNumber: string; passengerName: string; routeName: string }) {
  const { scheduleId, seatNumber, passengerName, routeName } = data;
  io.to(`schedule:${scheduleId}`).emit('seat:booked', {
    scheduleId, seatNumber, passengerName,
    timestamp: new Date().toISOString(),
  });
  io.to('dashboard').emit('dashboard:booking-created', {
    scheduleId, routeName, seatNumber, passengerName,
    timestamp: new Date().toISOString(),
  });
  addActivity('booking', `${passengerName} booked seat ${seatNumber} on ${routeName}`, 'TICKETER');
}

function processPaymentCompleted(data: { bookingRef: string; amount: number; method: string; passengerName: string; routeName: string }) {
  const { bookingRef, amount, method, passengerName, routeName } = data;
  io.emit('cashier:payment-done', {
    bookingRef, amount, method,
    timestamp: new Date().toISOString(),
  });
  io.to('dashboard').emit('dashboard:payment-completed', {
    bookingRef, amount, method, passengerName, routeName,
    timestamp: new Date().toISOString(),
  });
  addActivity('payment', `ETB ${amount} payment via ${method} for ${passengerName}`, 'CASHIER');
}

function processGateValidated(data: { scheduleId: string; result: string; passengerName: string; seatNumber: string; reference: string }) {
  const { scheduleId, result, passengerName, seatNumber, reference } = data;
  io.to(`gate:${scheduleId}`).emit('gate:scan-result', {
    scheduleId, result, passengerName, seatNumber, reference,
    timestamp: new Date().toISOString(),
  });
  io.to('dashboard').emit('dashboard:gate-event', {
    scheduleId, result, passengerName, seatNumber,
    timestamp: new Date().toISOString(),
  });
  if (result === 'VALID') {
    addActivity('boarding', `${passengerName} boarded (Seat ${seatNumber})`, 'GATEMAN');
  }
}

// ─── Socket.IO Connection Handler ──────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Realtime] Client connected: ${socket.id}`);

  socket.on('join-schedule', (scheduleId: string) => {
    socket.join(`schedule:${scheduleId}`);
  });

  socket.on('leave-schedule', (scheduleId: string) => {
    socket.leave(`schedule:${scheduleId}`);
  });

  socket.on('join-gate', (scheduleId: string) => {
    socket.join(`gate:${scheduleId}`);
  });

  socket.on('join-dashboard', () => {
    socket.join('dashboard');
  });

  socket.on('booking:created', (data) => processBookingCreated(data));
  socket.on('payment:completed', (data) => processPaymentCompleted(data));
  socket.on('gate:validated', (data) => processGateValidated(data));

  socket.on('activity:fetch', () => {
    socket.emit('activity:feed', { activities: recentActivity });
  });

  socket.on('disconnect', () => {
    console.log(`[Realtime] Client disconnected: ${socket.id}`);
  });
});

// ─── HTTP Bridge: API routes → Socket.IO broadcasts ────────────

const EVENT_PROCESSORS: Record<string, (data: any) => void> = {
  'booking:created': processBookingCreated,
  'payment:completed': processPaymentCompleted,
  'gate:validated': processGateValidated,
};

httpServer.on('request', async (req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', connections: io.engine.clientsCount }));
    return;
  }

  // Event emission endpoint (called by Next.js API routes)
  if (req.method === 'POST' && req.url === '/emit') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const { event, data } = JSON.parse(body);
      const processor = EVENT_PROCESSORS[event];
      if (processor && data) {
        processor(data);
        console.log(`[Realtime] Server-emitted: ${event}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unknown event or missing data' }));
      }
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ─── Start ──────────────────────────────────────────────────────

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