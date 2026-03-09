# Roadmap: SyncTexts Agency Website

## Overview

Transform the existing single-page vanilla HTML/CSS/JS landing page into a full-featured Astro-powered multi-page agency website. The journey goes from foundation (Astro migration, layout, navigation) through all content pages (blog, team, pricing, testimonials, portfolio with GitHub API) to lead capture (contact form with email and database) and finally production readiness (SEO, analytics, Docker deployment). Every phase delivers a coherent, verifiable capability that builds toward the core value: turning the website into a lead generation engine.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Migration** - Astro project setup, layout shell, navigation, responsive design system, homepage migration (completed 2026-03-09)
- [ ] **Phase 2: Content & Portfolio** - All content pages (blog, team, pricing, testimonials) and GitHub-powered portfolio
- [ ] **Phase 3: Lead Capture** - Working contact form with email notification, database persistence, and spam protection
- [ ] **Phase 4: SEO, Analytics & Deployment** - Meta tags, structured data, GA4/GTM, sitemap, Docker deployment with SSL

## Phase Details

### Phase 1: Foundation & Migration
**Goal**: Visitors can browse a multi-page Astro site with consistent navigation and the refined glassmorphism design system on any device
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07
**Success Criteria** (what must be TRUE):
  1. Site runs as an Astro project in hybrid rendering mode with pages loading as pre-rendered HTML
  2. Visitor can navigate between all page routes (Home, Portfolio, Team, Blog, Pricing, Contact) via a sticky top navigation bar
  3. Navigation collapses into a working hamburger menu on mobile viewports
  4. Glassmorphism design system (glass panels, colors, typography) renders consistently across all pages with no unstyled sections
  5. Homepage hero, services, and tech stack sections are migrated to Astro components with refined content and polish
**Plans:** 2/2 plans complete

Plans:
- [ ] 01-01-PLAN.md — Astro project setup, layout shell, navigation, CSS migration, and all page routes
- [ ] 01-02-PLAN.md — Homepage component migration (Hero, Services, TechGrid, previews), responsive polish, visual verification

### Phase 2: Content & Portfolio
**Goal**: Visitors can explore the agency's work, team, blog, pricing, and testimonials -- all driven by config files and content collections
**Depends on**: Phase 1
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, PORT-05, PORT-06, TEAM-01, TEAM-02, TEST-01, TEST-02, PRIC-01, PRIC-02, PRIC-03, BLOG-01, BLOG-02, BLOG-03, BLOG-04
**Success Criteria** (what must be TRUE):
  1. Portfolio page displays curated projects fetched from GitHub private repos at build time, each showing name, description, languages, and last updated date
  2. Clicking a portfolio project opens a detail page with full case study content, and projects can have manual overrides (custom titles, descriptions, screenshots)
  3. Team page shows member profiles (photo, name, role, bio) driven by a config file, not hardcoded HTML
  4. Blog listing page shows all posts with title, date, excerpt, and read time; individual posts render from Markdown with syntax-highlighted code blocks and tag categorization
  5. Pricing page displays service tiers with included services and starting prices; testimonials section shows client quotes with attribution -- both driven by config files
**Plans:** 1/5 plans executed

Plans:
- [ ] 02-01-PLAN.md — Content collections infrastructure: schemas, YAML data files, blog posts, portfolio case studies, Shiki config
- [ ] 02-02-PLAN.md — Team page, Pricing page, and homepage testimonials driven by content collections
- [ ] 02-03-PLAN.md — Blog listing page and individual blog post pages with syntax highlighting and tags
- [ ] 02-04-PLAN.md — Portfolio grid page, project detail pages, and homepage projects from GitHub API collection
- [ ] 02-05-PLAN.md — Visual verification of all content pages across viewports

### Phase 3: Lead Capture
**Goal**: Potential clients can submit an inquiry through a working contact form that reliably delivers notifications and persists every submission
**Depends on**: Phase 1
**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06
**Success Criteria** (what must be TRUE):
  1. Visitor can fill out and submit a contact form with name, email, message, and optional company fields, receiving clear success/error feedback
  2. Every valid submission is saved to a SQLite database and triggers an email notification to the agency
  3. Form validates input on both client-side (inline errors) and server-side (rejects invalid data with specific error messages)
  4. Spam submissions are blocked by a honeypot field and server-side rate limiting rejects rapid-fire submissions
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: SEO, Analytics & Deployment
**Goal**: The site is discoverable by search engines, tracks visitor behavior, and runs in production on the agency's own server with HTTPS
**Depends on**: Phase 2, Phase 3
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, DEPL-01, DEPL-02, DEPL-03, DEPL-04
**Success Criteria** (what must be TRUE):
  1. Every page has a unique meta title, meta description, and Open Graph tags that render correctly when shared on social media
  2. Sitemap.xml is auto-generated and includes all pages; JSON-LD structured data (Organization + BlogPosting) is present in page source
  3. GA4 tracks page views on every page and GTM container is loaded for flexible tag management
  4. Site runs inside a Docker container behind a reverse proxy with automatic SSL certificate renewal, accessible at synctexts.com over HTTPS
  5. All pages use semantic HTML with proper heading hierarchy and landmark elements
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4
Note: Phase 3 depends only on Phase 1 and can execute in parallel with Phase 2 if desired.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Migration | 2/2 | Complete   | 2026-03-09 |
| 2. Content & Portfolio | 1/5 | In Progress|  |
| 3. Lead Capture | 0/1 | Not started | - |
| 4. SEO, Analytics & Deployment | 0/2 | Not started | - |
