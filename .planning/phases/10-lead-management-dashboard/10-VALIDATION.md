---
phase: 10
slug: lead-management-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (CLAUDE.md: "No test framework is configured") |
| **Config file** | none |
| **Quick run command** | `npm run build` (type-check + build verification) |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Build must be green + manual checklist
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | DASH-01 | manual-only | `npm run build` | N/A | ⬜ pending |
| 10-01-02 | 01 | 1 | DASH-02 | manual-only | `npm run build` | N/A | ⬜ pending |
| 10-01-03 | 01 | 1 | DASH-03 | manual-only | `npm run build` | N/A | ⬜ pending |
| 10-01-04 | 01 | 1 | DASH-04, DASH-05 | manual-only | `npm run build` | N/A | ⬜ pending |
| 10-01-05 | 01 | 1 | DASH-06 | manual-only | `npm run build` | N/A | ⬜ pending |
| 10-01-06 | 01 | 1 | DASH-07 | manual-only | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework to install — project operates without one by design.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Score badge, status, service type, date visible in compact row | DASH-01 | No test framework; visual UI verification | Load `/admin` — verify each lead row shows color-coded score badge, status badge, service type, submission date |
| Status change via dropdown persists | DASH-02 | AJAX + DOM update; no headless browser | Expand a lead, change status dropdown, verify badge updates immediately; reload page and confirm status persisted |
| Notes save and reload | DASH-03 | Textarea + save button; no headless browser | Expand a lead, type a note, click Save Note, verify "Saved" flash; reload page and confirm note persisted |
| Sort by score/date changes order | DASH-04 | URL param + server-side query; visual verification | Load `/admin?sort=score_desc` — verify leads ordered by score descending; try `sort=date_asc` |
| Filter params reflected in URL and results | DASH-05 | URL param filters; visual verification | Load `/admin?status=new` — only new leads shown; load `/admin?min_score=50` — only scored leads shown; verify URL reflects active filters |
| 25-lead page cap, pagination controls | DASH-06 | Pagination; visual count verification | Load `/admin?page=1` — max 25 rows; verify pagination controls; navigate to page 2 |
| HubSpot badge and link display | DASH-07 | External link; visual verification | Find a HubSpot-synced lead — verify "Synced" badge in compact row and "View in HubSpot" link in expanded panel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
