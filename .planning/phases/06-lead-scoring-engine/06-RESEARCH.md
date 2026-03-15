# Phase 6: Lead Scoring Engine - Research

**Researched:** 2026-03-15
**Domain:** Pure TypeScript scoring function, configurable rule-based scoring, admin badge display
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Signal weights (max points):** budget: 35, timeline: 25, company: 15, message: 15, service: 10 — total = 100
- **Missing optional fields:** score 0 for that signal — no artificial floor, no redistribution
- **Tier thresholds:** Cold 0-30, Warm 31-60, Hot 61-100 — configurable in the same file as weights
- **Config location:** `src/lib/scoring-config.ts` — dedicated file, separate from scoring logic
- **Scoring function:** `scoreLead()` — pure function, no internal validation (contact API already validates)
- **No schema changes:** `leadScore` integer column already exists in `submissions` table
- **No backfill:** v1.0 submissions stay NULL; only new submissions get scored (Phase 7 writes the score)
- **Badge placement:** Submission card header row, alongside date and read/unread indicator
- **Badge colors:** Hot = green, Warm = amber, Cold = red (traffic light)
- **Badge format:** tier label + numeric score ("HOT 85", "WARM 42", "COLD 12"); NULL = dimmed "N/A"
- **Badge CSS:** Follows `.badge-rate-limited` pattern — pill shape, semi-transparent background, colored border
- **No form changes in Phase 6:** Phase 6 builds the function and admin display only; Phase 7 wires it into the API

### Claude's Discretion

- Exact point values for each budget/timeline/service tier within the weight allocation
- Message length thresholds (what counts as short/medium/long)
- Service type weight distribution across web_dev, devops, analytics
- Internal scoring function structure and helper organization
- Exact badge CSS values (follows existing badge pattern from rate-limited badge)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCORE-01 | System computes a lead score (0-100) from form data on submission (service type, budget, timeline, company, message length) | Scoring function design and signal breakdown documented below |
| SCORE-02 | Lead scores are stored in SQLite and displayed with color-coded tiers (cold/warm/hot) in the admin dashboard | `leadScore` column already in schema; admin badge CSS pattern extracted from existing code |
| SCORE-03 | Scoring weights are defined in a configurable server-side config object | Config file structure and self-documenting pattern documented below |
</phase_requirements>

---

## Summary

Phase 6 is a pure TypeScript implementation phase. There are no new external libraries to install — the entire deliverable is two new files (`src/lib/scoring-config.ts` and `src/lib/scoring.ts`) plus additions to the existing admin page Astro component.

The scoring function is a simple weighted point accumulation: each signal contributes 0 to N points based on the submitted value, the raw integer is clamped to [0, 100], and a tier string is derived from configurable thresholds. The function is deliberately kept separate from validation (the contact API handles that upstream) and separate from database writes (Phase 7 handles the integration).

The admin badge display follows the exact same CSS pattern as the existing `.badge-rate-limited` badge — pill shape, `border-radius: 50px`, semi-transparent background, colored border. Three variants are needed (hot/warm/cold) plus a dimmed N/A state for legacy NULL rows.

**Primary recommendation:** Build `scoreLead()` as a pure function that takes a single typed payload object and returns `{ score: number; tier: 'cold' | 'warm' | 'hot' }`. Keep all scoring constants in `scoring-config.ts` and import them in `scoring.ts`. Add badge markup and CSS directly to the existing admin Astro file.

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | Project default | Type-safe scoring config and function | Already used throughout src/lib/ |
| Drizzle ORM | Project default | DB read in admin page | Already used — `leadScore` column present |
| Astro | Project default | Admin page rendering | Already used |

### No New Dependencies Required

This phase has zero npm installs. All required capabilities (typed objects, arithmetic, string comparison) are native TypeScript. The only integration points are internal project files.

---

## Architecture Patterns

### Recommended File Layout

```
src/lib/
├── scoring-config.ts   # NEW — weights, tier thresholds, budget/timeline/service enums
├── scoring.ts          # NEW — scoreLead() pure function, scoreToTier() helper
├── validation.ts       # EXISTING — unchanged
├── rate-limiter.ts     # EXISTING — unchanged
└── email.ts            # EXISTING — unchanged

src/pages/admin/
└── index.astro         # EXISTING — add badge markup + CSS only
```

### Pattern 1: Config-First Design

**What:** All numeric constants live in `scoring-config.ts`. The scoring function imports the config and contains zero magic numbers.

