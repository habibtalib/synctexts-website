# Project Research Summary

**Project:** SyncTexts Agency Website
**Domain:** Tech agency marketing website (lead generation)
**Researched:** 2026-03-08
**Confidence:** HIGH

## Executive Summary

SyncTexts needs to migrate from a single-page vanilla HTML/CSS/JS landing page to a full-featured multi-page agency website that generates leads. The expert approach for this category of site is a content-first static site generator with minimal server-side capabilities -- specifically Astro in hybrid rendering mode. This gives pre-rendered, SEO-optimized HTML for all marketing pages and blog content, with a single server endpoint for the contact form. The existing dark glassmorphism design system and CSS carry over directly since Astro uses plain HTML templates with scoped styles, requiring no paradigm shift.

The recommended stack centers on Astro 5.18.x with the Node adapter for self-hosted Docker deployment, better-sqlite3 for lead persistence, Nodemailer for email notifications, and Octokit for build-time GitHub API integration that powers the portfolio page. The existing vanilla CSS stays as-is -- no Tailwind migration, no CSS-in-JS. Content (blog posts, team data, testimonials, pricing) lives in Astro Content Collections with Zod-validated schemas, keeping everything in the repo without CMS dependencies.

The primary risks are: leaking the GitHub PAT (must be build-time only, fine-grained, and never in client bundles), glassmorphism accessibility failures when scaling to content-heavy pages (contrast and GPU performance), contact form spam without honeypot/rate-limiting from day one, and breaking existing SEO equity during migration (301 redirects required). All of these are preventable with upfront planning and are mapped to specific implementation phases below.

## Key Findings

### Recommended Stack

The stack is deliberately conservative -- no bleeding-edge choices. Astro is the clear winner over Next.js, Nuxt, or Eleventy for a content-heavy marketing site because it ships zero JavaScript by default, handles hybrid static/server rendering natively, and its template syntax looks like HTML (matching the existing codebase). SQLite over Postgres eliminates infrastructure overhead for a form that receives dozens of submissions per month. Nodemailer over cloud email APIs avoids vendor lock-in on the agency's own infrastructure.

**Core technologies:**
- **Astro 5.18.x:** Site framework -- content-first, hybrid rendering, zero-JS default, Vite-powered
- **@astrojs/node 9.x:** Self-hosted deployment adapter -- standalone Node.js process, Docker-friendly
- **better-sqlite3 11.x:** Lead storage -- zero-infrastructure, single-file database, no separate server
- **Drizzle ORM 0.41.x:** Type-safe database queries -- lightweight, works with better-sqlite3
- **Nodemailer 6.x:** Email notifications -- works with any SMTP, no vendor lock-in
- **Octokit/rest 21.x:** GitHub API client -- build-time portfolio data fetching from private repos
- **Vanilla CSS (existing):** 800+ lines of glassmorphism design system -- no migration needed

### Expected Features

