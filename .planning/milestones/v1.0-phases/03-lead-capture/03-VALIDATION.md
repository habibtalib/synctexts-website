---
phase: 3
slug: lead-capture
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (manual testing) |
| **Config file** | none |
| **Quick run command** | `npm run build` (build verification) |
| **Full suite command** | `npm run build && npm run preview` (build + serve for manual testing) |
| **Estimated runtime** | ~10 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` to verify no build errors
- **After every plan wave:** Run `npm run build && npm run preview` + manual walkthrough
- **Before `/gsd:verify-work`:** Full manual walkthrough of all form scenarios must pass
- **Max feedback latency:** 10 seconds (build check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | LEAD-01 | build | `npm run build` | N/A | ⬜ pending |
| 03-01-02 | 01 | 1 | LEAD-01 | build | `npm run build` | N/A | ⬜ pending |
| 03-02-01 | 02 | 1 | LEAD-02, LEAD-03 | build | `npm run build` | N/A | ⬜ pending |
| 03-02-02 | 02 | 1 | LEAD-04, LEAD-05 | build | `npm run build` | N/A | ⬜ pending |
| 03-03-01 | 03 | 2 | LEAD-06 | build | `npm run build` | N/A | ⬜ pending |
| 03-03-02 | 03 | 2 | LEAD-02 | build | `npm run build` | N/A | ⬜ pending |
| 03-04-01 | 04 | 2 | LEAD-03 | manual | Browser form testing | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.
- No test framework install needed — validation is build-check + manual testing.
- Project has no test framework configured (per CLAUDE.md), and manual testing is proportionate for a single API endpoint on a marketing site.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Contact form renders with 4 fields + honeypot | LEAD-01 | Visual/DOM inspection | Open /contact, verify Name, Company, Email, Message fields visible; honeypot hidden |
| Form submission triggers email notification | LEAD-02 | Requires Resend API + inbox check | Submit form with valid data, verify email arrives at CONTACT_EMAIL |
| Submission saved to SQLite database | LEAD-03 | Requires running server + DB inspection | Submit form, check /admin page shows new entry |
| Honeypot filled submissions silently rejected | LEAD-04 | Requires DOM manipulation | Fill honeypot field via devtools, submit, verify no email sent and no error shown |
| Rate limiting after 5 submissions/hour | LEAD-05 | Requires rapid sequential submissions | Submit 6 times rapidly from same IP, verify 6th shows rate limit message |
| Client + server validation | LEAD-06 | Requires interactive form testing | Submit empty fields (check inline errors), submit invalid email (check server rejection) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
