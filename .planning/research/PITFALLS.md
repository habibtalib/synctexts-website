# Pitfalls Research

**Domain:** Lead conversion features on an Astro 5 + SQLite agency site (v1.1 — multi-step forms, Cal.com scheduling, lead scoring, dashboard upgrade, HubSpot CRM sync)
**Researched:** 2026-03-11
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: Drizzle `push` Destroys Existing Production Lead Data

**What goes wrong:**
The project currently uses Drizzle ORM with a SQLite database that holds real contact form submissions. The v1.1 milestone requires schema changes: adding columns for lead score, service type, status, notes, budget, and possibly new tables (lead_events for behavioral signals). Developers who used `drizzle-kit push` during v1.0 development may instinctively run `push` again on the production database, which is a destructive operation. Drizzle push can drop and recreate columns or tables when it cannot ALTER them in place — SQLite has no `ALTER COLUMN` support, so many column type changes trigger a table rebuild. The existing `submissions` table data can be silently wiped.

**Why it happens:**
`drizzle-kit push` works fine for local development (no real data). The command is fast, interactive enough to feel safe, and produces no warning until it's too late. The distinction between push (dev-only) and migrate (production) is documented but easy to overlook under deadline pressure.

**How to avoid:**
- Switch to `drizzle-kit generate` + `drizzle-kit migrate` for all schema changes from this point forward. Never run `push` against the production database.
- Before any migration: create a backup of `data/submissions.db` inside the Docker volume (`docker exec [container] sqlite3 /data/submissions.db .dump > backup.sql`).
- Use additive-only migrations: add new columns with `DEFAULT NULL` or a sensible default. Never remove or rename existing columns in the same migration that adds new ones.
- Test migrations against a copy of the production database dump locally before deploying.
- Add the migration step explicitly to the Docker entrypoint or a startup script so it runs automatically on container start after a deploy.

**Warning signs:**
- `drizzle-kit push` command present in `package.json` scripts without a `--no-drop` flag or comment about dev-only use
- No `drizzle/migrations/` directory with versioned SQL files
- No database backup step in the deployment runbook

**Phase to address:**
First phase of v1.1 — the database schema migration must be designed and executed correctly before any new features write to new columns.

---

### Pitfall 2: SQLite Single-Writer Lock Causes 500 Errors Under Concurrent Dashboard + Form Traffic

**What goes wrong:**
The current `better-sqlite3` setup is synchronous and single-writer. The v1.1 lead dashboard adds write operations (update status, add notes, mark score) that run from admin browser actions, while the public contact form continues accepting submissions. If a deployment update or traffic spike causes two writes to race, SQLite throws `SQLITE_BUSY: database is locked`. The in-memory rate limiter resets on container restart, so a restart during high traffic can cause a burst of simultaneous writes. This surfaces as 500 errors on form submissions — the worst possible failure mode for lead capture.

**Why it happens:**
SQLite's single-writer model is acceptable for the v1.0 read-heavy workload. The v1.1 dashboard introduces write operations from a second concurrent user (the admin) while the form still accepts writes from the public. better-sqlite3 is synchronous, so there is no retry or timeout configured.

**How to avoid:**
- Enable WAL mode immediately: run `PRAGMA journal_mode=WAL;` once at database initialization (add it to `src/db/index.ts`). WAL mode allows concurrent readers and a single writer without blocking reads entirely.
- Set a busy timeout: `sqlite.pragma('busy_timeout = 5000')` gives 5 seconds of retry before throwing SQLITE_BUSY. This is a single line and eliminates most transient lock errors at this traffic level.
- Keep write transactions short — do not hold a write transaction open while awaiting an external API call (such as sending to HubSpot).
- For the dashboard, use optimistic updates on the client side so the admin UI doesn't stall waiting for write confirmation.

**Warning signs:**
- `src/db/index.ts` does not call `sqlite.pragma('journal_mode = WAL')` or `sqlite.pragma('busy_timeout = ...')`
- Dashboard write operations and form submission API routes share the same synchronous DB instance without any serialization
- 500 errors appear in logs when admin is actively using the dashboard while form traffic is nonzero

**Phase to address:**
Database setup (first phase) — WAL mode and busy timeout are one-time configuration steps that must be in place before adding new write paths.

---

