# Phase 10: Lead Management Dashboard - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade the existing admin submissions page (`src/pages/admin/index.astro`) into a full lead management dashboard with compact expandable lead cards, status workflow dropdown, inline notes editing, server-side filtering/sorting via URL params, pagination, and Cal.com booking visibility. All 7 DASH requirements are in scope. No new database columns needed — all fields exist from prior phases.

</domain>

<decisions>
## Implementation Decisions

### Lead Card Layout & Info Density
- Compact row by default: name, email, score badge, status badge, service type, date, booking badge (if booked), note icon (if has note)
- Click to expand: reveals message text, notes editor, budget/timeline, Cal.com booking details (UID + scheduled time), HubSpot link/sync button, status change dropdown, IP address
- Keep indigo left border for unread leads (consistent with current admin)
- Expanded panel animates with slide-down height transition, gated on `prefers-reduced-motion`
- Cal.com booking shows as a "Booked" green badge in the compact row if `cal_booking_uid` is set
- Note icon (small) in compact row if `notes` is non-null/non-empty

### Status Workflow Interaction
- Dropdown select in the expanded view — styled glass select matching the form selects from Phase 8
- All statuses available at all times — no strict workflow order enforcement. Admin can jump to any status
- Status values: `new`, `contacted`, `qualified`, `proposal_sent`, `won`, `lost`
- Human-friendly labels: "New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"
- Save via inline AJAX (same pattern as toggle-read) — instant update to badge in compact row
- New API endpoint: `POST /api/admin/update-status` — takes `{ id, status }`, validates status against allowed values
- Semantic badge colors per status: new=indigo, contacted=blue, qualified=amber, proposal_sent=purple, won=green, lost=red

### Filtering & Sorting Controls
- Horizontal toolbar (glass-panel bar) above the lead list with dropdowns: Status, Service Type, Min Score, Sort By
- Server-side filtering: query params `?status=qualified&service=web_dev&min_score=50&sort=score&page=2`
- Drizzle query builds WHERE clauses from URL params, applies ORDER BY and LIMIT/OFFSET
- Page URL updates on filter/sort change (form submission or JS `window.location` update)
- Default sort: newest first (createdAt DESC) — same as current admin
- Sort options: Date (newest), Date (oldest), Score (highest), Score (lowest)
- Empty filter state: "All" — no filter applied for that dimension
- Active filters visually highlighted in toolbar

### Pagination
- 25 leads per page
- Previous/Next buttons + page number display ("Page 2 of 5")
- Page param in URL: `?page=2` — combined with filter params
- Drizzle query uses `.limit(25).offset((page - 1) * 25)`
- Total count query for page count calculation
- Show total lead count: "Showing 26-50 of 127 leads"

### Notes Editing UX
- Inline glass-styled textarea in expanded view, pre-filled with existing note text
- Explicit "Save Note" button below textarea — no auto-save
- AJAX save via new endpoint: `POST /api/admin/update-notes` — takes `{ id, notes }`
- Save confirmation: brief "Saved" text flash next to button, then reverts
- Small note icon in compact row if note exists — visual indicator without cluttering

### Preserved Behaviors
- "Mark as Read/Unread" toggle — keep existing functionality (toggle-read API)
- "Sync to HubSpot" button — keep existing functionality (hubspot-sync API)
- "View in HubSpot" link — keep existing functionality with portal ID
- Basic Auth — keep existing authentication pattern
- Score badges (cold/warm/hot) — keep existing color coding
- Rate Limited badge — keep existing display

### Claude's Discretion
- Exact CSS for compact row layout (flex spacing, badge sizing)
- Exact expanded panel internal layout
- Pagination control styling
- Filter toolbar responsive behavior on mobile
- Whether to use `<select>` elements or custom dropdowns for filters
- Exact transition timing for expand/collapse animation
- "No results" empty state text when filters return zero leads

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Admin Implementation
- `src/pages/admin/index.astro` — Current admin page to upgrade: HTML structure, inline script handlers, all CSS
- `src/pages/api/admin/toggle-read.ts` — Existing inline AJAX pattern for admin actions
- `src/pages/api/admin/hubspot-sync.ts` — Existing HubSpot sync endpoint pattern

### Database & Scoring
- `src/db/schema.ts` — Full submissions table schema with all columns
- `src/lib/scoring.ts` — `scoreToTier()` function for score badge rendering
- `src/lib/auth.ts` — Shared `requireBasicAuth` helper for admin API endpoints

### Prior Phase Decisions
- `.planning/phases/07-extended-api-hubspot/07-CONTEXT.md` — HubSpot badge pattern, shared auth helper
- `.planning/phases/08-multi-step-form-frontend/08-CONTEXT.md` — Glass select styling, form field patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/pages/admin/index.astro`: Full admin page — upgrade in place, don't create new page
- `src/pages/api/admin/toggle-read.ts`: Inline AJAX pattern — replicate for status update and notes save
- `src/lib/auth.ts`: `requireBasicAuth()` — use for new API endpoints
- `src/lib/scoring.ts`: `scoreToTier()` — already used for badge coloring
- `.glass-panel`, `.badge-score-*`, `.btn-toggle-read` CSS patterns — extend for new badges and controls

### Established Patterns
- Admin API endpoints: POST with JSON body, Basic Auth via shared helper, return `{success: true/false}`
- Badge styling: `display: inline-block; padding: 0.2rem 0.6rem; border-radius: 50px; font-size: 0.7rem; font-weight: 600;` with color-specific backgrounds
- AJAX handlers: `astro:page-load` event listener, fetch with `Content-Type: application/json`, inline DOM updates on success
- Glass inputs: `.glass-input` class from contact form — reuse for filter dropdowns

### Integration Points
- `src/pages/admin/index.astro`: Primary file to rewrite — HTML, script, and CSS
- `src/pages/api/admin/`: Two new endpoints (update-status, update-notes)
- `src/db/schema.ts`: No changes needed — all columns exist
- Drizzle query in admin page frontmatter: currently `.all()` — change to filtered/paginated query

</code_context>

<specifics>
## Specific Ideas

- The compact row should feel like a clean data row, not a mini-card — think linear.app issue list density
- Status badges should be immediately scannable — distinct colors so admin can visually "heat map" the pipeline
- Filter toolbar should feel like part of the dashboard, not a separate control panel — same glass aesthetic

</specifics>

<deferred>
## Deferred Ideas

- Form analytics per step (drop-off rates) — listed as ADMIN-02 in v2 requirements
- Multi-admin user management — listed as ADMIN-01 in v2 requirements
- Booking status display (scheduled time) in compact row — could add later if booking volume grows

</deferred>

---

*Phase: 10-lead-management-dashboard*
*Context gathered: 2026-03-25*
