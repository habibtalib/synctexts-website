# Architecture Research

**Domain:** Lead conversion engine added to existing Astro + SQLite + Drizzle agency site
**Researched:** 2026-03-11
**Confidence:** HIGH (all integration points derived from reading actual codebase)

---

## Standard Architecture

### System Overview (v1.1 State)

```
                        +-------------------------------+
                        |         Caddy Proxy           |
                        |  HTTPS termination, routing   |
                        +-------------+-----------------+
                                      |
                        +-------------v-----------------+
                        |  Astro Node.js (hybrid mode)  |
                        |  @astrojs/node standalone     |
                        +------+--------+-------+-------+
                               |        |       |
              +----------------+   +----+   +---+-----------+
              |                    |            |
    +---------v--------+  +--------v------+  +--v-----------+
    | Static Pages     |  | SSR Pages     |  | API Routes   |
    | (prerender=true) |  | (prerender=   |  | (prerender=  |
    |                  |  |  false)       |  |  false)      |
    | index, portfolio,|  | admin/index   |  | POST contact |
    | team, blog,      |  | (basic auth)  |  | POST toggle- |
    | pricing, contact |  |               |  |  read        |
    +------------------+  +---------------+  | GET health   |
                                             |              |
                                             | [NEW] POST   |
                                             |  contact-v2  |
                                             | POST scoring |
                                             | POST hubspot |
                                             | GET/PATCH    |
                                             |  leads       |
                                             +-+--------+---+
                                               |        |
                          +--------------------+   +----+-----------+
                          |                        |
               +----------v---------+   +----------v---------+
               | SQLite (Drizzle)   |   | External Services  |
               | data/submissions.db|   |                    |
               |                    |   | - Resend (email)   |
               | [v1.0] submissions |   | - HubSpot CRM API  |
               | [NEW]  lead_scores |   | - Cal.com (embed,  |
               | [NEW]  lead_events |   |   client-side only)|
               +--------------------+   +--------------------+
```

### Component Responsibilities

| Component | Responsibility | v1.1 Change |
|-----------|----------------|-------------|
| `src/pages/contact.astro` | Hosts the contact form HTML shell | Replace single-form with multi-step form component |
| `src/scripts/contact-form.ts` | Client-side form state, validation, submission | Replace with multi-step form controller |
| `src/pages/api/contact.ts` | POST handler: validate, persist, email | Extend to accept new fields; add scoring trigger |
| `src/db/schema.ts` | Drizzle table definitions for SQLite | Add columns to `submissions`; add new tables |
| `src/pages/admin/index.astro` | Basic auth read-only submissions list | Upgrade to full lead management dashboard |
| `src/pages/api/admin/toggle-read.ts` | Toggle read status | Add more admin mutation endpoints |
| `src/lib/email.ts` | Resend email notification | No change required |
| `src/lib/rate-limiter.ts` | In-memory rate limiter | No change required |
| `src/lib/validation.ts` | Server-side field validation | Extend for new form fields |

---

## Integration Architecture: Feature by Feature

### Feature 1: Multi-Step Contact Form

**What changes:**

The existing `contact.astro` uses a single-page HTML form submitted by `contact-form.ts`. The multi-step form needs client-side step state (current step, collected data, progress) that cannot live in static HTML alone.

**Integration pattern:** Replace the inline `<form>` in `contact.astro` with a vanilla JS class or small state machine in a new script. No framework island needed — vanilla TypeScript is sufficient given the existing precedent in `contact-form.ts`. Three service-specific paths share the same API endpoint.

**New files:**

```
src/scripts/multi-step-form.ts   # Replaces contact-form.ts for the new form
src/components/forms/
  StepIndicator.astro             # Visual step progress (static HTML, styled)
  ServiceSelector.astro           # Step 1: which service (web dev / devops / analytics)
```

**Modified files:**