### Pitfall 3: Cal.com Embed Script Fails Silently After Astro Page Navigation

**What goes wrong:**
Cal.com's embed script (`Cal("init", ...)`) is a global bootstrapper that must run after its `<script>` tag loads. In a plain HTML page, this works. In Astro, navigating between pages using View Transitions (if enabled) or Astro's client-side router does not fully reload the document — the `<head>` scripts are not re-executed. The embed script runs once on initial page load but fails silently when a user navigates away and back. The booking widget renders an empty `<div>` with no error in the console, or shows `Uncaught Error: Cal is not defined`.

**Why it happens:**
Cal.com's embed is designed for traditional multi-page apps where the browser loads a fresh document per navigation. Astro's View Transitions API (if used) swaps page content without a full reload. The `Cal` global disappears from scope after the swap, and any page that re-mounts the embed div finds no initializer to call.

**How to avoid:**
- Use `document.addEventListener('astro:page-load', () => { ... })` to re-initialize the Cal embed whenever Astro performs a page transition. This is the documented Astro pattern for re-running scripts after transitions.
- Place the Cal snippet initialization in a `<script>` tag that uses `is:inline` to prevent Astro from deduplicating it, and wraps the call in the `astro:page-load` listener.
- If View Transitions are not used, this pitfall does not apply — confirm the current project configuration before building the embed.
- Test by navigating away from the scheduling page and returning — verify the widget still renders.

**Warning signs:**
- Cal embed is only tested on a direct page load, never after in-app navigation
- `astro:page-load` not mentioned in the embed implementation
- Empty div where the calendar should appear after navigating back to the page

**Phase to address:**
Cal.com scheduling phase — the initialization pattern must be correct from the first implementation; it is not visible in normal dev testing.

---

### Pitfall 4: HubSpot Contact Upsert Creates Duplicate Records on Email Collision

**What goes wrong:**
When syncing a new contact form submission to HubSpot, the naive approach is `POST /crm/v3/objects/contacts` with the email and form data. If the contact already exists in HubSpot (they submitted before, or were manually added), this returns a 409 Conflict error. The sync code catches the error and either logs it silently (lead is never synced) or retries blindly (doubles the error load). Duplicate records accumulate when the email is slightly different (capitalization, extra spaces), and HubSpot's deduplication only merges exact email matches.

**Why it happens:**
The HubSpot v3 Contacts API does not upsert by default. The batch upsert endpoint (`/crm/v3/objects/contacts/batch/upsert`) exists but has documented bugs where it ignores all properties except email when creating new contacts, and returns 409 for the entire batch rather than a 207 partial success when one item collides.

**How to avoid:**
- Use the individual contact upsert pattern: first try `POST /crm/v3/objects/contacts`, catch 409, then `PATCH /crm/v3/objects/contacts/{id}` using the `hs_object_id` from the 409 response body.
- Normalize emails before sending to HubSpot: `.toLowerCase().trim()`.
- Store the HubSpot contact ID in the local SQLite `submissions` table after a successful sync. On subsequent form submissions from the same email, use the stored ID to PATCH directly instead of attempting a new create.
- Log every sync attempt and its outcome (created / updated / failed) to the local database — this makes debugging and retrying failed syncs possible from the dashboard.

**Warning signs:**
- HubSpot sync code uses only `POST` with no 409 handling
- No `hubspot_contact_id` column (or equivalent) in the local database schema
- No sync status column — impossible to know which submissions have been synced

**Phase to address:**
HubSpot integration phase — the upsert-by-email pattern must be built correctly from the start. Retroactively deduplicating HubSpot records is labor-intensive.

---

### Pitfall 5: HubSpot API Key Exposed in Admin Dashboard Client-Side Fetch

**What goes wrong:**
The admin dashboard is a server-rendered Astro page with Basic Auth. Developers adding a "Sync to HubSpot" button may implement it as a client-side `fetch('/api/admin/sync-hubspot')` call. If the API route does not re-verify Basic Auth credentials, an unauthenticated request can trigger CRM syncs. Worse: if the HubSpot Private App token is read in a client-side script instead of a server-side route, it is exposed in the browser.

**Why it happens:**
The existing admin page works with client-side `fetch` for the toggle-read button, and that pattern already re-verifies auth on the server. But adding new admin API endpoints under deadline pressure, especially if copy-pasting from a tutorial that shows environment variable access in browser context, is a common mistake.

