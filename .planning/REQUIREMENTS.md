# Requirements: SyncTexts Agency Website

**Defined:** 2026-03-08
**Core Value:** Potential clients can see SyncTexts' real project portfolio and expertise, then easily get in touch -- turning the website into a lead generation engine.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Site uses Astro framework with hybrid rendering (static pages + server endpoints)
- [x] **FOUND-02**: Multi-page structure with shared layout (Home, Portfolio, Team, Blog, Pricing, Contact)
- [x] **FOUND-03**: Sticky navigation with links to all pages and a CTA button
- [x] **FOUND-04**: Mobile-responsive navigation (hamburger menu at small breakpoints)
- [x] **FOUND-05**: Existing glassmorphism design system extended consistently to all new pages
- [x] **FOUND-06**: All pages fully responsive across mobile, tablet, and desktop
- [x] **FOUND-07**: Refined homepage sections (hero, services, tech stack) with improved content and polish

### Portfolio

- [ ] **PORT-01**: Portfolio page displays 5-10 curated projects from GitHub private repos via API
- [ ] **PORT-02**: Each portfolio card shows repo name, description, primary languages, and last updated date
- [x] **PORT-03**: Config file defines which repos to display (repo slugs + GitHub PAT in env var)
- [ ] **PORT-04**: Manual override capability per project (custom title, description, screenshots, tech tags)
- [ ] **PORT-05**: Individual project detail pages with full case study content
- [x] **PORT-06**: GitHub API data fetched at build time only (PAT never exposed to client)

### Content Pages

- [ ] **TEAM-01**: Team page with member profiles (photo, name, role, short bio)
- [x] **TEAM-02**: Team data driven by config file (YAML/JSON), not hardcoded HTML
- [ ] **TEST-01**: Testimonials section on homepage with client quotes, name, role, and company
- [x] **TEST-02**: Testimonials data driven by config file
- [ ] **PRIC-01**: Pricing page with 3 service tiers (Starter/Growth/Enterprise or similar)
- [ ] **PRIC-02**: Each tier shows included services, starting price, and CTA
- [x] **PRIC-03**: Pricing data driven by config file
- [ ] **BLOG-01**: Blog listing page showing all posts with title, date, excerpt, and read time
- [ ] **BLOG-02**: Individual blog post pages rendered from Markdown files with YAML frontmatter
- [ ] **BLOG-03**: Syntax highlighting for code blocks in blog posts
- [x] **BLOG-04**: Blog posts support tags for categorization

### Lead Capture

- [ ] **LEAD-01**: Contact form with 3-4 fields (name, email, message, optional company)
- [ ] **LEAD-02**: Form submissions send email notification via Nodemailer/SMTP
- [ ] **LEAD-03**: Form submissions persisted to SQLite database via Drizzle ORM
- [ ] **LEAD-04**: Honeypot field for spam prevention
- [ ] **LEAD-05**: Server-side rate limiting on form endpoint
- [ ] **LEAD-06**: Client-side and server-side form validation

### SEO & Analytics

- [ ] **SEO-01**: Unique meta title and description on every page
- [ ] **SEO-02**: Open Graph tags for social sharing on all pages
- [ ] **SEO-03**: Auto-generated sitemap.xml
- [ ] **SEO-04**: GA4 integration with page view tracking
- [ ] **SEO-05**: GTM container for flexible tag management
- [ ] **SEO-06**: JSON-LD structured data (Organization schema on all pages, BlogPosting on blog posts)
- [ ] **SEO-07**: Semantic HTML throughout (proper heading hierarchy, landmarks, etc.)

### Deployment

- [ ] **DEPL-01**: Dockerfile for production deployment (multi-stage Node.js build)
- [ ] **DEPL-02**: docker-compose.yml with Astro app + reverse proxy
- [ ] **DEPL-03**: SSL/HTTPS automation via Caddy or Certbot
- [ ] **DEPL-04**: Health check endpoint for container monitoring

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Blog Enhancements

- **BLOG-05**: RSS feed for blog posts
- **BLOG-06**: Tag filtering / tag index pages
- **BLOG-07**: Pagination on blog listing page

### Portfolio Enhancements

- **PORT-07**: Client logo bar on homepage
- **PORT-08**: Portfolio filtering by technology/category

### Lead Capture Enhancements

- **LEAD-07**: Calendly or meeting scheduler integration alongside contact form
- **LEAD-08**: Budget range dropdown on contact form

## Out of Scope

| Feature | Reason |
|---------|--------|
| Headless CMS | Overkill for small agency; Markdown + config files are sufficient |
| User authentication / client portal | Marketing site, not a project management tool |
| Live chat widget | Adds 200-500KB JS, requires someone to respond in real-time |
| E-commerce / online payments | Pricing is informational; actual projects need scoping calls |
| AI chatbot | Novelty without clear ROI; well-structured content is better |
| Internationalization (i18n) | Agency operates in English; global reach doesn't require translation |
| Newsletter signup | Defer until blog has consistent publishing cadence |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| FOUND-06 | Phase 1 | Complete |
| FOUND-07 | Phase 1 | Complete |
| PORT-01 | Phase 2 | Pending |
| PORT-02 | Phase 2 | Pending |
| PORT-03 | Phase 2 | Complete |
| PORT-04 | Phase 2 | Pending |
| PORT-05 | Phase 2 | Pending |
| PORT-06 | Phase 2 | Complete |
| TEAM-01 | Phase 2 | Pending |
| TEAM-02 | Phase 2 | Complete |
| TEST-01 | Phase 2 | Pending |
| TEST-02 | Phase 2 | Complete |
| PRIC-01 | Phase 2 | Pending |
| PRIC-02 | Phase 2 | Pending |
| PRIC-03 | Phase 2 | Complete |
| BLOG-01 | Phase 2 | Pending |
| BLOG-02 | Phase 2 | Pending |
| BLOG-03 | Phase 2 | Pending |
| BLOG-04 | Phase 2 | Complete |
| LEAD-01 | Phase 3 | Pending |
| LEAD-02 | Phase 3 | Pending |
| LEAD-03 | Phase 3 | Pending |
| LEAD-04 | Phase 3 | Pending |
| LEAD-05 | Phase 3 | Pending |
| LEAD-06 | Phase 3 | Pending |
| SEO-01 | Phase 4 | Pending |
| SEO-02 | Phase 4 | Pending |
| SEO-03 | Phase 4 | Pending |
| SEO-04 | Phase 4 | Pending |
| SEO-05 | Phase 4 | Pending |
| SEO-06 | Phase 4 | Pending |
| SEO-07 | Phase 4 | Pending |
| DEPL-01 | Phase 4 | Pending |
| DEPL-02 | Phase 4 | Pending |
| DEPL-03 | Phase 4 | Pending |
| DEPL-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after roadmap creation*
