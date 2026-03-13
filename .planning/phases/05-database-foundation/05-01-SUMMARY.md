---
phase: 05-database-foundation
plan: 01
subsystem: database
tags: [drizzle-orm, drizzle-kit, better-sqlite3, sqlite, wal, migrations]

# Dependency graph
requires: []
provides:
  - Extended submissions table with 8 new lead conversion columns (service_type, budget, timeline, lead_score, lead_status, notes, hubspot_id, hubspot_synced_at)
  - WAL mode + busy_timeout=5000 PRAGMA configuration on every DB connection
  - Production-safe generate+migrate workflow via npm scripts with automatic backup
  - drizzle/0000_square_swordsman.sql — first migration (ALTER TABLE ADD COLUMN)
affects:
  - 06-admin-dashboard
  - 07-hubspot-integration
  - 08-lead-scoring
  - 09-cal-integration
  - 10-analytics

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PRAGMA WAL mode set on raw better-sqlite3 connection before drizzle() wraps it"
    - "Migration SQL uses --> statement-breakpoint delimiter between statements"
    - "db:migrate backs up database with cp before running drizzle-kit migrate"

key-files:
  created:
    - drizzle/0000_square_swordsman.sql
    - drizzle/meta/_journal.json
    - drizzle/meta/0000_snapshot.json
  modified:
    - src/db/schema.ts
    - src/db/index.ts
    - package.json

key-decisions:
  - "leadStatus uses .default('new') not .$defaultFn() so SQLite applies DEFAULT 'new' during ALTER TABLE — all existing rows get lead_status='new' without a separate UPDATE"
  - "Migration SQL manually edited from CREATE TABLE to 8 ALTER TABLE ADD COLUMN statements with --> statement-breakpoint delimiters"
  - "WAL journal_mode is persistent in the DB file once set; busy_timeout is per-connection so both must be set at app startup in index.ts"
  - "npm rebuild / npm install needed to recompile better-sqlite3 native addon for Node.js v24"

patterns-established:
  - "Migrations: always run db:generate then inspect SQL before db:migrate; manually fix CREATE TABLE → ALTER TABLE on first migration"
  - "PRAGMAs: set on raw sqlite instance before drizzle() call, never in migration SQL files"
  - "Backup: cp data/submissions.db data/submissions.db.bak && drizzle-kit migrate — single-file SQLite makes backup trivial"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: 35min
completed: 2026-03-12
---

# Phase 5 Plan 01: Database Foundation Summary

**SQLite submissions table extended with 8 lead conversion columns via ALTER TABLE migration, WAL+busy_timeout PRAGMAs hardened into db/index.ts, and generate+backup+migrate workflow established via npm scripts**

## Performance

- **Duration:** 35 min
- **Started:** 2026-03-12T23:43:06Z
- **Completed:** 2026-03-12T00:18:00Z
- **Tasks:** 2 of 2
- **Files modified:** 7

## Accomplishments
- submissions table now has 17 columns (9 original + 8 new lead conversion columns)
- All existing rows have lead_status='new' via SQL-level DEFAULT applied during ALTER TABLE
- WAL mode + busy_timeout=5000 + synchronous=NORMAL set on every DB connection before drizzle() init
- npm scripts db:generate, db:migrate (with automatic backup), db:studio established
- First migration (0000_square_swordsman.sql) generated and applied successfully
- drizzle-kit push absent from all npm scripts

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend schema, add PRAGMAs, add npm scripts** - `f33611d` (feat)
2. **Task 2: Generate and verify first migration** - `843c702` (feat)

## Files Created/Modified
- `src/db/schema.ts` - Added 8 new columns to submissions table definition
- `src/db/index.ts` - Added 3 PRAGMA statements before drizzle() call
- `package.json` - Added db:generate, db:migrate, db:studio scripts
- `package-lock.json` - Updated after npm install better-sqlite3 for Node 24 compatibility
- `drizzle/0000_square_swordsman.sql` - First migration with 8 ALTER TABLE ADD COLUMN statements
- `drizzle/meta/_journal.json` - Migration tracking metadata
- `drizzle/meta/0000_snapshot.json` - Schema snapshot for future diffs

## Decisions Made
- `leadStatus` uses `.default('new')` (SQL-level DEFAULT) not `.$defaultFn()` (app-level), ensuring existing rows receive `lead_status='new'` automatically during `ALTER TABLE ADD COLUMN`
- WAL mode is persistent in the DB file once set; `busy_timeout` is per-connection — both must be in `index.ts`, not migration SQL
- Migration SQL manually edited to use 8 individual `ALTER TABLE submissions ADD COLUMN` statements with `-->statement-breakpoint` delimiters instead of the generated `CREATE TABLE` (which would fail on existing table)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Rebuilt better-sqlite3 native addon for Node.js v24**
- **Found during:** Task 2 (running db:migrate)
- **Issue:** `better-sqlite3` was compiled for Node v20 (MODULE_VERSION 127) but current runtime is Node v24 (MODULE_VERSION 137) — `ERR_DLOPEN_FAILED`
- **Fix:** Ran `npm install better-sqlite3` to download/compile for Node v24 — updated package-lock.json
- **Files modified:** package-lock.json, package.json (version bumped from `^11.0.0` to `^11.10.0`)
- **Verification:** `npm run db:migrate` succeeded after reinstall
- **Committed in:** `843c702` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed migration SQL format: CREATE TABLE → ALTER TABLE ADD COLUMN with breakpoints**
- **Found during:** Task 2 (inspecting generated SQL, then executing db:migrate)
- **Issue 1:** drizzle-kit generated `CREATE TABLE submissions` with all 16 columns instead of 8 `ALTER TABLE ADD COLUMN` statements (expected — first run has no prior snapshot)
- **Issue 2:** Initial fix used `-->statement-breakpoint` (no space) instead of `--> statement-breakpoint` (with space), causing the entire file to be run as one statement
- **Fix:** Manually replaced SQL content with 8 ALTER TABLE statements; corrected breakpoint format to `--> statement-breakpoint` matching drizzle-kit's BREAKPOINT constant
- **Files modified:** drizzle/0000_square_swordsman.sql
- **Verification:** `npm run db:migrate` succeeded; PRAGMA table_info shows all 17 columns; lead_status='new' for existing rows
- **Committed in:** `843c702` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking — native module rebuild; 1 bug — SQL format correction)
**Impact on plan:** Both fixes were necessary and anticipated in RESEARCH.md as "Pitfall 1". No scope creep.

## Issues Encountered
- The plan's `must_haves` stated "16 total columns (8 existing + 8 new)" but the original schema had 9 columns (id, name, email, company, message, ip, created_at, read, rate_limited), not 8. Result is 17 columns total — correct behavior, documentation error in plan.
- drizzle-kit `generate` BREAKPOINT constant is `--> statement-breakpoint\n` with a space; SQL files must match exactly for `readMigrationFiles` to split correctly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 8 new columns available in submissions table for Phase 6 (Admin Dashboard) and beyond
- Migration workflow established and verified — future migrations follow the same generate+inspect+migrate pattern
- WAL mode will activate on first app connection after deploy
- drizzle/meta/ snapshot ready for future `db:generate` diff detection

---
*Phase: 05-database-foundation*
*Completed: 2026-03-12*
