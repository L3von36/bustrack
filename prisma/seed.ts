import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ─── STATION ─────────────────────────────────────
  const station = await prisma.station.create({
    data: {
      name: "Central Bus Terminal",
      city: "Nairobi",
      address: "Accra Road, Nairobi CBD",
    },
  });

  // ─── STAFF ───────────────────────────────────────
  const staff = await Promise.all([
    prisma.staff.create({
      data: { name: "Alice Wanjiku", email: "alice@bustrack.com", password: "password", role: "TICKETER", stationId: station.id },
    }),
    prisma.staff.create({
      data: { name: "Bob Ochieng", email: "bob@bustrack.com", password: "password", role: "CASHIER", stationId: station.id },
    }),
    prisma.staff.create({
      data: { name: "Charles Mwangi", email: "charles@bustrack.com", password: "password", role: "GATEMAN", stationId: station.id },
    }),
    prisma.staff.create({
      data: { name: "Diana Akinyi", email: "diana@bustrack.com", password: "password", role: "MANAGER", stationId: station.id },
    }),
    prisma.staff.create({
      data: { name: "Edward Kamau", email: "edward@bustrack.com", password: "password", role: "SUPERADMIN" },
    }),
  ]);

  // ─── ROUTES ──────────────────────────────────────
  const routes = await Promise.all([
    prisma.route.create({
      data: { origin: "Nairobi", destination: "Mombasa", distanceKm: 483, baseFare: 1200, estimatedMin: 480, stationId: station.id },
    }),
    prisma.route.create({
      data: { origin: "Nairobi", destination: "Kisumu", distanceKm: 347, baseFare: 900, estimatedMin: 360, stationId: station.id },
    }),
    prisma.route.create({
      data: { origin: "Nairobi", destination: "Eldoret", distanceKm: 310, baseFare: 800, estimatedMin: 300, stationId: station.id },
    }),
    prisma.route.create({
      data: { origin: "Nairobi", destination: "Nakuru", distanceKm: 160, baseFare: 500, estimatedMin: 150, stationId: station.id },
    }),
  ]);

  // ─── BUSES ────────────────────────────────────────
  const buses = await Promise.all([
    prisma.bus.create({ data: { plateNumber: "KBA 234X", busType: "VIP", totalSeats: 33, rows: 11, cols: 3 } }),
    prisma.bus.create({ data: { plateNumber: "KCB 567Y", busType: "EXECUTIVE", totalSeats: 40, rows: 10, cols: 4 } }),
    prisma.bus.create({ data: { plateNumber: "KCC 890Z", busType: "STANDARD", totalSeats: 44, rows: 11, cols: 4 } }),
    prisma.bus.create({ data: { plateNumber: "KDE 123A", busType: "VIP", totalSeats: 33, rows: 11, cols: 3 } }),
    prisma.bus.create({ data: { plateNumber: "KDF 456B", busType: "EXECUTIVE", totalSeats: 40, rows: 10, cols: 4 } }),
  ]);

  // ─── SCHEDULES (today and tomorrow) ───────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const scheduleData = [
    { routeIdx: 0, busIdx: 0, time: "06:00", gate: "G1" },
    { routeIdx: 0, busIdx: 1, time: "08:00", gate: "G2" },
    { routeIdx: 0, busIdx: 3, time: "10:00", gate: "G1" },
    { routeIdx: 1, busIdx: 2, time: "07:00", gate: "G3" },
    { routeIdx: 1, busIdx: 4, time: "14:00", gate: "G3" },
    { routeIdx: 2, busIdx: 0, time: "09:00", gate: "G4" },
    { routeIdx: 3, busIdx: 2, time: "06:30", gate: "G5" },
    { routeIdx: 3, busIdx: 4, time: "08:30", gate: "G5" },
  ];

  const schedules = [];
  for (const dayStr of [todayStr, tomorrowStr]) {
    for (const s of scheduleData) {
      const route = routes[s.routeIdx];
      const bus = buses[s.busIdx];
      // Only create if the bus isn't already scheduled for that day
      schedules.push(
        prisma.schedule.create({
          data: {
            routeId: route.id,
            busId: bus.id,
            stationId: station.id,
            departureDate: dayStr,
            departureTime: s.time,
            fare: route.baseFare,
            status: "SCHEDULED",
            gateNumber: s.gate,
          },
        })
      );
    }
  }
  await Promise.all(schedules);

  // ─── SAMPLE BOOKINGS (some seats taken) ───────────
  const allSchedules = await prisma.schedule.findMany({
    where: { departureDate: todayStr },
    include: { route: true },
  });

  let bookingRef = 1000;
  for (const schedule of allSchedules.slice(0, 3)) {
    const seats = ["1A", "3B", "5C", "7A"];
    for (const seat of seats) {
      bookingRef++;
      await prisma.booking.create({
        data: {
          reference: `BK${bookingRef}`,
          scheduleId: schedule.id,
          staffId: staff[0].id,
          passengerName: "John Doe",
          passengerPhone: "+254712345678",
          seatNumber: seat,
          fare: schedule.fare,
          status: "CONFIRMED",
        },
      });
      await prisma.payment.create({
        data: {
          bookingId: (await prisma.booking.findFirst({ where: { reference: `BK${bookingRef}` } }))!.id,
          staffId: staff[1].id,
          amount: schedule.fare,
          method: "CASH",
          status: "COMPLETED",
          cashReceived: schedule.fare + 100,
          changeGiven: 100,
        },
      });
    }
  }

  console.log("Database seeded successfully!");
  console.log(`Station: ${station.name}`);
  console.log(`Staff: ${staff.length} users created`);
  console.log(`Routes: ${routes.length}`);
  console.log(`Buses: ${buses.length}`);
  console.log(`Schedules: ${scheduleData.length} per day x 2 days`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });