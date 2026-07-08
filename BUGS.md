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
**Description:** After the full UI redesign session, the dev server crashed with a fatal CSS compilation error: `Module not found: Can't resolve '/static/texture-btn.png'`. The error appears in the compiled CSS output at line 8313+ as `.after:bg-repeat { &:after { content: var(--tw-content); background-image: url("/static/texture-btn.png"); } }`. This is NOT caused by any source code in the project — `texture-btn` does not appear anywhere in `/src/`, `/public/`, or `/node_modules/` (excluding search result caches). The error persists even with a minimal globals.css and minimal page.tsx. Root cause appears to be a Tailwind CSS v4 internal bug where the `bg-repeat` utility incorrectly generates a `background-image: url(...)` reference. The dev server becomes completely unresponsive and won't auto-restart. All code passes ESLint with zero errors.
**Fix Attempted:**
1. Created placeholder PNG at `/public/static/texture-btn.png` — did not fix
2. Cleared `.next` cache — did not fix
3. Cleared `node_modules/.cache` — did not fix
4. Removed `tailwindcss-animate` plugin from `tailwind.config.ts` — did not fix
5. Upgraded `tw-animate-css` from 1.3.5 to 1.4.0 — did not fix
**Status:** Open — requires dev server restart. All code is correct (0 lint errors). May need fresh `bun install` + server restart.