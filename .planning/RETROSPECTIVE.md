# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Agency Website MVP

**Shipped:** 2026-03-11
**Phases:** 4 | **Plans:** 12

### What Was Built
- Full Astro multi-page agency website with glassmorphism design system
- 5 content collections (blog, team, pricing, testimonials, portfolio with GitHub API)
- Lead capture pipeline: contact form → validation → SQLite + Resend email → admin dashboard
- Comprehensive SEO: meta tags, OG, canonical URLs, JSON-LD, auto-sitemap
- GTM/GA4 analytics with custom event tracking for forms and CTAs
- Production Docker deployment with Caddy reverse proxy and automatic HTTPS

### What Worked
- Coarse 4-phase granularity kept momentum high — no planning overhead between small phases
- Content collections as a single pattern for all data (YAML + Markdown + Zod) was clean and consistent
- Phase 3 (Lead Capture) independence from Phase 2 enabled flexible execution ordering
- YOLO mode with verification enabled gave fast execution with quality checks
- 12 plans completed in ~1.4 hours total execution time

### What Was Inefficient
- SUMMARY.md files lack explicit `requirements-completed` frontmatter, making audit cross-referencing harder
- Some requirement text drifted from implementation (LEAD-02 says Nodemailer, uses Resend) — should update requirements when decisions change
- Nyquist validation created but never completed for any phase — overhead without value at this project scale

### Patterns Established
- Astro content collections for all structured data (YAML config files + Markdown content)
- `astro:page-load` event for View Transition-compatible client scripts
- Conditional GTM injection via environment variable with admin exclusion
- Honeypot + rate limiter as lightweight spam prevention
- Caddy as zero-config HTTPS reverse proxy for Docker deployments

### Key Lessons
1. For small agency sites, coarse phases (4 phases, 41 requirements) are more efficient than fine-grained ones
2. Content collections + YAML configs eliminate the need for a CMS at this scale
3. Resend is simpler than Nodemailer/SMTP for transactional email — fewer moving parts
4. Update requirement text immediately when implementation decisions diverge from original spec

### Cost Observations
- Model mix: predominantly Sonnet for execution agents, Opus for orchestration
- Sessions: ~6 sessions across 4 days
- Notable: Phase 4 averaged 2 min/plan — fastest phase due to pattern reuse from earlier phases

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~6 | 4 | Initial baseline — coarse granularity, YOLO mode |

### Cumulative Quality

| Milestone | Requirements | Satisfied | Tech Debt Items |
|-----------|-------------|-----------|-----------------|
| v1.0 | 41 | 41 (100%) | 3 (all info-level) |

### Top Lessons (Verified Across Milestones)

1. Coarse planning granularity reduces overhead without sacrificing quality (v1.0)
2. Single data pattern (content collections) scales cleanly across content types (v1.0)
