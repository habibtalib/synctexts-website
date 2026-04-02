# Requirements: SyncTexts Agency Website

**Defined:** 2026-03-11
**Core Value:** Potential clients can see SyncTexts' real project portfolio and expertise, then easily get in touch — turning the website into a lead generation engine.

## v1.1 Requirements

Requirements for the Lead Conversion Engine milestone. Each maps to roadmap phases.

### Multi-Step Forms

- [x] **FORM-01**: User can select a service type (Web Dev, DevOps, Analytics) as the first step of the contact form
- [x] **FORM-02**: User sees service-specific questions after selecting a service type (different fields per path)
- [x] **FORM-03**: User sees a progress indicator showing current step and total steps
- [x] **FORM-04**: User can navigate back to previous steps without losing entered data
- [x] **FORM-05**: User sees inline validation errors per step before advancing to the next step
- [x] **FORM-06**: User's form progress persists across page refresh via sessionStorage
- [x] **FORM-07**: User sees animated step transitions consistent with the existing design system
- [x] **FORM-08**: User sees a "Book a Discovery Call" CTA after successful form submission

### Lead Scoring

- [x] **SCORE-01**: System computes a lead score (0-100) from form data on submission (service type, budget, timeline, company, message length)
- [x] **SCORE-02**: Lead scores are stored in SQLite and displayed with color-coded tiers (cold/warm/hot) in the admin dashboard _(display: Phase 6 ✓, storage: Phase 7)_
- [x] **SCORE-03**: Scoring weights are defined in a configurable server-side config object

### Cal.com Scheduling

- [x] **CAL-01**: User can book a discovery call via an embedded Cal.com widget on the contact page
- [x] **CAL-02**: Cal.com embed uses dark theme matching the site's glassmorphism design
- [x] **CAL-03**: Cal.com embed prefills name and email from the contact form submission
- [x] **CAL-04**: Cal.com bookings are linked to lead records via webhook integration
- [x] **CAL-05**: Cal.com embed survives Astro View Transitions (re-initializes on page navigation)

### Lead Dashboard

- [x] **DASH-01**: Admin can view leads with score badges, status, and submission details
- [x] **DASH-02**: Admin can update lead status through a workflow (new/contacted/qualified/proposal_sent/won/lost)
- [x] **DASH-03**: Admin can add and edit notes on each lead
- [x] **DASH-04**: Admin can sort leads by score, date, or status
- [x] **DASH-05**: Admin can filter leads by status, service type, and minimum score via URL params
- [x] **DASH-06**: Dashboard paginates results to handle growing lead volume
- [x] **DASH-07**: Dashboard shows HubSpot sync status and direct link to HubSpot contact per lead

### HubSpot CRM

- [x] **HS-01**: System syncs new leads to HubSpot as contacts asynchronously after form submission
- [x] **HS-02**: HubSpot sync uses upsert-by-email to prevent duplicate contacts
- [x] **HS-03**: System sends lead score, service type, budget, and source page as HubSpot custom properties
- [x] **HS-04**: Admin can manually trigger HubSpot re-sync for individual leads from the dashboard
- [x] **HS-05**: HubSpot sync failures are logged and do not block form submission

### Infrastructure

- [x] **INFRA-01**: Database schema migrated via Drizzle generate+migrate (never push) with production backup
- [x] **INFRA-02**: SQLite configured with WAL mode and busy_timeout for concurrent read/write safety
- [x] **INFRA-03**: Shared auth helper used by all admin API endpoints

## v2.0 Requirements

Requirements for the Content & Credibility Engine milestone.

### Content Infrastructure

- [ ] **CONTENT-01**: Blog supports categories with filterable index page
- [ ] **CONTENT-02**: Blog index has pagination (12 posts/page)
- [ ] **CONTENT-03**: Blog posts show estimated read time, publish date, author, and category
- [ ] **CONTENT-04**: Blog has related posts section (by tags/category) at bottom of each post
- [ ] **CONTENT-05**: RSS feed auto-generated from blog collection

### Case Studies

- [ ] **CASE-01**: Portfolio detail pages support structured results data (metrics, testimonials, timeline)
- [ ] **CASE-02**: Case study pages have structured layout: Challenge → Approach → Results → Testimonial
- [ ] **CASE-03**: Results section shows quantified outcomes (e.g., "3x faster deploys", "99.9% uptime")
- [ ] **CASE-04**: Each case study has a CTA to book a discovery call

### Social Proof & Trust Signals

- [ ] **TRUST-01**: Client logos displayed in a marquee/ticker on the homepage
- [ ] **TRUST-02**: Individual service pages with detailed capabilities, process, and relevant case studies
- [ ] **TRUST-03**: Testimonials linked to specific case studies where applicable
- [ ] **TRUST-04**: Partner badges / "As seen in" section

### SEO & Performance

- [ ] **SEO-01**: Blog posts generate Article structured data (author, dates, images)
- [ ] **SEO-02**: Internal linking strategy — related posts, service→case study cross-links
- [ ] **SEO-03**: Image optimization pipeline (responsive images, WebP/AVIF, lazy loading)
- [ ] **SEO-04**: Lighthouse CI integration — automated performance/accessibility audits on build
- [ ] **SEO-05**: Open Graph images auto-generated per blog post

