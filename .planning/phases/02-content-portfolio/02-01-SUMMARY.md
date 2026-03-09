---
phase: 02-content-portfolio
plan: 01
subsystem: content
tags: [astro, content-collections, zod, yaml, markdown, shiki, github-api]

requires:
  - phase: 01-foundation-migration
    provides: "Astro project structure, component interfaces (TestimonialCard, ProjectCard)"
provides:
  - "5 content collections (blog, team, testimonials, pricing, portfolio) with Zod schemas"
  - "All YAML data files (team, testimonials, pricing, portfolio-config)"
  - "3 blog posts with code blocks and tags"
  - "3 portfolio case study Markdown files"
  - "Shiki syntax highlighting with github-dark theme"
  - "Custom portfolio loader with GitHub API integration"
affects: [02-content-portfolio, 03-lead-capture]

tech-stack:
  added: [yaml]
  patterns: [content-collections, file-loader, glob-loader, custom-inline-loader, zod-schema-validation]

key-files:
  created:
    - src/content.config.ts
    - src/data/team.yaml
    - src/data/testimonials.yaml
    - src/data/pricing.yaml
    - src/data/portfolio-config.yaml
    - src/data/blog/building-scalable-apis-with-nodejs.md
    - src/data/blog/kubernetes-zero-downtime-deployments.md
    - src/data/blog/flutter-state-management-guide.md
    - src/data/portfolio/project-crm.md
    - src/data/portfolio/project-infra.md
    - src/data/portfolio/project-fintech.md
  modified:
    - astro.config.mjs

key-decisions:
  - "Used process.env.GITHUB_PAT (not import.meta.env) for server-only build-time access"
  - "Portfolio loader gracefully degrades to local-only data when PAT is missing"
  - "yaml package already available in node_modules -- no new install needed"

patterns-established:
  - "Content collections: all data-driven content uses Astro content collections with Zod validation"
  - "YAML data files: team, testimonials, pricing use file() loader with id fields on every entry"
  - "Blog posts: glob() loader with frontmatter schema (title, date, excerpt, tags, draft)"
  - "Portfolio: custom inline loader merges GitHub API data with local YAML overrides"

requirements-completed: [PORT-03, PORT-06, TEAM-02, TEST-02, PRIC-03, BLOG-04]

duration: 16min
completed: 2026-03-09
---

# Phase 2 Plan 1: Content Collections & Data Infrastructure Summary

**Astro content collections with 5 Zod-validated schemas, YAML data files, blog posts with Shiki syntax highlighting, and custom GitHub API portfolio loader**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-09T17:02:21Z
- **Completed:** 2026-03-09T17:18:41Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Defined all 5 content collections (blog, team, testimonials, pricing, portfolio) with full Zod schema validation
- Created custom inline portfolio loader that fetches GitHub API data at build time and merges with local YAML overrides, gracefully handling missing PAT
- Populated all YAML data files: 4 team members, 5 testimonials (including 3 existing), 3 pricing tiers
- Created 3 portfolio case study Markdown files with realistic content (challenge/approach/results format)
- Created 3 blog posts with language-specific code blocks (TypeScript, YAML, Dart)
- Configured Shiki syntax highlighting with github-dark theme

## Task Commits

Each task was committed atomically:

1. **Task 1: Create content.config.ts with all collection schemas and all YAML/Markdown data files** - `3e58121` (feat)
2. **Task 2: Create sample blog posts and configure Shiki syntax highlighting** - `3c40cc1` (feat)

## Files Created/Modified
- `src/content.config.ts` - Defines all 5 content collections with Zod schemas and custom portfolio loader
- `src/data/team.yaml` - 4 team member profiles with id, name, role, bio, photo, order
- `src/data/testimonials.yaml` - 5 client testimonials (3 existing + 2 new)
- `src/data/pricing.yaml` - 3 service tiers (Starter, Growth, Enterprise)
- `src/data/portfolio-config.yaml` - 3 project configs with repo slugs, tech tags, case study links
- `src/data/portfolio/project-crm.md` - Enterprise CRM Dashboard case study
- `src/data/portfolio/project-infra.md` - High-Availability Microservices case study
- `src/data/portfolio/project-fintech.md` - FinTech Mobile Wallet case study
- `src/data/blog/building-scalable-apis-with-nodejs.md` - Node.js API patterns blog post
- `src/data/blog/kubernetes-zero-downtime-deployments.md` - K8s deployment strategies blog post
- `src/data/blog/flutter-state-management-guide.md` - Flutter state management blog post
- `astro.config.mjs` - Added Shiki github-dark theme configuration

## Decisions Made
- Used `process.env.GITHUB_PAT` instead of `import.meta.env` since the custom loader runs in Node.js build context, not Astro's Vite pipeline
- Portfolio loader logs a warning and uses local-only data when GITHUB_PAT is not set, ensuring builds never fail due to missing credentials
- Testimonials YAML preserves the 3 existing testimonials from index.astro and adds 2 new ones for a richer dataset

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. GITHUB_PAT is optional and the portfolio loader degrades gracefully without it.

## Next Phase Readiness
- All content collections are defined and queryable via `getCollection()`
- Data files are populated with realistic seed content
- Remaining Phase 2 plans can now build pages that consume these collections
- GITHUB_PAT should be set in environment when real GitHub repos are ready

---
*Phase: 02-content-portfolio*
*Completed: 2026-03-09*