```
src/pages/contact.astro           # Replace form HTML with multi-step structure
src/pages/api/contact.ts          # Accept service_type, budget, timeline fields
src/lib/validation.ts             # Add validation rules for new fields
src/db/schema.ts                  # Add service_type, budget, timeline columns
```

**Step structure:**

```
Step 1: Service type (web dev | devops | analytics | other)
Step 2: Service-specific questions
  web dev   → project type, budget range
  devops    → infrastructure type, team size
  analytics → current tools, data volume
Step 3: Contact details (name, company, email)  ← same fields as existing
Step 4: Confirmation + Cal.com scheduling prompt
```

**State machine (client-side, no framework):**

```typescript
// Multi-step form state lives in the script, not the DOM
interface FormState {
  currentStep: number;
  totalSteps: number;
  data: Record<string, string>;
  serviceType: 'webdev' | 'devops' | 'analytics' | 'other' | null;
}
```

The `data` object accumulates across steps. On final submit, the full payload goes to `POST /api/contact` (same endpoint, extended schema).

**Backward compatibility:** The existing `/api/contact` endpoint must stay compatible. New fields (`service_type`, `budget`, `timeline`) are nullable in the DB schema so the old single-page form path (if any bookmarks or bots hit it) does not break.

---

### Feature 2: Cal.com Embedded Scheduling

**Integration pattern:** Pure client-side embed, no server changes.

Cal.com provides a JavaScript snippet loaded from their CDN. It runs entirely in the browser. The embed can be:
- **Inline** — renders the full booking calendar directly in the page
- **Popup via element click** — opens a modal when a button is clicked

For this site, **popup via element click** is the correct choice. After the multi-step form submits successfully, instead of just showing a success message, show a "Book a call" button that triggers the Cal.com popup.

**Where it goes:**

```
src/layouts/BaseLayout.astro    # Add Cal.com loader script once, in <head>
src/pages/contact.astro         # Add booking CTA button (shown post-submission)
src/scripts/multi-step-form.ts  # Trigger cal.open() after successful submission
```

**Snippet structure (from Cal.com dashboard):**

```html
<!-- In BaseLayout.astro <head> -->
<script>
  (function (C, A, L) {
    let p = function (a, ar) { a.q.push(ar); };
    let d = C.document;
    C.Cal = C.Cal || function () {
      let cal = C.Cal;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        d.head.appendChild(d.createElement("script")).src = A;
        cal.loaded = true;
      }
      if (ar) {
        p(cal, arguments);
      }
    };
    C.Cal.ns["booking"] = C.Cal.ns["booking"] || function () {
      p(C.Cal.ns["booking"], arguments);
    };
  })(window, "https://app.cal.com/embed/embed.js", "init");
  Cal("init", "booking", { origin: "https://app.cal.com" });
</script>
```

The script tag must not be in a `<script type="module">` — Cal.com's embed expects a classic script context. BaseLayout already has GTM this way, so the pattern is established.

**Triggering from form success handler:**

```typescript
// In multi-step-form.ts, after successful POST
(window as any).Cal?.ns?.booking?.("ui", { styles: { branding: { brandColor: "#6366f1" } } });
document.getElementById('book-call-btn')?.addEventListener('click', () => {
  (window as any).Cal?.ns?.booking?.("openModal", { calLink: "synctexts/intro" });
});
```

**No server infrastructure required.** The Cal.com service handles all booking, calendar, and notification logic. This is a frontend-only integration.

---

### Feature 3: Lead Scoring

**What it is:** A numeric score (0–100) computed per submission from form data signals and behavioral signals. Stored in SQLite alongside the submission. Displayed in the admin dashboard.

**Where scoring runs:** Server-side, in `POST /api/contact` immediately after the submission is persisted. This keeps the scoring logic out of the browser and consistent.

**Data inputs:**

