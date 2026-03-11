---
phase: 1
slug: foundation-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (build-time smoke tests only) |
| **Config file** | none — Wave 0 installs Astro |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run preview` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run preview`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FOUND-01 | smoke | `npm run build` | N/A — build output | ⬜ pending |
| 01-01-02 | 01 | 1 | FOUND-02 | smoke | `npm run build && ls dist/index.html dist/portfolio/index.html dist/team/index.html dist/blog/index.html dist/pricing/index.html dist/contact/index.html` | N/A — build output | ⬜ pending |
| 01-02-01 | 02 | 1 | FOUND-03 | manual-only | Visual inspection in browser | N/A | ⬜ pending |
| 01-02-02 | 02 | 1 | FOUND-04 | manual-only | Visual inspection at mobile viewport | N/A | ⬜ pending |
| 01-02-03 | 02 | 1 | FOUND-05 | manual-only | Visual inspection across all pages | N/A | ⬜ pending |
| 01-02-04 | 02 | 1 | FOUND-06 | manual-only | Visual inspection at 375px, 768px, 1200px | N/A | ⬜ pending |
| 01-02-05 | 02 | 1 | FOUND-07 | smoke | `npm run build && grep -l "Services\|Tech Stack" dist/index.html` | N/A — build output | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Astro project initialization (`npm create astro@latest`)
- [ ] Verify build succeeds with all 6 pages generating to `dist/`
- [ ] No automated UI test framework needed for Phase 1 — all visual requirements verified via build success + manual inspection

*Existing infrastructure covers automated verification needs through build output.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sticky nav with links to all pages and CTA | FOUND-03 | Visual/interactive behavior | Navigate site, verify nav stays fixed on scroll, all links work |
| Mobile hamburger menu works | FOUND-04 | Interactive touch/click behavior | Resize to <600px, tap hamburger, verify sidebar opens/closes |
| Glassmorphism consistent across pages | FOUND-05 | Visual design consistency | Visit all 6 pages, verify glass panels render with blur and borders |
| Responsive across viewports | FOUND-06 | Layout verification | Check all pages at 375px, 768px, 1200px widths |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
