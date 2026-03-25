# Phase 10: Lead Management Dashboard - Research

**Researched:** 2026-03-25
**Domain:** Astro admin page upgrade — server-side filtering, pagination, AJAX actions, expandable card UI
**Confidence:** HIGH

## Summary

Phase 10 is a pure upgrade of the existing `src/pages/admin/index.astro` page. No new database columns are needed — all schema columns exist. The work is: (1) replace the current unbounded `.all()` query with a filtered/paginated Drizzle query driven by URL params; (2) restructure the card HTML from its current expanded-card format into a compact-row/expand-panel layout; (3) add two new API endpoints (`update-status`, `update-notes`) that follow the exact same pattern as `toggle-read.ts`; (4) add a glass filter toolbar above the list.

Every piece of infrastructure is already in place: Drizzle with better-sqlite3, `checkBasicAuth`, `scoreToTier`, `.glass-panel`/badge CSS patterns, and the AJAX handler idiom (`astro:page-load` → `fetch` → DOM update). This phase is primarily HTML/CSS/JS composition inside Astro, plus two straightforward DB-update endpoints.

**Primary recommendation:** Upgrade in-place. Copy the established `toggle-read.ts` shape for both new endpoints. Build the filtered Drizzle query in the frontmatter using `and()` + conditional `where` clauses with `.limit(25).offset()` and a separate count query.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Upgrade existing `src/pages/admin/index.astro` in place — no new page
- Compact row by default: name, email, score badge, status badge, service type, date, booking badge (if booked), note icon (if has note)
- Click to expand: reveals message, notes editor, budget/timeline, Cal.com booking details, HubSpot link/sync button, status change dropdown, IP
- Indigo left border for unread leads
- Expanded panel animates slide-down height transition, gated on `prefers-reduced-motion`
- Cal.com booking shows "Booked" green badge in compact row if `cal_booking_uid` is set
- Note icon in compact row if `notes` is non-null/non-empty
- Status dropdown in expanded view only — glass select matching Phase 8 form selects
- All statuses available at all times — no strict ordering enforcement
- Status values: `new`, `contacted`, `qualified`, `proposal_sent`, `won`, `lost`
- Labels: "New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"
- Status save via AJAX — instant badge update in compact row
- New endpoint: `POST /api/admin/update-status` — takes `{ id, status }`, validates against allowed list
- Status badge colors: new=indigo, contacted=blue, qualified=amber, proposal_sent=purple, won=green, lost=red
- Horizontal glass toolbar above lead list with dropdowns: Status, Service Type, Min Score, Sort By
- Server-side filtering via URL params: `?status=qualified&service=web_dev&min_score=50&sort=score&page=2`
- Page URL updates on filter/sort change
- Default sort: newest first (createdAt DESC)
- Sort options: Date (newest), Date (oldest), Score (highest), Score (lowest)
- Empty filter state: "All" — no filter for that dimension
- Active filters visually highlighted in toolbar
- 25 leads per page
- Previous/Next buttons + page number display ("Page 2 of 5")
- Page param in URL: `?page=2` — combined with filter params
- Drizzle uses `.limit(25).offset((page - 1) * 25)`
- Total count query for page count
- Show "Showing 26–50 of 127 leads"
- Inline glass textarea in expanded view for notes, pre-filled with existing text
- Explicit "Save Note" button — no auto-save
- AJAX save: `POST /api/admin/update-notes` — takes `{ id, notes }`
- "Saved" flash confirmation, then reverts
- Small note icon in compact row if note exists
- Preserve: toggle-read, HubSpot sync button, "View in HubSpot" link, Basic Auth, score badges, Rate Limited badge

### Claude's Discretion

- Exact CSS for compact row layout (flex spacing, badge sizing)
- Exact expanded panel internal layout
- Pagination control styling
- Filter toolbar responsive behavior on mobile
- Whether to use `<select>` elements or custom dropdowns for filters (use `<select>` — matches Phase 8 pattern)
- Exact transition timing for expand/collapse animation
- "No results" empty state text when filters return zero leads

### Deferred Ideas (OUT OF SCOPE)