| Signal | Source | Weight rationale |
|--------|--------|------------------|
| `service_type` | Form Step 1 | DevOps/Analytics = higher typical deal size |
| `budget` | Form Step 2 | Higher budget bracket = higher priority |
| `timeline` | Form Step 2 | "ASAP" = higher urgency |
| `company` | Form Step 3 | Company provided = B2B lead vs individual |
| `message` length | Form Step 3 | Longer = more considered inquiry |
| Page visit signals | Behavioral (see below) | Pricing page visit = high intent |

**Behavioral signals collection:** Client JS writes a cookie or localStorage entry tracking which high-intent pages were visited (pricing, specific service sections). On form submission, this session data is included as a hidden field in the form payload.

```typescript
// In analytics.js or a new src/scripts/lead-signals.ts
// Track page visits and engagement
const signals = {
  visitedPricing: false,
  visitedPortfolio: false,
  timeOnSite: 0,  // seconds
};

// On form submit, include signals in payload
document.querySelector('#lead-signals')!.value = JSON.stringify(signals);
```

**Scoring function — new lib file:**

```
src/lib/lead-scoring.ts    # NEW — pure function, no I/O
```

```typescript
export interface ScoringInput {
  serviceType: string | null;
  budget: string | null;
  timeline: string | null;
  hasCompany: boolean;
  messageLength: number;
  behavioralSignals: BehavioralSignals;
}

export function scoreLead(input: ScoringInput): number {
  let score = 0;
  // Service type weight (0-25)
  // Budget weight (0-30)
  // Timeline urgency (0-20)
  // Company present (0-10)
  // Message depth (0-10)
  // Behavioral signals (0-5 per signal)
  return Math.min(100, score);
}
```

Pure function with no dependencies means it is testable without a database or HTTP context.

**Schema change — `submissions` table:**

```typescript
// Add to existing submissions table in src/db/schema.ts
serviceType: text('service_type'),
budget: text('budget'),
timeline: text('timeline'),
leadScore: integer('lead_score').default(0),
leadStatus: text('lead_status').default('new'),  // new | contacted | qualified | closed
notes: text('notes'),
hubspotId: text('hubspot_id'),  // null until synced
hubspotSyncedAt: text('hubspot_synced_at'),
```

No new table needed. All lead data lives in the `submissions` row. Adding nullable columns to an existing SQLite table via Drizzle migration is straightforward (`drizzle-kit generate` + `drizzle-kit migrate`).

---

### Feature 4: Lead Management Dashboard

**What it replaces:** The existing `src/pages/admin/index.astro` renders a read-only list with a single "mark as read" toggle. The new dashboard needs filtering, status management, score display, notes editing, and HubSpot sync trigger.

**Integration pattern:** Extend the existing admin page architecture — same Basic Auth pattern, same Drizzle query approach, more API endpoints.

**New API routes:**

```
src/pages/api/admin/
  toggle-read.ts          [existing — keep unchanged]
  update-status.ts        [NEW] PATCH — update leadStatus
  update-notes.ts         [NEW] PATCH — update notes field
  sync-hubspot.ts         [NEW] POST — trigger HubSpot sync for one lead
```

**Admin page changes:**

```
src/pages/admin/index.astro     [MODIFY] — add score column, status dropdown,
                                  notes textarea, filter controls, HubSpot sync button
```

The admin page currently fetches all submissions and renders static HTML with a small inline `<script>` for the toggle. The new dashboard follows the same pattern but with more interactive controls. Each action (status change, notes save, HubSpot sync) calls the corresponding API endpoint via `fetch`.

**Filtering:** URL query parameters drive the server-side Drizzle query — no client-side filtering needed.

```
/admin?status=new&minScore=50
```

The Astro page frontmatter reads `Astro.url.searchParams` and passes them to the Drizzle query with `where()` clauses. This keeps the admin page statically renderable on the server per-request without client-side JS complexity.