**Must have (table stakes):**
- Multi-page structure with navigation (Home, Portfolio, Team, Blog, Pricing, Contact)
- Refined homepage (hero, services, tech stack, testimonials preview, CTA)
- Portfolio page with live GitHub API integration (the primary differentiator)
- Working contact form with email delivery (the site's core conversion mechanism)
- Team page with real photos and bios
- SEO fundamentals (meta tags, sitemap, semantic HTML, Open Graph)
- GA4 + GTM analytics integration
- Responsive design across all new pages

**Should have (add within first month):**
- Blog with Markdown content collections and syntax highlighting
- Pricing page with transparent tiers
- Testimonials as dedicated section with specific outcomes
- Contact form database persistence (backup to email)
- Structured data / JSON-LD for rich search results
- Spam protection (honeypot + rate limiting)

**Defer (v2+):**
- Individual project detail/case study pages
- Blog tag/category filtering (needs 15+ posts first)
- Newsletter signup (needs consistent publishing cadence)
- Client logo bar (needs 5+ logos with permission)

**Explicitly avoid (anti-features):**
- Headless CMS -- overkill; Markdown in repo is sufficient
- User auth / client portal -- wrong scope for a marketing site
- Live chat widget -- 200-500KB JS, requires someone to respond
- AI chatbot -- novelty without ROI
- i18n -- English is sufficient for a tech agency

### Architecture Approach

The architecture is an Astro hybrid-rendered multi-page site. All marketing pages, blog posts, and portfolio items are pre-rendered at build time as static HTML. The only server-rendered component is `POST /api/contact` for form submissions. GitHub API data is fetched at build time via a custom Astro Content Layer loader, so the PAT never reaches the client and there are no runtime API rate limit concerns. The site runs as a single Docker container (Node.js Alpine) behind the existing Traefik reverse proxy, with SQLite on a Docker volume.

**Major components:**
1. **Layout Shell** -- global nav, footer, glassmorphism background, meta tags, analytics scripts (static)
2. **Content Collections** -- Zod-validated schemas for blog (Markdown), team, testimonials, pricing (JSON/YAML)
3. **Portfolio System** -- custom content loader fetching GitHub API at build time, merged with manual overrides config
4. **Contact API Endpoint** -- server-side POST handler with Zod validation, SQLite persistence, Nodemailer delivery
5. **Contact Form Island** -- the only hydrated interactive component on the entire site (all else is zero-JS)

### Critical Pitfalls

1. **GitHub PAT exposure** -- store in env vars only, use fine-grained read-only tokens scoped to specific repos, fetch at build time never client-side, add `.env*` to `.gitignore` before writing any secrets
2. **Glassmorphism accessibility at scale** -- audit every glass panel for WCAG AA contrast (4.5:1), add solid dark fallbacks behind text, limit `backdrop-filter: blur()` to 5-7 elements per page, support `prefers-reduced-motion`
3. **Contact form spam and silent failures** -- ship honeypot + rate limiting with the form (not after), save to DB first then attempt email, implement specific error states, reject sub-2-second submissions
4. **SEO equity loss during migration** -- document all current URLs including hash anchors, implement 301 redirects, preserve meta tags, submit updated sitemap to Google Search Console post-deploy
5. **SSL certificate expiry** -- automate renewal via Traefik/Caddy auto-TLS or Certbot cron, set up uptime monitoring, ensure port 80 stays open for ACME challenges

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Migration

**Rationale:** Everything depends on the Astro project structure, layout shell, and ported design system existing first. This is the architectural foundation.
**Delivers:** Working Astro project with hybrid mode, BaseLayout with nav/footer, global CSS ported from existing design system, homepage sections migrated to Astro components, Docker multi-stage build.
**Addresses:** Multi-page structure, responsive design, design system extension, fast load times.
**Avoids:** CSR/SEO pitfall (by choosing SSG from the start), glassmorphism accessibility (by establishing accessible glass panel components early), breaking existing SEO (by setting up redirect mapping).

### Phase 2: Content System and Blog

**Rationale:** Content Collections are the backbone for blog, team, testimonials, and pricing data. Blog is the simplest content type and proves the content pipeline works before adding external API complexity.
**Delivers:** Content collection schemas (Zod), blog with Markdown (listing + detail pages, syntax highlighting, read time), team page, pricing page, testimonials section.
**Uses:** Astro Content Collections, Markdown processing, JSON/YAML data files.
**Implements:** Blog content flow, data-driven pages (team, pricing, testimonials).

### Phase 3: Portfolio with GitHub Integration

**Rationale:** Depends on Content Collections from Phase 2. Adds the external API integration layer which is the site's primary differentiator but also the most complex data flow.
**Delivers:** Portfolio listing page, curated GitHub repo data with manual overrides (custom descriptions, screenshots, display order), build-time data fetching.
**Uses:** Octokit/rest, custom Astro content loader, portfolio config file.
**Avoids:** GitHub PAT exposure (build-time only, env vars, fine-grained tokens), client-side API calls, rate limiting issues.

### Phase 4: Contact Form and Lead Capture

**Rationale:** The only server-side component. Requires hybrid mode to be working (established in Phase 1). Isolated from content phases so it can be built and tested independently.
**Delivers:** Contact form UI (interactive Astro island), POST /api/contact endpoint, Zod server-side validation, SQLite database setup with Drizzle, email notifications via Nodemailer, honeypot spam protection, rate limiting.
**Uses:** better-sqlite3, Drizzle ORM, Nodemailer, Astro server endpoints.
**Avoids:** Form spam (honeypot + rate limiting from day one), silent failures (DB-first then email), missing error states.

### Phase 5: SEO, Analytics, and Production Hardening

**Rationale:** Polish phase that requires all pages to exist first. SEO meta tags, structured data, and analytics need the final page structure. Deployment hardening wraps up the project.
**Delivers:** Per-page meta tags, Open Graph tags, sitemap.xml, robots.txt, JSON-LD structured data, GA4 + GTM integration, 301 redirects from old URLs, updated Dockerfile, docker-compose with volume and env config, SSL automation verification, branded 404 page.
**Avoids:** SEO equity loss (redirects + sitemap submission), SSL expiry (automation verification), missing analytics events.

### Phase Ordering Rationale

- **Foundation first** because every page, component, and data flow depends on the Astro project structure and layout shell.
- **Content system before portfolio** because Content Collections are used by both, and blog/team/pricing are simpler to implement (no external API), validating the pattern before adding GitHub complexity.
- **Portfolio before contact form** because portfolio is the differentiator (what makes prospects want to reach out), while the contact form is the conversion mechanism (what captures them after).
- **SEO/analytics last** because these are cross-cutting concerns that need all pages finalized. Adding meta tags to pages that are still changing wastes effort.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Portfolio/GitHub):** Custom Astro content loader for GitHub API is non-trivial. Need to research the Content Layer API loader pattern, error handling for failed API calls during build, and the optimal GitHub API query strategy (REST vs GraphQL for batching).
- **Phase 4 (Contact Form):** Server endpoint patterns in Astro hybrid mode, Drizzle + better-sqlite3 setup in Docker (volume permissions, WAL mode), and email deliverability (SPF/DKIM/DMARC DNS records for the agency's domain).

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Astro project setup and migration from vanilla HTML is extensively documented in official Astro docs and migration guides.
- **Phase 2 (Content/Blog):** Content Collections with Markdown is Astro's most well-documented feature. Standard patterns throughout.
- **Phase 5 (SEO/Analytics):** Meta tags, sitemaps, GA4/GTM, and Docker deployment are all well-established patterns with official Astro recipes.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Astro is the clear best fit; all alternatives were considered and rejected with rationale. Versions are current stable releases. |
| Features | HIGH | Feature set grounded in agency website best practices with competitor analysis. Clear MVP vs. v2 separation. |
| Architecture | HIGH | Hybrid rendering pattern is well-documented. Component boundaries and data flows are concrete and specific. |
| Pitfalls | HIGH | Pitfalls are specific to this project (not generic), with concrete prevention strategies and phase mappings. |

**Overall confidence:** HIGH

### Gaps to Address

- **Email infrastructure specifics:** Research recommends Nodemailer with SMTP but does not specify which SMTP provider or whether the agency has existing email infrastructure. Need to confirm SMTP credentials and deliverability setup (SPF/DKIM records) during Phase 4 planning.
- **GitHub repo selection:** The portfolio config requires a curated list of 5-10 repos. The specific repos to showcase, and what manual overrides (descriptions, screenshots) they need, must be defined before Phase 3 implementation.
- **Astro 6 upgrade timeline:** Astro 6 beta is available with improvements (CSP support, font APIs). Starting on 5.18.x is correct, but the upgrade timeline should be revisited after v1 launch.
- **Image optimization pipeline:** Portfolio screenshots need build-time optimization (WebP/AVIF, responsive sizes). The specific tooling (Astro's built-in image component vs. sharp vs. external service) was not deeply evaluated.
- **Mobile navigation pattern:** Current 3-link nav works on mobile. The 6+ page navigation needs a hamburger/drawer menu. The implementation approach (CSS-only vs. JS island) needs a decision during Phase 1.

## Sources

### Primary (HIGH confidence)
- [Astro Official Documentation](https://docs.astro.build/) -- framework, content collections, hybrid rendering, Docker deployment
- [Astro Content Layer Deep Dive](https://astro.build/blog/live-content-collections-deep-dive/) -- custom content loaders
- [GitHub REST API Docs](https://docs.github.com/en/rest) -- rate limits, PAT management, security
- [better-sqlite3 on npm](https://www.npmjs.com/package/better-sqlite3) -- database library
- [Drizzle ORM SQLite Docs](https://orm.drizzle.team/docs/get-started-sqlite) -- ORM setup

### Secondary (MEDIUM confidence)
- [Orbit Media Studios](https://www.orbitmedia.com/blog/lead-generation-website-practices/) -- agency website lead generation best practices
- [Search Engine Journal](https://www.searchenginejournal.com/site-migration-seo-common-mistakes-that-hurt-rankings/416516/) -- SEO migration pitfalls
- [Axess Lab](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/) -- glassmorphism accessibility research
- [Venture Harbour](https://ventureharbour.com/15-contact-form-examples-help-design-ultimate-contact-page/) -- contact form best practices

### Tertiary (LOW confidence)
- [Astro 6 Beta Announcement](https://astro.build/blog/astro-6-beta/) -- future upgrade path, beta status means details may change
- [Node.js built-in SQLite status](https://github.com/nodejs/node/issues/57445) -- still experimental, revisit in 6 months

---
*Research completed: 2026-03-08*
*Ready for roadmap: yes*
