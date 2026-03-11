# Project Research Summary

**Project:** SyncTexts Agency Website — v1.1 Lead Conversion Engine
**Domain:** Agency marketing site with CRM-grade lead capture and scheduling
**Researched:** 2026-03-11
**Confidence:** HIGH

## Executive Summary

SyncTexts v1.1 is a lead conversion upgrade layered onto an existing Astro 5 + SQLite + Drizzle stack. The v1.0 baseline (contact form, admin page, GTM/GA4, Resend email, Docker/Caddy) is already shipped. The v1.1 scope replaces the single-step contact form with a service-branched multi-step wizard, adds embedded Cal.com scheduling, implements rule-based lead scoring, upgrades the admin dashboard, and syncs qualified leads to HubSpot CRM. The recommended approach builds exclusively on the existing stack — no new frameworks, no additional UI libraries. Astro Actions + vanilla TypeScript handles multi-step form logic; `@hubspot/api-client` is the only new npm dependency; Cal.com ships as a CDN snippet with no npm install required.

The architecture extends rather than replaces what exists. All five v1.1 features share one schema migration, one extended API endpoint, and two new server lib files. The multi-step form is the dependency anchor: lead scoring, HubSpot sync, and Cal.com prefill all require the richer data captured by the new form. The recommended build sequence is schema first, scoring second, API endpoint third, form frontend fourth, Cal.com fifth, dashboard last — matching the dependency graph exactly and avoiding rework.

The top risk is data loss from running `drizzle-kit push` on the production database, which can silently wipe existing leads during schema changes. A close second is HubSpot sync blocking form submission — turning a CRM outage into a lead capture failure. Both risks are well-understood with clear, low-effort preventions. GDPR compliance for behavioral scoring and Cal.com booking-to-lead linkage are the two most easily overlooked correctness requirements and must be designed in from the start, not retrofitted.

---

## Key Findings

### Recommended Stack

The v1.1 stack requires one new npm package. Everything else is already in the project. Astro Actions (stable in Astro 5.x) handle multi-step form validation server-side via `z.discriminatedUnion()` per step — no React Hook Form or framework island needed. Cal.com integrates via a CDN IIFE snippet in `BaseLayout.astro`, configured with `theme: "dark"` to match the glassmorphism design. HubSpot sync uses the official `@hubspot/api-client` SDK (v13.4.0) for its built-in TypeScript types, auth header management, and retry handling. Lead scoring is a pure TypeScript function with no external dependency. The admin dashboard is a server-rendered Astro SSR page with URL-param-driven Drizzle queries — no client-side data grid library required.

**Core technologies:**
- **Astro Actions (built-in):** Server-side multi-step form handling with type-safe Zod validation — no new library required
- **Vanilla TypeScript (existing):** Client-side step state machine, sessionStorage persistence, behavioral signal tracking — consistent with the existing `contact-form.ts` pattern
- **Cal.com CDN embed:** Inline or popup scheduling widget with dark theme support — zero npm install, pure script tag
- **`@hubspot/api-client` v13.4.0:** HubSpot CRM contact upsert — only new npm dependency in v1.1
- **Custom `lead-scoring.ts` module:** Pure function, no external deps, server-side only — testable in isolation
- **Astro SSR pages (existing adapter):** Admin dashboard with Drizzle queries driven by URL params — no SPA or data grid library needed

**What NOT to use:** React Hook Form / Formik (requires React island), `@calcom/embed-react` (same problem), HubSpot Forms SDK (loses custom UX and dark theme), Prisma (already using Drizzle), Redis for form state (overkill for a 3-step form), TanStack Table / AG Grid (server-side rendering handles all required functionality without the JS payload).

### Expected Features

The feature dependency graph makes ordering unambiguous: the multi-step form is the foundation that all other features depend on. Lead scoring needs the service type, budget, and timeline fields from the new form. HubSpot sync is meaningless without those signals. Cal.com prefill and the post-form CTA require the form success state to exist first.

