---
phase: 7
slug: extended-api-hubspot
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (CLAUDE.md: "No test framework is configured") |
| **Config file** | none |
| **Quick run command** | `npm run build` (type-check + build verification) |
| **Full suite command** | `npm run build` + manual verification procedure |
| **Estimated runtime** | ~10 seconds (build) + manual steps |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + manual verification procedure
- **Before `/gsd:verify-work`:** Full manual verification must be green
- **Max feedback latency:** 10 seconds (build)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | INFRA-03 | manual | `npm run build` | N/A | ⬜ pending |
| 07-01-02 | 01 | 1 | HS-01, HS-02, HS-03, HS-05 | manual | `npm run build` | N/A | ⬜ pending |
| 07-01-03 | 01 | 1 | HS-01 | manual | `npm run build` | N/A | ⬜ pending |
| 07-01-04 | 01 | 1 | HS-04 | manual | `npm run build` | N/A | ⬜ pending |
| 07-01-05 | 01 | 1 | HS-01, HS-04 | manual | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework to configure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Form submit with new fields persists to SQLite with score | HS-01, HS-03 | No test framework; requires DB + API integration | Submit form with service_type, budget, timeline → check SQLite row |
| HubSpot contact created/updated async | HS-01, HS-02 | Requires live HubSpot portal | Submit form → check HubSpot portal for contact with custom props |
| Upsert prevents duplicates | HS-02 | Requires live HubSpot portal | Submit twice with same email → verify single HubSpot contact |
| HubSpot outage doesn't block submission | HS-05 | Requires simulated outage | Remove HUBSPOT_TOKEN → submit form → verify 200 response |
| Admin 401 on unauthenticated requests | INFRA-03 | Requires HTTP client | curl /api/admin/toggle-read without auth → verify 401 |
| Manual re-sync button works | HS-04 | Requires live HubSpot portal + UI | Click "Sync to HubSpot" → verify badge updates to Synced |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
