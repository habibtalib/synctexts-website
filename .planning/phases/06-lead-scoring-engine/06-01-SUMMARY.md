---
phase: 06-lead-scoring-engine
plan: 01
subsystem: api
tags: [typescript, lead-scoring, admin, astro]

# Dependency graph
requires:
  - phase: 05-database-foundation
    provides: submissions schema with leadScore integer column and leadStatus field
provides:
  - Pure TypeScript lead scoring function (scoreLead) returning 0-100 score and tier
  - Configurable signal weights and tier thresholds in scoring-config.ts
  - Score value maps establishing Phase 8 form field contract (budget/timeline/service strings)
  - Color-coded HOT/WARM/COLD score badges in admin submission cards
affects:
  - phase-07-contact-api (wires scoreLead into POST handler, writes score to DB)
  - phase-08-contact-form (must emit budget/timeline/service strings matching BUDGET_SCORES/TIMELINE_SCORES/SERVICE_SCORES keys)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function scoring: scoreLead() is standalone with no I/O, no DB writes — integration happens upstream in Phase 7"
    - "Config-driven scoring: all weights, thresholds, and value maps in scoring-config.ts; zero imports in that file (bottom of dependency chain)"
    - "Traffic-light badge pattern: hot=emerald, warm=amber, cold=red with glassmorphism pill styling"

key-files:
  created:
    - src/lib/scoring-config.ts
    - src/lib/scoring.ts
  modified:
    - src/pages/admin/index.astro

key-decisions:
  - "SIGNAL_WEIGHTS sums to 100: budget 35, timeline 25, company 15, message 15, service 10"
  - "Tier thresholds: cold < 31, warm 31-60, hot >= 61 (configurable in TIER_THRESHOLDS)"
  - "Score 0 renders as COLD 0 badge, not N/A — uses !== null check, not falsy check"
  - "web_dev scores highest (10) in SERVICE_SCORES due to largest typical deal size"
  - "asap timeline scores max (25); not_sure scores 0 — urgency directly maps to intent"

patterns-established:
  - "scoring-config.ts has zero imports — it is the bottom of the dependency chain"
  - "Admin badges use null/undefined guard with !== operator to avoid false N/A for score 0"

requirements-completed: [SCORE-01, SCORE-02, SCORE-03]

# Metrics
duration: 8min
completed: 2026-03-15
---

# Phase 6 Plan 01: Lead Scoring Engine Summary

**Pure TypeScript lead scoring engine with configurable signal weights (budget 35, timeline 25, company/message 15 each, service 10) plus traffic-light HOT/WARM/COLD badges in admin dashboard**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-15T15:11:00Z
- **Completed:** 2026-03-15T15:12:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created scoring-config.ts as a zero-import config module with all signal weights, tier thresholds, and score value maps establishing the contract for Phase 8's form fields
- Created scoring.ts with pure scoreLead() and exported scoreToTier() — five private helpers, result clamped to [0, 100], no DB writes
- Added color-coded score badges to admin submission cards: HOT (emerald), WARM (amber), COLD (red), N/A (dimmed) — matching existing pill style pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scoring config and pure scoring function** - `b30a3be` (feat)
2. **Task 2: Add score badges to admin submission cards** - `2e1e970` (feat)

## Files Created/Modified
- `src/lib/scoring-config.ts` - Signal weights, tier thresholds, LeadTier type, and score value maps for budget/timeline/service/message (zero imports)
- `src/lib/scoring.ts` - LeadPayload and ScoreResult interfaces, scoreLead() pure function, exported scoreToTier() classifier
- `src/pages/admin/index.astro` - Added scoreToTier import, score badge template (after read-indicator), and badge-score CSS family

## Decisions Made
- SIGNAL_WEIGHTS: budget (35) is the dominant signal, timeline (25) for urgency, company/message (15 each) for context and intent, service (10) for fit
- Tier boundaries: cold below 31, warm 31-60, hot 61+; thresholds stored in TIER_THRESHOLDS as configurable constants
- Badge null check uses `!== null && !== undefined` to correctly display "COLD 0" for a submitted lead that scored zero — falsy check would incorrectly show N/A
- web_dev scores 10 (highest) in SERVICE_SCORES since it typically commands the largest deal size

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in contact-form.ts (window.dataLayer type augmentation) and other files were present before this plan — these are out of scope and not caused by changes here. New files (scoring-config.ts, scoring.ts) and modified admin page have zero errors.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- scoreLead() is ready for Phase 7 to call from the contact API POST handler
- scoreToTier() is exported and already used in admin page
- Phase 8 form must emit budget/timeline/service string keys matching BUDGET_SCORES/TIMELINE_SCORES/SERVICE_SCORES (e.g., 'asap', '25k_50k', 'web_dev')
- No blockers

---
*Phase: 06-lead-scoring-engine*
*Completed: 2026-03-15*

## Self-Check: PASSED

- FOUND: src/lib/scoring-config.ts
- FOUND: src/lib/scoring.ts
- FOUND: src/pages/admin/index.astro
- FOUND: .planning/phases/06-lead-scoring-engine/06-01-SUMMARY.md
- FOUND: commit b30a3be (Task 1)
- FOUND: commit 2e1e970 (Task 2)