**How to avoid:**
- HubSpot API calls must only happen server-side (in Astro API routes, not in `<script>` blocks).
- Every new `/api/admin/*` endpoint must validate the `Authorization: Basic ...` header using the same check in `pages/admin/index.astro`. Extract this into a shared `lib/auth.ts` helper function that throws/returns 401 if auth fails — this prevents forgetting the check.
- Never import `import.meta.env.HUBSPOT_TOKEN` in any file that will be included in a client-side bundle. Astro will warn about this, but only if the variable name matches `PUBLIC_` prefix conventions — non-PUBLIC env vars accessed in server-only code are safe, but the distinction is easy to blur during debugging.
- Add `HUBSPOT_PRIVATE_APP_TOKEN` to `.env.example` (without the real value) and document it in the project README.

**Warning signs:**
- A new `/api/admin/` route that does not call the shared auth validation function
- `import.meta.env.HUBSPOT_TOKEN` referenced in a file inside `src/components/` or a `<script>` block
- HubSpot API requests visible in the browser Network tab (they should only appear in server logs)

**Phase to address:**
HubSpot integration phase — build the shared auth helper before writing any new admin endpoints. Authentication must not be an afterthought on new routes.

---

### Pitfall 6: Multi-Step Form State Lost on Browser Back / Refresh

**What goes wrong:**
The multi-step contact form stores current step and collected field values in JavaScript variables or component state. When a user on Step 3 (budget selection) hits browser Back to reconsider Step 2 (service type), the form either resets to Step 1 or loses previously entered data entirely. On mobile, accidental swipe-back gestures trigger this constantly. Users who hit F5 to refresh mid-form lose everything and abandon rather than restart.

**Why it happens:**
In-memory JavaScript state does not survive page navigation or refresh. The form appears to work perfectly in a demo (developer clicks the Next button in sequence, never hits Back), but real users navigate non-linearly. Vanilla JS state without any persistence layer has zero durability.

**How to avoid:**
- Persist form state in `sessionStorage` after every step transition. Key the data by a session ID or timestamp to avoid stale data from a previous visit.
- Restore from `sessionStorage` on page load before rendering the first step — this handles both F5 refresh and back navigation.
- Use the `popstate` event (via `history.pushState` per step) to allow Back to go to the previous step rather than the previous page. Each step gets a `?step=2` URL parameter so Back navigates to `?step=1`, not out of the form.
- Clear `sessionStorage` entry after successful form submission to prevent stale pre-fill on the next visit.
- Inform the user with a banner: "Your progress has been saved" after each step, reducing anxiety about data loss.

**Warning signs:**
- Form step state stored only in JavaScript variables, not in `sessionStorage` or URL
- No `popstate` listener and no `history.pushState` calls in the form JavaScript
- Refresh during Step 2 returns the user to Step 1 with empty fields (test this explicitly)

**Phase to address:**
Multi-step form phase — state persistence is part of the core form design, not an enhancement. Build it into the form from the first step.

---

### Pitfall 7: Behavioral Lead Scoring Tracks Data Without Consent, Violating GDPR

**What goes wrong:**
Lead scoring from behavioral signals means recording page visits, time on page, and engagement patterns per visitor — either via GTM events pushed to a `dataLayer` array, or via custom API calls from the frontend. Under GDPR (which applies to any EU visitor, regardless of where the business is based), this is personal data processing that requires a lawful basis. Behavioral tracking without consent or legitimate interest documentation exposes the business to regulatory risk. More immediately: browsers with privacy protection (Safari ITP, Firefox ETP) block or randomize cross-session identifiers, making session stitching unreliable.

**Why it happens:**
Developers implement behavioral tracking as a technical feature without recognizing the legal dimension. The existing GTM/GA4 setup already conditions on a consent check (`window.gtmConsent`), but adding new custom behavioral signals to feed the scoring engine may bypass this existing gate.

