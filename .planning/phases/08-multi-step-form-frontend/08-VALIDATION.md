---
phase: 8
slug: multi-step-form-frontend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured — CLAUDE.md states "No test framework is configured" |
| **Config file** | N/A |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run preview` |
| **Estimated runtime** | ~15 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run preview` (manual verification)
- **Before `/gsd:verify-work`:** Full manual browser walkthrough must pass
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | FORM-01 | manual | `npm run build` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | FORM-02 | manual | `npm run build` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | FORM-03 | manual | `npm run build` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | FORM-04 | manual | `npm run build` | ❌ W0 | ⬜ pending |
| 08-01-05 | 01 | 1 | FORM-05 | manual | `npm run build` | ❌ W0 | ⬜ pending |
| 08-01-06 | 01 | 1 | FORM-06 | manual | `npm run build` | ❌ W0 | ⬜ pending |
| 08-01-07 | 01 | 1 | FORM-07 | manual | `npm run build` | ❌ W0 | ⬜ pending |
| 08-01-08 | 01 | 1 | FORM-08 | manual | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test framework to install — project uses manual browser verification
- `npm run build` is the only automated gate (TypeScript compilation)
- All FORM requirements are verified manually via `npm run preview`

*Existing infrastructure covers automated build verification; all functional requirements require manual browser testing.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Service card selection auto-advances to Step 2 | FORM-01 | UI interaction, no test framework | Click each service card, verify Step 2 appears |
| All services share same Step 2 fields | FORM-02 | Visual verification | Select each service, verify identical budget/timeline dropdowns |
| Step indicator shows current/completed/pending | FORM-03 | Visual verification | Navigate through steps, verify dot states and connecting lines |
| Back navigation preserves data | FORM-04 | UI interaction + data persistence | Fill Step 2, go back, verify Step 1 selection retained |
| Inline validation errors on step advance | FORM-05 | UI interaction | Try advancing Step 3 with empty required fields |
| Page refresh restores form state | FORM-06 | Browser sessionStorage | Fill Step 2, refresh page, verify restoration to Step 2 with data |
| Slide animations with reduced-motion fallback | FORM-07 | Visual + accessibility | Toggle prefers-reduced-motion, verify instant transitions |
| Success panel with Cal.com CTA | FORM-08 | UI interaction | Submit form, verify success panel and booking button |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