**Must have (table stakes — v1.1 core, all P1):**
- Multi-step form with service-specific branching (3 paths: web dev, DevOps, analytics) — replaces the single-step form
- Progress indicator ("Step X of Y") and back navigation — without these, multi-step degrades UX rather than improving it
- Client-side validation per step with inline error messages on blur and Next click
- sessionStorage persistence for form state — survives refresh and browser back (built-in, not an enhancement)
- Explicit lead scoring on submission: service type, budget, timeline, company present, message length — stored in SQLite
- Upgraded admin dashboard: score badge with color tiers (cold/warm/hot), status dropdown (`new/contacted/qualified/proposal_sent/won/lost`), notes field, sort by score
- Cal.com inline embed / popup CTA on contact page with dark theme and name/email prefill from form data
- HubSpot contact upsert (async, fire-and-forget) with score and service type as custom properties

**Should have (P2 — v1.1 if time allows):**
- Dashboard sorting by score and filtering by status/service via URL params
- Cal.com prefill passing collected name and email to the booking widget
- HubSpot custom properties mapped: `synctexts_score`, `synctexts_service`, `synctexts_budget`, `synctexts_source`
- Cal.com booking linked to lead record via webhook + `lead_id` prefill (prevents data silo between booking and form submission)

**Defer (v2+):**
- Behavioral scoring signals — add only after real lead data shows whether page-visit weighting is predictive; requires GDPR consent gate
- Multi-admin auth — trigger: second team member needs dashboard access
- Form analytics per step via GTM — needs 50+ form starts to be meaningful
- HubSpot retry queue — add if sync failure rate exceeds 5%; manual "Sync Now" button is sufficient initially
- Cal.com round-robin routing — trigger: multiple sales team members doing calls

**Anti-features (do not build):**
- AI-powered lead scoring — no training data volume; rule-based scoring with documented weights is transparent and tunable
- Real-time HubSpot webhook bidirectional sync — massively overengineered for an agency's lead volume
- Automated email sequences from the dashboard — that is HubSpot Workflows' job; building it in a custom admin page duplicates CRM functionality badly
- Form A/B testing — premature at current traffic levels; instrument with GTM first, analyze drop-off manually after 4-6 weeks

### Architecture Approach

The v1.1 architecture is additive: extend existing files, add two new server lib modules, run one schema migration. No new infrastructure, no new services, no new deployment complexity. The `submissions` table gains 8 new nullable columns via Drizzle `generate` + `migrate` (never `push`). The contact API endpoint is extended with backward-compatible nullable fields rather than replaced with a v2 endpoint. Cal.com is purely client-side — one script tag in `BaseLayout.astro`, zero server changes. HubSpot calls run server-side only; the access token never appears in a client bundle.

**Major components:**
1. **`src/scripts/multi-step-form.ts` (NEW):** Client-side step state machine — manages `currentStep`, `formData`, `serviceType`; persists to sessionStorage on every step transition; restores state on page load; uses `history.pushState(?step=N)` so browser back navigates to the previous step rather than the previous page
2. **`src/lib/lead-scoring.ts` (NEW):** Pure scoring function with no I/O — computes 0-100 score from form signals; server-side only; no dependencies; unit-testable without a database or HTTP context
3. **`src/lib/hubspot.ts` (NEW):** HubSpot API wrapper — try POST, catch 409, PATCH using `hs_object_id` from the 409 response body; normalizes email to lowercase before sending; returns HubSpot contact ID for storage in SQLite
4. **`src/pages/api/contact.ts` (MODIFY):** Extended endpoint — validates new fields, persists to SQLite, calls `scoreLead()`, calls `upsertContact()` in a fire-and-forget try/catch, calls Resend; returns success after DB write regardless of HubSpot outcome
5. **`src/pages/admin/index.astro` (MODIFY):** Upgraded dashboard — score badges with color tiers, status dropdown, notes textarea, URL-param-driven filtering, `LIMIT`/`OFFSET` pagination, direct HubSpot contact record link per lead
6. **`src/db/schema.ts` (MODIFY):** Additive migration — 8 new nullable columns on `submissions`; no column drops or renames; WAL mode and busy_timeout configured at DB init