**How to avoid:**
- All behavioral signals fed into lead scoring must flow through the existing GTM consent gate. Do not add direct API calls from the frontend that bypass the consent check.
- Document the lawful basis for behavioral scoring in a privacy notice update. For a B2B agency site, legitimate interest is plausible but must be documented with a balancing test.
- Keep behavioral scoring lightweight and time-bounded: track events in the current session only (using `sessionStorage`, not `localStorage` or cookies). Do not build cross-session user profiles unless explicit consent is given.
- Use the existing GTM dataLayer for all behavioral events (`window.dataLayer.push({ event: 'page_engagement', ... })`). This keeps all tracking within the already-consented GTM container.
- Score form-derived signals (service type, budget, message length, company name) separately from behavioral signals — form data is submitted voluntarily and has a clear purpose, making the lawful basis simpler.

**Warning signs:**
- JavaScript code that writes to `localStorage` or sets cookies to track visitors across sessions without a consent check
- A new `/api/track` endpoint that accepts browser-sent events without verifying GTM consent state
- Lead scoring formula mixes form signals and behavioral signals without distinguishing their lawful basis

**Phase to address:**
Lead scoring phase — the data model for scoring must distinguish form-derived fields (safe) from behavioral signals (requires consent gate) before any scoring logic is written.

---

### Pitfall 8: Cal.com Booking Not Connected to Lead Record

**What goes wrong:**
A visitor books a call via the Cal.com embed. A lead record exists in SQLite from their earlier form submission. These two events are never connected. The admin dashboard shows the form submission and the calendar invite arrives in email separately, with no way to see "this booking is from this lead." The sales workflow breaks because follow-up requires manually cross-referencing two systems.

**Why it happens:**
Cal.com embed and the contact form are implemented independently. The embed fires a booking-confirmed JavaScript event, but no code listens to it and writes back to the database. Connecting them requires passing a lead identifier into the Cal.com booking as custom metadata, which requires using Cal.com's `prefill` option and webhook configuration — steps that are easy to skip if the feature is scoped as "just add the widget."

**How to avoid:**
- When the contact form is submitted (Step 1 of the multi-step form), generate a `lead_id` and store it in `sessionStorage`. When the Cal.com embed loads on the confirmation/next step, pass `lead_id` as a `notes` prefill value in the Cal.com init: `Cal("ui", { prefill: { notes: "lead_id:abc123" } })`.
- Configure a Cal.com webhook (via the Cal.com dashboard) that fires on `BOOKING_CREATED` events and calls a new endpoint (`/api/webhooks/cal`) on this site. The endpoint extracts the `lead_id` from the booking notes and updates the matching SQLite record with `cal_booking_uid` and `scheduled_at`.
- If the user books without submitting a form first (direct embed), create a new lead record from the booking attendee data in the webhook handler.
- Verify the webhook with Cal.com's signature header (`X-Cal-Signature-256`) to prevent spoofed booking events.

**Warning signs:**
- Cal.com embed initialized without any `prefill` configuration
- No Cal.com webhook configured in the Cal.com dashboard
- No `cal_booking_uid` or similar column in the `submissions`/leads database schema
- Admin dashboard cannot show "Booked call" status for any lead