**Score display:** Rendered as a colored badge in the card header. Color bands: 0–30 = grey (cold), 31–60 = amber (warm), 61–100 = green (hot).

---

### Feature 5: HubSpot CRM Integration

**Integration pattern:** Fire-and-forget server-side API call. HubSpot sync is not in the critical path of form submission. It runs either asynchronously after submission or on-demand from the admin dashboard.

**Two trigger points:**

1. **Automatic on submission** — After scoring, call HubSpot contacts API to create/upsert the contact. If the call fails, log and continue. The submission is already persisted in SQLite; HubSpot failure is non-blocking.

2. **Manual from admin dashboard** — "Sync to HubSpot" button calls `/api/admin/sync-hubspot` for a specific lead. Useful for re-syncing after a failure or enriching a lead with notes before it goes to the CRM.

**New lib file:**

```
src/lib/hubspot.ts    # NEW — HubSpot API client wrapper
```

```typescript
import { Client } from '@hubspot/api-client';

export async function upsertContact(data: {
  email: string;
  name: string;
  company?: string;
  serviceType?: string;
  budget?: string;
  leadScore?: number;
}): Promise<string> {  // returns HubSpot contact ID
  const client = new Client({ accessToken: import.meta.env.HUBSPOT_TOKEN });
  // POST /crm/v3/objects/contacts with upsert behavior
  // Returns hubspot internal ID for storage in submissions.hubspot_id
}
```

**Authentication:** HubSpot Private App access token stored in `.env` as `HUBSPOT_TOKEN`. Server-side only — never exposed to client.

**Error handling:** All HubSpot calls wrapped in try/catch. Failures logged to console but never bubble up to the form user. `submissions.hubspot_synced_at` stays null on failure; admin can see which leads need re-sync.

**Package addition:**

```bash
npm install @hubspot/api-client
```

**Environment variable additions:**

```
HUBSPOT_TOKEN=pat-na1-...
```

---

## Recommended Project Structure (v1.1 additions)

```
src/
├── components/
│   ├── forms/
│   │   ├── StepIndicator.astro     [NEW] progress bar for multi-step form
│   │   └── ServiceSelector.astro   [NEW] step 1 service-type cards
│   └── admin/
│       ├── LeadCard.astro          [NEW] replaces inline card HTML in admin page
│       ├── ScoreBadge.astro        [NEW] colored score display
│       └── StatusDropdown.astro    [NEW] status change control
├── lib/
│   ├── email.ts                    [unchanged]
│   ├── validation.ts               [extend for new fields]
│   ├── rate-limiter.ts             [unchanged]
│   ├── lead-scoring.ts             [NEW] pure scoring function
│   └── hubspot.ts                  [NEW] HubSpot API wrapper
├── pages/
│   ├── contact.astro               [modify] multi-step form
│   ├── admin/
│   │   └── index.astro             [modify] full lead dashboard
│   └── api/
│       ├── contact.ts              [modify] accept new fields, trigger scoring
│       ├── health.ts               [unchanged]
│       └── admin/
│           ├── toggle-read.ts      [unchanged]
│           ├── update-status.ts    [NEW]
│           ├── update-notes.ts     [NEW]
│           └── sync-hubspot.ts     [NEW]
├── scripts/
│   ├── contact-form.ts             [replace with multi-step-form.ts or refactor]
│   ├── multi-step-form.ts          [NEW] step state controller
│   ├── lead-signals.ts             [NEW] behavioral signal tracker
│   └── analytics.js                [unchanged]
└── db/
    ├── index.ts                    [unchanged]
    └── schema.ts                   [modify] add columns to submissions
```

---

## Data Flow

### Multi-Step Form Submission Flow

