# Phase 6: Lead Scoring Engine - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a pure scoring function that computes a 0-100 lead score from form data using configurable weights, classifies leads into cold/warm/hot tiers, and displays color-coded score badges in the existing admin page. No form changes — scoring logic and admin display only.

</domain>

<decisions>
## Implementation Decisions

### Signal Weight Priorities
- Budget is the highest-weight signal — higher budget = higher intent
- Service type weight: Claude's discretion based on typical agency deal patterns
- Company presence gives a moderate boost (~10-15 points) — indicates business lead
- Message length is a scoring signal — longer messages suggest higher intent, tiered by character count
- Missing optional fields (budget, timeline) score 0 points for that signal — no artificial floor or redistribution

### Weight Format
- Weights expressed as max points per signal (e.g. budget: 35, timeline: 25, company: 15, message: 15, service: 10)
- Total max points = 100
- Each signal contributes 0 to N points based on the submitted value

### Tier Thresholds
- Cold: 0-30, Warm: 31-60, Hot: 61-100 (from roadmap)
- Thresholds are configurable in the same config file as weights

### Score Badge Display
- Traffic light colors: Hot = green, Warm = amber, Cold = red
- Badge shows tier label + numeric score (e.g. "HOT 85", "COLD 12")
- Placed in the submission card header row, alongside date and read/unread indicator (consistent with existing rate-limited badge)
- NULL scores (v1.0 submissions) show dimmed "N/A" badge

### Config Structure
- Dedicated config file: `src/lib/scoring-config.ts` (separate from scoring logic)
- Self-documenting: each weight has inline comments explaining what it scores and why
- Tier thresholds also configurable in same file

### Edge Cases
- Missing optional fields = 0 points for that signal (no default assumption)
- No artificial score floor — bare submission (name + email + short message) scores as low as the formula gives
- `scoreLead()` trusts the caller — no internal validation (contact API already validates)
- No backfill of v1.0 submissions — only new submissions get scored

### Claude's Discretion
- Exact point values for each budget/timeline/service tier within the weight allocation
- Message length thresholds (what counts as short/medium/long)
- Service type weight distribution across web_dev, devops, analytics
- Internal scoring function structure and helper organization
- Exact badge CSS (follows existing badge pattern from rate-limited badge)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — standard patterns apply. Follow the existing badge styling conventions from the admin page (pill-shaped badges with semi-transparent backgrounds and colored borders).

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/schema.ts`: `leadScore` (integer) and `leadStatus` (text, default 'new') columns already exist
- `src/pages/admin/index.astro`: Existing badge pattern (`.badge-rate-limited`, `.read-indicator`) — score badges follow same CSS structure
- `src/lib/validation.ts`: Contact validation already handles input checking — scoring function doesn't need to re-validate

### Established Patterns
- Badges use pill shape with `border-radius: 50px`, semi-transparent `background`, colored `border`, uppercase text
- Admin page uses `glass-panel` cards with header/contact/message/footer sections
- Drizzle ORM with `db.insert().values()` pattern for database writes

### Integration Points
- `src/pages/api/contact.ts`: Will call `scoreLead()` in Phase 7 (not this phase — Phase 6 builds the function only)
- `src/pages/admin/index.astro`: Add score badge to submission card header (this phase)
- `src/db/schema.ts`: `leadScore` column already exists — no schema changes needed

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-lead-scoring-engine*
*Context gathered: 2026-03-15*