**Phase to address:**
Cal.com scheduling phase, but requires coordination with multi-step form phase (the `lead_id` must exist before the embed loads) and database phase (schema must include booking-related columns).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep `drizzle-kit push` for schema changes | Fast iteration, no migration files to manage | One bad push on production wipes all real lead data | Never in production — generate migration files from day one of v1.1 |
| Store all lead scoring logic in a single JavaScript function | Easy to add new signals quickly | Scoring becomes opaque; impossible to audit why a lead got its score | Acceptable in MVP if the function is well-commented and single-responsibility |
| Sync to HubSpot synchronously in the form submission API route | Simple code path, one handler does everything | HubSpot API latency (200-800ms) blocks the form response; HubSpot outages cause form submission failures | Never — always sync async (queue the sync, return success immediately) |
| Use Basic Auth for all admin API endpoints by copy-paste | Works, fast to implement | One forgotten endpoint exposes admin actions to unauthenticated callers | Never — extract to a shared `requireAuth()` helper from the start |
| Score only form-submitted fields, ignore behavioral signals | Simpler implementation, zero consent risk | Scoring is less predictive — a lead who visited Pricing 3 times looks the same as one who bounced | Acceptable for MVP; behavioral scoring can be added later with proper consent infrastructure |
| Multi-step form without `sessionStorage` persistence | Less code | Users who hit Back or refresh lose all progress and abandon | Never — sessionStorage persistence is 10 lines and must be in the first version |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| HubSpot Contacts v3 API | `POST /crm/v3/objects/contacts` on every submission with no 409 handling | Try POST, catch 409, PATCH using the ID from the 409 response body; normalize email to lowercase before sending |
| HubSpot Private App token | Reading the token from `import.meta.env` in a file that gets bundled client-side | Token must only appear in server-side Astro API routes (`export const prerender = false`); never in `<script>` blocks |
| Cal.com embed + Astro View Transitions | Initializing Cal embed once in a regular `<script>` tag | Wrap the Cal init in `document.addEventListener('astro:page-load', ...)` to re-run after each page transition |
| Cal.com booking webhook | Trusting all incoming webhook requests | Validate `X-Cal-Signature-256` header against your Cal.com webhook secret before processing any payload |
| Cal.com embed + multi-step form | Embedding Cal.com on a separate page with no connection to form submission data | Pass `lead_id` as a prefill `notes` field when initializing the embed; capture it in the webhook handler to link booking to lead |
| Drizzle ORM + SQLite WAL mode | Using default SQLite journal mode with concurrent reads/writes | Enable WAL with `sqlite.pragma('journal_mode = WAL')` and set `busy_timeout` to 5000ms at DB init |
| GTM behavioral events for lead scoring | Adding `dataLayer.push()` calls without checking consent state | Route all behavioral tracking through the existing GTM consent gate; do not add direct API calls that bypass GTM |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous HubSpot API call in form submit handler | Form appears to hang for 0.5-2s after submit; HubSpot outage causes form to return 500 | Queue HubSpot sync as a background operation; return success to user immediately after DB write | Immediately if HubSpot rate-limits or is slow; catastrophically if HubSpot has an outage |
| Loading all lead records for the dashboard without pagination | Dashboard loads in < 1s at 50 records, degrades to 5s+ at 500 records | Add `LIMIT`/`OFFSET` or cursor-based pagination from the start; do not fetch unbounded result sets | Around 200-300 lead records with full text messages in each row |
| Cal.com inline embed on a page with many glass panels | Page LCP degrades by 0.5-1.5s; mobile CPU spikes as Cal.com loads and renders simultaneously with glass compositing | Load the Cal.com embed lazily (only after user interaction) if placed below the fold; use the popup variant instead of inline on pages with heavy glass effects | Any page with 8+ glass panels simultaneously and the Cal inline embed |
| Re-running lead score calculation on every dashboard page load for all leads | Score recalculation is fast for 20 leads, slow for 500 | Store computed score in the database, recalculate only when inputs change (new submission, status update) | Around 100+ leads with complex scoring formulas |
| Fetching HubSpot sync status from HubSpot API to show in dashboard | 200-800ms added to every dashboard page load | Store sync status and last-synced-at timestamp locally in SQLite; never call HubSpot API on dashboard page render | Immediately — external API latency is non-deterministic |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| New `/api/admin/*` endpoints without the shared auth check | Any unauthenticated caller can update lead status, trigger HubSpot syncs, or read all submissions | Create `lib/auth.ts` with a `requireBasicAuth(request)` helper that returns 401 if invalid; call it as the first line of every admin endpoint |
| HubSpot Private App token in client-side JavaScript | Token exposed in browser DevTools; attacker can read/write all HubSpot CRM data | Only access `import.meta.env.HUBSPOT_TOKEN` in `prerender = false` API routes, never in `.astro` component `<script>` tags or `src/lib/*.ts` files imported by client bundles |
| Cal.com webhook endpoint without signature verification | Attacker can send fake booking events to manipulate lead statuses in the database | Verify `X-Cal-Signature-256` using HMAC-SHA256 against your webhook secret before processing the payload |
| Multi-step form that accepts arbitrary `service_type` values | Attacker sends `service_type: "<script>alert(1)</script>"` to inject into admin dashboard | Validate `service_type` against an allowlist (`['web-dev', 'devops', 'analytics']`) on the server; reject anything not in the list |
| Behavioral tracking data stored indefinitely with PII | Old behavioral logs accumulate PII for leads who never converted, violating GDPR data minimization | Apply the same data retention policy to behavioral event logs as to form submissions; purge after 12 months or on user request |
| Lead scores and statuses visible to any admin without access control | Single admin now, but score/status data is sensitive; any future admin addition risks over-sharing | Acceptable risk for single-admin MVP; document explicitly in code comments so access control is added before a second admin is created |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Multi-step form shows all errors only on final submit | User fills 3 steps, submits, sees errors on Step 1 — must navigate back, fixing each step blind | Validate each step before allowing Next; show inline errors on the current step immediately |
| No progress indicator on multi-step form | Users do not know how long the form is; drop off rate increases after Step 2 | Show a clear "Step 2 of 4" indicator with a progress bar; list step names so users know what's coming |
| Cal.com embed uses the default Cal.com branding | The embed looks visually inconsistent with the dark glassmorphism site; undermines professional perception | Configure Cal.com embed with `theme: 'dark'` and a custom brand color matching `#6366f1`; hide the Cal.com logo if on a paid plan |
| Form success page has no next action | User submits form, sees "Thank you!" and nothing else — no path to book a call or explore services | Success state should offer: (1) book a call via Cal.com CTA, (2) link to relevant case studies, (3) set expectation ("We'll reply within 24 hours") |
| Dashboard shows raw ISO dates and integer scores | Admin must mentally parse `2026-03-11T14:23:00.000Z` and a score of `72` — context-free | Format dates as relative ("3 days ago") with absolute on hover; show score as a labeled tier ("High — 72") with color coding |
| Admin must open HubSpot separately to see CRM context | Context-switching between dashboard and HubSpot breaks the review workflow | Show a "Synced to HubSpot" badge with a direct link to the HubSpot contact record on each lead card |