**When to use:** Always — makes weights auditable and tunable without touching logic.

```typescript
// src/lib/scoring-config.ts

/** Maximum points contributed by each signal. Must sum to 100. */
export const SIGNAL_WEIGHTS = {
  /** Higher budget = stronger purchase intent */
  budget: 35,
  /** Faster timeline = more urgent need */
  timeline: 25,
  /** Company name present = business lead, not personal inquiry */
  company: 15,
  /** Longer message = more thought invested = higher intent */
  message: 15,
  /** Service type indicates deal complexity and fit */
  service: 10,
} as const;

/** Score ranges for lead tier classification */
export const TIER_THRESHOLDS = {
  warm: 31,  // scores >= 31 are warm
  hot: 61,   // scores >= 61 are hot
  // scores < 31 are cold
} as const;

export type LeadTier = 'cold' | 'warm' | 'hot';
```

### Pattern 2: Pure Scoring Function

**What:** `scoreLead()` takes a payload, sums signal points, returns `{ score, tier }`. No side effects.

**When to use:** Scoring logic should be independently testable with no DB or HTTP dependencies.

```typescript
// src/lib/scoring.ts

import { SIGNAL_WEIGHTS, TIER_THRESHOLDS, type LeadTier } from './scoring-config';

export interface LeadPayload {
  budget?: string | null;
  timeline?: string | null;
  company?: string | null;
  message: string;
  serviceType?: string | null;
}

export interface ScoreResult {
  score: number;
  tier: LeadTier;
}

export function scoreLead(payload: LeadPayload): ScoreResult {
  let total = 0;
  total += scoreBudget(payload.budget);
  total += scoreTimeline(payload.timeline);
  total += scoreCompany(payload.company);
  total += scoreMessage(payload.message);
  total += scoreService(payload.serviceType);

  // Clamp to [0, 100] as a safety net
  const score = Math.max(0, Math.min(100, Math.round(total)));
  const tier = scoreToTier(score);
  return { score, tier };
}

export function scoreToTier(score: number): LeadTier {
  if (score >= TIER_THRESHOLDS.hot) return 'hot';
  if (score >= TIER_THRESHOLDS.warm) return 'warm';
  return 'cold';
}
```

### Pattern 3: Signal Helpers

Each signal gets a private helper that maps string values to points. Missing/null/undefined = 0 for that signal. No default assumptions.

```typescript
// Budget sub-scorer (private to scoring.ts)
function scoreBudget(budget: string | null | undefined): number {
  if (!budget) return 0;
  // Values match whatever the Phase 8 multi-step form will emit.
  // Placeholder mapping — exact strings chosen at plan time:
  const map: Record<string, number> = {
    'under_5k':   0,
    '5k_10k':     10,
    '10k_25k':    20,
    '25k_50k':    28,
    '50k_plus':   35,
  };
  return map[budget] ?? 0;
}
```

The same mapping pattern applies for timeline and service type. Message length uses character-count thresholds.

### Pattern 4: Admin Badge Markup

**What:** Insert badge span in the existing `.submission-meta` div, after the existing badges.

**Follows:** `.badge-rate-limited` CSS pattern verbatim.

```astro
<!-- Inside allSubmissions.map() — submission-meta div -->
{sub.leadScore !== null && sub.leadScore !== undefined ? (
  <span class={`badge-score badge-score-${scoreToTier(sub.leadScore)}`}>
    {scoreToTier(sub.leadScore).toUpperCase()} {sub.leadScore}
  </span>
) : (
  <span class="badge-score badge-score-na">N/A</span>
)}
```