```
User fills Step 1–3 (client-side state in multi-step-form.ts)
         |
         v
Step 4: Confirm — user clicks "Submit"
         |
         v
lead-signals.ts reads localStorage/sessionStorage
  (visited pricing? time on site? pages seen?)
         |
         v
POST /api/contact
  { name, email, company, message,
    service_type, budget, timeline,
    behavioral_signals: "{...}" }
         |
         v
Server: validateContact() — extended validation
         |
         v
Server: db.insert(submissions, {...}) — persist first
         |
         v
Server: scoreLead(input) — pure function, returns 0-100
         |
         v
Server: db.update(submissions, { leadScore }) — update score in place
         |
         v
Server: upsertContact(hubspot) — fire-and-forget, errors caught
         |
         v
Server: sendContactNotification(resend) — email to admin
         |
         v
JSON { success: true }
         |
         v
Client: show success UI + Cal.com "Book a call" CTA
```

### Admin Dashboard Data Flow

```
GET /admin[?status=new&minScore=50]
         |
         v
Basic Auth check (same as v1.0)
         |
         v
Drizzle query with WHERE filters from URL params
         |
         v
Render LeadCard components with score badges, status dropdowns
         |
         v
User actions (status change, notes, sync)
  → fetch() to /api/admin/update-status etc.
  → optimistic UI update
```

### HubSpot Sync Flow

```
Automatic (on submission):
  POST /api/contact succeeds
         |
         v
  hubspot.upsertContact(data)
    → POST https://api.hubapi.com/crm/v3/objects/contacts
    → Authorization: Bearer {HUBSPOT_TOKEN}
    → Returns: hubspot_id
         |
         v
  db.update({ hubspot_id, hubspot_synced_at })

Manual (from admin):
  Admin clicks "Sync to HubSpot" button
         |
         v
  POST /api/admin/sync-hubspot { submissionId }
         |
         v
  Load submission from DB
  hubspot.upsertContact(data)
  Update hubspot_id + synced_at
         |
         v
  JSON { success: true, hubspotId }
         |
         v
  Admin UI shows sync status update
```

---

## Architectural Patterns

### Pattern 1: Extend, Don't Replace the API Endpoint

**What:** Add new optional fields to `/api/contact` rather than creating `/api/contact-v2`.

**When to use:** When existing integrations (any bookmarked direct links, bots) should keep working.

**Trade-offs:** Requires backward-compatible nullable schema additions. Avoids having two endpoints with duplicated validation and persistence logic.

```typescript
// Existing fields preserved. New fields with fallbacks.
const serviceType = body.service_type as string | undefined ?? null;
const budget = body.budget as string | undefined ?? null;
```

### Pattern 2: Additive Schema Migrations (No Destructive Changes)

**What:** Add nullable columns to the existing `submissions` table. Never drop or rename existing columns.

**When to use:** Any schema change in v1.1.

**Trade-offs:** Schema accumulates columns over time, but for a single SQLite table this is trivially manageable.

```typescript
// src/db/schema.ts — additions only
export const submissions = sqliteTable('submissions', {
  // ... all existing columns preserved ...
  serviceType: text('service_type'),        // NEW — nullable
  budget: text('budget'),                   // NEW — nullable
  timeline: text('timeline'),               // NEW — nullable
  leadScore: integer('lead_score').default(0),  // NEW
  leadStatus: text('lead_status').default('new'),
  notes: text('notes'),
  hubspotId: text('hubspot_id'),
  hubspotSyncedAt: text('hubspot_synced_at'),
});
```

Run `npx drizzle-kit generate` then `npx drizzle-kit migrate` to apply.

### Pattern 3: Fire-and-Forget External API Calls

**What:** HubSpot API call does not block the response to the user. Errors are caught and logged, not rethrown.

**When to use:** Any external service call that is not critical to the user-facing operation.

**Trade-offs:** Async failures are silent to the user. Admin must check `hubspot_id IS NULL` to find unsynced leads.