### Critical Pitfalls

1. **`drizzle-kit push` on production destroys lead data** — SQLite has no `ALTER COLUMN`; push can silently rebuild tables and wipe rows. Prevention: switch to `generate` + `migrate` immediately; back up `data/submissions.db` before every migration; test against a copy of the production DB dump; remove `push` from production scripts entirely.

2. **HubSpot sync blocking form submission** — awaiting `upsertContact()` in the form handler means a HubSpot outage returns 500 errors and loses leads. Prevention: fire-and-forget with try/catch; return success after DB write; store `hubspot_synced_at IS NULL` as the retry flag; provide a manual "Sync" button in the dashboard.

3. **Multi-step form state lost on browser back or refresh** — in-memory JS state has zero durability; mobile swipe-back gestures trigger this constantly in testing. Prevention: persist all step state to sessionStorage after every transition; use `history.pushState(?step=N)` so browser back navigates within the form; restore from sessionStorage on page load; clear on successful submission.

4. **HubSpot duplicate contacts from 409 mishandling** — `POST /crm/v3/objects/contacts` returns 409 if the email already exists; catching the error silently loses the sync or creates duplicates on retry. Prevention: try POST, catch 409, extract `hs_object_id` from the 409 response body, PATCH that ID; normalize email to lowercase; store `hubspot_id` locally for future syncs.

5. **Cal.com embed breaks silently after Astro page navigation** — the `Cal()` global does not survive View Transitions page swaps; the booking div renders empty with no console error. Prevention: wrap Cal init in `document.addEventListener('astro:page-load', ...)` with an `is:inline` script tag; manually test by navigating away and back to the scheduling page before considering it done.

6. **Cal.com bookings not linked to lead records** — form submission and booking land in separate systems with no connection; the admin cannot see which leads booked calls. Prevention: pass `lead_id` as a `notes` prefill value in the Cal embed init; configure a Cal.com `BOOKING_CREATED` webhook calling `/api/webhooks/cal`; write `cal_booking_uid` and `scheduled_at` to the lead record; verify the webhook with `X-Cal-Signature-256`.

7. **Behavioral scoring without GDPR consent gate** — tracking page visits and session engagement is personal data processing; Safari ITP and Firefox ETP also randomize cross-session identifiers. Prevention: route all behavioral signals through the existing GTM consent gate; use sessionStorage only (not localStorage or persistent cookies) for in-session tracking; keep form-derived signals (voluntary submission data) separate from behavioral signals in the scoring config.

8. **New admin API endpoints without auth check** — copy-paste under deadline pressure produces endpoints that miss `Authorization: Basic` validation. Prevention: create `src/lib/auth.ts` with a `requireBasicAuth(request)` helper as the first deliverable in the API endpoint phase; call it as the first line of every new `/api/admin/*` handler.

---

## Implications for Roadmap

Based on the dependency graph from ARCHITECTURE.md and the pitfall-to-phase mapping from PITFALLS.md, the build order is fixed. Nothing can be safely reordered without either wasting implementation effort or risking production data integrity.

### Phase 1: Database Foundation

**Rationale:** Everything downstream depends on the schema existing. Running migrations incorrectly here destroys real production lead data — this is the highest-stakes task of the entire milestone. Doing it first, carefully, de-risks everything else.
**Delivers:** Extended `submissions` schema with 8 new columns (`service_type`, `budget`, `timeline`, `lead_score`, `lead_status`, `notes`, `hubspot_id`, `hubspot_synced_at`); WAL mode (`journal_mode = WAL`) and `busy_timeout = 5000` configured in `src/db/index.ts`; additive migration tested against a production DB dump copy before deployment; `drizzle-kit push` removed from production scripts
**Addresses:** Schema prerequisites for multi-step form fields, scoring, status workflow, HubSpot sync tracking, and Cal.com booking linkage
**Avoids:** Pitfall 1 (drizzle push destroys production data), Pitfall 2 (SQLite BUSY errors from concurrent dashboard + form writes without WAL mode)

