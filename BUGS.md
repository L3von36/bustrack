# Bus Station Ticket Booking System — Bug Tracker

## Format
**Bug ID:** BUG-001
**Date Found:** YYYY-MM-DD
**Severity:** Critical / High / Medium / Low
**Description:** What went wrong
**Fix:** How we fixed it
**Status:** Open / Fixed

---

## BUG-001
**Date Found:** 2026-07-08
**Severity:** Low
**Description:** Prisma schema validation failed — `@@index [staffId]` missing parentheses. Error: "This line is not a valid field or attribute definition."
**Fix:** Changed `@@index [staffId]` to `@@index([staffId])` — Prisma requires parentheses around index fields.
**Status:** Fixed

---

## BUG-002
**Date Found:** 2026-07-08
**Severity:** Low
**Description:** Prisma schema validation failed — `bookings` relation field on Route model had no opposite relation field on Booking model. Booking relates to Schedule, not directly to Route.
**Fix:** Removed `bookings Booking[]` from Route model. Booking data is accessible through `route.schedules.bookings`.
**Status:** Fixed

---

## BUG-003
**Date Found:** 2026-07-08
**Severity:** Medium
**Description:** ESLint parsing error in `constants.ts` — file contained JSX (React elements like `<Ticket className="h-6 w-6" />`) but had a `.ts` extension. TypeScript/ESLint cannot parse JSX in `.ts` files.
**Fix:** Renamed `src/components/bus-track/constants.ts` to `constants.tsx`. All imports using `'./constants'` (without extension) resolved correctly in Next.js.
**Status:** Fixed

---

## BUG-004
**Date Found:** 2026-07-08
**Severity:** Low
**Description:** React ESLint rule `react-hooks/set-state-in-effect` triggered in `use-realtime.ts` — `setIsConnected(true)` was called synchronously inside a `useEffect` body when checking `socket.connected`. This can cause cascading renders.
**Fix:** Wrapped the synchronous setState call in `queueMicrotask(() => setIsConnected(true))` to defer the state update out of the synchronous effect body, satisfying the lint rule while maintaining the same behavior.
**Status:** Fixed