- Form analytics per step (drop-off rates) — ADMIN-02
- Multi-admin user management — ADMIN-01
- Booking status display (scheduled time) in compact row
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Admin can view leads with score badges, status, and submission details | Schema has all columns; existing `scoreToTier()` and badge CSS reusable; compact row pattern defined |
| DASH-02 | Admin can update lead status through workflow (new/contacted/qualified/proposal_sent/won/lost) | `update-status` endpoint follows `toggle-read.ts` shape; `leadStatus` column exists; AJAX DOM update pattern established |
| DASH-03 | Admin can add and edit notes on each lead | `notes` column exists (text, nullable); `update-notes` endpoint follows same shape; inline textarea in expanded panel |
| DASH-04 | Admin can sort leads by score, date, or status | Drizzle `orderBy()` with conditional direction; sort param in URL; four options defined |
| DASH-05 | Admin can filter leads by status, service type, and minimum score via URL params | Drizzle `and()` + conditional `where` clauses; `Astro.url.searchParams` for param extraction |
| DASH-06 | Dashboard paginates results | `.limit(25).offset((page-1)*25)` + separate count query; `count()` from drizzle-orm |
| DASH-07 | Dashboard shows HubSpot sync status and direct link per lead | `hubspotId` and `hubspotSyncedAt` columns exist; existing badge/link HTML already in admin page |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | already installed | Filtered/paginated DB queries | Project ORM — all queries use this |
| better-sqlite3 | already installed | SQLite driver | Configured in `src/db/index.ts` |
| Astro (SSR) | already installed | Server-side rendering, URL param access | `export const prerender = false` pattern established |

### Drizzle Query Operators Needed
| Operator | Import | Purpose |
|----------|--------|---------|
| `and` | `drizzle-orm` | Combine multiple WHERE conditions |
| `eq` | `drizzle-orm` | WHERE field = value |
| `gte` | `drizzle-orm` | WHERE lead_score >= min_score |
| `desc` | `drizzle-orm` | ORDER BY DESC |
| `asc` | `drizzle-orm` | ORDER BY ASC |
| `count` | `drizzle-orm` | SELECT COUNT(*) for pagination total |
| `sql` | `drizzle-orm` | Raw SQL fragments if needed |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure

No new files/folders needed beyond:
```
src/pages/admin/
└── index.astro              # Upgrade in place

src/pages/api/admin/
├── toggle-read.ts           # Existing — preserve unchanged
├── hubspot-sync.ts          # Existing — preserve unchanged
├── update-status.ts         # NEW — Phase 10
└── update-notes.ts          # NEW — Phase 10
```

### Pattern 1: Server-Side Filtering in Astro Frontmatter

Extract URL params via `Astro.url.searchParams`, build conditional Drizzle WHERE clauses, execute two queries (data + count).

```typescript
// Source: established Drizzle + Astro SSR pattern in this project
const url = Astro.url;
const statusParam = url.searchParams.get('status') || '';
const serviceParam = url.searchParams.get('service') || '';
const minScoreParam = parseInt(url.searchParams.get('min_score') || '0', 10);
const sortParam = url.searchParams.get('sort') || 'date_desc';
const pageParam = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));

const PAGE_SIZE = 25;

const conditions = [];
if (statusParam) conditions.push(eq(submissions.leadStatus, statusParam));
if (serviceParam) conditions.push(eq(submissions.serviceType, serviceParam));
if (minScoreParam > 0) conditions.push(gte(submissions.leadScore, minScoreParam));

const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

const orderByClause =
  sortParam === 'score_desc' ? desc(submissions.leadScore) :
  sortParam === 'score_asc'  ? asc(submissions.leadScore) :
  sortParam === 'date_asc'   ? asc(submissions.createdAt) :
  desc(submissions.createdAt); // default: date_desc

const totalResult = db
  .select({ count: count() })
  .from(submissions)
  .where(whereClause)
  .get();
const totalCount = totalResult?.count ?? 0;
const totalPages = Math.ceil(totalCount / PAGE_SIZE);

const leads = db
  .select()
  .from(submissions)
  .where(whereClause)
  .orderBy(orderByClause)
  .limit(PAGE_SIZE)
  .offset((pageParam - 1) * PAGE_SIZE)
  .all();
```

### Pattern 2: New API Endpoint (update-status)

Follows `toggle-read.ts` exactly — same file shape, same validation style.

```typescript
// Source: src/pages/api/admin/toggle-read.ts (existing project pattern)
const ALLOWED_STATUSES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];

// Body validation
const { id, status } = body;
if (!id || typeof id !== 'number') { /* 400 */ }
if (!status || !ALLOWED_STATUSES.includes(status)) { /* 400 */ }

// DB update
db.update(submissions)
  .set({ leadStatus: status })
  .where(eq(submissions.id, id))
  .run();

return new Response(JSON.stringify({ success: true, status }), { ... });
```

