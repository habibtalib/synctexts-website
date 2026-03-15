---
phase: 6
slug: lead-scoring-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (CLAUDE.md: "No test framework is configured") |
| **Config file** | None |
| **Quick run command** | Manual: call `scoreLead()` with test payloads in browser console or inline script |
| **Full suite command** | Manual: verify admin page renders badges correctly in browser |
| **Estimated runtime** | ~30 seconds (manual inspection) |

---

## Sampling Rate

- **After every task commit:** Manual verification — call `scoreLead()` with representative payloads
- **After every plan wave:** Full manual review of admin page badge rendering in browser
- **Before `/gsd:verify-work`:** All success criteria verified manually
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SCORE-01 | manual | `grep -n 'SIGNAL_WEIGHTS' src/lib/scoring-config.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | SCORE-01 | manual | Call `scoreLead()` with test payloads | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | SCORE-02 | visual/manual | Load admin page, inspect badge colors | N/A | ⬜ pending |
| 06-01-04 | 01 | 1 | SCORE-03 | manual | Verify config weights sum to 100 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/scoring-config.ts` — does not exist yet, created in first task
- [ ] `src/lib/scoring.ts` — does not exist yet, created in first task

*No test framework to install — project explicitly has no test framework per CLAUDE.md. Verification is manual.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `scoreLead()` returns 0-100 | SCORE-01 | No test framework | Call with min/max/edge payloads, verify range |
| Config weights sum to 100 | SCORE-02 | Static inspection | Read `SIGNAL_WEIGHTS` object, sum values |
| Score badge renders correct color | SCORE-03 | Visual UI check | Load admin page, verify hot=green, warm=amber, cold=red, null=N/A |
| Score 0 renders as COLD, not N/A | SCORE-03 | Edge case visual | Submit form with minimal data, verify badge shows "COLD 0" |

---

## Validation Sign-Off

- [ ] All tasks have manual verify instructions
- [ ] Sampling continuity: manual check after each task commit
- [ ] Wave 0 covers all MISSING file references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