### Phase 2: Lead Scoring Engine

**Rationale:** The scoring function is a pure TypeScript module with no I/O, no network calls, and no UI dependencies. Building it second allows it to be unit-tested in isolation before anything integrates it. It is the simplest server-side deliverable in the milestone.
**Delivers:** `src/lib/lead-scoring.ts` — pure `scoreLead(input): number` function (0-100 scale); `SCORING_CONFIG` object with documented weights (budget: 0-40pts, timeline: 0-30pts, service: 10pts each, company: 0-10pts, message length: 0-10pts); score tier thresholds (0-30 cold, 31-60 warm, 61-100 hot)
**Uses:** No new stack elements — pure TypeScript, no new dependencies
**Avoids:** Pitfall 7 (behavioral tracking without consent — the scoring config separates form-derived signals from behavioral signals by design, so behavioral scoring can be added later with a proper consent gate without restructuring the function)

### Phase 3: Extended API Endpoint and HubSpot Integration

**Rationale:** The API endpoint is the server integration point for scoring (Phase 2), the new form (Phase 4), and HubSpot CRM. It must exist before the form frontend can submit real data. The HubSpot lib and the shared auth helper are both built here because they are needed by the endpoint and by all future admin routes.
**Delivers:** Extended `POST /api/contact` accepting new fields + triggering `scoreLead()` + firing `upsertContact()` in a fire-and-forget try/catch; `src/lib/hubspot.ts` with the try-POST/catch-409/PATCH upsert-by-email pattern; `src/lib/auth.ts` with a `requireBasicAuth(request)` helper for all admin endpoints; `HUBSPOT_TOKEN` environment variable documented in `.env.example`
**Uses:** `@hubspot/api-client` v13.4.0 — only new npm install in v1.1
**Avoids:** Pitfall 2 (HubSpot sync blocking form submission — fire-and-forget pattern), Pitfall 4 (HubSpot 409 duplicate contacts — upsert-by-email pattern), Pitfall 5 (HubSpot token in client bundle — server-only access), Pitfall 8 (missing auth on admin endpoints — `requireBasicAuth` helper created here before any admin routes are added)

### Phase 4: Multi-Step Form Frontend

**Rationale:** The form is the primary user-facing change in v1.1 and the feature that all others either depend on or are enhanced by. It is built after the backend endpoint is ready so that step-by-step submission can be tested against a real endpoint from day one.
**Delivers:** `src/scripts/multi-step-form.ts` step state machine with sessionStorage persistence and `history.pushState(?step=N)` per step; `src/components/forms/StepIndicator.astro` and `ServiceSelector.astro`; 3 service-branched paths (web dev, DevOps, analytics) with shared closing step for budget/timeline/contact; inline per-step validation (on blur and Next click); `src/scripts/lead-signals.ts` behavioral tracker (sessionStorage only, gated on existing GTM consent state); step transition animations consistent with existing `.reveal` pattern
**Implements:** Multi-step form UX contract (progress indicator, back navigation, state persistence); service-specific question branching; Cal.com post-submission CTA wiring (button shown on success state)
**Avoids:** Pitfall 3 (form state lost on back/refresh — sessionStorage + history.pushState built in from the first step), Pitfall 6 (missing back navigation), Pitfall 7 (behavioral tracking without consent — sessionStorage only, GTM consent gate)

### Phase 5: Cal.com Scheduling Integration

**Rationale:** Cal.com requires the form success state (Phase 4) to show the post-submission CTA and needs `lead_id` for prefill. It is the only genuinely client-side-only feature in v1.1 and is fast to ship once the form is complete. The Cal.com webhook endpoint adds a non-trivial server piece that benefits from having the `requireBasicAuth` helper and the extended schema already in place (from Phases 1 and 3).
**Delivers:** Cal.com CDN snippet in `BaseLayout.astro` using `is:inline` and `document.addEventListener('astro:page-load', ...)` to survive Astro page transitions; popup booking CTA on form success state with name/email prefill; `/api/webhooks/cal` endpoint linking `BOOKING_CREATED` events to lead records via `lead_id` in booking notes; `cal_booking_uid` and `scheduled_at` values written to SQLite (columns from Phase 1 schema)
**Uses:** Cal.com CDN embed (no npm install); `Cal()` API with `config: { theme: "dark" }` and branding color `#6366f1`
**Avoids:** Pitfall 3 (embed breaks after Astro page navigation — `astro:page-load` listener), Pitfall 8 (bookings not linked to lead records — webhook + `lead_id` prefill round-trip)

