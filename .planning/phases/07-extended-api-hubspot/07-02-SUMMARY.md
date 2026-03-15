---
phase: 07-extended-api-hubspot
plan: 02
subsystem: api
tags: [hubspot, crm, admin, astro, drizzle]

# Dependency graph
requires:
  - phase: 07-01
    provides: syncToHubSpot() in src/lib/hubspot.ts and checkBasicAuth() in src/lib/auth.ts
provides:
  - Manual HubSpot re-sync admin API endpoint (POST /api/admin/hubspot-sync)
  - Admin dashboard sync status badges (Synced/Not Synced) per submission card
  - Inline AJAX sync button that replaces itself with badge+link on success
affects: [phase-08-contact-form-ui, phase-09-cal-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Auth-guarded POST endpoint mirroring toggle-read.ts structure with try/catch around awaited sync
    - AJAX inline update pattern: button -> loading state -> success (DOM replace) or failure (retry)
    - data-portal-id attribute on parent container for client-side URL construction

key-files:
  created:
    - src/pages/api/admin/hubspot-sync.ts
  modified:
    - src/pages/admin/index.astro

key-decisions:
  - "Manual sync endpoint awaits syncToHubSpot() (not fire-and-forget) so admin sees immediate result"
  - "On sync success, re-query DB to get updated hubspotId for returning in response"
  - "portal ID passed to JS via data-portal-id on .submissions-list container, not inline JS variable"

patterns-established:
  - "Pattern: Admin sync button AJAX flow — disable+loading -> fetch POST -> DOM replace or timed error reset"
  - "Pattern: HubSpot badge conditional — truthy hubspotId -> green Synced + View link; falsy -> grey Not Synced + button"

requirements-completed: [HS-04, SCORE-02]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 7 Plan 02: HubSpot Sync Admin UI Summary

**Auth-guarded manual re-sync endpoint with inline AJAX button that shows Synced/Not Synced badges and View in HubSpot links on admin dashboard cards**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-15T16:27:02Z
- **Completed:** 2026-03-15T16:31:00Z
- **Tasks:** 2 of 2 complete
- **Files modified:** 2

## Accomplishments
- Created `/api/admin/hubspot-sync` endpoint: auth-guarded POST that awaits sync and returns updated hubspotId
- Added Synced (green badge) / Not Synced (grey badge) to every submission card based on hubspotId column
- Added "View in HubSpot" link for synced leads (when HUBSPOT_PORTAL_ID env var is set)
- Added AJAX "Sync to HubSpot" button with loading state, success DOM-replace, and 2s failure reset

## Task Commits

Each task was committed atomically:

1. **Task 1: Create manual HubSpot sync API endpoint and add sync UI to admin** - `dc9a8d7` (feat)
2. **Task 2: Verify complete Phase 7 flow end-to-end** - Human-verify checkpoint, approved by user

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/pages/api/admin/hubspot-sync.ts` - Auth-guarded POST endpoint for manual HubSpot re-sync
- `src/pages/admin/index.astro` - Added HubSpot sync badges, button, CSS, and AJAX handler

## Decisions Made
- Manual sync endpoint awaits `syncToHubSpot()` (unlike the fire-and-forget on form submit) so admin gets immediate feedback
- On success, re-queries the DB to return the `hubspotId` in the response, enabling client-side URL construction
- Portal ID passed via `data-portal-id` on `.submissions-list` container (not hardcoded in inline script) so Astro SSR renders the value safely

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing type errors in `src/scripts/contact-form.ts` and `src/pages/portfolio/[...id].astro` were present before this plan and are out of scope. Build succeeded despite `astro check` reporting errors in those files.

## User Setup Required
None - HubSpot sync UI degrades gracefully when env vars are not set. See Phase 7 Plan 01 SUMMARY for HubSpot custom property setup instructions.

## Next Phase Readiness
- Phase 7 fully complete: contact API extended, lead scoring, HubSpot fire-and-forget sync, admin sync UI, manual re-sync all wired
- Human verified complete Phase 7 flow end-to-end and approved
- Phase 8 contact form UI can add service_type/budget/timeline fields — API already accepts them
- Manual re-sync available for leads submitted before HubSpot was configured

## Self-Check: PASSED

- `src/pages/api/admin/hubspot-sync.ts` — FOUND
- `src/pages/admin/index.astro` — FOUND
- Commit `dc9a8d7` — FOUND
- Human verification approved — CONFIRMED

---
*Phase: 07-extended-api-hubspot*
*Completed: 2026-03-15*
