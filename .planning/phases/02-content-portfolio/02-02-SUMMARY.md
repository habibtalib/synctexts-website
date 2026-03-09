---
phase: 02-content-portfolio
plan: 02
subsystem: ui
tags: [astro, content-collections, glassmorphism, css-grid, yaml]

requires:
  - phase: 02-content-portfolio
    provides: "Content collections (team, testimonials, pricing) with Zod schemas and YAML data files"
provides:
  - "Team page with member cards from team collection"
  - "Pricing page with 3 tier cards from pricing collection"
  - "Homepage testimonials driven by testimonials collection instead of inline data"
  - "TeamMemberCard and PricingTier reusable components"
affects: [02-content-portfolio]

tech-stack:
  added: []
  patterns: [collection-driven-pages, avatar-fallback, highlighted-tier-badge]

key-files:
  created:
    - src/components/TeamMemberCard.astro
    - src/components/PricingTier.astro
  modified:
    - src/pages/team.astro
    - src/pages/pricing.astro
    - src/pages/index.astro
    - src/styles/global.css

key-decisions:
  - "TeamMemberCard uses initials fallback when photo images are unavailable"
  - "PricingTier highlighted state uses primary color border glow and gradient badge"

patterns-established:
  - "Collection-driven pages: query getCollection, sort/filter, map to card components with delay prop"
  - "Avatar fallback: CSS-based initials display when image fails to load via onerror handler"

requirements-completed: [TEAM-01, TEAM-02, TEST-01, TEST-02, PRIC-01, PRIC-02, PRIC-03]

duration: 4min
completed: 2026-03-09
---

# Phase 2 Plan 2: Team, Pricing, and Testimonials Pages Summary

**Team and Pricing pages with glass-panel card components querying YAML content collections, plus homepage testimonials converted from inline data to getCollection**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T09:07:49Z
- **Completed:** 2026-03-09T09:11:45Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Team page renders 4 member profiles sorted by order field, with circular avatar placeholders and gradient role text
- Pricing page renders 3 tiers (Starter, Growth, Enterprise) with the Growth tier visually highlighted via gradient badge and border glow
- Homepage testimonials section now loads all 5 testimonials from content collection instead of 3 hardcoded inline entries
- Both TeamMemberCard and PricingTier components follow established reveal/delay animation pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Team page and update homepage testimonials to use collections** - `b183343` (feat)
2. **Task 2: Build Pricing page with tier cards** - `141295a` (feat)

## Files Created/Modified
- `src/components/TeamMemberCard.astro` - Team member card with avatar, name, role, bio and initials fallback
- `src/components/PricingTier.astro` - Pricing tier card with highlighted badge, feature checklist, CTA button
- `src/pages/team.astro` - Team listing page querying team collection sorted by order
- `src/pages/pricing.astro` - Pricing page querying pricing collection and rendering tier cards
- `src/pages/index.astro` - Homepage testimonials now use getCollection('testimonials')
- `src/styles/global.css` - Added team-grid and pricing-grid responsive CSS

## Decisions Made
- TeamMemberCard uses an onerror-based fallback showing initials when team member photos are unavailable (photos reference /images/team/ paths that may not exist yet)
- PricingTier highlighted state combines a gradient "Most Popular" badge, primary-color border, and subtle box-shadow glow for visual emphasis
- Pricing CTA buttons use btn-primary for highlighted tier and btn-secondary for others, linking to /contact

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All content-driven pages (Team, Pricing) are built and rendering from YAML collections
- Homepage testimonials are fully data-driven
- Team photos should be added to /public/images/team/ when real photos are available
- Remaining Phase 2 work (portfolio pages, blog listing) can proceed independently

---
*Phase: 02-content-portfolio*
*Completed: 2026-03-09*