### Pattern 3: Expand/Collapse Card

Use a CSS `max-height` height transition with `overflow: hidden`. Toggle a `.expanded` class via JS click on the compact row.

```typescript
// Source: Phase 8 pattern — prefers-reduced-motion gate
card.addEventListener('click', (e) => {
  // Don't expand when clicking interactive elements (buttons, links, selects)
  if ((e.target as HTMLElement).closest('button, a, select, textarea')) return;
  card.classList.toggle('expanded');
});
```

```css
/* Gated on prefers-reduced-motion (Claude's discretion for timing) */
.lead-panel {
  max-height: 0;
  overflow: hidden;
}

@media (prefers-reduced-motion: no-preference) {
  .lead-panel {
    transition: max-height 0.3s ease;
  }
}

.lead-row.expanded .lead-panel {
  max-height: 600px; /* generous ceiling — actual content is shorter */
}
```

### Pattern 4: Filter Toolbar Form Submission

Use a `<form method="get">` with `<select>` elements. On change, submit the form — the browser updates URL params naturally. No JS required for basic filter application.

```html
<form method="get" class="filter-toolbar glass-panel">
  <select name="status" class="glass-input">
    <option value="">All Statuses</option>
    <option value="new" selected={statusParam === 'new'}>New</option>
    ...
  </select>
  <!-- Reset page to 1 on filter change — hidden input -->
  <input type="hidden" name="page" value="1" />
  <button type="submit" class="btn">Apply</button>
</form>
```

For JS-enhanced instant filter: `select.addEventListener('change', () => form.submit())`.

### Pattern 5: Pagination URL Construction

Build pagination links that preserve current filter params.

```typescript
// In frontmatter — build URL for prev/next
function buildUrl(overrides: Record<string, string | number>) {
  const params = new URLSearchParams();
  if (statusParam) params.set('status', statusParam);
  if (serviceParam) params.set('service', serviceParam);
  if (minScoreParam > 0) params.set('min_score', String(minScoreParam));
  if (sortParam !== 'date_desc') params.set('sort', sortParam);
  for (const [k, v] of Object.entries(overrides)) params.set(k, String(v));
  return `/admin?${params.toString()}`;
}

const prevUrl = pageParam > 1 ? buildUrl({ page: pageParam - 1 }) : null;
const nextUrl = pageParam < totalPages ? buildUrl({ page: pageParam + 1 }) : null;
```

### Anti-Patterns to Avoid

- **Expanding via `display: none` toggle:** Does not animate. Use `max-height` transition instead.
- **Auto-saving notes on keyup:** Creates excessive API calls and confusing UX. Use explicit Save button as decided.
- **Rebuilding filter state in JS:** Filter toolbar is a `<form method="get">` — the browser handles URL updates natively.
- **Calling `.all()` without LIMIT for pagination:** The entire point of DASH-06. Always use `.limit().offset()`.
- **Forgetting to reset page to 1 on filter change:** Stale page param after filter change shows "Page 3 of 1" type errors. Always reset to page=1 when filters change.
- **Using `height: auto` in CSS transition:** CSS cannot transition to `auto`. Must use explicit `max-height`.
- **Expanding on any click without excluding interactive children:** Status dropdown, note textarea, Save button, HubSpot link — clicks on these must not toggle expand/collapse. Use `e.target.closest('button, a, select, textarea')` guard.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Score tier label | Custom logic | `scoreToTier()` from `src/lib/scoring.ts` | Already battle-tested, handles null check |
| Basic Auth check | Inline header parsing | `checkBasicAuth(request)` from `src/lib/auth.ts` | Shared helper — all admin endpoints use it |
| SQL WHERE conditions | String concatenation | `and()`, `eq()`, `gte()` from drizzle-orm | Type-safe, injection-proof |
| Count query | Raw SQL | `count()` from drizzle-orm | Already in dependency, no extra install |

## Common Pitfalls

### Pitfall 1: `count()` import from drizzle-orm
**What goes wrong:** Developer tries `db.select({ count: sql\`count(*)\` })` or forgets to import `count`.
**Why it happens:** `count` is less commonly imported than `eq`/`desc`.
**How to avoid:** Import `count` from `drizzle-orm` alongside `eq`, `desc`, `and`.
**Warning signs:** TypeScript error on `count` call.

