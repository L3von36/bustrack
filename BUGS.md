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