import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ─── STATION ─────────────────────────────────────
  const station = await prisma.station.create({
    data: {
      name: "Addis Ababa Central Bus Terminal",
      city: "Addis Ababa",
      address: "Ras Mekonnen Avenue, Merkato",
    },
  });

  // ─── STAFF ───────────────────────────────────────
  const hashedPassword = hashSync("password", 12);
  const staff = await Promise.all([
    prisma.staff.create({
      data: { name: "Abebech Bekele", email: "alice@bustrack.com", password: hashedPassword, role: "TICKETER", stationId: station.id },
    }),
    prisma.staff.create({
      data: { name: "Bereket Tadesse", email: "bob@bustrack.com", password: hashedPassword, role: "CASHIER", stationId: station.id },
    }),
    prisma.staff.create({
      data: { name: "Chala Hailu", email: "charles@bustrack.com", password: hashedPassword, role: "GATEMAN", stationId: station.id },
    }),
    prisma.staff.create({
      data: { name: "Dinknesh Girma", email: "diana@bustrack.com", password: hashedPassword, role: "MANAGER", stationId: station.id },
    }),
    prisma.staff.create({
      data: { name: "Eyasu Tesfaye", email: "edward@bustrack.com", password: hashedPassword, role: "SUPERADMIN" },
    }),
  ]);

  // ─── ROUTES (fares in cents: ETB * 100) ─────────
  const routes = await Promise.all([
    prisma.route.create({
      data: { origin: "Addis Ababa", destination: "Dire Dawa", distanceKm: 445, baseFare: 180000, estimatedMin: 420, stationId: station.id },
    }),
    prisma.route.create({
      data: { origin: "Addis Ababa", destination: "Bahir Dar", distanceKm: 565, baseFare: 220000, estimatedMin: 540, stationId: station.id },
    }),
    prisma.route.create({
      data: { origin: "Addis Ababa", destination: "Hawassa", distanceKm: 275, baseFare: 120000, estimatedMin: 270, stationId: station.id },
    }),
    prisma.route.create({
      data: { origin: "Addis Ababa", destination: "Adama", distanceKm: 100, baseFare: 50000, estimatedMin: 90, stationId: station.id },
    }),
  ]);

  // ─── BUSES ────────────────────────────────────────
  const buses = await Promise.all([
    prisma.bus.create({ data: { plateNumber: "AA2345AB", busType: "VIP", totalSeats: 33, rows: 11, cols: 3 } }),
    prisma.bus.create({ data: { plateNumber: "AA5678CD", busType: "EXECUTIVE", totalSeats: 40, rows: 10, cols: 4 } }),
    prisma.bus.create({ data: { plateNumber: "AA9012EF", busType: "STANDARD", totalSeats: 44, rows: 11, cols: 4 } }),
    prisma.bus.create({ data: { plateNumber: "AA3456GH", busType: "VIP", totalSeats: 33, rows: 11, cols: 3 } }),
    prisma.bus.create({ data: { plateNumber: "AA7890IJ", busType: "EXECUTIVE", totalSeats: 40, rows: 10, cols: 4 } }),
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
  const passengerNames = ["Abebech Kebede", "Birtukan Mulugeta", "Chaltu Tadesse", "Dawit Assefa"];
  let nameIdx = 0;
  for (const schedule of allSchedules.slice(0, 3)) {
    const seats = ["1A", "3B", "5C", "7A"];
    for (const seat of seats) {
      bookingRef++;
      const booking = await prisma.booking.create({
        data: {
          reference: `BK${bookingRef}`,
          scheduleId: schedule.id,
          staffId: staff[0].id,
          passengerName: passengerNames[nameIdx % passengerNames.length],
          passengerPhone: "+25191234567" + String(nameIdx).padStart(2, "0"),
          seatNumber: seat,
          fare: schedule.fare,
          status: "CONFIRMED",
        },
      });
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          staffId: staff[1].id,
          amount: schedule.fare,
          method: "CASH",
          status: "COMPLETED",
          cashReceived: schedule.fare + 10000, // 100 ETB extra in cents
          changeGiven: 10000, // 100 ETB in cents
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