```css
/* CSS follows .badge-rate-limited structure exactly */
.badge-score {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-score-hot {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-score-warm {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-score-cold {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-score-na {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-dimmed);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Color rationale:** Green (#10b981 — emerald-500) for hot, amber (#f59e0b — amber-500) for warm, red (#ef4444 — red-500) for cold. These are Tailwind-compatible color values that match the existing indigo/amber palette in the codebase. The N/A badge reuses the `.read-indicator.read` dimmed style.

### Anti-Patterns to Avoid

- **Validation inside `scoreLead()`:** The contact API already validates — the scoring function trusts the caller. Don't add guards that would need to be maintained in two places.
- **Score floor / redistribution:** If budget is null, don't redistribute those 35 points to other signals. Missing = 0 for that signal only.
- **Writing to DB in Phase 6:** `scoreLead()` is a pure function. DB write happens in Phase 7 when the contact API calls it.
- **Importing `scoring.ts` in `scoring-config.ts`:** Config has no imports — it is the bottom of the dependency chain. Direction: `scoring-config.ts` → imported by `scoring.ts` → imported by `contact.ts` (Phase 7) and `admin/index.astro` (Phase 6).
- **Dynamic import of config:** Config is a static TypeScript module. No JSON, no `fs.readFile`, no runtime loading.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Score clamping | Custom bounds-checking class | `Math.max(0, Math.min(100, n))` | One line, built-in |
| Tier lookup | Complex switch/if chain | Config-driven threshold comparison | Two comparisons, fully configurable |
| Badge color logic | Inline ternary chains in template | CSS class name derived from tier string | Clean, readable, maintainable |

**Key insight:** This domain requires no third-party libraries. All complexity is in the business rules (which weights to use), not in the implementation mechanism.

---

## Common Pitfalls

### Pitfall 1: Enum Value Mismatch With Future Form

**What goes wrong:** Phase 6 defines budget/timeline/service string values (e.g., `'5k_10k'`) that don't match what Phase 8's multi-step form will actually submit.

**Why it happens:** Phase 6 builds the scoring function before the form exists. String literals in the mapping become canonical.

**How to avoid:** Document the expected string values explicitly as TypeScript literal union types in `scoring-config.ts`. Phase 8 must emit exactly these values. Treat them as a contract.

**Warning signs:** `scoreLead()` returns 0 for all budget/timeline/service signals during Phase 7 testing — means the form values aren't matching the config keys.

### Pitfall 2: NULL leadScore in Admin Query

**What goes wrong:** Admin page template crashes or shows "undefined" if `sub.leadScore` is checked loosely.

**Why it happens:** SQLite returns `null` for rows inserted before Phase 7 wires up scoring. TypeScript types `leadScore` as `number | null`.

**How to avoid:** Use explicit null check (`sub.leadScore !== null && sub.leadScore !== undefined`) not falsy check (`sub.leadScore`) — score 0 is falsy but valid and should show "COLD 0" not "N/A".

**Warning signs:** Legitimate score-0 submissions show "N/A" instead of "COLD 0".

### Pitfall 3: `scoreToTier` Called in Admin Without Import

**What goes wrong:** The admin `.astro` file needs `scoreToTier()` for badge display, but it's a server-side function in `scoring.ts`. Forgetting to import it causes a build error.

**Why it happens:** Astro frontmatter imports are easy to forget when adding badge logic.

**How to avoid:** Import both `scoreToTier` and `LeadTier` at the top of the admin frontmatter block. Since the admin page is SSR (`prerender = false`), server-side imports work correctly.

### Pitfall 4: Config Type Safety

**What goes wrong:** `SIGNAL_WEIGHTS` values are changed to sum to ≠ 100 during tuning, with no compile-time guard.

**Why it happens:** The config is just a record of numbers.

**How to avoid:** Add a comment `// Must sum to 100` next to the object. Optionally add a runtime assertion in `scoreLead()`: `if (process.env.NODE_ENV === 'development') { assert sum === 100 }` — but don't block production over it.

---

## Code Examples

### Complete `scoreLead()` outline (verified against phase decisions)

```typescript
// Source: Phase 6 CONTEXT.md decisions — signal weights and edge case rules

export function scoreLead(payload: LeadPayload): ScoreResult {
  // Each helper returns 0 if the field is null/undefined/empty
  const points =
    scoreBudget(payload.budget) +
    scoreTimeline(payload.timeline) +
    scoreCompany(payload.company) +
    scoreMessage(payload.message) +
    scoreService(payload.serviceType);

  const score = Math.max(0, Math.min(100, Math.round(points)));
  return { score, tier: scoreToTier(score) };
}

// Company: binary — present gets full weight, absent gets 0
function scoreCompany(company: string | null | undefined): number {
  return company && company.trim().length > 0 ? SIGNAL_WEIGHTS.company : 0;
}

// Message length: tiered by character count (exact thresholds = Claude's discretion)
// Recommended: <50 chars = 0, 50-149 = 5, 150-299 = 10, 300+ = 15
function scoreMessage(message: string): number {
  const len = message.trim().length;
  if (len >= 300) return SIGNAL_WEIGHTS.message;       // 15 pts
  if (len >= 150) return Math.round(SIGNAL_WEIGHTS.message * 0.67); // 10 pts
  if (len >= 50)  return Math.round(SIGNAL_WEIGHTS.message * 0.33); // 5 pts
  return 0;
}
```

