---
phase: 09-cal-com-scheduling
plan: 01
subsystem: database, api
tags: [drizzle, sqlite, cal.com, webhook, hmac-sha256, astro]

# Dependency graph
requires:
  - phase: 05-database-foundation
    provides: Drizzle schema + migration workflow (generate + migrate)
  - phase: 07-extended-api-hubspot
    provides: Astro API route patterns, db.update() patterns
provides:
  - calBookingUid and calScheduledAt nullable text columns on submissions table
  - drizzle/0001_wild_hex.sql migration with ALTER TABLE statements
  - POST /api/cal-webhook endpoint with HMAC-SHA256 signature verification
affects: [09-02, 09-03, admin-dashboard]

# Tech tracking
tech-stack:
  added: [node:crypto (built-in, createHmac + timingSafeEqual)]
  patterns: [HMAC-SHA256 webhook verification with timingSafeEqual, email-based lead matching with orderBy desc id]

key-files:
  created:
    - src/pages/api/cal-webhook.ts
    - drizzle/0001_wild_hex.sql
  modified:
    - src/db/schema.ts

key-decisions:
  - "Match booking to most recent lead by email using orderBy(desc(submissions.id)).limit(1) — consistent with HubSpot dedup pattern"
  - "timingSafeEqual wrapped in try/catch to handle Buffer length mismatch (attacker sends wrong-length sig → 401 not 500)"
  - "Read rawBody via request.text() before any parsing — signature must be verified against raw string"
  - "Rebuilt better-sqlite3 native module (npm rebuild) due to Node.js version mismatch (NODE_MODULE_VERSION 137 vs 127)"

patterns-established:
  - "Pattern: Cal.com webhook verification — createHmac('sha256', secret).update(rawBody).digest('hex') + timingSafeEqual with try/catch"
  - "Pattern: Email-based lead match — .where(eq(submissions.email, email)).orderBy(desc(submissions.id)).limit(1).get()"

requirements-completed: [CAL-04]

# Metrics
duration: 8min
completed: 2026-03-20
---

# Phase 09 Plan 01: Cal.com Webhook Integration Summary

**HMAC-SHA256 signed webhook endpoint at POST /api/cal-webhook links Cal.com BOOKING_CREATED events to lead records via email-match on submissions table, with two new nullable DB columns (cal_booking_uid, cal_scheduled_at) and applied migration**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-20T11:20:00Z
- **Completed:** 2026-03-20T11:29:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added calBookingUid and calScheduledAt nullable text columns to submissions table schema
- Generated and applied migration drizzle/0001_wild_hex.sql with proper ALTER TABLE statements
- Created POST /api/cal-webhook endpoint with HMAC-SHA256 signature verification using timingSafeEqual
- Implemented email-based lead matching (most recent by id desc) and booking record update

## Task Commits

Each task was committed atomically:

1. **Task 1: Add booking columns to schema and run migration** - `0f13cd5` (feat)
2. **Task 2: Create Cal.com webhook endpoint** - `0cd16d4` (feat)

**Plan metadata:** (see final docs commit)

## Files Created/Modified
- `src/db/schema.ts` - Added calBookingUid and calScheduledAt columns after hubspotSyncedAt
- `drizzle/0001_wild_hex.sql` - Migration with two ALTER TABLE statements for new columns
- `drizzle/meta/0001_snapshot.json` - Drizzle migration snapshot metadata
- `drizzle/meta/_journal.json` - Updated migration journal
- `src/pages/api/cal-webhook.ts` - POST endpoint: HMAC verify, parse BOOKING_CREATED, email-match lead, update booking columns

## Decisions Made
- Most-recent lead matching via `orderBy(desc(submissions.id)).limit(1)` — handles multiple submissions with same email by targeting the latest
- `timingSafeEqual` wrapped in try/catch: prevents Buffer length mismatch from throwing 500 (wrong-length signature returns 401)
- Raw body read first via `request.text()` before JSON.parse — required by HMAC verification protocol
- Rebuilt better-sqlite3 native module via `npm rebuild` to resolve NODE_MODULE_VERSION mismatch between drizzle-kit and current Node.js v22

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Rebuilt better-sqlite3 native module for Node.js version compatibility**
- **Found during:** Task 1 (running drizzle-kit migrate)
- **Issue:** `drizzle-kit migrate` failed with ERR_DLOPEN_FAILED — better-sqlite3 compiled for NODE_MODULE_VERSION 137, current Node.js v22 requires 127
- **Fix:** Ran `npm rebuild better-sqlite3` to recompile the native module for the running Node version
- **Files modified:** node_modules/better-sqlite3 (native binary, not tracked in git)
- **Verification:** Migration applied successfully after rebuild
- **Committed in:** 0f13cd5 (part of Task 1 commit — no file change, just the rebuild step)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Rebuild was necessary infrastructure step. No scope creep.

## Issues Encountered
- better-sqlite3 native module version mismatch during drizzle-kit migrate — resolved via npm rebuild (Rule 3)

## User Setup Required
**External services require manual configuration before webhook functions.**

Environment variables needed:
- `CAL_WEBHOOK_SECRET` — from Cal.com Dashboard -> Settings -> Developer -> Webhooks -> Create webhook -> copy secret

Dashboard configuration:
- Create webhook endpoint pointing to `https://<your-domain>/api/cal-webhook` in Cal.com Dashboard -> Settings -> Developer -> Webhooks
- Select BOOKING_CREATED event trigger on the webhook configuration

## Next Phase Readiness
- DB schema extended with cal_booking_uid and cal_scheduled_at — ready for Phase 09-02 (Cal.com embed in success panel)
- Webhook endpoint ready and deployed once CAL_WEBHOOK_SECRET env var is configured
- Phase 09-02 can proceed immediately (no blocking dependencies)

---
*Phase: 09-cal-com-scheduling*
*Completed: 2026-03-20*

## Self-Check: PASSED

- src/db/schema.ts — FOUND
- drizzle/0001_wild_hex.sql — FOUND
- src/pages/api/cal-webhook.ts — FOUND
- 09-01-SUMMARY.md — FOUND
- Commit 0f13cd5 — FOUND
- Commit 0cd16d4 — FOUND
