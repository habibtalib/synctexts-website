---
phase: 07-extended-api-hubspot
plan: 01
subsystem: api
tags: [hubspot, crm, validation, auth, drizzle, sqlite, astro, typescript]

# Dependency graph
requires:
  - phase: 06-lead-scoring-engine
    provides: scoreLead() function and LeadPayload interface in src/lib/scoring.ts
  - phase: 05-database-foundation
    provides: submissions schema with hubspotId, hubspotSyncedAt, leadScore, serviceType, budget, timeline columns
provides:
  - Shared checkBasicAuth helper in src/lib/auth.ts for all admin API routes
  - syncToHubSpot() in src/lib/hubspot.ts using POST-then-PATCH upsert-by-email
  - Extended validateContact() with optional enum validation for service_type, budget, timeline
  - Extended contact.ts with lead scoring, new field persistence, and fire-and-forget HubSpot sync
affects: [08-contact-form-ui, 09-admin-dashboard-hubspot, admin API endpoints]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - POST-then-PATCH upsert-by-email for HubSpot CRM contacts (no atomic upsert in v3 API)
    - Graceful env var guard — early return when HUBSPOT_TOKEN missing, no errors surfaced
    - Fire-and-forget async with .catch() — HubSpot sync never blocks form response
    - Conditional properties object — only include non-null values to avoid HubSpot API rejections
    - Shared auth helper pattern — extract inline checkBasicAuth to src/lib/auth.ts for reuse

key-files:
  created:
    - src/lib/auth.ts
    - src/lib/hubspot.ts
  modified:
    - src/lib/validation.ts
    - src/pages/api/contact.ts
    - src/pages/api/admin/toggle-read.ts

key-decisions:
  - "Native fetch used for HubSpot API calls — @hubspot/api-client SDK is 20.8 MB for 2-3 endpoints, not worth the dependency"
  - "POST-then-PATCH upsert-by-email chosen over batch endpoint — batch has community-reported edge cases with email as idProperty"
  - "HubSpot sync placed inside !rateLimited guard — mirrors email notification skip pattern"
  - "leadScore=0 stored (not NULL) even when new fields absent — scoreLead() returns 0 for message-only submissions"

patterns-established:
  - "Fire-and-forget: syncFn().catch(console.error) — do NOT await, never block response"
  - "Graceful env guard: if (!import.meta.env.TOKEN) return; — silent skip, no throw"
  - "Shared auth: import { checkBasicAuth } from '../../../lib/auth' in all admin API routes"
  - "Enum validation: check only when field !== undefined && !== null — optional fields OK to omit"

requirements-completed: [HS-01, HS-02, HS-03, HS-05, INFRA-03]

# Metrics
duration: 1min
completed: 2026-03-15
---

# Phase 07 Plan 01: Extended API and HubSpot Integration Summary

**HubSpot CRM sync wired to contact endpoint via fire-and-forget POST-then-PATCH upsert-by-email with lead scoring and shared auth helper extraction**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-15T08:23:01Z
- **Completed:** 2026-03-15T08:24:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `src/lib/auth.ts` with shared `checkBasicAuth` helper; removed inline duplicate from `toggle-read.ts`
- Extended `validateContact()` with exported enum constants and optional enum validation for `service_type`, `budget`, `timeline` — backwards compatible, rejects invalid values with 400
- Created `src/lib/hubspot.ts` with `syncToHubSpot()` — POST-then-PATCH upsert-by-email, graceful HUBSPOT_TOKEN guard, writes `hubspot_id` and `hubspot_synced_at` back to SQLite on success
- Extended `contact.ts` to extract optional fields, compute lead score via `scoreLead()`, persist all new columns, and fire-and-forget HubSpot sync after DB insert

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract shared auth helper and extend validation** - `a2ca926` (feat)
2. **Task 2: Create HubSpot sync module and wire contact.ts** - `8f4b687` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `src/lib/auth.ts` — Shared `checkBasicAuth(request)` helper for all admin API routes
- `src/lib/hubspot.ts` — `syncToHubSpot()` with HubSpot v3 Contacts API, upsert-by-email, SQLite write-back
- `src/lib/validation.ts` — Added enum constants and optional enum checks for service_type, budget, timeline
- `src/pages/api/contact.ts` — Extended with optional field extraction, lead scoring, new field persistence, fire-and-forget HubSpot sync
- `src/pages/api/admin/toggle-read.ts` — Replaced inline `checkBasicAuth` with import from `src/lib/auth`

## Decisions Made

- Native `fetch` used for HubSpot API calls — `@hubspot/api-client` SDK weighs 20.8 MB for 2-3 endpoints
- POST-then-PATCH upsert-by-email: batch endpoint has reported edge cases with email as `idProperty`; single-contact POST-then-PATCH is more reliable
- HubSpot sync inside `!rateLimited` guard — mirrors existing email notification skip pattern
- `leadScore` stored as computed integer (may be 0 when optional fields absent) — `scoreLead()` returns 0 for message-only subs

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration before end-to-end testing.**

### Environment Variables

Add to `.env`:
```
HUBSPOT_TOKEN=your-private-app-access-token
HUBSPOT_PORTAL_ID=your-hub-id
```

- `HUBSPOT_TOKEN`: HubSpot -> Settings -> Integrations -> Private Apps -> Create private app -> Access token
- `HUBSPOT_PORTAL_ID`: HubSpot -> Settings -> Account Management -> Account Setup -> Hub ID (top-right corner of HubSpot nav)

### HubSpot Custom Properties

Create these in HubSpot -> Settings -> Data Management -> Properties -> Contact properties -> Create property:

| Internal name             | Label              | Type             |
|---------------------------|--------------------|------------------|
| lead_score                | Lead Score         | Number           |
| synctexts_service_type    | Service Type       | Single-line text |
| synctexts_budget          | Budget             | Single-line text |
| synctexts_timeline        | Timeline           | Single-line text |
| synctexts_source_page     | Source Page        | Single-line text |
| synctexts_message         | Message            | Multi-line text  |

### Verification

After configuration, submit the contact form and verify:
1. SQLite row has `lead_score`, `service_type`, `budget`, `timeline` populated
2. HubSpot portal shows new contact with custom properties
3. Re-submit with same email — contact updated, not duplicated
4. Remove `HUBSPOT_TOKEN` from `.env` — form submission still returns 200

## Next Phase Readiness

- Contact API fully extended: new fields, scoring, HubSpot sync all wired
- Shared auth helper ready for any additional admin API endpoints (e.g., manual re-sync endpoint in next plan)
- Schema columns `hubspotId`, `hubspotSyncedAt` will be populated by live HubSpot syncs
- Admin dashboard (Phase 8) can now display HubSpot sync badges using `hubspot_id` column

---
*Phase: 07-extended-api-hubspot*
*Completed: 2026-03-15*
