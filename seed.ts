import { db } from './src/lib/db';

const today = new Date().toISOString().split('T')[0];

async function seed() {
  console.log('Seeding database...');

  // Create station
  const station = await db.station.create({
    data: {
      name: 'Nairobi Central Terminal',
      city: 'Nairobi',
      address: 'Moi Avenue, Nairobi',
    },
  });
  console.log(`Created station: ${station.name}`);

  // Create staff
  const staffData = [
    { name: 'Alice Wanjiku', email: 'alice@bustrack.com', password: 'password', phone: '+254711111111', role: 'TICKETER' as const, stationId: station.id },
    { name: 'Bob Ochieng', email: 'bob@bustrack.com', password: 'password', phone: '+254722222222', role: 'CASHIER' as const, stationId: station.id },
    { name: 'Charles Mwangi', email: 'charles@bustrack.com', password: 'password', phone: '+254733333333', role: 'GATEMAN' as const, stationId: station.id },
    { name: 'Diana Achieng', email: 'diana@bustrack.com', password: 'password', phone: '+254744444444', role: 'MANAGER' as const, stationId: station.id },
    { name: 'Edward Kamau', email: 'edward@bustrack.com', password: 'password', phone: '+254755555555', role: 'SUPERADMIN' as const, stationId: station.id },
  ];

  const staff = [];
  for (const s of staffData) {
    const created = await db.staff.create({ data: s });
    staff.push(created);
    console.log(`Created staff: ${created.name} (${created.role})`);
  }

  // Create routes
  const routesData = [
    { origin: 'Nairobi', destination: 'Mombasa', distanceKm: 484, baseFare: 1200, estimatedMin: 480, stationId: station.id },
    { origin: 'Nairobi', destination: 'Kisumu', distanceKm: 347, baseFare: 900, estimatedMin: 360, stationId: station.id },
    { origin: 'Nairobi', destination: 'Eldoret', distanceKm: 310, baseFare: 800, estimatedMin: 300, stationId: station.id },
    { origin: 'Nairobi', destination: 'Nakuru', distanceKm: 160, baseFare: 500, estimatedMin: 150, stationId: station.id },
    { origin: 'Nairobi', destination: 'Malindi', distanceKm: 560, baseFare: 1400, estimatedMin: 540, stationId: station.id },
    { origin: 'Nairobi', destination: 'Diani', distanceKm: 500, baseFare: 1300, estimatedMin: 500, stationId: station.id },
  ];

  const routes = [];
  for (const r of routesData) {
    const created = await db.route.create({ data: r });
    routes.push(created);
    console.log(`Created route: ${created.origin} → ${created.destination}`);
  }

  // Create buses
  const busesData = [
    { plateNumber: 'KBA 231J', busType: 'VIP' as const, totalSeats: 33, rows: 11, cols: 3 },
    { plateNumber: 'KBA 456K', busType: 'EXECUTIVE' as const, totalSeats: 40, rows: 10, cols: 4 },
    { plateNumber: 'KBA 789L', busType: 'STANDARD' as const, totalSeats: 49, rows: 13, cols: 4 },
    { plateNumber: 'KBA 012M', busType: 'PREMIUM' as const, totalSeats: 29, rows: 10, cols: 3 },
    { plateNumber: 'KBA 345N', busType: 'VIP' as const, totalSeats: 33, rows: 11, cols: 3 },
    { plateNumber: 'KBA 678P', busType: 'EXECUTIVE' as const, totalSeats: 40, rows: 10, cols: 4 },
    { plateNumber: 'KBA 901Q', busType: 'STANDARD' as const, totalSeats: 49, rows: 13, cols: 4 },
    { plateNumber: 'KBA 234R', busType: 'VIP' as const, totalSeats: 33, rows: 11, cols: 3 },
  ];

  const buses = [];
  for (const b of busesData) {
    const created = await db.bus.create({ data: b });
    buses.push(created);
    console.log(`Created bus: ${created.plateNumber}`);
  }

  // Create today's schedules
  const schedulesData = [
    { routeId: routes[0].id, busId: buses[0].id, stationId: station.id, departureDate: today, departureTime: '06:00', fare: 1200, status: 'DEPARTED' as const, gateNumber: 'A1', actualDeparture: '06:05' },
    { routeId: routes[0].id, busId: buses[1].id, stationId: station.id, departureDate: today, departureTime: '08:30', fare: 1200, status: 'BOARDING' as const, gateNumber: 'A2' },
    { routeId: routes[0].id, busId: buses[4].id, stationId: station.id, departureDate: today, departureTime: '11:00', fare: 1200, status: 'SCHEDULED' as const, gateNumber: 'A1' },
    { routeId: routes[1].id, busId: buses[2].id, stationId: station.id, departureDate: today, departureTime: '07:00', fare: 900, status: 'SCHEDULED' as const, gateNumber: 'B1' },
    { routeId: routes[1].id, busId: buses[5].id, stationId: station.id, departureDate: today, departureTime: '14:00', fare: 900, status: 'SCHEDULED' as const, gateNumber: 'B2' },
    { routeId: routes[2].id, busId: buses[3].id, stationId: station.id, departureDate: today, departureTime: '09:00', fare: 800, status: 'SCHEDULED' as const, gateNumber: 'C1' },
    { routeId: routes[3].id, busId: buses[6].id, stationId: station.id, departureDate: today, departureTime: '10:00', fare: 500, status: 'SCHEDULED' as const, gateNumber: 'D1' },
    { routeId: routes[4].id, busId: buses[7].id, stationId: station.id, departureDate: today, departureTime: '12:00', fare: 1400, status: 'SCHEDULED' as const, gateNumber: 'A3' },
    { routeId: routes[5].id, busId: buses[0].id, stationId: station.id, departureDate: today, departureTime: '16:00', fare: 1300, status: 'SCHEDULED' as const, gateNumber: 'A1' },
  ];

  const schedules = [];
  for (const s of schedulesData) {
    const created = await db.schedule.create({ data: s });
    schedules.push(created);
    console.log(`Created schedule: ${created.departureTime} (gate ${created.gateNumber})`);
  }

  // Create some bookings for the first schedule (DEPARTED)
  const passengers = [
    { name: 'James Otieno', phone: '+254711000001' },
    { name: 'Mary Wambui', phone: '+254711000002' },
    { name: 'Peter Kipchoge', phone: '+254711000003' },
    { name: 'Grace Akinyi', phone: '+254711000004' },
    { name: 'Samuel Muthoni', phone: '+254711000005' },
    { name: 'Sarah Chebet', phone: '+254711000006' },
    { name: 'John Njoroge', phone: '+254711000007' },
    { name: 'Faith Wairimu', phone: '+254711000008' },
    { name: 'David Kariuki', phone: '+254711000009' },
    { name: 'Lucy Nyambura', phone: '+254711000010' },
    { name: 'Martin Omondi', phone: '+254711000011' },
    { name: 'Esther Muthoni', phone: '+254711000012' },
  ];

  // Bookings for schedule 0 (DEPARTED) - fully booked
  for (let i = 0; i < 12; i++) {
    const row = Math.floor(i / 3) + 1;
    const col = (i % 3);
    const colLetter = ['A', 'B', 'C'][col];
    const seatNumber = `${row}${colLetter}`;

    const ref = `BT-${String(Date.now()).slice(-6)}${String(i).padStart(2, '0')}`;
    const booking = await db.booking.create({
      data: {
        reference: ref,
        scheduleId: schedules[0].id,
        staffId: staff[0].id,
        passengerName: passengers[i].name,
        passengerPhone: passengers[i].phone,
        seatNumber,
        fare: 1200,
        status: i < 8 ? 'BOARDED' : 'CONFIRMED',
        boardedAt: i < 8 ? new Date() : null,
      },
    });
    console.log(`Created booking: ${booking.reference} - ${passengers[i].name} (${seatNumber})`);
  }

  // Bookings for schedule 1 (BOARDING) - some bookings
  const boardingPassengers = [
    { name: 'Agnes Wanjiru', phone: '+254711000020' },
    { name: 'Henry Kiprop', phone: '+254711000021' },
    { name: 'Beatrice Adhiambo', phone: '+254711000022' },
    { name: 'Joseph Maina', phone: '+254711000023' },
    { name: 'Catherine Njeri', phone: '+254711000024' },
    { name: 'Thomas Odhiambo', phone: '+254711000025' },
  ];

  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 4) + 1;
    const col = (i % 4);
    const colLetter = ['A', 'B', 'C', 'D'][col];
    const seatNumber = `${row}${colLetter}`;

    const ref2 = `BT-${String(Date.now()).slice(-6)}${String(i + 20).padStart(2, '0')}`;
    await db.booking.create({
      data: {
        reference: ref2,
        scheduleId: schedules[1].id,
        staffId: staff[0].id,
        passengerName: boardingPassengers[i].name,
        passengerPhone: boardingPassengers[i].phone,
        seatNumber,
        fare: 1200,
        status: i < 2 ? 'BOARDED' : (i < 4 ? 'CONFIRMED' : 'PENDING_PAYMENT'),
        boardedAt: i < 2 ? new Date() : null,
      },
    });
  }

  // Create some payments for completed bookings
  const completedBookings = await db.booking.findMany({
    where: { status: { in: ['CONFIRMED', 'BOARDED'] } },
  });

  for (const booking of completedBookings) {
    await db.payment.create({
      data: {
        bookingId: booking.id,
        staffId: staff[1].id,
        amount: booking.fare,
        method: ['CASH', 'MOBILE_MONEY', 'CARD', 'QR_CODE'][Math.floor(Math.random() * 4)] as any,
        status: 'COMPLETED',
        cashReceived: Math.random() > 0.5 ? Math.ceil(booking.fare / 100) * 100 : null,
        changeGiven: null,
      },
    });
  }

  console.log('\n✅ Seeding complete!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });