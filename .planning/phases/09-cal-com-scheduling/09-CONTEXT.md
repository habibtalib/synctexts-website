# Phase 9: Cal.com Scheduling - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Embed a Cal.com booking widget in the contact form success panel so visitors can book a discovery call immediately after submitting the form. Prefill name and email from the submission. Create a webhook endpoint to receive booking notifications from Cal.com and link them to lead records in SQLite. Requires a DB migration to add booking columns.

</domain>

<decisions>
## Implementation Decisions

### Embed Placement & Trigger
- Cal.com inline embed replaces the current "Book a Discovery Call" link button in the success panel
- Embed appears ONLY after form submission — no standalone booking entry point
- Visitor books without leaving the page (embedded, not external link)
- Cal.com event type slug: `synctexts/discovery` (hardcoded, not env var)
- Keep `PUBLIC_CAL_URL` env var as fallback in contact-form.ts but default to `synctexts/discovery`

### Prefill & Data Handoff
- Use Cal.com's JavaScript embed API for prefilling: `Cal('ui', {prefill: {name, email}})`
- Pass only name and email from the just-submitted form data (still in memory from submission)
- Match bookings to leads by email address — no lead_id passed via notes field
- Email is the dedup key (consistent with HubSpot upsert-by-email pattern from Phase 7)

### Webhook & Lead Linking
- New API endpoint: `POST /api/cal-webhook` receives Cal.com `BOOKING_CREATED` events
- Secured via shared secret in webhook header — env var: `CAL_WEBHOOK_SECRET`
- Match booking to lead by email address lookup in submissions table
- If no matching lead found: log warning and skip (booking still exists in Cal.com)
- On match: update lead record with `cal_booking_uid` and `cal_scheduled_at`
- New nullable DB columns: `cal_booking_uid` (text) and `cal_scheduled_at` (text) on submissions table
- DB migration via `drizzle-kit generate` + `drizzle-kit migrate` (established Phase 5 workflow)

### Embed Loading & Performance
- Cal.com embed script loaded dynamically ONLY when success panel renders (after form submission)
- No Cal.com JS on initial page load — keeps the contact form fast
- Script injected via DOM manipulation in contact-form.ts after successful submission

### View Transitions & Lifecycle
- Navigating away and back to contact shows a fresh empty form (sessionStorage already cleared on submission)
- No Cal.com embed visible on return since it only exists in the success panel DOM
- Cal.com embed re-init handled by `astro:page-load` event listener pattern (same as form initialization)
- If embed script was already loaded globally, re-use it; otherwise inject fresh

### Claude's Discretion
- Cal.com embed container sizing and responsive behavior within success panel
- Exact Cal.com theme configuration parameters (dark theme, indigo accent)
- Webhook payload parsing and field extraction
- Error handling for Cal.com embed load failures
- Whether to show a loading spinner while Cal.com embed initializes

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cal.com Embed
- Cal.com embed documentation (external) — JavaScript embed API, prefill config, theme options, postMessage events

### Database & Migration
- `src/db/schema.ts` — Current submissions table schema, add new columns here
- `.planning/phases/05-database-foundation/05-CONTEXT.md` — Migration workflow (generate + migrate, never push)

### Contact Form Integration
- `src/scripts/contact-form.ts` — Current success panel rendering (line ~527-541), where Cal.com embed replaces the CTA link
- `src/pages/contact.astro` — Success panel CSS (`.success-panel` styles)
- `src/pages/api/contact.ts` — Contact form API endpoint for reference

### Prior Phase Decisions
- `.planning/phases/07-extended-api-hubspot/07-CONTEXT.md` — HubSpot sync patterns, shared auth helper
- `.planning/phases/08-multi-step-form-frontend/08-CONTEXT.md` — Form state machine, success panel design, View Transition patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `contact-form.ts` success panel: Already renders success HTML with Cal.com CTA link — modify to embed widget instead
- `CAL_URL` constant: Already defined with env var fallback (`import.meta.env.PUBLIC_CAL_URL ?? 'https://cal.com/synctexts/discovery'`)
- `.success-panel` CSS: Glass-styled panel with checkmark, heading, paragraph, and button — extend for embed container
- `src/lib/auth.ts`: Shared `requireBasicAuth` helper — NOT needed for webhook (uses secret, not Basic Auth)
- `src/db/schema.ts`: Drizzle schema — add `calBookingUid` and `calScheduledAt` columns

### Established Patterns
- API endpoints: `src/pages/api/*.ts` with Astro server endpoints
- DB access: Drizzle ORM with `db.select()`, `db.update()`, `db.insert()`
- Migration workflow: `drizzle-kit generate` then `drizzle-kit migrate` (never push)
- View Transitions: `astro:page-load` event listener registration
- GTM tracking: `window.dataLayer.push()` for analytics events
- Env var pattern: `import.meta.env.VAR_NAME` for Astro server/client

### Integration Points
- `src/scripts/contact-form.ts` line ~534: Success panel innerHTML — replace CTA link with Cal.com embed container
- `src/pages/api/`: New `cal-webhook.ts` endpoint
- `src/db/schema.ts`: New columns for booking data

</code_context>

<specifics>
## Specific Ideas

- The Cal.com embed should feel like a natural extension of the success panel — not a jarring iframe. Dark theme with indigo accent matching the site's color system
- Cal.com requirements doc explicitly rejects React Atoms (custom components) — standard embed is the approach
- Email-based matching keeps it simple and consistent with HubSpot dedup strategy

</specifics>

<deferred>
## Deferred Ideas

- Cal.com round-robin routing for multiple sales team members — listed as CRM-02 in v2 requirements
- Booking confirmation email from the website (Cal.com handles its own confirmations)
- Booking status display in admin dashboard — could be added in Phase 10

</deferred>

---

*Phase: 09-cal-com-scheduling*
*Context gathered: 2026-03-20*