### Analytics & Insights

- [ ] **ANALYTICS-01**: Admin dashboard shows submission trends over time (chart)
- [ ] **ANALYTICS-02**: Admin dashboard shows conversion funnel: visits → form starts → submissions → bookings
- [ ] **ANALYTICS-03**: Source tracking — capture UTM params on form submission for attribution

### Tech Debt & Quality

- [ ] **DEBT-01**: Remove unused `.coming-soon` CSS class
- [ ] **DEBT-02**: Remove dead `jsonLd` prop from BaseLayout Props interface
- [ ] **DEBT-03**: Fix homepage portfolio href fallback for projects without caseStudySlug
- [ ] **DEBT-04**: Upgrade Astro to latest stable
- [ ] **DEBT-05**: Add `robots.txt` with admin/API exclusion rules

## v3 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Behavioral Scoring

- **BSCORE-01**: System tracks page visits and engagement signals for lead scoring enhancement
- **BSCORE-02**: Behavioral scoring requires GDPR consent gate before activation

### Advanced Admin

- **ADMIN-01**: Multi-admin user management with role-based access
- **ADMIN-02**: Form analytics per step via GTM (drop-off rate tracking)

### CRM Enhancements

- **CRM-01**: HubSpot retry queue for failed syncs
- **CRM-02**: Cal.com round-robin routing for multiple sales team members

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI-powered lead scoring | No training data volume; rule-based scoring is transparent and tunable |
| Real-time HubSpot webhook sync | Massively overengineered for agency lead volume |
| Automated email sequences from dashboard | That is HubSpot Workflows' job; duplicates CRM functionality |
| Form A/B testing | Premature at current traffic; instrument with GTM first, analyze after 4-6 weeks |
| Self-hosted Cal.com | Significant ops burden (Postgres, Redis, separate Docker service); cloud free tier is sufficient |
| Cal.com custom Atoms (React) | Requires React islands; standard embed with dark theme is sufficient |
| Zapier/Make as HubSpot middleware | Adds third-party dependency; direct API call is simpler |
| Lead deduplication beyond email | Fuzzy matching creates false positives; email is the dedup key; HubSpot handles natively |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORM-01 | Phase 8 | Complete |
| FORM-02 | Phase 8 | Complete |
| FORM-03 | Phase 8 | Complete |
| FORM-04 | Phase 8 | Complete |
| FORM-05 | Phase 8 | Complete |
| FORM-06 | Phase 8 | Complete |
| FORM-07 | Phase 8 | Complete |
| FORM-08 | Phase 8 | Complete |
| SCORE-01 | Phase 6 | Complete |
| SCORE-02 | Phase 6+7 | Complete |
| SCORE-03 | Phase 6 | Complete |
| CAL-01 | Phase 9 | Complete |
| CAL-02 | Phase 9 | Complete |
| CAL-03 | Phase 9 | Complete |
| CAL-04 | Phase 9 | Complete |
| CAL-05 | Phase 9 | Complete |
| DASH-01 | Phase 10 | Complete |
| DASH-02 | Phase 10 | Complete |
| DASH-03 | Phase 10 | Complete |
| DASH-04 | Phase 10 | Complete |
| DASH-05 | Phase 10 | Complete |
| DASH-06 | Phase 10 | Complete |
| DASH-07 | Phase 10 | Complete |
| HS-01 | Phase 7 | Complete |
| HS-02 | Phase 7 | Complete |
| HS-03 | Phase 7 | Complete |
| HS-04 | Phase 7 | Complete |
| HS-05 | Phase 7 | Complete |
| INFRA-01 | Phase 5 | Complete |
| INFRA-02 | Phase 5 | Complete |
| INFRA-03 | Phase 7 | Complete |
| CONTENT-01 | Phase 11 | Pending |
| CONTENT-02 | Phase 11 | Pending |
| CONTENT-03 | Phase 11 | Pending |
| CONTENT-04 | Phase 11 | Pending |
| CONTENT-05 | Phase 11 | Pending |
| CASE-01 | Phase 12 | Pending |
| CASE-02 | Phase 12 | Pending |
| CASE-03 | Phase 12 | Pending |
| CASE-04 | Phase 12 | Pending |
| TRUST-01 | Phase 13 | Pending |
| TRUST-02 | Phase 13 | Pending |
| TRUST-03 | Phase 13 | Pending |
| TRUST-04 | Phase 13 | Pending |
| SEO-01 | Phase 14 | Pending |
| SEO-02 | Phase 14 | Pending |
| SEO-03 | Phase 14 | Pending |
| SEO-04 | Phase 14 | Pending |
| SEO-05 | Phase 14 | Pending |
| ANALYTICS-01 | Phase 15 | Pending |
| ANALYTICS-02 | Phase 15 | Pending |
| ANALYTICS-03 | Phase 15 | Pending |
| DEBT-01 | Phase 16 | Pending |
| DEBT-02 | Phase 16 | Pending |
| DEBT-03 | Phase 16 | Pending |
| DEBT-04 | Phase 16 | Pending |
| DEBT-05 | Phase 16 | Pending |

**Coverage:**
- v1.1 requirements: 31 total — 31 complete ✓
- v2.0 requirements: 27 total — 0 complete
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-04-02 after v2.0 milestone creation*