### Phase 6: Lead Management Dashboard

**Rationale:** The dashboard is the final phase because it is purely a read/write interface on top of data that phases 1-5 populate. It requires score data (Phase 3), status and notes columns (Phase 1), and HubSpot sync status (Phase 3) before it has anything meaningful to display. Building it last guarantees it reflects the full v1.1 data model.
**Delivers:** Upgraded `src/pages/admin/index.astro` with color-coded score badges, status dropdown with full `new/contacted/qualified/proposal_sent/won/lost` workflow, notes textarea, sort by score descending as the default, URL-param-driven filtering (`?status=new&minScore=50`), `LIMIT`/`OFFSET` pagination from the start; `update-status.ts`, `update-notes.ts`, `sync-hubspot.ts` admin API routes (all guarded with `requireBasicAuth`); direct link to HubSpot contact record per lead; relative date display ("3 days ago") with absolute on hover
**Avoids:** Pitfall 8 (missing auth on admin endpoints — `requireBasicAuth` applied consistently); dashboard performance trap at scale (pagination built in from day one, never load unbounded result sets)

### Phase Ordering Rationale

- Schema is first because every other feature writes to new columns; building anything else first means writing against a temporary schema and migrating later under more risk
- Scoring is second because it is the simplest module, has no external dependencies, and benefits from being isolated and unit-tested before the API endpoint integrates it
- The API endpoint is third because the form frontend has nowhere to submit richer data until the endpoint accepts the new fields; Cal.com needs the `lead_id` that only the endpoint creates
- The form frontend is fourth — highest user visibility, but dependent on the endpoint being ready for real end-to-end testing
- Cal.com is fifth — fast to ship, requires form success state to exist, and the webhook adds a server component that benefits from the auth helper and extended schema already being in place
- The dashboard is last because it is purely additive on top of data the earlier phases create; it unblocks nothing else and its feature set depends on all previous data being populated

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 5 (Cal.com webhook):** The `BOOKING_CREATED` webhook payload structure, the `X-Cal-Signature-256` verification algorithm, and the `lead_id` round-trip through Cal.com prefill notes are documented but sparse. Verify the exact payload shape and signature method against Cal.com's current webhook docs before implementing. Budget 1-2 hours for debugging the signature verification.
- **Phase 3 (HubSpot upsert):** The try-POST / catch-409 / PATCH pattern is the documented workaround for a known bug in the batch upsert endpoint. Verify whether this is still the recommended approach for `@hubspot/api-client` v13.4.0 specifically before committing to the implementation.

Phases with standard patterns (skip research-phase):