### Pitfall 2: `null` leadScore in gte() filter
**What goes wrong:** `gte(submissions.leadScore, minScore)` silently skips leads with `leadScore = null` in SQLite — this is correct SQL behavior (NULL comparisons are false), but it may surprise if some leads have no score.
**Why it happens:** `leadScore` is nullable in schema.
**How to avoid:** This is acceptable — no-score leads are excluded from min_score filter. Document it; don't fight it.

### Pitfall 3: Stale page param after filter change
**What goes wrong:** User on page 3, changes status filter — new filter may have only 1 page, but page=3 is preserved, showing empty results.
**Why it happens:** Filter form submits all params including current page.
**How to avoid:** Include a hidden `<input type="hidden" name="page" value="1">` inside the filter form, or reset via JS before submit.

### Pitfall 4: `max-height` transition ceiling too low
**What goes wrong:** Expanded panel content is cut off at the `max-height` value.
**Why it happens:** Content (notes, message, booking details) varies in length.
**How to avoid:** Set a generous ceiling (600px or 800px) — transition speed scales to actual content height visually.

### Pitfall 5: Click handler on compact row catches child element events
**What goes wrong:** Clicking the status dropdown or Save Note button also collapses/expands the card.
**Why it happens:** Event bubbles up to the row click handler.
**How to avoid:** Early return in click handler: `if (e.target.closest('button, a, select, textarea')) return;`

### Pitfall 6: AJAX status/notes save uses stale DOM reference
**What goes wrong:** After saving status, the badge DOM element may not match the expected selector if it was dynamically created.
**Why it happens:** The badge was set during initial render with server-side class, and JS targets it by class.
**How to avoid:** Use `card.querySelector('.badge-status')` scoped to the current card — same pattern as toggle-read.ts using `btn.closest('.submission-card')`.

### Pitfall 7: `and()` called with empty array
**What goes wrong:** `db.select().from(submissions).where(and()).all()` — calling `and()` with zero arguments may throw or produce unexpected SQL depending on drizzle-orm version.
**Why it happens:** Conditionally building the conditions array and always passing it to `and()`.
**How to avoid:** Only call `and(...conditions)` when `conditions.length > 0`; pass `undefined` to `.where()` when no conditions exist. Pattern shown in Pattern 1 above.

## Code Examples

### Complete Drizzle Filtered+Paginated Query
```typescript
// Source: Drizzle ORM better-sqlite3 + project patterns
import { db } from '../../db';
import { submissions } from '../../db/schema';
import { and, eq, gte, desc, asc, count } from 'drizzle-orm';

const conditions = [];
if (statusParam) conditions.push(eq(submissions.leadStatus, statusParam));
if (serviceParam) conditions.push(eq(submissions.serviceType, serviceParam));
if (minScoreParam > 0) conditions.push(gte(submissions.leadScore, minScoreParam));
const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

const { count: totalCount } = db
  .select({ count: count() })
  .from(submissions)
  .where(whereClause)
  .get()!;

const leads = db
  .select()
  .from(submissions)
  .where(whereClause)
  .orderBy(orderByClause)
  .limit(25)
  .offset((page - 1) * 25)
  .all();
```

### update-status.ts Endpoint
```typescript
// Source: toggle-read.ts pattern (src/pages/api/admin/toggle-read.ts)
import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { submissions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { checkBasicAuth } from '../../../lib/auth';

export const prerender = false;

const ALLOWED_STATUSES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'] as const;

export const POST: APIRoute = async ({ request }) => {
  if (!checkBasicAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }
  let body: { id?: number; status?: string };
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!body.id || typeof body.id !== 'number') {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!body.status || !(ALLOWED_STATUSES as readonly string[]).includes(body.status)) {
    return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  db.update(submissions).set({ leadStatus: body.status }).where(eq(submissions.id, body.id)).run();
  return new Response(JSON.stringify({ success: true, status: body.status }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
```

### Status Badge Color Map
```typescript
// In Astro template (frontmatter or inline)
const STATUS_BADGE_CLASSES: Record<string, string> = {
  new:           'badge-status-new',       // indigo
  contacted:     'badge-status-contacted', // blue
  qualified:     'badge-status-qualified', // amber
  proposal_sent: 'badge-status-proposal',  // purple
  won:           'badge-status-won',       // green
  lost:          'badge-status-lost',      // red
};
```

```css
/* Follow exact same pattern as .badge-score-* */
.badge-status-new       { background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
.badge-status-contacted { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
.badge-status-qualified { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
.badge-status-proposal  { background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); }
.badge-status-won       { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
.badge-status-lost      { background: rgba(239,68,68,0.15);  color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
```