### Admin badge integration (Astro frontmatter addition)

```typescript
// Add to admin/index.astro frontmatter
import { scoreToTier } from '../../lib/scoring';
```

```astro
<!-- Add inside .submission-meta div, after existing badges -->
{sub.leadScore !== null && sub.leadScore !== undefined ? (
  <span class={`badge-score badge-score-${scoreToTier(sub.leadScore)}`}>
    {scoreToTier(sub.leadScore).toUpperCase()} {sub.leadScore}
  </span>
) : (
  <span class="badge-score badge-score-na">N/A</span>
)}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| ML-based lead scoring | Rule-based weighted scoring | Transparent, tunable, no training data needed — appropriate for agency lead volume |
| Score stored as float | Score as integer (0-100) | Simpler display, no rounding surprises in UI |
| Tier logic in template | `scoreToTier()` helper | Reusable — same function used in admin display and (Phase 7) API write |

**Deprecated/outdated:**
- AI-powered lead scoring: explicitly out of scope per REQUIREMENTS.md — no training data volume; rule-based is transparent and tunable.

---

## Open Questions

1. **Budget/timeline/service string literals for Phase 8 compatibility**
   - What we know: Phase 8 (multi-step form) will submit these as string values; Phase 6 must define the canonical values
   - What's unclear: Exact form option labels haven't been designed yet
   - Recommendation: Define sensible string keys in `scoring-config.ts` as a TypeScript union type — document them as the contract Phase 8 must honor. Keep keys snake_case (e.g., `'50k_plus'`, `'asap'`, `'web_dev'`).

2. **Score display precision**
   - What we know: Integer score stored, integer displayed
   - What's unclear: Whether "COLD 0" should ever appear (bare submission = valid low score)
   - Recommendation: Yes, show "COLD 0" — matches the design decision that bare submissions score as low as the formula gives. Don't suppress zero scores.

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test framework is configured") |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCORE-01 | `scoreLead()` returns 0-100 for any valid payload | unit | None — no test framework | No framework |
| SCORE-02 | Score badge renders with correct tier color in admin | visual/manual | Manual browser verification | N/A |
| SCORE-03 | Config object has weights summing to 100 | manual inspection | `grep -n 'SIGNAL_WEIGHTS' src/lib/scoring-config.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** Manual verification — call `scoreLead()` inline in a test script or console
- **Per wave merge:** Full manual review of admin page rendering in browser
- **Phase gate:** All success criteria verified before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No test framework — manual verification is the only option per CLAUDE.md
- [ ] `src/lib/scoring-config.ts` — does not exist yet, created in Wave 0/Task 1
- [ ] `src/lib/scoring.ts` — does not exist yet, created in Wave 0/Task 1

*(Project explicitly has no test framework. Verification is manual: call `scoreLead()` with test payloads during implementation and inspect output. Admin badge display verified by loading the admin page in a browser.)*

---

## Sources

### Primary (HIGH confidence)
- `src/pages/admin/index.astro` — Existing badge CSS pattern extracted verbatim (`.badge-rate-limited`, `.read-indicator`)
- `src/db/schema.ts` — Confirmed `leadScore integer`, `leadStatus text default 'new'`, `serviceType`, `budget`, `timeline` columns exist
- `src/lib/validation.ts` — Confirmed validation is upstream; `scoreLead()` does not re-validate
- `src/pages/api/contact.ts` — Confirmed scoring not yet wired in (Phase 7 will do this)
- `.planning/phases/06-lead-scoring-engine/06-CONTEXT.md` — All locked decisions from user discussion

### Secondary (MEDIUM confidence)
- Tailwind color palette (#10b981 emerald, #f59e0b amber, #ef4444 red) — standard traffic-light colors consistent with glassmorphism dark theme

### Tertiary (LOW confidence)
- Message length thresholds (50/150/300 chars) — heuristic recommendation; exact values are Claude's discretion per CONTEXT.md

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all tooling already in project
- Architecture: HIGH — two new files, one existing file modified; patterns extracted directly from existing code
- Pitfalls: HIGH — NULL score handling and enum mismatch are concrete edge cases identified from the codebase
- Validation: HIGH — project explicitly has no test framework; manual-only is the documented approach

**Research date:** 2026-03-15
**Valid until:** 2026-04-14 (stable domain — pure function, no external APIs)