```typescript
// In /api/contact.ts — after DB insert succeeds
try {
  const hsId = await upsertContact({ email, name, ... });
  db.update(submissions).set({ hubspotId: hsId, hubspotSyncedAt: new Date().toISOString() })
    .where(eq(submissions.id, insertedId)).run();
} catch (err) {
  console.error('[HubSpot sync failed]', err);
  // Submission is already saved. User gets success response regardless.
}
```

### Pattern 4: URL-Param-Driven Server Filtering

**What:** Admin filters (status, score range, date) expressed as URL query params. Drizzle `where()` clauses built server-side in the Astro frontmatter.

**When to use:** The admin page is SSR (`prerender = false`). Server-side filtering is more efficient than fetching all records and filtering client-side.

**Trade-offs:** Full page reload on filter change (not a SPA). Acceptable for an internal admin tool used by a single admin.

```typescript
// In admin/index.astro frontmatter
const url = Astro.url;
const statusFilter = url.searchParams.get('status');
const minScore = Number(url.searchParams.get('minScore') ?? 0);

const query = db.select().from(submissions).orderBy(desc(submissions.createdAt));
// Conditionally add where clauses based on params
```

---

## Integration Points

### External Services

| Service | Integration Point | Auth | Failure Mode |
|---------|-------------------|------|--------------|
| Cal.com | Client-side embed script in BaseLayout head | None (public) | Script load failure → button does nothing |
| HubSpot CRM | Server-side `@hubspot/api-client` in `src/lib/hubspot.ts` | Private App token in env | Submission still saved; sync_at stays null |
| Resend | Existing `src/lib/email.ts`, unchanged | API key in env | Email fails silently (existing behavior) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `contact.astro` ↔ `multi-step-form.ts` | DOM events, form data collection | Form script reads step state, builds payload |
| `multi-step-form.ts` ↔ `/api/contact` | `fetch` POST, JSON | Same endpoint contract as v1.0, extended fields |
| `/api/contact` ↔ `lead-scoring.ts` | Direct import, pure function call | No I/O in scoring function |
| `/api/contact` ↔ `hubspot.ts` | Async import, awaited with try/catch | Fire-and-forget pattern |
| `admin/index.astro` ↔ `api/admin/*` | `fetch` POST from inline script | Same Basic Auth header pattern as v1.0 |
| `lead-signals.ts` ↔ `multi-step-form.ts` | `localStorage` read on submit | Behavioral signals collected passively |

---

## Build Order (v1.1 Dependencies)

The ordering reflects what must exist before the next thing can be built.

```
Phase 1: Schema Extension
  Modify src/db/schema.ts (add new columns to submissions)
  Run drizzle-kit migration
  Extend src/lib/validation.ts for new fields
  --> Everything downstream depends on the new schema existing

Phase 2: Lead Scoring
  Implement src/lib/lead-scoring.ts (pure function, no deps)
  Unit-testable independently
  --> Needed before API endpoint can compute scores

Phase 3: Extended API Endpoint
  Modify src/pages/api/contact.ts (accept new fields, call scorer, call HubSpot)
  Implement src/lib/hubspot.ts (HubSpot client wrapper)
  Add HUBSPOT_TOKEN to .env
  --> Depends on schema (Phase 1) and scoring (Phase 2)

Phase 4: Multi-Step Form (Frontend)
  New src/scripts/multi-step-form.ts (step state machine)
  New src/scripts/lead-signals.ts (behavioral tracker)
  New src/components/forms/ (StepIndicator, ServiceSelector)
  Modify src/pages/contact.astro (new form HTML)
  --> Depends on API endpoint being ready (Phase 3)

Phase 5: Cal.com Scheduling
  Add Cal.com script to BaseLayout.astro
  Add booking CTA to post-submission success state
  --> Depends on form success flow existing (Phase 4)

Phase 6: Lead Management Dashboard
  Modify src/pages/admin/index.astro (filtering, scores, status)
  New src/pages/api/admin/update-status.ts
  New src/pages/api/admin/update-notes.ts
  New src/pages/api/admin/sync-hubspot.ts
  --> Depends on score data existing (Phase 3) and HubSpot client (Phase 3)
```