### AJAX Status Update Handler
```typescript
// Source: toggle-read.ts AJAX pattern — same structure
card.querySelector('.status-select')?.addEventListener('change', async (e) => {
  const select = e.target as HTMLSelectElement;
  const id = Number(card.getAttribute('data-id'));
  const status = select.value;

  const res = await fetch('/api/admin/update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  if (res.status === 401) { window.location.reload(); return; }

  const data = await res.json();
  if (data.success) {
    const badge = card.querySelector('.badge-status') as HTMLElement;
    badge.className = `badge-status ${STATUS_BADGE_CLASSES[status]}`;
    badge.textContent = STATUS_LABELS[status];
  }
});
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `.all()` unbounded query | `.limit(25).offset()` + count query | DASH-06 compliance, prevents full table scan |
| Single expanded card layout | Compact row + expand panel | Linear.app-style density, more leads visible |
| No filtering | URL param filters + Drizzle WHERE | DASH-04, DASH-05 compliance |

## Open Questions

1. **`count()` behavior with `null` leadScore in min_score filter**
   - What we know: SQLite NULL comparison via `gte` returns false — leads with no score are excluded from min_score-filtered views
   - What's unclear: Whether this is the desired behavior or if null-score leads should always appear
   - Recommendation: Exclude null-score leads from score filter — consistent with SQL semantics, acceptable for admin use

2. **Cal.com `calScheduledAt` display format**
   - What we know: Column exists as text (ISO string); `calBookingUid` also stored
   - What's unclear: Whether to show the scheduled time in the expanded panel or just the UID
   - Recommendation: Show both in expanded panel (`calScheduledAt` formatted via `formatDate()`); compact row shows "Booked" badge only (locked decision)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test framework is configured") |
| Config file | none |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Score badge, status, submission details visible | manual-only | N/A — no test framework | N/A |
| DASH-02 | Status change via dropdown persists | manual-only | N/A | N/A |
| DASH-03 | Notes save and reload | manual-only | N/A | N/A |
| DASH-04 | Sort by score/date changes order | manual-only | N/A | N/A |
| DASH-05 | Filter params reflected in URL and results | manual-only | N/A | N/A |
| DASH-06 | 25-lead page cap, pagination controls work | manual-only | N/A | N/A |
| DASH-07 | HubSpot badge and link display | manual-only | N/A | N/A |

**Manual verification checklist (for `/gsd:verify-work`):**
- Load `/admin?page=1` — see compact rows, pagination controls
- Load `/admin?status=new` — only new leads shown, URL param reflected in toolbar
- Load `/admin?sort=score_desc` — leads ordered by score descending
- Load `/admin?min_score=50` — only leads with score >= 50 shown
- Load `/admin?page=2` — page 2 results, "Page 2 of N" shown
- Click any lead row — panel expands with animation
- Change status dropdown — badge updates in compact row immediately
- Edit note, click Save Note — "Saved" flash appears
- HubSpot synced lead — "Synced" badge + "View in HubSpot" link in expanded panel

### Wave 0 Gaps
- No test infrastructure to create — project has no test framework by design

## Sources

### Primary (HIGH confidence)
- `src/pages/admin/index.astro` — full current admin page: HTML structure, CSS, AJAX handlers
- `src/pages/api/admin/toggle-read.ts` — canonical admin API endpoint pattern
- `src/pages/api/admin/hubspot-sync.ts` — canonical admin API endpoint with awaited async
- `src/db/schema.ts` — full schema: all columns confirmed present, no migrations needed
- `src/lib/auth.ts` — `checkBasicAuth()` helper
- `src/lib/scoring.ts` — `scoreToTier()` function
- `src/db/index.ts` — Drizzle setup: better-sqlite3, WAL mode
- `.planning/phases/10-lead-management-dashboard/10-CONTEXT.md` — locked decisions
- `.planning/REQUIREMENTS.md` — DASH-01 through DASH-07

### Secondary (MEDIUM confidence)
- Drizzle ORM docs — `and()`, `count()`, `gte()`, `limit()`, `offset()` operator shapes confirmed via prior phases and standard Drizzle API

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed and in use
- Architecture: HIGH — all patterns directly derived from existing codebase
- Pitfalls: HIGH — identified from concrete code inspection, not speculation
- Validation: HIGH — no test framework; manual checklist is the established verification method

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable — no new packages, no external APIs)
