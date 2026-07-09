// @ts-no-check
/**
 * BusTrack Comprehensive Real-User Test Suite
 * Uses child_process.execSync for reliability (curl)
 */
const { execSync } = require('child_process');

const BASE = 'http://127.0.0.1:3001';
let passCount = 0, failCount = 0, bugCount = 0;
const bugs = [];

function log(test, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '🐛';
  console.log(`${icon} ${test}${detail ? ' — ' + detail : ''}`);
  if (status === 'PASS') passCount++;
  else if (status === 'FAIL') failCount++;
  else { bugCount++; bugs.push({ test, detail }); }
}

function curl(method, path, body = '', token = '') {
  try {
    let cmd = `curl -s -w '\\n%{http_code}' -X ${method} '${BASE}${path}' -H 'Content-Type: application/json'`;
    if (token) cmd += ` -H 'Authorization: Bearer ${token}'`;
    if (body) cmd += ` -d '${body.replace(/'/g, "'\\''")}'`;
    const out = execSync(cmd, { timeout: 15000, encoding: 'utf8', shell: '/bin/bash' }).trim();
    const lines = out.split('\n');
    const status = parseInt(lines[lines.length - 1]) || 0;
    const response = lines.slice(0, -1).join('\n');
    return { status, body: response, json: safeParse(response) };
  } catch (e: any) {
    return { status: 0, body: e.message, json: null };
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function jstr(o, path) {
  try {
    const parts = path.split('.');
    let v = o;
    for (const p of parts) {
      if (v == null) return undefined;
      // Handle array index like data[0]
      const arrMatch = p.match(/^(\w+)\[(\d+)\]$/);
      if (arrMatch) { v = v[arrMatch[1]]?.[parseInt(arrMatch[2])]; }
      else { v = v[p]; }
    }
    return v;
  } catch { return undefined; }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   BusTrack Comprehensive API Test Suite       ║');
  console.log('╚══════════════════════════════════════════════╝');

  // ═══ 1. HEALTH ═══
  console.log('\n═══ 1. HEALTH ═══');
  let r = curl('GET', '/api/health');
  log('GET /api/health', r.status === 200 ? 'PASS' : 'FAIL', `status=${r.status}`);
  if (r.json?.db?.connected) log('DB connectivity', 'PASS', `latency=${r.json.db.latencyMs}ms`);
  else log('DB connectivity', 'FAIL', 'not connected');

  // ═══ 2. AUTH WALL ═══
  console.log('\n═══ 2. AUTHENTICATION WALL ═══');
  const getEps = ['/api/bookings', '/api/payments', '/api/gate/validate', '/api/dashboard/stats',
    '/api/admin/staff', '/api/schedules/today', '/api/routes', '/api/notifications',
    '/api/luggage', '/api/payments/recent', '/api/dashboard/departures',
    '/api/admin/routes', '/api/admin/buses', '/api/admin/analytics'];
  const postEps = ['/api/bookings', '/api/payments', '/api/gate/validate',
    '/api/admin/staff', '/api/admin/routes', '/api/admin/buses', '/api/luggage'];

  for (const ep of getEps) {
    r = curl('GET', ep);
    log(`Auth: GET ${ep}`, r.status === 401 ? 'PASS' : 'BUG', `got ${r.status}`);
  }
  for (const ep of postEps) {
    r = curl('POST', ep, '{}');
    log(`Auth: POST ${ep}`, r.status === 401 ? 'PASS' : 'BUG', `got ${r.status}`);
  }

  // ═══ 3. LOGIN ═══
  console.log('\n═══ 3. LOGIN — All 5 Roles ═══');
  const tokens: Record<string, string> = {};
  const creds = [
    { email: 'alice@bustrack.com', pw: 'password', role: 'TICKETER', name: 'Abebech Bekele' },
    { email: 'bob@bustrack.com', pw: 'password', role: 'CASHIER', name: 'Bereket Tadesse' },
    { email: 'charles@bustrack.com', pw: 'password', role: 'GATEMAN', name: 'Chala Hailu' },
    { email: 'diana@bustrack.com', pw: 'password', role: 'MANAGER', name: 'Dinknesh Girma' },
    { email: 'edward@bustrack.com', pw: 'password', role: 'SUPERADMIN', name: 'Eyasu Tesfaye' },
  ];

  for (const c of creds) {
    r = curl('POST', '/api/auth/login', JSON.stringify({ email: c.email, password: c.pw }));
    if (r.status === 200 && r.json?.token) {
      tokens[c.role] = r.json.token;
      const uname = r.json.user?.name;
      const hasPw = !!r.json.user?.password;
      log(`Login: ${c.role}`, uname === c.name ? 'PASS' : 'BUG',
        uname === c.name ? `name=${uname}` : `name mismatch: ${uname} vs ${c.name}`);
      log(`  No password leak (${c.role})`, !hasPw ? 'PASS' : 'BUG', hasPw ? 'PASSWORD IN RESPONSE' : '');
    } else {
      log(`Login: ${c.role}`, 'FAIL', `status=${r.status}`);
    }
  }

  // Bad logins
  r = curl('POST', '/api/auth/login', JSON.stringify({ email: 'alice@bustrack.com', password: 'wrong' }));
  log('Wrong password', r.status === 401 ? 'PASS' : 'BUG', `got ${r.status}`);

  r = curl('POST', '/api/auth/login', JSON.stringify({ email: 'nobody@bustrack.com', password: 'x' }));
  log('Non-existent user', r.status === 401 ? 'PASS' : 'BUG', `got ${r.status}`);

  r = curl('POST', '/api/auth/login', JSON.stringify({ password: 'x' }));
  log('Missing email', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);

  r = curl('POST', '/api/auth/login', JSON.stringify({ email: 'alice@bustrack.com' }));
  log('Missing password', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);

  r = curl('POST', '/api/auth/login', JSON.stringify({ email: 'notanemail', password: 'x' }));
  log('Invalid email format', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);

  r = curl('POST', '/api/auth/login', '{}');
  log('Empty body', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);

  // ═══ 4. TICKETER ═══
  console.log('\n═══ 4. TICKETER FLOW ═══');
  const TK = tokens['TICKETER'];

  r = curl('GET', '/api/routes', '', TK);
  log('GET routes', r.status === 200 ? 'PASS' : 'FAIL', `status=${r.status}`);
  const routeCount = r.json?.routes?.length || 0;

  r = curl('GET', '/api/routes?search=Dire', '', TK);
  log('Search routes "Dire"', r.status === 200 ? 'PASS' : 'FAIL', `found=${r.json?.routes?.length || 0}`);

  r = curl('GET', '/api/schedules/today', '', TK);
  log('GET schedules/today', r.status === 200 ? 'PASS' : 'FAIL');
  const scheds = r.json?.schedules || [];
  const firstSched = scheds[0];

  if (firstSched) {
    r = curl('GET', `/api/schedules/${firstSched.id}`, '', TK);
    log('GET schedule detail', r.status === 200 ? 'PASS' : 'FAIL',
      `booked=${r.json?.bookedSeats?.length || 0}/${r.json?.bus?.totalSeats || 0}`);

    // Try to book a seat (try multiple if some are taken)
    const seatAttempts = ['2A', '3A', '5A', '7A', '9A', '2B', '4B', '6B', '8B', '10A'];
    let booked = false;
    for (const seat of seatAttempts) {
      r = curl('POST', '/api/bookings', JSON.stringify({
        scheduleId: firstSched.id, passengerName: 'Test Passenger',
        passengerPhone: '+251911223344', seatNumber: seat, fare: firstSched.fare,
      }), TK);
      if (r.status === 200) {
        log(`Book seat ${seat}`, 'PASS', `ref=${r.json?.booking?.reference}`);
        booked = true;
        break;
      } else if (r.status !== 409) {
        log(`Book seat ${seat}`, 'FAIL', `status=${r.status}`);
        break;
      }
    }
    if (!booked) log('Book seat (all taken or error)', 'FAIL');

    // Duplicate seat
    r = curl('POST', '/api/bookings', JSON.stringify({
      scheduleId: firstSched.id, passengerName: 'Dup',
      passengerPhone: '+251911223345', seatNumber: '2A', fare: firstSched.fare,
    }), TK);
    log('Duplicate seat → 409', r.status === 409 ? 'PASS' : 'BUG', `got ${r.status}`);

    // Invalid phone
    r = curl('POST', '/api/bookings', JSON.stringify({
      scheduleId: firstSched.id, passengerName: 'Bad',
      passengerPhone: '0712345678', seatNumber: '99Z', fare: 100,
    }), TK);
    log('Invalid phone → 400', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);

    // Missing fields
    r = curl('POST', '/api/bookings', JSON.stringify({ scheduleId: 'abc' }), TK);
    log('Missing fields → 400', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);

    // Bad schedule
    r = curl('POST', '/api/bookings', JSON.stringify({
      scheduleId: 'nonexistent', passengerName: 'Ghost Rider',
      passengerPhone: '+251911223346', seatNumber: '1A', fare: 100,
    }), TK);
    log('Bad schedule → 404', r.status === 404 ? 'PASS' : 'BUG', `got ${r.status}`);

    // Pending bookings
    r = curl('GET', '/api/bookings?status=PENDING_PAYMENT', '', TK);
    log('GET pending bookings', r.status === 200 ? 'PASS' : 'FAIL');
    // Check pagination
    if (r.json?.pagination) {
      log('  Has pagination metadata', 'PASS');
    } else {
      log('  Has pagination metadata', 'BUG', 'No pagination object');
    }
  } else {
    log('No schedules available', 'FAIL', 'Cannot test booking');
  }

  // ═══ 5. CASHIER ═══
  console.log('\n═══ 5. CASHIER FLOW ═══');
  const CSH = tokens['CASHIER'];

  r = curl('GET', '/api/bookings?status=PENDING_PAYMENT', '', CSH);
  log('GET pending bookings', r.status === 200 ? 'PASS' : 'FAIL');
  const pendingList = r.json?.data || r.json?.bookings || [];
  const pb = pendingList.find((b: any) => b.status === 'PENDING_PAYMENT');

  if (pb) {
    const cashExtra = Math.ceil(pb.fare) + 100;
    r = curl('POST', '/api/payments', JSON.stringify({
      bookingId: pb.id, method: 'CASH', cashReceived: cashExtra,
    }), CSH);
    log('Process CASH payment', r.status === 200 ? 'PASS' : 'FAIL', `status=${r.status}`);
    if (r.json?.payment) {
      const change = (r.json.payment.changeGiven || 0) / 100;
      log(`  Change given`, Math.abs(change - 100) < 1 ? 'PASS' : 'BUG',
        `expected ETB 100, got ETB ${change.toFixed(2)}`);
    }
  } else {
    log('No pending booking for cashier', 'FAIL', 'Create a booking first');
  }

  r = curl('GET', '/api/payments/recent', '', CSH);
  log('GET recent payments', r.status === 200 ? 'PASS' : 'FAIL');

  r = curl('GET', '/api/bookings?status=CONFIRMED', '', CSH);
  log('GET confirmed bookings', r.status === 200 ? 'PASS' : 'FAIL');

  // ═══ 6. GATEMAN ═══
  console.log('\n═══ 6. GATEMAN FLOW ═══');
  const GM = tokens['GATEMAN'];

  r = curl('GET', '/api/schedules/today', '', GM);
  log('GET schedules', r.status === 200 ? 'PASS' : 'FAIL');
  const gmScheds = r.json?.schedules || [];
  const gmSched = gmScheds[0];

  if (gmSched) {
    r = curl('GET', `/api/gate/boarding?scheduleId=${gmSched.id}`, '', GM);
    log('GET boarding info', r.status === 200 ? 'PASS' : 'FAIL',
      `boarded=${r.json?.summary?.boardedCount || 0}/${r.json?.summary?.totalBooked || 0}`);

    // Fake ticket
    r = curl('POST', '/api/gate/validate', JSON.stringify({ reference: 'FAKE-123', scheduleId: gmSched.id }), GM);
    const fakeResult = r.json?.result;
    log('Fake ticket → INVALID', fakeResult === 'INVALID' ? 'PASS' : 'BUG', `got ${fakeResult}`);

    // Missing fields
    r = curl('POST', '/api/gate/validate', '{}', GM);
    log('Gate missing fields → 400', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);

    // Find confirmed booking for this schedule
    r = curl('GET', '/api/bookings?status=CONFIRMED', '', GM);
    const confList = r.json?.data || r.json?.bookings || [];
    const confBooking = confList.find((b: any) => b.schedule?.id === gmSched.id);

    if (confBooking) {
      // Valid scan
      r = curl('POST', '/api/gate/validate', JSON.stringify({
        reference: confBooking.reference, scheduleId: gmSched.id,
      }), GM);
      const valResult = r.json?.result;
      const valName = r.json?.passengerName;
      log(`Valid ticket → ${valResult}`, valResult === 'VALID' ? 'PASS' : 'FAIL',
        `name=${valName}, seat=${r.json?.seatNumber}`);

      // Rescan
      r = curl('POST', '/api/gate/validate', JSON.stringify({
        reference: confBooking.reference, scheduleId: gmSched.id,
      }), GM);
      const rescan = r.json?.result;
      log(`Rescan → ${rescan}`, rescan === 'ALREADY_BOARDED' ? 'PASS' : 'BUG', `got ${rescan}`);
    } else {
      log('No confirmed booking for gate test', 'FAIL', `schedule ${gmSched.id}`);
    }
  } else {
    log('No schedules for gate', 'FAIL');
  }

  // ═══ 7. MANAGER ═══
  console.log('\n═══ 7. MANAGER FLOW ═══');
  const MGR = tokens['MANAGER'];

  r = curl('GET', '/api/dashboard/stats', '', MGR);
  log('GET dashboard stats', r.status === 200 ? 'PASS' : 'FAIL',
    `revenue=ETB ${r.json?.totalRevenue || 0}, passengers=${r.json?.totalPassengers || 0}`);

  // Validate stats structure
  if (r.json) {
    const checks = [
      ['totalRevenue is number', typeof r.json.totalRevenue === 'number'],
      ['totalPassengers is number', typeof r.json.totalPassengers === 'number'],
      ['busesDeparted is number', typeof r.json.busesDeparted === 'number'],
      ['onTimeRate is number', typeof r.json.onTimeRate === 'number'],
      ['revenueChange is number', typeof r.json.revenueChange === 'number'],
      ['bookingsByRoute is array', Array.isArray(r.json.bookingsByRoute)],
    ];
    for (const [label, ok] of checks) {
      log(`  Stats: ${label}`, ok ? 'PASS' : 'BUG');
    }
  }

  r = curl('GET', '/api/dashboard/departures', '', MGR);
  log('GET departures', r.status === 200 ? 'PASS' : 'FAIL', `count=${r.json?.departures?.length || 0}`);

  r = curl('GET', '/api/notifications', '', MGR);
  log('GET notifications', r.status === 200 ? 'PASS' : 'FAIL', `count=${Array.isArray(r.json) ? r.json.length : 0}`);

  // ═══ 8. SUPERADMIN ═══
  console.log('\n═══ 8. SUPERADMIN FLOW ═══');
  const SA = tokens['SUPERADMIN'];

  r = curl('GET', '/api/admin/staff', '', SA);
  log('GET staff', r.status === 200 ? 'PASS' : 'FAIL', `count=${r.json?.staff?.length || 0}`);

  // Password leak check
  const staffList = r.json?.staff || [];
  const hasPw = staffList.some((s: any) => s.password);
  log('No passwords in staff list', !hasPw ? 'PASS' : 'BUG', hasPw ? 'PASSWORD LEAKED' : '');

  r = curl('GET', '/api/admin/routes', '', SA);
  log('GET routes', r.status === 200 ? 'PASS' : 'FAIL');

  r = curl('GET', '/api/admin/buses', '', SA);
  log('GET buses', r.status === 200 ? 'PASS' : 'FAIL');

  r = curl('GET', '/api/admin/analytics', '', SA);
  log('GET analytics', r.status === 200 ? 'PASS' : 'FAIL');

  // Create staff
  const ts = Date.now();
  r = curl('POST', '/api/admin/staff', JSON.stringify({
    name: 'Test User', email: `test-${ts}@bustrack.com`,
    password: 'testpass123', role: 'TICKETER',
    phone: '+251912345600', stationId: staffList.find((s: any) => s.stationId)?.stationId || '',
  }), SA);
  log('CREATE staff', r.status === 201 ? 'PASS' : 'FAIL', `status=${r.status}`);

  // Create route
  const stId = staffList.find((s: any) => s.stationId)?.stationId || '';
  r = curl('POST', '/api/admin/routes', JSON.stringify({
    origin: 'Addis Ababa', destination: 'Jimma', distanceKm: 345,
    baseFare: 150000, estimatedMin: 360, stationId: stId,
  }), SA);
  log('CREATE route (Addis→Jimma)', r.status === 201 ? 'PASS' : 'FAIL', `status=${r.status}`);

  // Create bus
  const rp = `AA${1000 + Math.floor(Math.random() * 9000)}BT`;
  r = curl('POST', '/api/admin/buses', JSON.stringify({
    plateNumber: rp, busType: 'VIP', totalSeats: 33, rows: 11, cols: 3,
  }), SA);
  log(`CREATE bus (${rp})`, r.status === 201 ? 'PASS' : 'FAIL', `status=${r.status}`);

  // Invalid plate
  r = curl('POST', '/api/admin/buses', JSON.stringify({
    plateNumber: 'KENYA1234', busType: 'VIP', totalSeats: 33, rows: 11, cols: 3,
  }), SA);
  log('Invalid plate → 400', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);

  // Invalid seats
  r = curl('POST', '/api/admin/buses', JSON.stringify({
    plateNumber: 'AA9999ZZ', busType: 'VIP', totalSeats: 200, rows: 11, cols: 3,
  }), SA);
  log('Invalid seats → 400', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);

  // ═══ 9. RBAC ═══
  console.log('\n═══ 9. RBAC ═══');
  // TICKETER shouldn't access admin
  r = curl('GET', '/api/admin/staff', '', tokens['TICKETER']);
  log('TICKETER → admin/staff → 403', r.status === 403 ? 'PASS' : 'BUG', `got ${r.status}`);

  r = curl('GET', '/api/dashboard/stats', '', tokens['TICKETER']);
  log('TICKETER → dashboard/stats → 403', r.status === 403 ? 'PASS' : 'BUG', `got ${r.status}`);

  r = curl('GET', '/api/admin/staff', '', tokens['CASHIER']);
  log('CASHIER → admin/staff → 403', r.status === 403 ? 'PASS' : 'BUG', `got ${r.status}`);

  r = curl('GET', '/api/dashboard/stats', '', tokens['GATEMAN']);
  log('GATEMAN → dashboard/stats → 403', r.status === 403 ? 'PASS' : 'BUG', `got ${r.status}`);

  r = curl('GET', '/api/dashboard/stats', '', tokens['MANAGER']);
  log('MANAGER → dashboard/stats → 200', r.status === 200 ? 'PASS' : 'BUG', `got ${r.status}`);

  r = curl('GET', '/api/admin/staff', '', tokens['SUPERADMIN']);
  log('SUPERADMIN → admin/staff → 200', r.status === 200 ? 'PASS' : 'BUG', `got ${r.status}`);

  // ═══ 10. PAGINATION ═══
  console.log('\n═══ 10. PAGINATION ═══');
  r = curl('GET', '/api/bookings?page=1&limit=2', '', TK);
  log('Pagination page 1', r.status === 200 ? 'PASS' : 'FAIL',
    `items=${r.json?.data?.length || 0}, total=${r.json?.pagination?.total || 0}`);
  log('  Has pagination obj', r.json?.pagination ? 'PASS' : 'BUG');
  if (r.json?.pagination) {
    const p = r.json.pagination;
    log(`  hasPrevPage=false`, p.hasPrevPage === false ? 'PASS' : 'BUG');
  }

  r = curl('GET', '/api/bookings?page=999&limit=2', '', TK);
  log('Pagination way past end', r.status === 200 ? 'PASS' : 'FAIL',
    `items=${r.json?.data?.length || 0}`);

  // ═══ 11. LUGGAGE ═══
  console.log('\n═══ 11. LUGGAGE ═══');
  r = curl('GET', '/api/bookings?status=CONFIRMED', '', TK);
  const lugBookings = r.json?.data || r.json?.bookings || [];
  const lugBooking = lugBookings[0];

  if (lugBooking) {
    const tag = `TAG-${ts}`;
    r = curl('POST', '/api/luggage', JSON.stringify({
      tagNumber: tag, bookingId: lugBooking.id, weightKg: 15, notes: 'Test',
    }), TK);
    log('CREATE luggage', r.status === 201 ? 'PASS' : 'FAIL', `status=${r.status}`);

    r = curl('GET', `/api/luggage?bookingId=${lugBooking.id}`, '', TK);
    log('GET luggage', r.status === 200 ? 'PASS' : 'FAIL');

    r = curl('POST', '/api/luggage', JSON.stringify({
      tagNumber: tag, bookingId: lugBooking.id, weightKg: 10,
    }), TK);
    log('Duplicate tag → 409', r.status === 409 ? 'PASS' : 'BUG', `got ${r.status}`);

    r = curl('GET', '/api/luggage', '', TK);
    log('Missing bookingId → 400', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);

    r = curl('POST', '/api/luggage', JSON.stringify({
      tagNumber: `TAG-BAD-${ts}`, bookingId: lugBooking.id, weightKg: 200,
    }), TK);
    log('Invalid weight → 400', r.status === 400 ? 'PASS' : 'BUG', `got ${r.status}`);
  } else {
    log('Luggage: no confirmed booking', 'FAIL');
  }

  // ═══ RESULTS ═══
  console.log('\n══════════════════════════════════════════════');
  console.log(`  RESULTS: ${passCount} passed, ${failCount} failed, ${bugCount} bugs`);
  if (bugs.length > 0) {
    console.log('\n  🐛 BUGS FOUND:');
    for (const b of bugs) {
      console.log(`     • ${b.test}: ${b.detail}`);
    }
  }
  console.log('══════════════════════════════════════════════\n');
}

main().catch(console.error);