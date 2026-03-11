---
phase: 4
slug: seo-analytics-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Build-based validation (no test framework) |
| **Config file** | none — build validation via Astro compiler |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && docker build -t synctexts-test .` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && docker build -t synctexts-test .`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SEO-01 | smoke | `grep '<meta name="description"' dist/client/index.html` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | SEO-02 | smoke | `grep 'og:title' dist/client/index.html` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | SEO-06 | smoke | `grep 'application/ld+json' dist/client/index.html` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | SEO-03 | smoke | `npm run build && cat dist/client/sitemap-index.xml` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 1 | SEO-07 | manual | Inspect heading hierarchy in built HTML | N/A | ⬜ pending |
| 04-01-06 | 01 | 1 | SEO-04, SEO-05 | manual | Check GTM/GA4 in browser dev tools | N/A | ⬜ pending |
| 04-02-01 | 02 | 1 | DEPL-04 | smoke | `curl localhost:4321/api/health` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | DEPL-01 | smoke | `docker build -t synctexts-test .` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 1 | DEPL-02 | smoke | `docker compose up -d && curl localhost:4321/api/health` | ❌ W0 | ⬜ pending |
| 04-02-04 | 02 | 1 | DEPL-03 | manual-only | Requires real server with DNS | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (build-based validation + manual inspection)
- No test framework installation needed — this phase is configuration-heavy

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OG tags render correctly when shared on social media | SEO-02 | Requires actual social media sharing or preview tool | Use Facebook Sharing Debugger or Twitter Card Validator with live URL |
| GA4 tracks page views on every page | SEO-04 | Requires GTM container configured with GA4 tag | Open browser dev tools Network tab, verify gtm.js loads and GA4 requests fire |
| GTM container loaded for flexible tag management | SEO-05 | Requires browser with GTM Preview mode | Use GTM Preview mode to verify container fires |
| SSL/HTTPS via Caddy | DEPL-03 | Requires real domain with DNS pointing to server | Deploy to server, visit https://synctexts.com, verify certificate |
| Semantic HTML heading hierarchy | SEO-07 | Visual inspection of heading levels | Use browser accessibility tools or HeadingsMap extension |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
