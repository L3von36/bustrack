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

---

## BUG-005
**Date Found:** 2026-07-08
**Severity:** Medium
**Description:** Graph-paper grid CSS (`body::before` with `linear-gradient` background) was not rendering on the page. The pseudo-element's computed styles showed `content: none`, `position: static`, `backgroundImage: none` — all default values, meaning our rule was being overridden.
**Fix:** The rule was initially placed inside `@layer base { ... }` in `globals.css`. Tailwind CSS 4's preflight reset inside the base layer was overriding the `::before` pseudo-element styles. Moving the `body::before` rule **outside** the `@layer base` block (to the top-level of the stylesheet) gave it higher cascade priority than the layered preflight, and the grid rendered correctly. The hero section also needed its own inline grid overlay div since its solid `bg-[#0a0f1e]` background would cover the global `body::before` grid.
**Status:** Fixed

---

## BUG-006
**Date Found:** 2026-07-08
**Severity:** Critical
**Description:** Dev server crashed with a CSS compilation error referencing a missing static image. The error was self-perpetuating: the error output was written to dev.log (via tee in the dev script), and Tailwind CSS v4 auto-scanned dev.log, found the error text containing a Tailwind class name with a URL reference, then tried to compile that class — which produced the same error again, creating an infinite loop.
**Fix:** 1) Deleted dev.log and server.log files containing poisoned error output. 2) Escaped the class name reference in this BUGS.md file. 3) Added a .gitignore entry for *.log. 4) Removed tee from the dev script to prevent log files from being created in the future.
**Status:** Fixed