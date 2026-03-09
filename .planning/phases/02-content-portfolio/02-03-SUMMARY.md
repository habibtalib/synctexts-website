---
phase: 02-content-portfolio
plan: 03
subsystem: ui
tags: [astro, blog, markdown, shiki, content-collections, glassmorphism]

requires:
  - phase: 02-content-portfolio
    provides: "Blog content collection with Zod schema, 3 blog posts with code blocks"
provides:
  - "Blog listing page at /blog with post cards showing metadata"
  - "Dynamic blog post pages at /blog/{id} with Markdown rendering"
  - "BlogPostCard component for reuse"
  - "Prose/article styles for Markdown content"
  - "Tag pill styling system"
affects: [02-content-portfolio]

tech-stack:
  added: []
  patterns: [getCollection-query, getStaticPaths-dynamic-routes, render-markdown, prose-typography]

key-files:
  created:
    - src/components/BlogPostCard.astro
    - src/pages/blog/index.astro
    - src/pages/blog/[...id].astro
  modified:
    - src/styles/global.css

key-decisions:
  - "Read time calculated from post.body word count / 200 wpm"
  - "Blog listing uses 2-column grid on desktop, 1-column on mobile"
  - "Prose styles override Shiki code block backgrounds for dark theme consistency"

patterns-established:
  - "Blog listing: getCollection with draft filter and date sort"
  - "Dynamic routes: getStaticPaths returning post as prop for render()"
  - "Tag pills: reusable .tag-pill class with primary color at low opacity"
  - "Prose typography: .prose class for all Markdown-rendered content"

requirements-completed: [BLOG-01, BLOG-02, BLOG-03, BLOG-04]

duration: 3min
completed: 2026-03-09
---

# Phase 2 Plan 3: Blog System Summary

**Blog listing page with metadata cards and dynamic Markdown post pages with Shiki syntax-highlighted code blocks and tag pills**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T09:08:52Z
- **Completed:** 2026-03-09T09:11:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Blog listing page at /blog queries blog collection, filters drafts, sorts newest first, shows cards with date, read time, excerpt, and tag pills
- Dynamic blog post pages render full Markdown content with syntax-highlighted code blocks via Shiki
- Prose typography styles provide consistent rendering for headings, lists, blockquotes, inline code, and images

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BlogPostCard component and blog listing page** - `5fad796` (feat)
2. **Task 2: Create dynamic blog post pages with Markdown rendering** - `272758c` (feat)

## Files Created/Modified
- `src/components/BlogPostCard.astro` - Blog card with date, read time, excerpt, tags, reveal animation
- `src/pages/blog/index.astro` - Blog listing page querying blog collection with grid layout
- `src/pages/blog/[...id].astro` - Dynamic blog post pages via getStaticPaths with Content rendering
- `src/styles/global.css` - Blog grid, tag pills, prose typography, code block, and blog post page styles

## Decisions Made
- Read time calculated as `Math.ceil(wordCount / 200)` for consistent estimation across listing and post pages
- Blog listing uses 2-column grid on desktop for visual density, collapses to 1-column at 768px
- Prose code block styles use `!important` on background to ensure Shiki output integrates with dark theme

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Blog system is fully functional with listing and individual post pages
- All 3 blog posts render with syntax highlighting
- Tag pills and prose styles are reusable for any future Markdown content pages

---
*Phase: 02-content-portfolio*
*Completed: 2026-03-09*