---

## Anti-Patterns

### Anti-Pattern 1: Putting Scoring Logic in the Client

**What people do:** Compute lead score in the browser before sending to the server.

**Why it's wrong:** Client-supplied scores can be trivially manipulated. Any lead could set their own score to 100 by editing the payload. Scores are only meaningful if computed server-side from trusted inputs.

**Do this instead:** Score exclusively in `/api/contact` after server-side validation. The client never sees the scoring logic.

### Anti-Pattern 2: Blocking Form Submission on HubSpot

**What people do:** `await upsertContact()` and return an error to the user if HubSpot is down.

**Why it's wrong:** HubSpot has outages. The lead's form submission should never fail because a third-party CRM is temporarily unavailable. The SQLite record is the source of truth.

**Do this instead:** Fire-and-forget with try/catch. Log failures. Provide manual re-sync in admin dashboard.

### Anti-Pattern 3: Client-Side HubSpot API Calls

**What people do:** Call `https://api.hubapi.com` directly from the browser using a token embedded in JavaScript.

**Why it's wrong:** Exposes the HubSpot Private App token publicly. Anyone can extract it and access or corrupt the CRM data.

**Do this instead:** All HubSpot calls go through `/api/admin/sync-hubspot` or from `/api/contact` on the server. The token never leaves the server.

### Anti-Pattern 4: Separate DB Tables for Scores and Leads

**What people do:** Create a separate `lead_scores` table with a foreign key to `submissions`.

**Why it's wrong:** For this scale (agency site getting tens of leads/month), a JOIN to get a score alongside a submission adds complexity for no benefit. The `submissions` table is the one unit of work.

**Do this instead:** Add nullable columns directly to `submissions`. A score is an attribute of a submission, not a separate entity.

### Anti-Pattern 5: Framework Island for the Multi-Step Form

**What people do:** Reach for React/Vue for the multi-step form because "it has state."

**Why it's wrong:** Ships 40–100KB of framework JS for a 3–4 step form. The existing `contact-form.ts` is vanilla TypeScript and handles complex async behavior. A step state machine is straightforward to implement the same way.

**Do this instead:** Vanilla TypeScript class or object managing `currentStep`, `formData`, and rendering. Follows the exact pattern already established in the codebase.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (agency site, ~50 leads/month) | SQLite handles trivially. All patterns above are sufficient. No changes to infrastructure. |
| 10x growth (500 leads/month) | SQLite still fine. Consider moving HubSpot sync to a background queue if latency becomes noticeable. |
| 100x growth (5000 leads/month) | At this point, evaluate Postgres migration for concurrent writes. HubSpot sync should move off the request path entirely (queue + worker). |

This is an agency marketing site. Reaching 5000 leads/month would be extraordinary success and would justify infrastructure investment. The current architecture handles the realistic growth curve without changes.

---

## Sources

- Existing codebase: `src/pages/api/contact.ts`, `src/db/schema.ts`, `src/db/index.ts`, `src/scripts/contact-form.ts`, `src/pages/admin/index.astro`
- [Cal.com Embed Documentation](https://cal.com/help/embedding/adding-embed)
- [Cal.com Embed Features](https://cal.com/resources/feature/embed)
- [HubSpot Node.js API Client](https://github.com/HubSpot/hubspot-api-nodejs)
- [HubSpot CRM Contacts API v3](https://developers.hubspot.com/docs/api-reference/crm-contacts-v3/guide)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Astro Share State Between Islands](https://docs.astro.build/en/recipes/sharing-state-islands/)
- [Astro Server Endpoints](https://docs.astro.build/en/guides/endpoints/)

---
*Architecture research for: Astro + SQLite lead conversion engine (v1.1)*
*Researched: 2026-03-11*