- **Phase 1 (Database):** Drizzle `generate` + `migrate` is well-documented in official Drizzle docs; additive nullable column additions to SQLite via Drizzle are straightforward; WAL mode pragma is a one-liner with no ambiguity
- **Phase 2 (Scoring):** Pure TypeScript function with no external integration; no novel patterns; no research needed
- **Phase 4 (Multi-step form):** sessionStorage persistence, `history.pushState` per step, and Astro Actions discriminated union are all well-documented patterns; the existing `contact-form.ts` establishes the vanilla TypeScript approach used throughout
- **Phase 6 (Dashboard):** Astro SSR + Drizzle URL-param-driven filtering is a standard pattern with clear Astro documentation; no novel integration points

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Astro Actions and Drizzle are from official docs; HubSpot SDK is official GitHub; Cal.com snippet is documented but with sparse detail on advanced usage (MEDIUM for Cal.com specifically) |
| Features | HIGH | Feature priorities and dependency graph are well-reasoned from industry UX research (Smashing Magazine, Baymard) and HubSpot API documentation |
| Architecture | HIGH | Architecture derived by reading the actual existing codebase — component boundaries and data flows are grounded in what is already there, not speculative |
| Pitfalls | HIGH | Most pitfalls sourced from real GitHub issues (Cal.com #25082, HubSpot Community duplicate-email thread) and official Drizzle push-vs-migrate documentation |

**Overall confidence:** HIGH

### Gaps to Address

- **Cal.com webhook payload structure:** The exact JSON shape of `BOOKING_CREATED` events and the `X-Cal-Signature-256` verification algorithm are documented but sparse. Verify against Cal.com's current webhook docs before implementing Phase 5. The alternative fallback — matching bookings to leads by attendee email rather than `lead_id` — should be kept ready if the prefill-notes round-trip proves unreliable.
- **HubSpot batch upsert bug status:** The batch upsert endpoint (`/crm/v3/objects/contacts/batch/upsert`) had documented bugs where it ignores all properties except email when creating new contacts. Verify whether the individual POST-then-PATCH workaround is still necessary for `@hubspot/api-client` v13.4.0 before Phase 3 implementation.
- **GDPR legitimate interest for behavioral scoring:** Behavioral scoring on a B2B agency site likely qualifies under legitimate interest, but a balancing test must be documented before enabling any cross-session tracking. Flag for a documented self-assessment before adding behavioral signals beyond the in-session sessionStorage approach.
- **Cal.com cloud vs. self-hosted decision:** Research assumes Cal.com cloud (free tier). Self-hosting would require a separate Docker Compose service, Postgres, and Redis — significant ops overhead not covered in this research. Treat cloud Cal.com as the baseline; revisit only if white-labeling or full data ownership becomes a requirement.
- **Behavioral scoring validation timing:** The FEATURES.md research recommends deferring behavioral scoring enhancements until real lead data is available to validate whether page-visit weighting is actually predictive. Plan a checkpoint after 4-6 weeks of v1.1 data before committing Phase 2 behavioral enhancements.

---

## Sources

### Primary (HIGH confidence)
- Astro Actions Docs — `z.discriminatedUnion()` for multi-step routing, stable in Astro 5.x
- HubSpot Node.js API Client (GitHub) — Official SDK v13.4.0, Private App token authentication
- HubSpot Private Apps Docs — Auth method, required scopes, API key sunset (Nov 2022)
- HubSpot CRM Contacts API v3 Guide — Contact create/upsert, 409 error handling
- Drizzle ORM push vs. migrate documentation — `push` is dev-only; `generate`+`migrate` for production
- Drizzle ORM migrations documentation — additive migration patterns for SQLite
- Existing codebase (read directly) — `src/pages/api/contact.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/scripts/contact-form.ts`, `src/pages/admin/index.astro`

### Secondary (MEDIUM confidence)
- Cal.com Embed Docs — `Cal("inline", {...})` vanilla JS API (docs sparse, supplemented by GitHub discussions)
- Cal.com GitHub Issue #25082 — Cal embed fails after page navigation (`Cal is not defined`)
- Cal.com Docs — Webhooks, `BOOKING_CREATED` event, `X-Cal-Signature-256` verification
- HubSpot Community — v3 Contact Create API throws 409 on duplicate email; recommended upsert workaround
- Smashing Magazine — Creating an Effective Multi-Step Form (Dec 2024)
- Baymard Institute — Back button UX; 59% of sites fail this expectation
- SQLite WAL mode docs — concurrent read/write, `busy_timeout` configuration
- GDPR consent for behavioral tracking (Reform.app, Forrester)
- Medium — Four Ways to Handle SQLite Concurrency

### Tertiary (needs validation before implementation)
- Cal.com `lead_id` in prefill notes — workaround, not a documented Cal.com feature for external record linking; test in a sandbox booking before committing to this approach
- HubSpot batch upsert endpoint — bug reports suggest individual POST-then-PATCH is more reliable; verify current status against `@hubspot/api-client` v13.4.0 release notes

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
