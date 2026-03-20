---
phase: 09
slug: cal-com-scheduling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no test framework configured (per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Build must pass + human verification
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | CAL-04 | build + schema | `npm run build` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 2 | CAL-01, CAL-02, CAL-03, CAL-05 | build | `npm run build` | ✅ | ⬜ pending |
| 09-03-01 | 03 | 3 | CAL-01–05 | human | manual browser test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework to install — project uses build verification + human testing per CLAUDE.md.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cal.com embed loads with dark theme and indigo accent | CAL-01, CAL-02 | Visual verification — no headless browser testing configured | Open /contact, submit form, verify embed renders with correct theme |
| Prefill name and email from form submission | CAL-03 | Requires Cal.com cloud account + live embed | Submit form with known name/email, verify Cal.com fields prefilled |
| Webhook updates lead record | CAL-04 | Requires Cal.com webhook firing + DB inspection | Complete booking in Cal.com, verify DB row updated |
| Embed survives View Transitions | CAL-05 | Browser navigation test | Navigate away from /contact and back, verify no JS errors |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
