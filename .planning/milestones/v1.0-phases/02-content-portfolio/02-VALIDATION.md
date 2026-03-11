---
phase: 2
slug: content-portfolio
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (build-time validation via Astro schema checking) |
| **Config file** | none — Wave 0 installs content infrastructure |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run preview` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run preview`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PORT-01, PORT-03 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | PORT-02, PORT-04 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | PORT-05 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | PORT-06 | manual-only | Inspect `dist/` for PAT | N/A | ⬜ pending |
| 02-02-01 | 02 | 1 | TEAM-01, TEAM-02 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | TEST-01, TEST-02 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | PRIC-01, PRIC-02, PRIC-03 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | BLOG-01 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | BLOG-02, BLOG-03 | smoke | `npm run build` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | BLOG-04 | smoke | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/content.config.ts` — content collection definitions with Zod schemas
- [ ] `src/data/` directory — YAML config files and Markdown content
- [ ] `.env` file with `GITHUB_PAT` — needed for portfolio loader
- [ ] Sample content: blog posts, team/testimonials/pricing YAML seed data

*No test framework to install — validation relies on Astro's build-time schema checking and `npm run build` success*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Portfolio cards show correct layout | PORT-02 | Visual layout verification | Open portfolio page, verify name/description/languages/date visible |
| PAT not in client bundle | PORT-06 | Requires dist/ inspection | `grep -r "ghp_" dist/` should return empty |
| Testimonials render on homepage | TEST-01 | Visual verification | Check homepage testimonials section |
| Pricing tiers display correctly | PRIC-01, PRIC-02 | Visual layout | Check pricing page for 3 tiers with details |
| Blog listing shows metadata | BLOG-01 | Visual verification | Check blog page for title/date/excerpt/read time |
| Syntax highlighting renders | BLOG-03 | Visual verification | Check blog post with code block |
| Tags display on posts | BLOG-04 | Visual verification | Check blog posts for tag labels |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