---

## "Looks Done But Isn't" Checklist

- [ ] **Multi-step form:** Looks done when steps navigate — verify that refreshing mid-form restores the current step and previously entered values from `sessionStorage`
- [ ] **Multi-step form:** Looks done when final submit works — verify that browser Back from Step 3 goes to Step 2 (not the previous page) without losing data
- [ ] **Lead scoring:** Looks done when a score appears in the database — verify that score updates when a new submission arrives from the same email, and that the dashboard reflects the updated score without a manual refresh
- [ ] **Cal.com embed:** Looks done when the calendar renders on first page load — verify that navigating away and returning to the scheduling page still shows the calendar (Astro page transition test)
- [ ] **Cal.com embed:** Looks done when a booking is made — verify the webhook fires, the booking is linked to the correct lead record in the database, and the dashboard shows "Call scheduled" status
- [ ] **HubSpot sync:** Looks done when the first contact is created in HubSpot — verify that submitting a form with an existing HubSpot email does a PATCH (update) not a duplicate POST (409)
- [ ] **HubSpot sync:** Looks done after one successful sync — verify sync failure (HubSpot down, rate limit) is logged in the database and retryable from the dashboard, not silently swallowed
- [ ] **Dashboard:** Looks done when a list renders — verify it paginates or limits results; open the dashboard with 200+ dummy records and measure load time
- [ ] **Database migration:** Looks done when the app starts — verify that the migration runs cleanly against a copy of the current production database dump, not just against an empty fresh database

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `drizzle-kit push` wiped production lead data | HIGH | Restore from the pre-migration backup dump (`sqlite3 /data/submissions.db < backup.sql`); if no backup exists, data is unrecoverable. Incident: re-populate from Resend email delivery logs if those were retained. |
| HubSpot duplicates created from 409 mishandling | MEDIUM | Use HubSpot's built-in deduplication tool to merge records; update the sync code to use the upsert pattern; re-sync all local records using the corrected logic with `force_resync` flag |
| Cal.com bookings not linked to leads (no webhook) | MEDIUM | Retrospectively match bookings to leads by attendee email in HubSpot or Cal.com dashboard; add the webhook and `lead_id` prefill going forward; accept that historical bookings require manual linking |
| Admin endpoint called without auth (unauthorized write) | HIGH | Audit server logs for unauthorized calls; add `requireAuth()` to the endpoint immediately; check if any lead data was maliciously modified; consider rotating the admin credentials |
| Behavioral tracking data collected without GDPR basis | MEDIUM | Delete behavioral event log data for visitors without documented consent; update privacy policy; ensure GTM consent gate prevents future collection without consent |
| SQLite BUSY errors causing form submission 500s | LOW | Enable WAL mode + `busy_timeout` (two lines in `db/index.ts`); restart container; verify with a concurrent load test |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| `drizzle-kit push` on production data | Database schema phase (Phase 1) | `drizzle/migrations/` directory exists with versioned SQL files; `push` removed from production scripts; migration tested against production DB dump |
| SQLite BUSY errors | Database setup (Phase 1) | `sqlite.pragma('journal_mode = WAL')` and `busy_timeout` present in `db/index.ts`; concurrent write test passes without errors |
| Cal.com embed breaks after Astro navigation | Cal.com scheduling phase | Manual test: navigate away from scheduling page and back; calendar still renders; `astro:page-load` listener present in embed script |
| HubSpot duplicate contacts on 409 | HubSpot integration phase | Submit form twice with same email; confirm only one HubSpot contact record exists; DB shows `hubspot_contact_id` populated on first submission, updated on second |
| HubSpot token in client bundle | HubSpot integration phase | `grep -r "HUBSPOT" src/components src/layouts src/pages` — no hits in non-API-route files |
| Multi-step form state lost on Back/refresh | Multi-step form phase | Form filled to Step 3, F5 pressed — Step 3 restores; browser Back pressed — returns to Step 2 with data intact |
| Cal.com booking not linked to lead | Cal.com + database schema phase | Submit form, then book via embed; admin dashboard shows `cal_booking_uid` on the lead record; webhook endpoint logs confirm the link |
| GDPR-violating behavioral tracking | Lead scoring phase | All behavioral `dataLayer.push()` calls gated on `window.gtmConsent`; no `localStorage` writes for cross-session visitor IDs without consent check; privacy policy updated |
| Unauthenticated admin API endpoints | Every phase that adds a new `/api/admin/*` route | `curl -X POST /api/admin/[new-endpoint]` without Authorization header returns 401; auth helper used in all admin routes |
| Dashboard load time at scale | Dashboard phase | Load dashboard with 200 synthetic lead records; page renders in under 2s; SQL query uses `LIMIT` |

