# Phase 7: Extended API and HubSpot Integration - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the contact form endpoint to accept optional new fields (service_type, budget, timeline), compute and persist lead scores via `scoreLead()`, sync leads to HubSpot CRM asynchronously, extract a shared auth helper, and add manual re-sync capability from the admin dashboard. No frontend form changes — API, sync, and admin sync UX only.

</domain>

<decisions>
## Implementation Decisions

### HubSpot API Client
- Claude's discretion on client library choice (official SDK vs direct fetch)
- Graceful skip: if `HUBSPOT_TOKEN` env var is missing, sync is silently disabled — no errors, no warnings to user
- Single env var for auth: `HUBSPOT_TOKEN` (HubSpot private app access token)
- Additional env var: `HUBSPOT_PORTAL_ID` for constructing HubSpot contact links in admin
- Upsert-by-email to prevent duplicate contacts (HS-02)

### HubSpot Custom Properties
- Sync all lead data: lead_score, service_type, budget, timeline, source_page (URL), and message
- These map to HubSpot custom properties that need to be created in the HubSpot portal manually

### Sync Behavior
- Fire-and-forget Promise — call syncToHubSpot() without awaiting, runs in-process after response is sent
- Skip HubSpot sync for rate-limited submissions (same pattern as email notification skip)
- On successful sync: store `hubspot_id` and `hubspot_synced_at` in the submissions row
- On sync failure: console.error only — no separate error column or table

### Sync Status Display
- Badge based on `hubspot_id` column: NULL → "Not synced" (grey badge), set → "Synced" (green badge)
- Synced leads show a "View in HubSpot" link using URL pattern: `https://app.hubspot.com/contacts/{HUBSPOT_PORTAL_ID}/contact/{hubspot_id}`

### Manual Re-sync UX
- "Sync to HubSpot" button in submission card header row, next to "Mark as Read" button
- Button only appears when `hubspot_id` is NULL (not yet synced) — no force re-sync for already-synced leads
- Inline AJAX feedback: button shows loading state → success (becomes Synced badge) or error (brief error text) — same pattern as toggle-read
- New API endpoint for manual sync (admin-authenticated)

### New Form Fields in API
- service_type, budget, timeline accepted optionally — if missing, stored as NULL and scored with 0 points for those signals
- Backwards compatible: current form (Phase 8 not yet built) continues working unchanged
- Validate against allowed values when present:
  - service_type: `web_dev | devops | analytics`
  - budget: `under_5k | 5k_15k | 15k_50k | 50k_plus`
  - timeline: `asap | 1_3_months | 3_6_months | exploring`
- Reject invalid enum values with 400 error
- Validation added to existing `validation.ts` (extend `validateContact()`)

### API Response
- Success response unchanged: `{success: true, message: "..."}` — do not expose lead score to visitors

### Shared Auth Helper (INFRA-03)
- Extract `checkBasicAuth` from `toggle-read.ts` into a shared utility (e.g., `src/lib/auth.ts`)
- All admin API endpoints use the shared helper consistently
- Admin page (`index.astro`) continues using inline auth check (Astro page, not API route)

### Claude's Discretion
- HubSpot client library choice (SDK vs fetch)
- HubSpot API error handling details and retry logic (if any)
- Exact sync function structure and module organization
- Auth helper file location and export pattern
- Badge CSS for HubSpot sync status (follows existing badge pattern)

</decisions>

<specifics>
## Specific Ideas

- Follow the existing email notification pattern in contact.ts for fire-and-forget sync (try/catch around async call, console.error on failure, never block response)
- HubSpot sync status badge should match the existing badge styling (pill-shaped, semi-transparent backgrounds, colored borders) from score badges and rate-limited badge

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/scoring.ts`: `scoreLead()` ready to call — returns `{score, tier}` from `LeadPayload`
- `src/lib/scoring-config.ts`: Signal weights and tier thresholds already defined
- `src/lib/validation.ts`: `validateContact()` handles name/email/company/message — extend for new fields
- `src/pages/api/admin/toggle-read.ts`: Contains inline `checkBasicAuth` — extract to shared helper
- `src/db/schema.ts`: `hubspotId`, `hubspotSyncedAt`, `leadScore`, `serviceType`, `budget`, `timeline` columns already exist

### Established Patterns
- Fire-and-forget async: email notification in contact.ts uses try/catch without blocking response
- Admin badges: pill-shaped with `border-radius: 50px`, semi-transparent backgrounds, colored borders
- AJAX admin actions: toggle-read uses fetch POST → inline UI update without page reload
- API auth: `checkBasicAuth()` reads Authorization header, compares against `ADMIN_USER`/`ADMIN_PASS` env vars

### Integration Points
- `src/pages/api/contact.ts`: Main integration point — add scoring, new field persistence, and HubSpot sync call
- `src/pages/admin/index.astro`: Add HubSpot sync badge and manual sync button to submission cards
- New API endpoint needed: `src/pages/api/admin/hubspot-sync.ts` for manual re-sync
- New lib module: `src/lib/hubspot.ts` for sync logic
- New lib module: `src/lib/auth.ts` for shared auth helper

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-extended-api-hubspot*
*Context gathered: 2026-03-15*