---

## Sources

- [Drizzle ORM — push vs. migrate documentation](https://orm.drizzle.team/docs/drizzle-kit-push)
- [Drizzle ORM — migrations documentation](https://orm.drizzle.team/docs/migrations)
- [Cal.com GitHub Issue #25082 — Inline Embed Failing, Cal is not defined](https://github.com/calcom/cal.com/issues/25082)
- [Cal.com GitHub Issue #22777 — Website CSS overrides break embed](https://github.com/calcom/cal.com/issues/22777)
- [Cal.com Docs — Webhooks](https://cal.com/docs/developing/guides/automation/webhooks)
- [HubSpot Community — v3 Contact Create API Throws Error on Duplicate Email](https://community.hubspot.com/t5/APIs-Integrations/v3-Contact-Create-API-Throws-Error-On-Duplicate-Email-Address/m-p/382458)
- [HubSpot Docs — API usage guidelines and rate limits](https://developers.hubspot.com/docs/developer-tooling/platform/usage-guidelines)
- [DevRix — Common Pitfalls in HubSpot API Integration](https://devrix.com/tutorial/hubspot-api-integration/)
- [SQLite Official Docs — Appropriate Uses for SQLite](https://www.sqlite.org/whentouse.html)
- [Medium — Four Ways to Handle SQLite Concurrency](https://medium.com/@gwendal.roue/four-different-ways-to-handle-sqlite-concurrency-db3bcc74d00e)
- [Baymard Institute — Back Button UX Expectations (59% of sites get it wrong)](https://baymard.com/blog/back-button-expectations)
- [Astro GitHub Issue #13943 — ClientRouter triggers full reload on history.back()](https://github.com/withastro/astro/issues/13943)
- [GDPR consent for behavioral tracking — Reform.app](https://www.reform.app/blog/gdpr-consent-for-behavioral-tracking)
- [Forrester — Five Unexpected GDPR Marketing Automation Pitfalls](https://www.forrester.com/blogs/gdpr-is-coming-five-unexpected-marketing-automation-pitfalls-to-plan-for/)
- [LogSnag — The Tiny Stack (Astro, SQLite, Litestream)](https://logsnag.com/blog/the-tiny-stack)

---
*Pitfalls research for: SyncTexts v1.1 Lead Conversion Engine*
*Researched: 2026-03-11*
